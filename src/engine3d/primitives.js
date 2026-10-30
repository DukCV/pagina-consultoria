/**
 * Geometrías procedurales puras (sin DOM ni WebGL) para componer escenas con el motor propio.
 *
 * Todas devuelven `{ positions, normals, uvs, indices }`:
 * - `positions`/`normals`: Float32Array xyz (normales unitarias, apuntando hacia fuera).
 * - `uvs`: Float32Array uv con la convención glTF (v = 0 arriba de la imagen).
 * - `indices`: triángulos con orientación antihoraria vista desde fuera (lo que espera `CULL_FACE BACK`).
 *   Uint16Array hasta 65535 vértices y Uint32Array por encima: WebGL2 trata el índice 65535 de
 *   Uint16 como reinicio de primitiva, por eso ese valor no se usa como vértice.
 *
 * Las formas con eje (cilindro, toro, engranaje) lo orientan sobre Y; el plano mira hacia +Z.
 */
import {
  mat3NormalFromMat4,
  mat4Determinant3,
  vec3Cross,
  vec3Dot,
  vec3Normalize,
  vec3Sub,
} from './math3d.js'

/** Último vértice direccionable con índices de 16 bits (65535 queda reservado al reinicio). */
export const MAX_UINT16_VERTICES = 65535

const TAU = Math.PI * 2
const MIN_RADIAL_SEGMENTS = 3
const EPSILON = 1e-9

/** Entero ≥ `min`: los parámetros de segmentación nunca producen geometría degenerada. */
const segments = (value, min = 1) => Math.max(min, Math.floor(value))

function createBuilder() {
  return { positions: [], normals: [], uvs: [], indices: [], vertexCount: 0 }
}

function pushVertex(b, px, py, pz, nx, ny, nz, u, v) {
  b.positions.push(px, py, pz)
  b.normals.push(nx, ny, nz)
  b.uvs.push(u, v)
  return b.vertexCount++
}

function pushTriangle(b, i0, i1, i2) {
  b.indices.push(i0, i1, i2)
}

/** Elige Uint16 o Uint32 según el nº de vértices (el motor acepta ambos en `drawElements`). */
function createIndexArray(values, vertexCount) {
  return vertexCount <= MAX_UINT16_VERTICES ? Uint16Array.from(values) : Uint32Array.from(values)
}

function finishBuilder(b) {
  return {
    positions: Float32Array.from(b.positions),
    normals: Float32Array.from(b.normals),
    uvs: Float32Array.from(b.uvs),
    indices: createIndexArray(b.indices, b.vertexCount),
  }
}

/**
 * Rejilla rectangular de (ws+1)×(hs+1) vértices. `t` es la dirección horizontal, `b` la vertical
 * (t × b = normal) y la fila 0 queda arriba (v = 0), así una imagen se ve derecha de frente.
 */
function pushGrid(builder, { center, t, b, normal, width, height, widthSegments, heightSegments }) {
  const first = builder.vertexCount
  const stride = widthSegments + 1
  for (let iy = 0; iy <= heightSegments; iy++) {
    const q = iy / heightSegments
    for (let ix = 0; ix <= widthSegments; ix++) {
      const s = ix / widthSegments
      const hx = (s - 0.5) * width
      const vy = (0.5 - q) * height
      pushVertex(
        builder,
        center[0] + t[0] * hx + b[0] * vy,
        center[1] + t[1] * hx + b[1] * vy,
        center[2] + t[2] * hx + b[2] * vy,
        normal[0],
        normal[1],
        normal[2],
        s,
        q,
      )
    }
  }
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = first + iy * stride + ix
      const c = a + stride
      pushTriangle(builder, a, c, c + 1)
      pushTriangle(builder, a, c + 1, a + 1)
    }
  }
}

