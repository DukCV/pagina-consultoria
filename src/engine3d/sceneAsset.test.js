import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createBox, createPlane, createSphere, createTorus } from './primitives.js'
import { buildSceneAsset, mergeAssets, overrideMaterials } from './sceneAsset.js'

const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }
const READERS = {
  5123: (dv, at) => dv.getUint16(at, true),
  5125: (dv, at) => dv.getUint32(at, true),
  5126: (dv, at) => dv.getFloat32(at, true),
}
const COMPONENT_BYTES = { 5123: 2, 5125: 4, 5126: 4 }

/** Lee un accesor tal como lo haría el stage: bufferView.byteOffset + accessor.byteOffset + stride. */
function readAccessor(asset, accessorIndex) {
  const { gltf, binChunk } = asset
  const accessor = gltf.accessors[accessorIndex]
  const view = gltf.bufferViews[accessor.bufferView]
  const components = COMPONENTS[accessor.type]
  const bytes = COMPONENT_BYTES[accessor.componentType]
  const stride = view.byteStride || components * bytes
  const start = (view.byteOffset || 0) + (accessor.byteOffset || 0)
  const dv = new DataView(binChunk.buffer, binChunk.byteOffset, binChunk.byteLength)
  const read = READERS[accessor.componentType]
  const out = []
  for (let i = 0; i < accessor.count; i++) {
    for (let c = 0; c < components; c++) out.push(read(dv, start + i * stride + c * bytes))
  }
  return out
}

const primitiveOf = (asset, meshIndex) => asset.gltf.meshes[meshIndex].primitives[0]
const closeArrays = (actual, expected, label) => {
  assert.equal(actual.length, expected.length, `${label}: longitud`)
  for (let i = 0; i < expected.length; i++) {
    assert.ok(Math.abs(actual[i] - expected[i]) < 1e-6, `${label}[${i}]: ${actual[i]} ≠ ${expected[i]}`)
  }
}

