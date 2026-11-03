/**
 * Prismas de sección convexa extruidos a lo largo de X (de -0.5 a 0.5), para tejados que una caja no da:
 * dos aguas, dientes de sierra, bóvedas. El perfil son puntos [z, y] en sentido antihorario (z a la
 * derecha, y arriba); el resto del cierre (la base) se deduce. Se escalan como una caja: [largo, alto, fondo].
 * Puro (sin DOM ni WebGL), con el mismo formato que `engine3d/primitives.js`.
 */

const HALF = 0.5

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** Perfil [z, y] → vértice 3D en el plano x. */
const lift = (x, [z, y]) => [x, y, z]

export function createPrism(profile) {
  const positions = []
  const normals = []
  const indices = []

  const addVertex = (point, normal) => {
    positions.push(...point)
    normals.push(...normal)
    return positions.length / 3 - 1
  }
  // Los índices se ordenan para que el triángulo mire a la normal declarada (antihorario desde fuera)
  const addTriangle = (a, b, c, normal) => {
    const facing = dot(cross(sub(positions.slice(b * 3, b * 3 + 3), positions.slice(a * 3, a * 3 + 3)), sub(positions.slice(c * 3, c * 3 + 3), positions.slice(a * 3, a * 3 + 3))), normal)
    indices.push(a, facing >= 0 ? b : c, facing >= 0 ? c : b)
  }

  for (const side of [-1, 1]) {
    const normal = [side, 0, 0]
    const first = profile.map((point) => addVertex(lift(side * HALF, point), normal))
    for (let k = 1; k < first.length - 1; k += 1) addTriangle(first[0], first[k], first[k + 1], normal)
  }
  profile.forEach((from, k) => {
    const to = profile[(k + 1) % profile.length]
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1
    const normal = [0, -(to[0] - from[0]) / length, (to[1] - from[1]) / length]
    const corners = [lift(-HALF, from), lift(HALF, from), lift(HALF, to), lift(-HALF, to)].map((point) => addVertex(point, normal))
    addTriangle(corners[0], corners[1], corners[2], normal)
    addTriangle(corners[0], corners[2], corners[3], normal)
  })

  return {
    positions: Float32Array.from(positions),
    normals: Float32Array.from(normals),
    uvs: new Float32Array((positions.length / 3) * 2),
    indices: Uint16Array.from(indices),
  }
}

/** Semielipse de `steps` tramos (z de 0,5 a -0,5 por arriba) para cubiertas curvas. */
function vaultProfile(steps) {
  return Array.from({ length: steps + 1 }, (_, k) => {
    const angle = (k / steps) * Math.PI
    return [HALF * Math.cos(angle), Math.sin(angle)]
  })
}

/** Pared vertical en -Z y pendiente hacia +Z (diente de sierra, rampa). */
export const WEDGE = createPrism([
  [-HALF, 0],
  [HALF, 0],
  [-HALF, 1],
])
/** Tejado a dos aguas con la cumbrera en z = 0. */
export const GABLE = createPrism([
  [-HALF, 0],
  [HALF, 0],
  [0, 1],
])
export const VAULT_FINE = createPrism(vaultProfile(8))
export const VAULT_COARSE = createPrism(vaultProfile(4))