/** Caja centrada en el origen. UV 0‥1 en cada cara. */
export function createBox({ width = 1, height = 1, depth = 1 } = {}) {
  const b = createBuilder()
  const hw = width / 2
  const hh = height / 2
  const hd = depth / 2
  const faces = [
    { normal: [1, 0, 0], t: [0, 0, -1], b: [0, 1, 0], w: depth, h: height, center: [hw, 0, 0] },
    { normal: [-1, 0, 0], t: [0, 0, 1], b: [0, 1, 0], w: depth, h: height, center: [-hw, 0, 0] },
    { normal: [0, 1, 0], t: [1, 0, 0], b: [0, 0, -1], w: width, h: depth, center: [0, hh, 0] },
    { normal: [0, -1, 0], t: [1, 0, 0], b: [0, 0, 1], w: width, h: depth, center: [0, -hh, 0] },
    { normal: [0, 0, 1], t: [1, 0, 0], b: [0, 1, 0], w: width, h: height, center: [0, 0, hd] },
    { normal: [0, 0, -1], t: [-1, 0, 0], b: [0, 1, 0], w: width, h: height, center: [0, 0, -hd] },
  ]
  for (const face of faces) {
    pushGrid(b, {
      center: face.center,
      t: face.t,
      b: face.b,
      normal: face.normal,
      width: face.w,
      height: face.h,
      widthSegments: 1,
      heightSegments: 1,
    })
  }
  return finishBuilder(b)
}

/** Plano en XY mirando a +Z, centrado en el origen (la cara trasera se ve con `doubleSided`). */
export function createPlane({ width = 1, height = 1, widthSegments = 1, heightSegments = 1 } = {}) {
  const b = createBuilder()
  pushGrid(b, {
    center: [0, 0, 0],
    t: [1, 0, 0],
    b: [0, 1, 0],
    normal: [0, 0, 1],
    width,
    height,
    widthSegments: segments(widthSegments),
    heightSegments: segments(heightSegments),
  })
  return finishBuilder(b)
}

/** Esfera UV: `widthSegments` meridianos × `heightSegments` paralelos (polo norte en +Y). */
export function createSphere({ radius = 0.5, widthSegments = 32, heightSegments = 16 } = {}) {
  const ws = segments(widthSegments, MIN_RADIAL_SEGMENTS)
  const hs = segments(heightSegments, 2)
  const b = createBuilder()
  for (let iy = 0; iy <= hs; iy++) {
    const v = iy / hs
    const phi = v * Math.PI
    for (let ix = 0; ix <= ws; ix++) {
      const u = ix / ws
      const theta = u * TAU
      const nx = -Math.sin(phi) * Math.cos(theta)
      const ny = Math.cos(phi)
      const nz = Math.sin(phi) * Math.sin(theta)
      pushVertex(b, nx * radius, ny * radius, nz * radius, nx, ny, nz, u, v)
    }
  }
  const stride = ws + 1
  for (let iy = 0; iy < hs; iy++) {
    for (let ix = 0; ix < ws; ix++) {
      const a = iy * stride + ix
      const c = a + stride
      // Los triángulos degenerados de los polos se omiten
      if (iy !== hs - 1) pushTriangle(b, a, c, c + 1)
      if (iy !== 0) pushTriangle(b, a, c + 1, a + 1)
    }
  }
  return finishBuilder(b)
}

/**
 * Cilindro o tronco de cono sobre Y (de -height/2 a +height/2). Con `radiusTop: 0` es un cono.
 * Las tapas son discos planos con vértices propios (normal ±Y).
 */