describe('buildSceneAsset', () => {
  it('escribe la geometría en bufferViews alineados y separa vértices de índices', () => {
    const box = createBox({ width: 2, height: 1, depth: 3 })
    const asset = buildSceneAsset({
      nodes: [{ name: 'raiz', translation: [1, 2, 3], children: [{ name: 'caja', mesh: { geometry: box } }] }],
    })
    const { gltf, binChunk } = asset

    assert.equal(gltf.nodes.length, 2)
    assert.deepEqual(gltf.scenes[0].nodes, [0])
    assert.deepEqual(gltf.nodes[0].children, [1])
    assert.deepEqual(gltf.nodes[0].translation, [1, 2, 3])
    assert.equal(gltf.bufferViews.length, 2)
    const [vertexView, indexView] = gltf.bufferViews
    assert.equal(vertexView.target, 34962)
    assert.equal(vertexView.byteStride, 32)
    assert.equal(indexView.target, 34963)
    assert.equal(indexView.byteStride, undefined)
    for (const view of gltf.bufferViews) assert.equal(view.byteOffset % 4, 0)
    assert.equal(binChunk.byteLength % 4, 0)
    assert.equal(gltf.buffers[0].byteLength, binChunk.byteLength)

    const primitive = primitiveOf(asset, gltf.nodes[1].mesh)
    closeArrays(readAccessor(asset, primitive.attributes.POSITION), box.positions, 'POSITION')
    closeArrays(readAccessor(asset, primitive.attributes.NORMAL), box.normals, 'NORMAL')
    closeArrays(readAccessor(asset, primitive.attributes.TEXCOORD_0), box.uvs, 'TEXCOORD_0')
    assert.deepEqual(readAccessor(asset, primitive.indices), [...box.indices])
    assert.equal(gltf.accessors[primitive.indices].componentType, 5123)
  })

  it('los accesores POSITION llevan min/max de la geometría y los índices 32 bits usan 5125', () => {
    const plane = createPlane({ width: 4, height: 2 })
    const index32 = { ...plane, indices: Uint32Array.from(plane.indices) }
    const asset = buildSceneAsset({ nodes: [{ mesh: { geometry: index32 } }] })
    const primitive = primitiveOf(asset, 0)
    const position = asset.gltf.accessors[primitive.attributes.POSITION]
    assert.deepEqual(position.min, [-2, -1, 0])
    assert.deepEqual(position.max, [2, 1, 0])
    assert.equal(asset.gltf.accessors[primitive.indices].componentType, 5125)
    assert.equal(asset.gltf.bufferViews[1].byteOffset % 4, 0)
  })

  it('mantiene la alineación a 4 bytes con un número impar de índices de 16 bits', () => {
    const triangle = {
      positions: Float32Array.from([0, 0, 0, 1, 0, 0, 0, 1, 0]),
      normals: Float32Array.from([0, 0, 1, 0, 0, 1, 0, 0, 1]),
      uvs: Float32Array.from([0, 0, 1, 0, 0, 1]),
      indices: Uint16Array.from([0, 1, 2]),
    }
    const asset = buildSceneAsset({
      nodes: [{ mesh: { geometry: triangle } }, { mesh: { geometry: createBox() } }],
    })
    assert.equal(asset.gltf.bufferViews[1].byteLength, 6)
    for (const view of asset.gltf.bufferViews) assert.equal(view.byteOffset % 4, 0)
    const second = primitiveOf(asset, 1)
    assert.deepEqual(readAccessor(asset, second.indices), [...createBox().indices])
  })

  it('deduplica geometrías, materiales y mallas por referencia', () => {
    const geometry = createSphere({ widthSegments: 8, heightSegments: 4 })
    const red = { baseColor: [1, 0, 0, 1] }
    const blue = { baseColor: [0, 0, 1, 1] }
    const asset = buildSceneAsset({
      nodes: [
        { mesh: { geometry, material: red } },
        { mesh: { geometry, material: red } },
        { mesh: { geometry, material: blue } },
        { mesh: { geometry, material: red } },
      ],
    })
    assert.equal(asset.gltf.meshes.length, 2)
    assert.equal(asset.gltf.materials.length, 2)
    assert.equal(asset.gltf.accessors.length, 4, 'una sola copia de los bytes de la esfera')
    assert.equal(asset.gltf.bufferViews.length, 2)
    assert.equal(asset.gltf.nodes[0].mesh, asset.gltf.nodes[1].mesh)
    assert.equal(asset.gltf.nodes[0].mesh, asset.gltf.nodes[3].mesh)
    assert.notEqual(asset.gltf.nodes[0].mesh, asset.gltf.nodes[2].mesh)
  })

  it('traduce el material: defaults, alfa, emisivo, aditivo y doble cara', () => {
    const geometry = createBox()
    const asset = buildSceneAsset({
      nodes: [
        { mesh: { geometry } },
        { mesh: { geometry, material: { baseColor: [0.2, 0.4, 0.6, 0.3] } } },
        { mesh: { geometry, material: { baseColor: [0.2, 0.4, 0.6, 0.3], alphaMode: 'BLEND', doubleSided: true } } },
        { mesh: { geometry, material: { baseColor: [1, 1, 1, 0.5], additive: true, emissive: [0.1, 0.2, 0.3], emissiveIntensity: 2 } } },
      ],
    })
    const [defaults, opaque, blend, additive] = asset.gltf.materials
    assert.deepEqual(defaults.pbrMetallicRoughness, { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.5 })
    assert.equal(defaults.emissiveFactor, undefined)
    assert.equal(defaults.alphaMode, undefined)
    assert.equal(opaque.pbrMetallicRoughness.baseColorFactor[3], 1, 'un material opaco ignora el alfa')
    assert.equal(blend.alphaMode, 'BLEND')
    assert.equal(blend.doubleSided, true)
    assert.equal(blend.pbrMetallicRoughness.baseColorFactor[3], 0.3)
    assert.equal(additive.alphaMode, 'BLEND', 'aditivo implica BLEND')
    assert.deepEqual(additive.extras, { additive: true })
    closeArrays(additive.emissiveFactor, [0.2, 0.4, 0.6], 'emissiveFactor')
  })

  it('registra una imagen y una textura por referencia, aunque se use en dos ranuras', () => {
    const image = { fake: 'canvas' }
    const other = { fake: 'bitmap' }
    const asset = buildSceneAsset({
      nodes: [
        { mesh: { geometry: createBox(), material: { baseColorImage: image, emissiveImage: image } } },
        { mesh: { geometry: createBox(), material: { baseColorImage: other } } },
      ],
    })
    assert.deepEqual(asset.decodedImages, [image, other])
    assert.equal(asset.gltf.images.length, 2)
    assert.equal(asset.gltf.textures.length, 2)
    const [first, second] = asset.gltf.materials
    assert.equal(first.pbrMetallicRoughness.baseColorTexture.index, first.emissiveTexture.index)
    assert.equal(second.pbrMetallicRoughness.baseColorTexture.index, 1)
    assert.deepEqual(first.emissiveFactor, [1, 1, 1], 'emissiveImage sin factor explícito usa 1')
  })

  it('normaliza la rotación y acepta una escala escalar', () => {
    const asset = buildSceneAsset({ nodes: [{ rotation: [0, 0, 2, 0], scale: 3 }] })
    assert.deepEqual(asset.gltf.nodes[0].rotation, [0, 0, 1, 0])
    assert.deepEqual(asset.gltf.nodes[0].scale, [3, 3, 3])
  })

  it('rechaza nombres repetidos y valores inválidos con mensajes claros', () => {
    assert.throws(() => buildSceneAsset({ nodes: [{ name: 'a' }, { name: 'b', children: [{ name: 'a' }] }] }), /duplicado: «a»/)
    assert.throws(() => buildSceneAsset({ nodes: [{ translation: [0, 1] }] }), /translation/)
    assert.throws(
      () => buildSceneAsset({ nodes: [{ mesh: { geometry: createBox(), material: { alphaMode: 'MASK' } } }] }),
      /alphaMode/,
    )
    assert.throws(() => buildSceneAsset({ nodes: [{ mesh: { geometry: {} } }] }), /positions/)
    assert.throws(() => buildSceneAsset({}), /nodes/)
  })

  it('una escena vacía produce un asset válido', () => {
    const asset = buildSceneAsset({ nodes: [] })
    assert.deepEqual(asset.gltf.nodes, [])
    assert.deepEqual(asset.gltf.scenes[0].nodes, [])
    assert.equal(asset.binChunk.byteLength, 0)
  })
})

