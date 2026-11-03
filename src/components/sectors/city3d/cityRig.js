/**
 * Plano de la ciudad: geometría y reparto de lotes (funciones puras, sin DOM ni WebGL).
 *
 * Mundo: Y hacia arriba, suelo en y = 0. La ciudad es un disco de radio `CITY.radius` con la plaza del
 * logotipo en el centro, una avenida circular y cinco distritos de 72° que corresponden, en orden, a las
 * cinco diapositivas. Los ángulos se miden desde +Z hacia +X (posición = [r·sen θ, r·cos θ]), igual que
 * el mapeo de la tapa de un cilindro, y el giro Y de un lote es ese mismo ángulo.
 *
 * Cada distrito es una cuadrícula alineada con su eje: dos hileras de lotes (A, cerca de la plaza; B,
 * junto al borde) separadas por una calle recta. Las calles radiales corren por los límites entre
 * distritos. En el sistema local de un lote la fachada principal mira siempre a +Z y el suelo es y = 0.
 */

export const DISTRICT_COUNT = 5
export const DISTRICT_STEP = (Math.PI * 2) / DISTRICT_COUNT

export const CITY = {
  radius: 13,
  thickness: 0.5,
  plazaRadius: 3,
  ringRoad: [3, 4.4], // avenida circular alrededor de la plaza
  sidewalkEdge: 5, // fin de la acera interior: aquí empieza la hilera A
  middleStreet: [7.9, 8.9], // calle recta (en el eje del distrito) entre las hileras
  radialRoadWidth: 1,
}

export const DISTRICTS = [
  { id: 'comercio', name: 'Comercio y pequeños negocios' },
  { id: 'atencion', name: 'Comercio y atención al público' },
  { id: 'empresarial', name: 'Zona empresarial' },
  { id: 'experiencias', name: 'Exhibición, experiencias y educación' },
  { id: 'industrial', name: 'Industria y operaciones' },
]

/**
 * Hileras de lotes de un distrito. `inner` es la distancia al centro, medida sobre el eje del distrito,
 * del borde cercano de la hilera; `facing`, hacia dónde mira la fachada ('outward' = al borde de la
 * ciudad, 'inward' = a la plaza). Las B miran afuera (es lo que ve la cámara desde fuera) y las A adentro.
 */
export const LOT_RINGS = {
  A: { inner: 5, depth: 2.9, width: 2.2, offsets: [-1.25, 1.25], facing: 'inward' },
  B: { inner: 8.9, depth: 2.7, width: 3.2, offsets: [-3.4, 0, 3.4], facing: 'outward' },
}

/**
 * Qué se construye en cada lote: `LOT_PLAN[distrito][hilera]` lista los tipos de izquierda a derecha.
 * Los pintores de `district/*.js` reconocen estos nombres.
 */
export const LOT_PLAN = [
  { A: ['cafe', 'mini-office'], B: ['shop-row', 'market', 'shop-row-b'] },
  { A: ['admin', 'community'], B: ['storefronts', 'clinic', 'storefronts-b'] },
  { A: ['tower-a', 'tower-b'], B: ['office-mid', 'hq', 'office-low'] },
  { A: ['dome', 'school'], B: ['campus', 'expo-hall', 'plaza-art'] },
  { A: ['silo-yard', 'ops-center'], B: ['factory', 'warehouse', 'workshop'] },
]

/**
 * Vehículos de la avenida circular (solo en calidad completa): carril, sentido (1 = antihorario visto desde
 * arriba), velocidad en vueltas por segundo y fase inicial (0‥1). `vehicles.js` crea tantos nodos como entradas.
 */
export const VEHICLES = [
  { radius: 3.35, direction: 1, speed: 0.03, phase: 0 },
  { radius: 3.35, direction: 1, speed: 0.03, phase: 0.34 },
  { radius: 3.35, direction: 1, speed: 0.03, phase: 0.68 },
  { radius: 4.05, direction: -1, speed: 0.024, phase: 0.12 },
  { radius: 4.05, direction: -1, speed: 0.024, phase: 0.5 },
  { radius: 4.05, direction: -1, speed: 0.024, phase: 0.83 },
]

export const districtAngle = (district) => district * DISTRICT_STEP

/** [x, z] de un punto a distancia `radius` del centro en el ángulo `angle`. */
export const polar = (angle, radius) => [radius * Math.sin(angle), radius * Math.cos(angle)]

/** Del sistema del distrito (t tangente, s radial sobre su eje) al del mundo. */
export function districtToWorld(district, t, s) {
  const angle = districtAngle(district)
  const sin = Math.sin(angle)
  const cos = Math.cos(angle)
  return [t * cos + s * sin, -t * sin + s * cos]
}

/** Los 25 lotes: `{ id, district, ring, slot, kind, center: [x, 0, z], yaw, size: [ancho, fondo] }`. */
export function createLots() {
  const lots = []
  LOT_PLAN.forEach((plan, district) => {
    for (const ring of ['A', 'B']) {
      const { inner, depth, width, offsets, facing } = LOT_RINGS[ring]
      offsets.forEach((offset, slot) => {
        const [x, z] = districtToWorld(district, offset, inner + depth / 2)
        lots.push({
          id: `${district}-${ring}${slot}`,
          district,
          ring,
          slot,
          kind: plan[ring][slot],
          center: [x, 0, z],
          yaw: districtAngle(district) + (facing === 'inward' ? Math.PI : 0),
          size: [width, depth],
        })
      })
    }
  })
  return lots
}

/** Las cuatro esquinas [x, z] de un lote en el mundo. */
export function lotCorners(lot) {
  const [cx, , cz] = lot.center
  const [width, depth] = lot.size
  const sin = Math.sin(lot.yaw)
  const cos = Math.cos(lot.yaw)
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sz]) => {
    const lx = (sx * width) / 2
    const lz = (sz * depth) / 2
    return [cx + lx * cos + lz * sin, cz - lx * sin + lz * cos]
  })
}

/** Rectángulo [mínX, mínZ, máxX, máxZ] que contiene un lote (para pruebas de solape). */
export function lotBounds(lot) {
  const corners = lotCorners(lot)
  const xs = corners.map((corner) => corner[0])
  const zs = corners.map((corner) => corner[1])
  return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)]
}

/** Distancia (con signo) de un punto del mundo al límite radial del distrito: positiva = dentro. */
export function insideDistrictMargin(district, [x, z]) {
  const angle = districtAngle(district)
  const sin = Math.sin(angle)
  const cos = Math.cos(angle)
  const t = x * cos - z * sin
  const s = x * sin + z * cos
  const half = DISTRICT_STEP / 2
  // distancia al límite más cercano (las dos rectas a ±36° del eje)
  return s * Math.sin(half) - Math.abs(t) * Math.cos(half)
}
