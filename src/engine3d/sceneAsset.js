/**
 * Ensamblado de «assets» de escena para el motor (puro, sin DOM ni WebGL).
 *
 * Un asset es lo mismo que devuelve `loadGlbAsset`: `{ gltf, binChunk, decodedImages }`.
 * - `buildSceneAsset`: genera uno sintético a partir de un árbol de nodos con geometrías procedurales.
 * - `mergeAssets`: fusiona varios (GLB reales y sintéticos) en uno, para dibujar toda la escena con
 *   un solo stage y un solo contexto WebGL.
 * - `overrideMaterials`: copia un asset cambiando factores de material por nombre.
 *
 * Los assets de `loadGlbAsset` están en caché y se comparten entre visores: aquí NUNCA se mutan;
 * el JSON se clona y el binario y las imágenes decodificadas se comparten por referencia.
 */
import { assertValidGeometry } from './primitives.js'
import { quatNormalize } from './math3d.js'

/** glTF exige que cada bufferView y accesor empiecen en múltiplos de 4 bytes (el motor lo asume). */
const BINARY_ALIGNMENT = 4
const COMPONENT_UNSIGNED_SHORT = 5123
const COMPONENT_UNSIGNED_INT = 5125
const COMPONENT_FLOAT = 5126
const TARGET_ARRAY_BUFFER = 34962
const TARGET_ELEMENT_ARRAY_BUFFER = 34963
const FLOATS_PER_VERTEX = 8 // posición (3) + normal (3) + uv (2), entrelazados
const VERTEX_STRIDE_BYTES = FLOATS_PER_VERTEX * 4
const NORMAL_BYTE_OFFSET = 12
const UV_BYTE_OFFSET = 24
// Sampler por defecto: el motor lo ignora (siempre REPEAT + mipmaps), pero el JSON queda válido
const DEFAULT_SAMPLER = { magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }
const ALPHA_MODES = ['OPAQUE', 'BLEND']
const DEFAULT_SCENE_MATERIAL = Object.freeze({})
const MERGED_DEFAULT_MATERIAL_NAME = 'ov-default-material'

const alignUp = (length) => (length + BINARY_ALIGNMENT - 1) & ~(BINARY_ALIGNMENT - 1)

/** Acumula trozos binarios alineados a 4 bytes y los compone en un único Uint8Array. */
function createBinaryWriter() {
  const chunks = []
  let length = 0
  return {
    /** Añade `bytes` (Uint8Array) y devuelve su offset. */
    append(bytes) {
      const offset = alignUp(length)
      chunks.push({ offset, bytes })
      length = offset + bytes.byteLength
      return offset
    },
    finish() {
      const out = new Uint8Array(alignUp(length))
      for (const { offset, bytes } of chunks) out.set(bytes, offset)
      return out
    },
  }
}

const bytesOf = (typedArray) => new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength)

function toVector(value, size, label) {
  if (!Array.isArray(value) && !ArrayBuffer.isView(value)) {
    throw new Error(`${label} debe ser un array de ${size} números`)
  }
  if (value.length !== size || Array.from(value).some((n) => !Number.isFinite(n))) {
    throw new Error(`${label} debe tener ${size} números finitos`)
  }
  return Array.from(value)
}

/** Acepta un número (escala uniforme) o un array [x, y, z]. */
function toScale(value, label) {
  return typeof value === 'number' ? toVector([value, value, value], 3, label) : toVector(value, 3, label)
}

/** Copia validada de translation/rotation/scale en un nodo glTF (solo los presentes). */
function assignTransform(node, def, label) {
  if (def.translation !== undefined) node.translation = toVector(def.translation, 3, `${label}.translation`)
  if (def.rotation !== undefined) {
    node.rotation = Array.from(quatNormalize([0, 0, 0, 1], toVector(def.rotation, 4, `${label}.rotation`)))
  }
  if (def.scale !== undefined) node.scale = toScale(def.scale, `${label}.scale`)
}

// ---------------------------------------------------------------------------------------------
// buildSceneAsset
// ---------------------------------------------------------------------------------------------