/** Asset «importado» mínimo y escrito a mano, con skin, para probar el re-indexado. */
function createRiggedAsset() {
  const ibm = new Float32Array(16)
  ibm.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
  const positions = Float32Array.from([0, 0, 0, 1, 0, 0, 0, 1, 0])
  const binary = new Uint8Array(64 + 36 + 8)
  binary.set(new Uint8Array(ibm.buffer), 0)
  binary.set(new Uint8Array(positions.buffer), 64)
  binary.set(new Uint8Array(Uint16Array.from([0, 1, 2]).buffer), 100)
  return {
    gltf: {
      asset: { version: '2.0' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [
        { name: 'rig_root', children: [1, 2] },
        { name: 'rig_bone', translation: [0, 1, 0] },
        { name: 'rig_mesh', mesh: 0, skin: 0 },
        { name: 'rig_orphan', mesh: 0 },
      ],
      meshes: [{ primitives: [{ attributes: { POSITION: 1 }, indices: 2, mode: 4 }] }],
      skins: [{ joints: [1], inverseBindMatrices: 0, skeleton: 0 }],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 1, type: 'MAT4' },
        { bufferView: 1, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 2, componentType: 5123, count: 3, type: 'SCALAR' },
      ],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 64 },
        { buffer: 0, byteOffset: 64, byteLength: 36, target: 34962 },
        { buffer: 0, byteOffset: 100, byteLength: 6, target: 34963 },
      ],
      buffers: [{ byteLength: binary.byteLength }],
    },
    // Un subarray con byteOffset ≠ 0 imita al binChunk que devuelve parseGlbBuffer
    binChunk: new Uint8Array(new Uint8Array([9, 9, 9, 9, ...binary]).buffer, 4),
    decodedImages: [],
  }
}