export function createCylinder({
  radiusTop = 0.5,
  radiusBottom = 0.5,
  height = 1,
  radialSegments = 32,
  heightSegments = 1,
  capTop = true,
  capBottom = true,
} = {}) {
  const rs = segments(radialSegments, MIN_RADIAL_SEGMENTS)
  const hs = segments(heightSegments)
  const b = createBuilder()
  const halfH = height / 2
  // La normal de la pared es perpendicular a la generatriz (rBottom→rTop en el plano radio-altura)
  const slopeY = radiusBottom - radiusTop
  const slopeLen = Math.hypot(height, slopeY) || 1

  for (let iy = 0; iy <= hs; iy++) {
    const v = iy / hs
    const radius = radiusTop + (radiusBottom - radiusTop) * v
    const y = halfH - height * v
    for (let ix = 0; ix <= rs; ix++) {
      const u = ix / rs
      const theta = u * TAU
      const sin = Math.sin(theta)
      const cos = Math.cos(theta)
      pushVertex(
        b,
        radius * sin,
        y,
        radius * cos,
        (height / slopeLen) * sin,
        slopeY / slopeLen,
        (height / slopeLen) * cos,
        u,
        v,
      )
    }
  }
  const stride = rs + 1
  for (let iy = 0; iy < hs; iy++) {
    for (let ix = 0; ix < rs; ix++) {
      const a = iy * stride + ix
      const c = a + stride
      if (!(radiusBottom === 0 && iy === hs - 1)) pushTriangle(b, a, c, c + 1)
      if (!(radiusTop === 0 && iy === 0)) pushTriangle(b, a, c + 1, a + 1)
    }
  }

  const pushCap = (radius, y, normalY) => {
    const center = pushVertex(b, 0, y, 0, 0, normalY, 0, 0.5, 0.5)
    const ring = b.vertexCount
    for (let ix = 0; ix < rs; ix++) {
      const theta = (ix / rs) * TAU
      const sin = Math.sin(theta)
      const cos = Math.cos(theta)
      pushVertex(b, radius * sin, y, radius * cos, 0, normalY, 0, 0.5 + 0.5 * sin, 0.5 + 0.5 * cos)
    }
    for (let ix = 0; ix < rs; ix++) {
      const current = ring + ix
      const next = ring + ((ix + 1) % rs)
      if (normalY > 0) pushTriangle(b, center, current, next)
      else pushTriangle(b, center, next, current)
    }
  }
  if (capTop && radiusTop > 0) pushCap(radiusTop, halfH, 1)
  if (capBottom && radiusBottom > 0) pushCap(radiusBottom, -halfH, -1)
  return finishBuilder(b)
}

/**
 * Toro con el eje en Y. `radius` es la distancia del centro al eje del tubo, `tube` el radio del tubo,
 * `tubularSegments` los pasos alrededor del anillo y `radialSegments` los de la sección del tubo.
 */
export function createTorus({ radius = 0.5, tube = 0.15, radialSegments = 16, tubularSegments = 48 } = {}) {
  const rs = segments(radialSegments, MIN_RADIAL_SEGMENTS)
  const ts = segments(tubularSegments, MIN_RADIAL_SEGMENTS)
  const b = createBuilder()
  for (let i = 0; i <= ts; i++) {
    const u = i / ts
    const alpha = u * TAU
    for (let j = 0; j <= rs; j++) {
      const v = j / rs
      const beta = v * TAU
      const nx = Math.cos(beta) * Math.cos(alpha)
      const ny = Math.sin(beta)
      const nz = Math.cos(beta) * Math.sin(alpha)
      const ring = radius + tube * Math.cos(beta)
      pushVertex(b, ring * Math.cos(alpha), tube * ny, ring * Math.sin(alpha), nx, ny, nz, u, v)
    }
  }
  const stride = rs + 1
  for (let i = 0; i < ts; i++) {
    for (let j = 0; j < rs; j++) {
      const a = i * stride + j
      const next = a + stride
      pushTriangle(b, a, a + 1, next)
      pushTriangle(b, a + 1, next + 1, next)
    }
  }
  return finishBuilder(b)
}

/** Giro de `vector` alrededor del eje unitario `axis` (fórmula de Rodrigues). */
function rotateAroundAxis(out, vector, axis, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dot = vec3Dot(axis, vector)
  const cross = vec3Cross([0, 0, 0], axis, vector)
  for (let k = 0; k < 3; k++) {
    out[k] = vector[k] * cos + cross[k] * sin + axis[k] * dot * (1 - cos)
  }
  return out
}