function addGeometry(state, geometry) {
  const cached = state.geometries.get(geometry)
  if (cached) return cached
  assertValidGeometry(geometry, 'mesh.geometry')

  const { positions, normals, uvs, indices } = geometry
  const vertexCount = positions.length / 3
  const interleaved = new Float32Array(vertexCount * FLOATS_PER_VERTEX)
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let v = 0; v < vertexCount; v++) {
    const o = v * FLOATS_PER_VERTEX
    for (let a = 0; a < 3; a++) {
      const p = positions[v * 3 + a]
      interleaved[o + a] = p
      interleaved[o + 3 + a] = normals[v * 3 + a]
      min[a] = Math.min(min[a], p)
      max[a] = Math.max(max[a], p)
    }
    interleaved[o + 6] = uvs[v * 2]
    interleaved[o + 7] = uvs[v * 2 + 1]
  }

  // Vértices e índices en bufferViews distintos: el stage sube cada bufferView a un búfer GL con su
  // propio «target» y lo cachea por índice, así que no pueden compartirse.
  const vertexView = state.bufferViews.length
  state.bufferViews.push({
    buffer: 0,
    byteOffset: state.writer.append(bytesOf(interleaved)),
    byteLength: interleaved.byteLength,
    byteStride: VERTEX_STRIDE_BYTES,
    target: TARGET_ARRAY_BUFFER,
  })
  const indexView = state.bufferViews.length
  state.bufferViews.push({
    buffer: 0,
    byteOffset: state.writer.append(bytesOf(indices)),
    byteLength: indices.byteLength,
    target: TARGET_ELEMENT_ARRAY_BUFFER,
  })

  const firstAccessor = state.accessors.length
  state.accessors.push(
    { bufferView: vertexView, byteOffset: 0, componentType: COMPONENT_FLOAT, count: vertexCount, type: 'VEC3', min, max },
    { bufferView: vertexView, byteOffset: NORMAL_BYTE_OFFSET, componentType: COMPONENT_FLOAT, count: vertexCount, type: 'VEC3' },
    { bufferView: vertexView, byteOffset: UV_BYTE_OFFSET, componentType: COMPONENT_FLOAT, count: vertexCount, type: 'VEC2' },
    {
      bufferView: indexView,
      byteOffset: 0,
      componentType: indices instanceof Uint16Array ? COMPONENT_UNSIGNED_SHORT : COMPONENT_UNSIGNED_INT,
      count: indices.length,
      type: 'SCALAR',
    },
  )
  const accessors = {
    attributes: { POSITION: firstAccessor, NORMAL: firstAccessor + 1, TEXCOORD_0: firstAccessor + 2 },
    indices: firstAccessor + 3,
  }
  state.geometries.set(geometry, accessors)
  return accessors
}

/** Una imagen (canvas, ImageBitmap…) → textura; la misma referencia reutiliza la misma textura. */
function addTexture(state, image) {
  const cached = state.textures.get(image)
  if (cached !== undefined) return cached
  const imageIndex = state.images.length
  state.images.push({ name: `ov-image-${imageIndex}`, mimeType: 'image/png' })
  state.decodedImages.push(image)
  if (state.samplers.length === 0) state.samplers.push({ ...DEFAULT_SAMPLER })
  const textureIndex = state.gltfTextures.length
  state.gltfTextures.push({ source: imageIndex, sampler: 0 })
  state.textures.set(image, textureIndex)
  return textureIndex
}

