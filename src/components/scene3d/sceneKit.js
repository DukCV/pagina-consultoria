import { OVERLAYER_PALETTE } from '../../constants/brandTheme.js'
import { mat4FromTRS, quatFromEulerXYZ, quatMultiply } from '../../engine3d/math3d.js'

/**
 * Utilidades compartidas por los objetos 3D de la hélice: colores de la paleta, materiales con
 * nombre, matrices para fusionar geometrías y cuaterniones. Puro (sin DOM ni WebGL), salvo por las
 * imágenes de canvas que algunos materiales reciben ya creadas.
 */

/** `#RRGGBB` → [r, g, b] en 0‥1 (sRGB, como espera el motor). */
export function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => channel / 255)
}

const { charcoal, emerald, indigo, lime, lightGray } = OVERLAYER_PALETTE
// Tonos derivados de la paleta (los mismos que usan las escenas del hero)
export const TONES = {
  charcoal,
  charcoalDeep: '#2B2830',
  charcoalSlab: '#35303A',
  emerald,
  indigo,
  indigoSoft: '#6666AE',
  indigoDeep: '#363665',
  lime,
  lightGray,
}

export const rgb = (tone) => hexToRgb(TONES[tone] ?? tone)
export const rgba = (tone, alpha) => [...rgb(tone), alpha]

/** Material opaco con la paleta. `glow` añade emisión del mismo color (conexiones y LEDs). */
export function solid(name, tone, { metallic = 0.2, roughness = 0.45, glow = 0 } = {}) {
  return {
    name,
    baseColor: rgba(tone, 1),
    metallic,
    roughness,
    emissive: glow ? rgb(tone).map((channel) => channel * glow) : [0, 0, 0],
  }
}

/** Material emisivo translúcido: haces, halos y rejillas que se suman a la imagen. */
export function light(name, tone, alpha = 0.6) {
  return { name, baseColor: rgba(tone, alpha), metallic: 0, roughness: 1, emissive: rgb(tone), additive: true }
}

/** Cristal translúcido (marcos AR, plataformas): se mezcla con lo que hay detrás. */
export function glass(name, tone, alpha = 0.25) {
  return { name, baseColor: rgba(tone, alpha), metallic: 0.1, roughness: 0.12, alphaMode: 'BLEND', doubleSided: true }
}

/** Pantalla encendida: la imagen aporta el color y también la emisión (se ve aunque haya poca luz). */
export function screen(name, image, intensity = 0.85) {
  return {
    name,
    baseColor: [1, 1, 1, 1],
    metallic: 0.1,
    roughness: 0.3,
    baseColorImage: image,
    emissiveImage: image,
    emissiveIntensity: intensity,
  }
}

/** Mancha de luz (aditiva) o de sombra (mezcla normal) con la forma de la imagen. */
export function sprite(name, image, tone = '#FFFFFF', alpha = 1, { additive = false } = {}) {
  return additive
    ? { name, baseColor: rgba(tone, alpha), baseColorImage: image, emissive: rgb(tone), emissiveImage: image, additive: true, roughness: 1 }
    : { name, baseColor: rgba(tone, alpha), baseColorImage: image, alphaMode: 'BLEND', doubleSided: true, roughness: 1 }
}

// ---- Cuaterniones y matrices -------------------------------------------------------------------------

/** Cuaternión de un giro de `angle` radianes sobre el eje Y (o X, Z). */
export const quatY = (angle) => [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)]
export const quatX = (angle) => [Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)]
export const quatZ = (angle) => [0, 0, Math.sin(angle / 2), Math.cos(angle / 2)]

/** Cuaternión que lleva el eje +Y a la dirección `direction` (no hace falta normalizarla). */
export function quatYTo(direction) {
  const length = Math.hypot(...direction)
  const [x, y, z] = direction.map((component) => component / length)
  if (y < -0.999999) return [1, 0, 0, 0] // giro de 180° sobre X
  // eje = Y × d = (z, 0, -x); ángulo = acos(y)
  const w = 1 + y
  const norm = Math.hypot(z, -x, w)
  return [z / norm, 0, -x / norm, w / norm]
}

/** Composición de giros: el último se aplica primero. */
export function composeQuat(...quats) {
  const out = [0, 0, 0, 1]
  for (const quat of quats) quatMultiply(out, out, quat)
  return out
}

export const eulerQuat = (rx, ry, rz) => Array.from(quatFromEulerXYZ([0, 0, 0, 1], rx, ry, rz))

/** Matriz 4×4 (orden de columnas) para `mergeGeometries`. */
export function matrix({ translation = [0, 0, 0], rotation = [0, 0, 0, 1], scale = [1, 1, 1] } = {}) {
  const s = typeof scale === 'number' ? [scale, scale, scale] : scale
  return mat4FromTRS(new Float32Array(16), translation, rotation, s)
}

/** Cilindro delgado entre dos puntos, como elemento de `mergeGeometries`. */
export function segmentItem(createCylinder, from, to, radius, radialSegments = 6) {
  const direction = [to[0] - from[0], to[1] - from[1], to[2] - from[2]]
  const height = Math.hypot(...direction)
  return {
    geometry: createCylinder({ radiusTop: radius, radiusBottom: radius, height, radialSegments, capTop: false, capBottom: false }),
    matrix: matrix({
      translation: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2],
      rotation: quatYTo(direction),
    }),
  }
}

/** Nodo con malla: atajo para describir la escena. */
export function meshNode(name, geometry, material, transform = {}, children) {
  return { name, mesh: { geometry, material }, ...transform, ...(children ? { children } : {}) }
}

export const groupNode = (name, transform = {}, children = []) => ({ name, ...transform, children })

/** Puntos de una curva suave (Catmull-Rom) que pasa por `points`, para tubos de conexión curvos. */
export function curve(points, samplesPerSegment = 8) {
  const out = []
  const at = (i) => points[Math.max(0, Math.min(points.length - 1, i))]
  for (let i = 0; i < points.length - 1; i += 1) {
    for (let s = 0; s < samplesPerSegment; s += 1) {
      const t = s / samplesPerSegment
      const t2 = t * t
      const t3 = t2 * t
      out.push(
        [0, 1, 2].map(
          (k) =>
            0.5 *
            (2 * at(i)[k] +
              (-at(i - 1)[k] + at(i + 1)[k]) * t +
              (2 * at(i - 1)[k] - 5 * at(i)[k] + 4 * at(i + 1)[k] - at(i + 2)[k]) * t2 +
              (-at(i - 1)[k] + 3 * at(i)[k] - 3 * at(i + 1)[k] + at(i + 2)[k]) * t3),
        ),
      )
    }
  }
  out.push(points[points.length - 1])
  return out
}