/** Vector unitario cualquiera perpendicular a `dir` (arranque del marco de transporte). */
function anyPerpendicular(out, dir) {
  const axis = Math.abs(dir[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
  vec3Cross(out, dir, axis)
  return vec3Normalize(out, out)
}

/**
 * Tangentes unitarias de una polilínea (diferencia centrada; adelante/atrás en los extremos).
 * Los puntos consecutivos repetidos ya se eliminaron antes.
 */
function computeTangents(points) {
  return points.map((_, k) => {
    const prev = points[Math.max(0, k - 1)]
    const next = points[Math.min(points.length - 1, k + 1)]
    return vec3Normalize([0, 0, 0], vec3Sub([0, 0, 0], next, prev))
  })
}

/**
 * Marcos de transporte paralelo (rotación mínima entre pasos): a diferencia de usar un vector «arriba»
 * fijo, no giran sobre sí mismos en hélices ni curvas 3D. Devuelve la normal N de cada punto
 * (la binormal es T × N).
 */
function computeParallelNormals(tangents) {
  const normals = [anyPerpendicular([0, 0, 0], tangents[0])]
  for (let k = 1; k < tangents.length; k++) {
    const prevT = tangents[k - 1]
    const currT = tangents[k]
    const axis = vec3Cross([0, 0, 0], prevT, currT)
    const sinAngle = Math.hypot(axis[0], axis[1], axis[2])
    let normal
    if (sinAngle < EPSILON) {
      // Tangentes paralelas (sin giro) o enfrentadas (media vuelta: se reconstruye el marco)
      normal =
        vec3Dot(prevT, currT) > 0 ? normals[k - 1] : anyPerpendicular([0, 0, 0], currT)
    } else {
      vec3Normalize(axis, axis)
      normal = rotateAroundAxis([0, 0, 0], normals[k - 1], axis, Math.atan2(sinAngle, vec3Dot(prevT, currT)))
    }
    normals.push(vec3Normalize([0, 0, 0], normal))
  }
  return normals
}

/**
 * Tubo de sección circular sobre una polilínea 3D (`path`: [[x,y,z], …], ≥ 2 puntos distintos).
 * `v` de las UV avanza con la longitud de arco; `capEnds` cierra ambos extremos con discos planos.
 */
export function createTube({ path, radius = 0.05, radialSegments = 8, capEnds = true } = {}) {
  const points = (path ?? []).filter((p, k, all) => {
    if (k === 0) return true
    const q = all[k - 1]
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > EPSILON
  })
  if (points.length < 2) {
    throw new Error('createTube necesita una polilínea con al menos 2 puntos distintos')
  }
  const rs = segments(radialSegments, MIN_RADIAL_SEGMENTS)
  const tangents = computeTangents(points)
  const normalsN = computeParallelNormals(tangents)
  const binormals = tangents.map((t, k) => vec3Cross([0, 0, 0], t, normalsN[k]))

  const arc = [0]
  for (let k = 1; k < points.length; k++) {
    arc.push(arc[k - 1] + Math.hypot(...vec3Sub([0, 0, 0], points[k], points[k - 1])))
  }
  const totalLength = arc[arc.length - 1]

  const b = createBuilder()
  for (let k = 0; k < points.length; k++) {
    const n = normalsN[k]
    const bn = binormals[k]
    const p = points[k]
    for (let j = 0; j <= rs; j++) {
      const phi = (j / rs) * TAU
      const cos = Math.cos(phi)
      const sin = Math.sin(phi)
      const dx = cos * n[0] + sin * bn[0]
      const dy = cos * n[1] + sin * bn[1]
      const dz = cos * n[2] + sin * bn[2]
      pushVertex(b, p[0] + radius * dx, p[1] + radius * dy, p[2] + radius * dz, dx, dy, dz, j / rs, arc[k] / totalLength)
    }
  }
  const stride = rs + 1
  for (let k = 0; k < points.length - 1; k++) {
    for (let j = 0; j < rs; j++) {
      const a = k * stride + j
      const next = a + stride
      pushTriangle(b, a, a + 1, next)
      pushTriangle(b, a + 1, next + 1, next)
    }
  }

  if (capEnds) {
    const pushEndCap = (k, outwardSign) => {
      const t = tangents[k]
      const nx = t[0] * outwardSign
      const ny = t[1] * outwardSign
      const nz = t[2] * outwardSign
      const p = points[k]
      const center = pushVertex(b, p[0], p[1], p[2], nx, ny, nz, 0.5, 0.5)
      const ring = b.vertexCount
      for (let j = 0; j < rs; j++) {
        const phi = (j / rs) * TAU
        const cos = Math.cos(phi)
        const sin = Math.sin(phi)
        const n = normalsN[k]
        const bn = binormals[k]
        pushVertex(
          b,
          p[0] + radius * (cos * n[0] + sin * bn[0]),
          p[1] + radius * (cos * n[1] + sin * bn[1]),
          p[2] + radius * (cos * n[2] + sin * bn[2]),
          nx,
          ny,
          nz,
          0.5 + 0.5 * cos,
          0.5 + 0.5 * sin,
        )
      }
      for (let j = 0; j < rs; j++) {
        const current = ring + j
        const next = ring + ((j + 1) % rs)
        // φ crece en sentido antihorario visto desde +T: el cierre final (normal +T) lo conserva
        if (outwardSign > 0) pushTriangle(b, center, current, next)
        else pushTriangle(b, center, next, current)
      }
    }
    pushEndCap(0, -1)
    pushEndCap(points.length - 1, 1)
  }
  return finishBuilder(b)
}

/**
 * Pared lateral de un contorno 2D (x, y) extruida entre `lo` y `hi` en la tercera coordenada.
 * `flat` da una normal por arista (dientes nítidos); si no, normales radiales hacia `inward` suaves.
 * Con el contorno antihorario la normal de arista (dy, -dx) apunta hacia fuera.
 */
function pushProfileWall(builder, loop, lo, hi, { flat, inward = false, perimeter }) {
  const count = loop.length
  let travelled = 0
  for (let k = 0; k < count; k++) {
    const p0 = loop[k]
    const p1 = loop[(k + 1) % count]
    const dx = p1[0] - p0[0]
    const dy = p1[1] - p0[1]
    const len = Math.hypot(dx, dy) || 1
    const u0 = travelled / perimeter
    travelled += len
    const u1 = travelled / perimeter
    const flatNormal = [dy / len, -dx / len]
    const nA = flat ? flatNormal : radialNormal(p0, inward)
    const nB = flat ? flatNormal : radialNormal(p1, inward)
    const base = builder.vertexCount
    pushVertex(builder, p0[0], p0[1], lo, nA[0], nA[1], 0, u0, 1)
    pushVertex(builder, p1[0], p1[1], lo, nB[0], nB[1], 0, u1, 1)
    pushVertex(builder, p1[0], p1[1], hi, nB[0], nB[1], 0, u1, 0)
    pushVertex(builder, p0[0], p0[1], hi, nA[0], nA[1], 0, u0, 0)
    pushTriangle(builder, base, base + 1, base + 2)
    pushTriangle(builder, base, base + 2, base + 3)
  }
}

function radialNormal(point, inward) {
  const len = Math.hypot(point[0], point[1]) || 1
  const sign = inward ? -1 : 1
  return [(sign * point[0]) / len, (sign * point[1]) / len]
}

/** Proporción del paso angular de cada diente en la que cae cada vértice del perfil trapezoidal. */
const GEAR_TOOTH_PROFILE = [
  { at: 0.25, onTip: false },
  { at: 0.4, onTip: true },
  { at: 0.6, onTip: true },
  { at: 0.75, onTip: false },
]

/**
 * Engranaje recto con eje en Y. `rootRadius` es el fondo entre dientes, `outerRadius` la punta,
 * `thickness` el grosor total y `boreRadius` el taladro central (0 = macizo).
 */
export function createGear({
  teeth = 12,
  outerRadius = 0.5,
  rootRadius = outerRadius * 0.82,
  thickness = 0.12,
  boreRadius = 0,
} = {}) {
  const toothCount = segments(teeth, MIN_RADIAL_SEGMENTS)
  const pitch = TAU / toothCount
  const profile = []
  for (let i = 0; i < toothCount; i++) {
    for (const vertex of GEAR_TOOTH_PROFILE) {
      const angle = (i + vertex.at) * pitch
      const radius = vertex.onTip ? outerRadius : rootRadius
      profile.push([radius * Math.cos(angle), radius * Math.sin(angle), angle])
    }
  }
  const hasBore = boreRadius > 0
  const half = thickness / 2
  const perimeter = profile.reduce((sum, p, k) => {
    const q = profile[(k + 1) % profile.length]
    return sum + Math.hypot(q[0] - p[0], q[1] - p[1])
  }, 0)

  // Se construye en XY con el grosor en Z (cómodo para las caras) y luego se gira el eje a Y
  const b = createBuilder()
  pushProfileWall(b, profile, -half, half, { flat: true, perimeter })

  const faceUv = (point) => [0.5 + point[0] / (2 * outerRadius), 0.5 - point[1] / (2 * outerRadius)]
  const bore = hasBore
    ? profile.map((p) => [boreRadius * Math.cos(p[2]), boreRadius * Math.sin(p[2]), p[2]])
    : null

  for (const side of [1, -1]) {
    const z = side * half
    const center = hasBore ? -1 : pushVertex(b, 0, 0, z, 0, 0, side, 0.5, 0.5)
    const outerStart = b.vertexCount
    for (const p of profile) pushVertex(b, p[0], p[1], z, 0, 0, side, ...faceUv(p))
    const innerStart = b.vertexCount
    if (hasBore) for (const p of bore) pushVertex(b, p[0], p[1], z, 0, 0, side, ...faceUv(p))
    const count = profile.length
    for (let k = 0; k < count; k++) {
      const o0 = outerStart + k
      const o1 = outerStart + ((k + 1) % count)
      if (hasBore) {
        const i0 = innerStart + k
        const i1 = innerStart + ((k + 1) % count)
        if (side > 0) {
          pushTriangle(b, o0, i1, i0)
          pushTriangle(b, o0, o1, i1)
        } else {
          pushTriangle(b, o0, i0, i1)
          pushTriangle(b, o0, i1, o1)
        }
      } else if (side > 0) {
        pushTriangle(b, center, o0, o1)
      } else {
        pushTriangle(b, center, o1, o0)
      }
    }
  }
  if (hasBore) {
    // Contorno del taladro recorrido al revés: la normal de arista (dy, -dx) apunta al eje
    const reversed = [...bore].reverse()
    const borePerimeter = TAU * boreRadius
    pushProfileWall(b, reversed, -half, half, { flat: false, inward: true, perimeter: borePerimeter })
  }

  const geometry = finishBuilder(b)
  return rotateZAxisToY(geometry)
}

/** Gira (x, y, z) → (x, z, -y): giro propio, conserva el sentido de los triángulos. */
function rotateZAxisToY(geometry) {
  for (const array of [geometry.positions, geometry.normals]) {
    for (let k = 0; k < array.length; k += 3) {
      const y = array[k + 1]
      array[k + 1] = array[k + 2]
      array[k + 2] = -y
    }
  }
  return geometry
}

/**
 * Comprueba que una geometría tiene el formato esperado por `buildSceneAsset` y la sube a la GPU
 * sin sorpresas (longitudes coherentes, índices Uint16/Uint32 y dentro de rango).
 */
export function assertValidGeometry(geometry, label = 'geometría') {
  const { positions, normals, uvs, indices } = geometry ?? {}
  if (!(positions instanceof Float32Array) || positions.length === 0 || positions.length % 3 !== 0) {
    throw new Error(`${label}: «positions» debe ser un Float32Array xyz no vacío`)
  }
  const vertexCount = positions.length / 3
  if (!(normals instanceof Float32Array) || normals.length !== positions.length) {
    throw new Error(`${label}: «normals» debe ser un Float32Array del mismo tamaño que «positions»`)
  }
  if (!(uvs instanceof Float32Array) || uvs.length !== vertexCount * 2) {
    throw new Error(`${label}: «uvs» debe ser un Float32Array uv con un par por vértice`)
  }
  const isU16 = indices instanceof Uint16Array
  if (!isU16 && !(indices instanceof Uint32Array)) {
    throw new Error(`${label}: «indices» debe ser Uint16Array o Uint32Array`)
  }
  if (indices.length === 0 || indices.length % 3 !== 0) {
    throw new Error(`${label}: «indices» debe contener triángulos completos`)
  }
  if (isU16 && vertexCount > MAX_UINT16_VERTICES) {
    throw new Error(`${label}: ${vertexCount} vértices exceden el límite de índices de 16 bits`)
  }
  for (let k = 0; k < indices.length; k++) {
    if (indices[k] >= vertexCount) throw new Error(`${label}: el índice ${indices[k]} está fuera de rango`)
  }
}

/**
 * Une varias geometrías en una sola (un único `drawElements`), aplicando a cada una su matriz 4×4
 * en orden de columnas. Las normales usan la inversa traspuesta; una matriz que refleja (determinante
 * negativo) invierte además el sentido de los triángulos para que sigan mirando hacia fuera.
 * Pasa a índices de 32 bits si el total supera el límite de 16 bits.
 */
export function mergeGeometries(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('mergeGeometries necesita al menos una geometría')
  }
  items.forEach((item, k) => assertValidGeometry(item?.geometry, `mergeGeometries[${k}]`))

  const totalVertices = items.reduce((sum, item) => sum + item.geometry.positions.length / 3, 0)
  const totalIndices = items.reduce((sum, item) => sum + item.geometry.indices.length, 0)
  const positions = new Float32Array(totalVertices * 3)
  const normals = new Float32Array(totalVertices * 3)
  const uvs = new Float32Array(totalVertices * 2)
  const indices = totalVertices <= MAX_UINT16_VERTICES ? new Uint16Array(totalIndices) : new Uint32Array(totalIndices)

  const normalMat = new Float32Array(9)
  let vertexOffset = 0
  let indexOffset = 0
  for (const { geometry, matrix } of items) {
    const count = geometry.positions.length / 3
    uvs.set(geometry.uvs, vertexOffset * 2)
    let flip = false
    if (matrix) {
      const exact = mat3NormalFromMat4(normalMat, matrix)
      flip = mat4Determinant3(matrix) < 0
      for (let v = 0; v < count; v++) {
        const s = v * 3
        const d = (vertexOffset + v) * 3
        const x = geometry.positions[s]
        const y = geometry.positions[s + 1]
        const z = geometry.positions[s + 2]
        positions[d] = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]
        positions[d + 1] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]
        positions[d + 2] = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]
        const nx = geometry.normals[s]
        const ny = geometry.normals[s + 1]
        const nz = geometry.normals[s + 2]
        // Matriz singular (escala 0): se conserva la normal original en vez de propagar NaN
        const tx = exact ? exact[0] * nx + exact[3] * ny + exact[6] * nz : nx
        const ty = exact ? exact[1] * nx + exact[4] * ny + exact[7] * nz : ny
        const tz = exact ? exact[2] * nx + exact[5] * ny + exact[8] * nz : nz
        const len = Math.hypot(tx, ty, tz) || 1
        normals[d] = tx / len
        normals[d + 1] = ty / len
        normals[d + 2] = tz / len
      }
    } else {
      positions.set(geometry.positions, vertexOffset * 3)
      normals.set(geometry.normals, vertexOffset * 3)
    }
    for (let k = 0; k < geometry.indices.length; k += 3) {
      const i0 = geometry.indices[k] + vertexOffset
      const i1 = geometry.indices[k + 1] + vertexOffset
      const i2 = geometry.indices[k + 2] + vertexOffset
      indices[indexOffset + k] = i0
      indices[indexOffset + k + 1] = flip ? i2 : i1
      indices[indexOffset + k + 2] = flip ? i1 : i2
    }
    vertexOffset += count
    indexOffset += geometry.indices.length
  }
  return { positions, normals, uvs, indices }
}