function addMaterial(state, material) {
  const cached = state.materials.get(material)
  if (cached !== undefined) return cached

  const {
    name,
    baseColor = [1, 1, 1, 1],
    metallic = 0,
    roughness = 0.5,
    emissiveIntensity = 1,
    alphaMode = 'OPAQUE',
    additive = false,
    doubleSided = false,
    baseColorImage = null,
    emissiveImage = null,
  } = material
  if (!ALPHA_MODES.includes(alphaMode)) {
    throw new Error(`material: alphaMode «${alphaMode}» no válido (usa ${ALPHA_MODES.join(' o ')})`)
  }
  // Una textura emisiva multiplicada por el factor por defecto (0) no se vería: sin factor explícito se usa 1
  const emissive = material.emissive ?? (emissiveImage ? [1, 1, 1] : [0, 0, 0])
  const blend = alphaMode === 'BLEND' || additive
  const color = toVector(baseColor, 4, 'material.baseColor')

  const pbr = {
    // El shader del motor trata baseColorFactor como sRGB (lo convierte a lineal): se pasa tal cual
    // Solo se respeta el alfa en materiales translúcidos; los opacos se dibujan con alfa 1
    baseColorFactor: [color[0], color[1], color[2], blend ? color[3] : 1],
    metallicFactor: metallic,
    roughnessFactor: roughness,
  }
  if (baseColorImage) pbr.baseColorTexture = { index: addTexture(state, baseColorImage) }

  const def = { name: name ?? `ov-material-${state.gltfMaterials.length}`, pbrMetallicRoughness: pbr }
  const emissiveFactor = toVector(emissive, 3, 'material.emissive').map((c) => c * emissiveIntensity)
  if (emissiveFactor.some((c) => c > 0)) def.emissiveFactor = emissiveFactor
  if (emissiveImage) def.emissiveTexture = { index: addTexture(state, emissiveImage) }
  if (blend) def.alphaMode = 'BLEND'
  if (doubleSided) def.doubleSided = true
  if (additive) def.extras = { additive: true }

  const index = state.gltfMaterials.length
  state.gltfMaterials.push(def)
  state.materials.set(material, index)
  return index
}

function addMesh(state, { geometry, material = DEFAULT_SCENE_MATERIAL }) {
  let byMaterial = state.meshes.get(geometry)
  if (!byMaterial) {
    byMaterial = new Map()
    state.meshes.set(geometry, byMaterial)
  }
  const cached = byMaterial.get(material)
  if (cached !== undefined) return cached

  const { attributes, indices } = addGeometry(state, geometry)
  const meshIndex = state.gltfMeshes.length
  state.gltfMeshes.push({
    name: `ov-mesh-${meshIndex}`,
    primitives: [{ attributes, indices, material: addMaterial(state, material), mode: 4 }],
  })
  byMaterial.set(material, meshIndex)
  return meshIndex
}

function addNode(state, def) {
  const label = `nodo «${def?.name ?? state.nodes.length}»`
  if (!def || typeof def !== 'object') throw new Error(`${label}: definición no válida`)
  if (def.name !== undefined) {
    if (state.names.has(def.name)) throw new Error(`Nombre de nodo duplicado: «${def.name}»`)
    state.names.add(def.name)
  }
  // El nodo se registra antes que sus hijos: el orden de índices es el de recorrido en profundidad
  const index = state.nodes.length
  const node = {}
  state.nodes.push(node)
  if (def.name !== undefined) node.name = def.name
  assignTransform(node, def, label)
  if (def.mesh) node.mesh = addMesh(state, def.mesh)
  if (def.children?.length) node.children = def.children.map((child) => addNode(state, child))
  return index
}

/**
 * Construye un asset sintético a partir de un árbol de nodos.
 *
 * @param {{ nodes: Array<{
 *   name?: string,
 *   translation?: number[], rotation?: number[], scale?: number | number[],
 *   mesh?: { geometry: object, material?: object },
 *   children?: object[]
 * }> }} scene Los nodos de primer nivel son las raíces de la escena. Los nombres, si existen, son únicos.
 *
 * `material`: { name?, baseColor=[1,1,1,1] (sRGB 0-1), metallic=0, roughness=0.5, emissive=[0,0,0],
 * emissiveIntensity=1, alphaMode='OPAQUE'|'BLEND', additive=false (implica BLEND), doubleSided=false,
 * baseColorImage?, emissiveImage? (canvas/ImageBitmap) }. Geometrías y materiales se deduplican por
 * referencia: reutilizar el mismo objeto no duplica bytes ni objetos GL.
 */