describe('mergeAssets', () => {
  const makePartA = () =>
    buildSceneAsset({
      nodes: [
        { name: 'a_raiz', children: [{ name: 'a_caja', translation: [1, 0, 0], mesh: { geometry: createBox(), material: { baseColor: [1, 0, 0, 1] } } }] },
      ],
    })
  const textured = { fake: 'canvas' }
  const makePartB = (prefix = 'b') =>
    buildSceneAsset({
      nodes: [
        { name: `${prefix}_toro`, mesh: { geometry: createTorus({ radialSegments: 6, tubularSegments: 10 }), material: { baseColorImage: textured, emissive: [1, 0, 0] } } },
        { name: `${prefix}_plano`, mesh: { geometry: createPlane() } },
      ],
    })

  it('crea envoltorios raíz, conserva nombres y re-indexa los accesores de la segunda parte', () => {
    const partA = makePartA()
    const partB = makePartB()
    const torus = createTorus({ radialSegments: 6, tubularSegments: 10 })
    const { asset, nodeIndexByName } = mergeAssets([
      { asset: partA, wrapperName: 'envA', translation: [5, 0, 0] },
      { asset: partB, wrapperName: 'envB', scale: 2, rotation: [0, 0, 0, 1] },
    ])
    const { gltf } = asset

    assert.equal(gltf.nodes.length, 2 + 2 + 2)
    assert.deepEqual(gltf.scenes[0].nodes, [nodeIndexByName.get('envA'), nodeIndexByName.get('envB')])
    for (const name of ['a_raiz', 'a_caja', 'b_toro', 'b_plano', 'envA', 'envB']) {
      assert.equal(gltf.nodes[nodeIndexByName.get(name)].name, name)
    }
    assert.deepEqual(gltf.nodes[nodeIndexByName.get('envA')].children, [nodeIndexByName.get('a_raiz')])
    assert.deepEqual(gltf.nodes[nodeIndexByName.get('envB')].children, [nodeIndexByName.get('b_toro'), nodeIndexByName.get('b_plano')])
    assert.deepEqual(gltf.nodes[nodeIndexByName.get('envA')].translation, [5, 0, 0])
    assert.deepEqual(gltf.nodes[nodeIndexByName.get('envB')].scale, [2, 2, 2])
    assert.deepEqual(gltf.nodes[nodeIndexByName.get('a_raiz')].children, [nodeIndexByName.get('a_caja')])

    // Los bytes del toro (parte B) siguen siendo accesibles a través de la malla re-indexada
    const torusNode = gltf.nodes[nodeIndexByName.get('b_toro')]
    const primitive = gltf.meshes[torusNode.mesh].primitives[0]
    closeArrays(readAccessor(asset, primitive.attributes.POSITION), torus.positions, 'POSITION de la parte B')
    closeArrays(readAccessor(asset, primitive.attributes.TEXCOORD_0), torus.uvs, 'UV de la parte B')
    assert.deepEqual(readAccessor(asset, primitive.indices), [...torus.indices])
    // …y los de la parte A también
    const boxNode = gltf.nodes[nodeIndexByName.get('a_caja')]
    const boxPrimitive = gltf.meshes[boxNode.mesh].primitives[0]
    closeArrays(readAccessor(asset, boxPrimitive.attributes.POSITION), createBox().positions, 'POSITION de la parte A')

    // Alineación a 4 bytes de todos los bufferViews y accesores
    for (const view of gltf.bufferViews) assert.equal(view.byteOffset % 4, 0)
    for (const accessor of gltf.accessors) {
      const bytes = COMPONENT_BYTES[accessor.componentType]
      assert.equal(((gltf.bufferViews[accessor.bufferView].byteOffset || 0) + (accessor.byteOffset || 0)) % bytes, 0)
    }
    assert.equal(gltf.buffers[0].byteLength, asset.binChunk.byteLength)
    assert.equal(asset.binChunk.byteLength % 4, 0)
  })

  it('remapea materiales, texturas e imágenes y concatena decodedImages en orden', () => {
    const { asset } = mergeAssets([
      { asset: makePartA(), wrapperName: 'envA' },
      { asset: makePartB(), wrapperName: 'envB' },
    ])
    const { gltf } = asset
    assert.equal(gltf.materials.length, 3)
    const torusMaterial = gltf.materials[1]
    assert.equal(torusMaterial.pbrMetallicRoughness.baseColorTexture.index, 0)
    assert.equal(gltf.textures[0].source, 0)
    assert.deepEqual(asset.decodedImages, [textured])

    const partB = makePartB()
    const second = makePartB('c')
    const merged = mergeAssets([
      { asset: partB, wrapperName: 'uno' },
      { asset: second, wrapperName: 'dos' },
    ]).asset.gltf
    assert.equal(merged.textures.length, 2)
    assert.equal(merged.textures[1].source, 1, 'la segunda imagen se desplaza por las de la primera parte')
    assert.equal(merged.materials[2].pbrMetallicRoughness.baseColorTexture.index, 1)
  })

  it('re-indexa skins, descarta nodos huérfanos y fija material por defecto', () => {
    const rig = createRiggedAsset()
    const { asset, nodeIndexByName } = mergeAssets([
      { asset: makePartA(), wrapperName: 'envA' },
      { asset: rig, wrapperName: 'envRig', translation: [0, 0, 1] },
    ])
    const { gltf } = asset
    assert.equal(nodeIndexByName.has('rig_orphan'), false, 'el nodo no alcanzable desde la escena se descarta')
    assert.equal(gltf.skins.length, 1)
    const bone = nodeIndexByName.get('rig_bone')
    assert.deepEqual(gltf.skins[0].joints, [bone])
    assert.equal(gltf.skins[0].skeleton, nodeIndexByName.get('rig_root'))
    // El accesor de las matrices inversas apunta a los bytes originales de la parte B
    const ibmAccessor = gltf.skins[0].inverseBindMatrices
    assert.deepEqual(readAccessor(asset, ibmAccessor), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
    const skinned = gltf.nodes[nodeIndexByName.get('rig_mesh')]
    assert.equal(skinned.skin, 0)
    const primitive = gltf.meshes[skinned.mesh].primitives[0]
    assert.deepEqual(readAccessor(asset, primitive.attributes.POSITION), [0, 0, 0, 1, 0, 0, 0, 1, 0])
    assert.deepEqual(readAccessor(asset, primitive.indices), [0, 1, 2])
    assert.equal(gltf.materials[primitive.material].name, 'ov-default-material')
  })

  it('una primitiva sin material usa el material 0 de su propio asset (como el stage)', () => {
    const rig = createRiggedAsset()
    rig.gltf.materials = [{ name: 'propio' }]
    const { asset } = mergeAssets([
      { asset: makePartA(), wrapperName: 'envA' },
      { asset: rig, wrapperName: 'envRig' },
    ])
    const material = asset.gltf.meshes[1].primitives[0].material
    assert.equal(asset.gltf.materials[material].name, 'propio')
  })

  it('lanza error si dos nodos colisionan, incluido un envoltorio', () => {
    assert.throws(
      () =>
        mergeAssets([
          { asset: makePartA(), wrapperName: 'uno' },
          { asset: makePartA(), wrapperName: 'dos' },
        ]),
      /duplicado «a_raiz»/,
    )
    assert.throws(
      () =>
        mergeAssets([
          { asset: makePartA(), wrapperName: 'a_caja' },
        ]),
      /duplicado «a_caja»/,
    )
    assert.throws(() => mergeAssets([{ asset: makePartA() }]), /wrapperName/)
    assert.throws(() => mergeAssets([]), /al menos una parte/)
  })

  it('no muta los assets de origen', () => {
    const partA = makePartA()
    const partB = makePartB()
    const before = structuredClone([partA.gltf, partB.gltf])
    const binaryBefore = [...partA.binChunk]
    mergeAssets([
      { asset: partA, wrapperName: 'envA' },
      { asset: partB, wrapperName: 'envB' },
    ])
    assert.deepEqual([partA.gltf, partB.gltf], before)
    assert.deepEqual([...partA.binChunk], binaryBefore)
  })
})

describe('overrideMaterials', () => {
  const makeAsset = () => {
    const geometry = createBox()
    return buildSceneAsset({
      nodes: [
        { mesh: { geometry, material: { name: 'MQ3_OuterShell', baseColor: [0.9, 0.9, 0.9, 0.5], roughness: 0.34 } } },
        { mesh: { geometry, material: { name: 'MQ3_Strap' } } },
      ],
    })
  }

  it('devuelve un asset nuevo sin tocar el original y comparte binario e imágenes por referencia', () => {
    const original = makeAsset()
    const snapshot = structuredClone(original.gltf)
    const result = overrideMaterials(original, {
      MQ3_OuterShell: { baseColorFactor: [0.1, 0.2, 0.3], metallicFactor: 0.9, roughnessFactor: 0.1, emissiveFactor: [0, 1, 0] },
    })
    assert.deepEqual(original.gltf, snapshot)
    assert.notEqual(result.gltf, original.gltf)
    assert.equal(result.binChunk, original.binChunk)
    assert.equal(result.decodedImages, original.decodedImages)

    const patched = result.gltf.materials.find((m) => m.name === 'MQ3_OuterShell')
    assert.deepEqual(patched.pbrMetallicRoughness.baseColorFactor, [0.1, 0.2, 0.3, 1], 'sin alfa se conserva el alfa previo (opaco = 1)')
    assert.equal(patched.pbrMetallicRoughness.metallicFactor, 0.9)
    assert.equal(patched.pbrMetallicRoughness.roughnessFactor, 0.1)
    assert.deepEqual(patched.emissiveFactor, [0, 1, 0])
    const untouched = result.gltf.materials.find((m) => m.name === 'MQ3_Strap')
    assert.deepEqual(untouched, original.gltf.materials[1])
  })

  it('permite hacer translúcido o aditivo un material y revertirlo', () => {
    const result = overrideMaterials(makeAsset(), { MQ3_Strap: { alphaMode: 'BLEND', doubleSided: true, additive: true } })
    const material = result.gltf.materials.find((m) => m.name === 'MQ3_Strap')
    assert.equal(material.alphaMode, 'BLEND')
    assert.equal(material.doubleSided, true)
    assert.deepEqual(material.extras, { additive: true })
    const reverted = overrideMaterials(result, { MQ3_Strap: { alphaMode: 'OPAQUE', additive: false } })
    const back = reverted.gltf.materials.find((m) => m.name === 'MQ3_Strap')
    assert.equal(back.alphaMode, undefined)
    assert.equal(back.extras.additive, undefined)
  })

  it('falla con un nombre de material inexistente o una propiedad desconocida', () => {
    assert.throws(() => overrideMaterials(makeAsset(), { NoExiste: { roughnessFactor: 1 } }), /«NoExiste» no existe/)
    assert.throws(() => overrideMaterials(makeAsset(), { MQ3_Strap: { brillo: 1 } }), /«brillo» no soportada/)
  })
})
