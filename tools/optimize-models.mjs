/**
 * Optimiza un GLB para el visor WebGL2 propio de Overlayer (sin extensiones: el motor solo
 * entiende glTF 2.0 plano, así que no se usa compresión Draco/Meshopt ni cuantización).
 *
 * Herramienta de desarrollo: sus dependencias NO forman parte del proyecto. Instálalas sin guardarlas:
 *   npm i --no-save @gltf-transform/core @gltf-transform/functions meshoptimizer sharp
 *
 *   node tools/optimize-models.mjs <entrada.glb> <salida.glb> [--tex 512] [--jpeg 84] [--plan '{"Malla":{"ratio":0.3,"error":0.0006}}']
 *
 * El plan de simplificación es por nombre de malla (coincidencia por prefijo). Las mallas no
 * incluidas no se simplifican. `error` es la fracción máxima del radio de la malla que puede
 * desplazarse (límite duro); `ratio` es el objetivo de reducción de vértices. La simplificación
 * tiene en cuenta normales y UV (evita ondulaciones de sombreado) y bloquea los bordes de las islas UV.
 *
 * Parámetros usados en los modelos actuales (originales en models-source/):
 *   Quest 3:  --tex 512 --plan '{"Quest3_Headset":{"ratio":0.25,"error":0.002},"Quest3_Controller":{"ratio":0.5,"error":0.0012}}'
 *   Personaje IA:  --tex 512   (la geometría ya es ligera; solo se reducen las texturas)
 */
import { NodeIO } from '@gltf-transform/core'
import { compactPrimitive, dedup, prune, textureCompress, weld } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import fs from 'node:fs'

const [input, output, ...rest] = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = rest.indexOf(`--${name}`)
  return i >= 0 ? rest[i + 1] : fallback
}
const texSize = Number(flag('tex', 512))
const jpegQuality = Number(flag('jpeg', 84))
const plan = JSON.parse(flag('plan', '{}'))

await MeshoptSimplifier.ready
const io = new NodeIO()
const doc = await io.read(input)

const count = () => {
  let verts = 0
  let tris = 0
  const perMesh = {}
  for (const mesh of doc.getRoot().listMeshes()) {
    let t = 0
    for (const prim of mesh.listPrimitives()) {
      verts += prim.getAttribute('POSITION').getCount()
      t += prim.getIndices().getCount() / 3
    }
    tris += t
    perMesh[mesh.getName()] = Math.round(t)
  }
  return { verts, tris, perMesh }
}

/**
 * Simplificación guiada por atributos: además de la posición, penaliza colapsos que alteren
 * normales y coordenadas UV (evita las ondulaciones de sombreado de la simplificación solo geométrica).
 */
function simplifyWithAttributes(prim, { ratio, error, lockBorder, normalWeight, uvWeight }) {
  const positions = prim.getAttribute('POSITION').getArray()
  const normals = prim.getAttribute('NORMAL').getArray()
  const uvs = prim.getAttribute('TEXCOORD_0').getArray()
  const indexAccessor = prim.getIndices()
  const indices = Uint32Array.from(indexAccessor.getArray())
  const vertexCount = positions.length / 3

  const attributes = new Float32Array(vertexCount * 5)
  for (let v = 0; v < vertexCount; v++) {
    attributes.set(normals.subarray(v * 3, v * 3 + 3), v * 5)
    attributes.set(uvs.subarray(v * 2, v * 2 + 2), v * 5 + 3)
  }
  const weights = [normalWeight, normalWeight, normalWeight, uvWeight, uvWeight]
  const target = Math.max(3, Math.floor((indices.length * ratio) / 3) * 3)
  const flags = lockBorder ? ['LockBorder'] : []
  const [result] = MeshoptSimplifier.simplifyWithAttributes(indices, positions, 3, attributes, 5, weights, null, target, error, flags)

  const useU16 = vertexCount <= 65535
  indexAccessor.setArray(useU16 ? Uint16Array.from(result) : result)
  compactPrimitive(prim)
}

const before = count()
await doc.transform(dedup(), weld())

for (const mesh of doc.getRoot().listMeshes()) {
  const name = mesh.getName()
  const key = Object.keys(plan).find((prefix) => name.startsWith(prefix))
  if (!key) continue
  const { ratio, error, lockBorder = true, normalWeight = 1, uvWeight = 1 } = plan[key]
  for (const prim of mesh.listPrimitives()) {
    // Las primitivas diminutas (p. ej. lentes de 384 triángulos) no merecen simplificarse
    if (prim.getIndices().getCount() / 3 < 1000) continue
    simplifyWithAttributes(prim, { ratio, error, lockBorder, normalWeight, uvWeight })
  }
}

await doc.transform(
  textureCompress({ encoder: sharp, resize: [texSize, texSize], quality: jpegQuality }),
  prune(),
)
const after = count()

await io.write(output, doc)
const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0)
console.log(
  `${input.split(/[\\/]/).pop()}: ${kb(input)} KB → ${kb(output)} KB | vértices ${before.verts} → ${after.verts} | triángulos ${before.tris} → ${after.tris}`,
)
console.log('  por malla:', JSON.stringify(before.perMesh), '→', JSON.stringify(after.perMesh))