export function buildSceneAsset({ nodes } = {}) {
  if (!Array.isArray(nodes)) throw new Error('buildSceneAsset: «nodes» debe ser un array de nodos')
  const state = {
    writer: createBinaryWriter(),
    nodes: [],
    names: new Set(),
    bufferViews: [],
    accessors: [],
    gltfMeshes: [],
    gltfMaterials: [],
    images: [],
    gltfTextures: [],
    samplers: [],
    decodedImages: [],
    geometries: new Map(),
    materials: new Map(),
    meshes: new Map(),
    textures: new Map(),
  }
  const roots = nodes.map((def) => addNode(state, def))
  const binChunk = state.writer.finish()

  const gltf = {
    asset: { version: '2.0', generator: 'overlayer-scene-asset' },
    scene: 0,
    scenes: [{ name: 'OverlayerScene', nodes: roots }],
    nodes: state.nodes,
    meshes: state.gltfMeshes,
    materials: state.gltfMaterials,
    accessors: state.accessors,
    bufferViews: state.bufferViews,
    buffers: [{ byteLength: binChunk.byteLength }],
  }
  if (state.gltfTextures.length > 0) {
    gltf.samplers = state.samplers
    gltf.textures = state.gltfTextures
    gltf.images = state.images
  }
  return { gltf, binChunk, decodedImages: state.decodedImages }
}

// ---------------------------------------------------------------------------------------------
// mergeAssets
// ---------------------------------------------------------------------------------------------

const TEXTURE_SLOTS = ['normalTexture', 'occlusionTexture', 'emissiveTexture']

/** Nodos alcanzables desde las raíces de la escena, en recorrido en profundidad. */
function collectReachableNodes(gltf) {
  const roots = gltf.scenes?.[gltf.scene ?? 0]?.nodes || [0]
  const order = []
  const seen = new Set()
  const visit = (index) => {
    if (seen.has(index) || !gltf.nodes[index]) return
    seen.add(index)
    order.push(index)
    for (const child of gltf.nodes[index].children || []) visit(child)
  }
  roots.forEach(visit)
  return { roots: roots.filter((r) => seen.has(r)), order }
}

function remapMaterialTextures(material, textureBase) {
  const pbr = material.pbrMetallicRoughness
  for (const slot of ['baseColorTexture', 'metallicRoughnessTexture']) {
    if (pbr?.[slot]) pbr[slot].index += textureBase
  }
  for (const slot of TEXTURE_SLOTS) {
    if (material[slot]) material[slot].index += textureBase
  }
}

function assertMergePart(part, position) {
  const label = `mergeAssets[${position}]`
  const { asset, wrapperName } = part ?? {}
  if (!asset?.gltf || !(asset.binChunk instanceof Uint8Array)) {
    throw new Error(`${label}: «asset» debe tener gltf y binChunk (Uint8Array)`)
  }
  if (typeof wrapperName !== 'string' || wrapperName === '') {
    throw new Error(`${label}: «wrapperName» es obligatorio`)
  }
  if ((asset.gltf.images || []).length !== (asset.decodedImages || []).length) {
    throw new Error(`${label}: «decodedImages» no coincide con las imágenes del glTF`)
  }
}

/**
 * Fusiona varios assets en uno. Cada parte queda bajo un nodo envoltorio `wrapperName` (con el
 * TRS indicado) que es raíz de la escena; los nodos originales conservan su nombre para que las
 * poses del stage (`Quest3_Headset`, `hips`…) sigan encontrándolos.
 *
 * @param {Array<{ asset: object, wrapperName: string, translation?: number[], rotation?: number[], scale?: number | number[] }>} parts
 * @returns {{ asset: object, nodeIndexByName: Map<string, number> }}
 * @throws si dos nodos (incluidos los envoltorios) comparten nombre.
 *
 * Solo se conservan los nodos alcanzables desde la escena de cada parte (el stage dibuja todo nodo
 * con malla, también los huérfanos). El binario se copia una vez; las imágenes decodificadas se
 * comparten por referencia con los assets de origen.
 */
export function mergeAssets(parts) {
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error('mergeAssets necesita al menos una parte')
  }
  parts.forEach(assertMergePart)

  const out = {
    accessors: [],
    bufferViews: [],
    materials: [],
    meshes: [],
    skins: [],
    nodes: [],
    samplers: [],
    textures: [],
    images: [],
  }
  const writer = createBinaryWriter()
  const decodedImages = []
  const nodeIndexByName = new Map()
  const wrapperIndices = []
  let defaultMaterialIndex = -1

  const claimName = (name, partPosition) => {
    if (name === undefined || name === '') return
    if (nodeIndexByName.has(name)) {
      throw new Error(`Nombre de nodo duplicado «${name}» al fusionar (parte ${partPosition})`)
    }
    nodeIndexByName.set(name, -1)
  }

  parts.forEach((part, partPosition) => {
    // Se trabaja sobre un clon: el asset de origen (posiblemente en la caché de glbLoader) no se toca
    const gltf = structuredClone(part.asset.gltf)
    const base = {
      bufferView: out.bufferViews.length,
      accessor: out.accessors.length,
      material: out.materials.length,
      mesh: out.meshes.length,
      skin: out.skins.length,
      texture: out.textures.length,
      image: out.images.length,
      sampler: out.samplers.length,
      node: out.nodes.length,
    }
    const binOffset = writer.append(part.asset.binChunk)

    for (const view of gltf.bufferViews || []) {
      out.bufferViews.push({ ...view, buffer: 0, byteOffset: binOffset + (view.byteOffset || 0) })
    }
    for (const accessor of gltf.accessors || []) {
      if (accessor.bufferView !== undefined) accessor.bufferView += base.bufferView
      out.accessors.push(accessor)
    }
    for (const sampler of gltf.samplers || []) out.samplers.push(sampler)
    for (const image of gltf.images || []) {
      if (image.bufferView !== undefined) image.bufferView += base.bufferView
      out.images.push(image)
    }
    decodedImages.push(...(part.asset.decodedImages || []))
    for (const texture of gltf.textures || []) {
      if (texture.source !== undefined) texture.source += base.image
      if (texture.sampler !== undefined) texture.sampler += base.sampler
      out.textures.push(texture)
    }
    for (const material of gltf.materials || []) {
      remapMaterialTextures(material, base.texture)
      out.materials.push(material)
    }

    const hasOwnMaterials = (gltf.materials || []).length > 0
    for (const mesh of gltf.meshes || []) {
      for (const primitive of mesh.primitives) {
        for (const [attribute, accessor] of Object.entries(primitive.attributes)) {
          primitive.attributes[attribute] = accessor + base.accessor
        }
        if (primitive.indices !== undefined) primitive.indices += base.accessor
        delete primitive.targets
        if (primitive.material !== undefined) {
          primitive.material += base.material
        } else if (hasOwnMaterials) {
          // El stage interpreta «sin material» como el material 0 del propio asset: se conserva esa regla
          primitive.material = base.material
        } else {
          if (defaultMaterialIndex < 0) {
            defaultMaterialIndex = out.materials.length
            out.materials.push({ name: MERGED_DEFAULT_MATERIAL_NAME, pbrMetallicRoughness: {} })
          }
          primitive.material = defaultMaterialIndex
        }
      }
      out.meshes.push(mesh)
    }

    const { roots, order } = collectReachableNodes(gltf)
    const nodeMap = new Map(order.map((oldIndex, rank) => [oldIndex, base.node + rank]))
    for (const oldIndex of order) {
      const node = gltf.nodes[oldIndex]
      claimName(node.name, partPosition)
      if (node.name) nodeIndexByName.set(node.name, nodeMap.get(oldIndex))
      if (node.children) node.children = node.children.map((child) => nodeMap.get(child))
      if (node.mesh !== undefined) node.mesh += base.mesh
      if (node.skin !== undefined) node.skin += base.skin
      delete node.camera
      out.nodes.push(node)
    }

    for (const skin of gltf.skins || []) {
      if (skin.inverseBindMatrices !== undefined) skin.inverseBindMatrices += base.accessor
      skin.joints = skin.joints.map((joint) => {
        if (!nodeMap.has(joint)) throw new Error(`mergeAssets[${partPosition}]: una articulación del skin no está en la escena`)
        return nodeMap.get(joint)
      })
      if (skin.skeleton !== undefined) {
        if (nodeMap.has(skin.skeleton)) skin.skeleton = nodeMap.get(skin.skeleton)
        else delete skin.skeleton
      }
      out.skins.push(skin)
    }

    const wrapper = { name: part.wrapperName, children: roots.map((root) => nodeMap.get(root)) }
    assignTransform(wrapper, part, `mergeAssets[${partPosition}]`)
    claimName(wrapper.name, partPosition)
    nodeIndexByName.set(wrapper.name, out.nodes.length)
    wrapperIndices.push(out.nodes.length)
    out.nodes.push(wrapper)
  })

  const binChunk = writer.finish()
  const gltf = {
    asset: { version: '2.0', generator: 'overlayer-scene-merge' },
    scene: 0,
    scenes: [{ name: 'OverlayerMergedScene', nodes: wrapperIndices }],
    ...out,
    buffers: [{ byteLength: binChunk.byteLength }],
  }
  return { asset: { gltf, binChunk, decodedImages }, nodeIndexByName }
}

// ---------------------------------------------------------------------------------------------
// overrideMaterials
// ---------------------------------------------------------------------------------------------

function applyMaterialPatch(material, patch, name) {
  const pbr = (material.pbrMetallicRoughness ??= {})
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    switch (key) {
      case 'baseColorFactor': {
        const color = Array.from(value)
        if (color.length !== 3 && color.length !== 4) throw new Error(`overrideMaterials «${name}»: baseColorFactor necesita 3 o 4 valores`)
        pbr.baseColorFactor = [color[0], color[1], color[2], color[3] ?? pbr.baseColorFactor?.[3] ?? 1]
        break
      }
      case 'metallicFactor':
      case 'roughnessFactor':
        pbr[key] = value
        break
      case 'emissiveFactor':
        material.emissiveFactor = Array.from(value)
        break
      case 'alphaMode':
        if (!ALPHA_MODES.includes(value)) throw new Error(`overrideMaterials «${name}»: alphaMode no válido`)
        if (value === 'OPAQUE') delete material.alphaMode
        else material.alphaMode = value
        break
      case 'doubleSided':
        material.doubleSided = Boolean(value)
        break
      case 'additive':
        if (value) material.extras = { ...material.extras, additive: true }
        else if (material.extras) delete material.extras.additive
        break
      default:
        throw new Error(`overrideMaterials «${name}»: propiedad «${key}» no soportada`)
    }
  }
}

/**
 * Devuelve un asset NUEVO con los materiales indicados modificados. El JSON se clona; `binChunk` y
 * `decodedImages` se comparten por referencia con el original, que no se altera.
 *
 * @param {object} asset
 * @param {Record<string, { baseColorFactor?: number[], metallicFactor?: number, roughnessFactor?: number,
 *   emissiveFactor?: number[], alphaMode?: 'OPAQUE' | 'BLEND', doubleSided?: boolean, additive?: boolean }>} overrides
 *   Claves = nombre del material (`MQ3_OuterShell`…). Un nombre inexistente o una propiedad desconocida lanzan error.
 */
export function overrideMaterials(asset, overrides) {
  const gltf = structuredClone(asset.gltf)
  const materials = gltf.materials || []
  for (const [name, patch] of Object.entries(overrides ?? {})) {
    const targets = materials.filter((material) => material.name === name)
    if (targets.length === 0) throw new Error(`overrideMaterials: el material «${name}» no existe`)
    for (const material of targets) applyMaterialPatch(material, patch, name)
  }
  return { gltf, binChunk: asset.binChunk, decodedImages: asset.decodedImages }
}
