import { createPlane, createTorus } from '../../../engine3d/primitives.js'
import { quatX, quatY, quatYTo } from '../../scene3d/sceneKit.js'
import { GABLE, VAULT_COARSE, VAULT_FINE, WEDGE } from './prism.js'

/**
 * Piezas compartidas por los pintores de edificios y el mobiliario: paneles planos (4 vértices, para
 * ventanas y letreros), fachadas, toldos, cubiertas, árboles, farolas, coches… Todo dibuja con el pincel
 * en el sistema actual (el del lote, o el del mundo); `brush.detail` decide cuántos adornos se añaden.
 *
 * Convención de «rectángulo»: `{ cx, cz, hw, hd }` = centro y semiejes en x y z.
 */

export const LOT_MARGIN = 0.12
const ROOF_SKIN = 0.02
const SKIN = 0.03 // separación de los paneles sobre el muro (evita el parpadeo entre superficies coplanares)
const PANE = createPlane({ width: 1, height: 1 })
const FLAT = quatX(-Math.PI / 2)

export const rect = (cx, cz, width, depth) => ({ cx, cz, hw: width / 2, hd: depth / 2 })

/** Área útil de un lote (con margen) como rectángulo centrado. */
export const lotArea = (lot, margin = LOT_MARGIN) => rect(0, 0, lot.size[0] - margin * 2, lot.size[1] - margin * 2)

// ---- Paneles planos --------------------------------------------------------------------------------

/** Panel plano mirando a +Z, centrado en `center`. */
export function quad(brush, layer, center, [width, height], rotation) {
  brush.custom(layer, PANE, { translation: center, rotation, scale: [width, height, 1] })
}

/** Panel vertical mirando a +Z con la base en y (como las cajas). */
export const pane = (brush, layer, [x, y, z], [width, height]) => quad(brush, layer, [x, y + height / 2, z], [width, height])

/** Panel horizontal mirando hacia arriba (césped, suelo de terraza, helipuerto). */
export function floorPane(brush, layer, [x, y, z], [width, depth]) {
  brush.custom(layer, PANE, { translation: [x, y, z], rotation: FLAT, scale: [width, depth, 1] })
}

// ---- Volúmenes y fachadas ----------------------------------------------------------------------------

/** Prisma rectangular de `rect` entre y y y + height. */
export function block(brush, layer, y, { cx, cz, hw, hd }, height) {
  brush.box(layer, [cx, y, cz], [hw * 2, height, hd * 2])
}

/**
 * Losa que sobresale `over` por todos los lados (cornisas, forjados, cubiertas): canto de `layer` y cara
 * superior de hormigón, para que las azoteas no pesen como una mancha oscura.
 */
export function slab(brush, layer, y, { cx, cz, hw, hd }, { over = 0.03, height = 0.04 } = {}) {
  const size = [(hw + over) * 2, (hd + over) * 2]
  brush.box(layer, [cx, y, cz], [size[0], height, size[1]])
  floorPane(brush, 'concrete', [cx, y + height + ROOF_SKIN, cz], size)
}

const FACES = {
  front: { yaw: 0, at: ({ cx, cz, hd }) => [cx, 0, cz + hd], span: ({ hw }) => hw * 2 },
  back: { yaw: Math.PI, at: ({ cx, cz, hd }) => [cx, 0, cz - hd], span: ({ hw }) => hw * 2 },
  right: { yaw: Math.PI / 2, at: ({ cx, cz, hw }) => [cx + hw, 0, cz], span: ({ hd }) => hd * 2 },
  left: { yaw: -Math.PI / 2, at: ({ cx, cz, hw }) => [cx - hw, 0, cz], span: ({ hd }) => hd * 2 },
}
export const SIDES = ['front', 'right', 'back', 'left']

/** Dibuja en el plano de una fachada: origen en su centro al pie del muro, +Z hacia fuera. `draw(ancho)`. */
export function onFace(brush, face, area, draw) {
  const { yaw, at, span } = FACES[face]
  brush.frame(at(area), yaw, () => draw(span(area)))
}

export function onFaces(brush, faces, area, draw) {
  for (const face of faces) onFace(brush, face, area, (span) => draw(span, face))
}

/**
 * Ventanas de una fachada: `floors` plantas de `floorHeight`; en detalle completo una ventana por columna,
 * en el reducido una banda continua por planta. Se dibuja en el plano de la fachada (ver `onFace`).
 */
export function windowGrid(brush, { width, y = 0, floors, floorHeight, cols, layer = 'glass', margin = 0.08, fill = 0.62 }) {
  const inner = width - margin * 2
  const pitch = inner / cols
  const paneHeight = floorHeight * 0.52
  for (let floor = 0; floor < floors; floor += 1) {
    const base = y + floor * floorHeight + (floorHeight - paneHeight) / 2
    if (brush.detail < 1) {
      pane(brush, layer, [0, base, SKIN], [inner, paneHeight])
      continue
    }
    for (let col = 0; col < cols; col += 1) {
      pane(brush, layer, [-inner / 2 + pitch * (col + 0.5), base, SKIN], [pitch * fill, paneHeight])
    }
  }
}

/** Banda de cristal continua con montantes (`mullions`) y travesaños (`transoms`) de carbón. */
export function glassBand(brush, { x = 0, width, y, height, layer = 'glass', mullions = 0, transoms = 0 }) {
  pane(brush, layer, [x, y, SKIN], [width, height])
  if (brush.detail < 1) return
  for (let k = 1; k <= mullions; k += 1) {
    pane(brush, 'trim', [x - width / 2 + (width * k) / (mullions + 1), y, SKIN * 2], [0.02, height])
  }
  for (let k = 1; k <= transoms; k += 1) {
    pane(brush, 'trim', [x, y + (height * k) / (transoms + 1) - 0.01, SKIN * 2], [width, 0.02])
  }
}

/** Puerta o portón: hueco oscuro con dintel en `lintel` (capa opcional). */
export function opening(brush, { x = 0, width, height, layer = 'dark', lintel = null, y = 0 }) {
  pane(brush, layer, [x, y, SKIN], [width, height])
  if (lintel) brush.box(lintel, [x, y + height, SKIN], [width + 0.06, 0.03, 0.04])
}

/** Rótulo luminoso sin texto: placa de carbón con una banda emisiva. */
export function glowSign(brush, { x = 0, y, z = 0, width, height = 0.1, layer = 'lamp' }) {
  brush.box('trim', [x, y, z], [width + 0.04, height + 0.04, 0.03])
  pane(brush, layer, [x, y + 0.02, z + 0.016], [width, height])
}

/** Escalones de acceso hacia +Z (desde z) que se estrechan hacia fuera. */
export function steps(brush, layer, { x = 0, z, width, count = 3, rise = 0.035, run = 0.07 }) {
  for (let k = 0; k < count; k += 1) {
    brush.box(layer, [x, 0, z + run * k], [width + (count - k) * 0.02, rise * (count - k), run])
  }
}

/** Columnas redondas entre x0 y x1 (incluidas) en el plano z. */
export function columns(brush, layer, { x0, x1, z, y = 0, height, radius = 0.028, count }) {
  for (let k = 0; k < count; k += 1) {
    const x = count === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * k) / (count - 1)
    brush.cylinder(layer, [x, y, z], { radius, height, segments: 8 })
  }
}

// ---- Toldos y cubiertas ------------------------------------------------------------------------------

/**
 * Toldo a rayas sobre el muro (en el marco de la fachada): sale `depth` y cae `drop` desde la altura `y`.
 * Las rayas alternan las capas de `layers`.
 */
export function awning(brush, { x = 0, y, z = 0, width, depth = 0.2, drop = 0.1, stripes = 6, layers = ['accent', 'wall'] }) {
  const slope = Math.hypot(depth, drop)
  const tilt = quatX(-Math.atan2(depth, drop))
  const stripe = width / stripes
  for (let k = 0; k < stripes; k += 1) {
    const layer = layers[k % layers.length]
    const sx = x - width / 2 + stripe * (k + 0.5)
    quad(brush, layer, [sx, y - drop / 2, z + depth / 2], [stripe, slope], tilt)
    if (brush.detail >= 1) pane(brush, layer, [sx, y - drop - 0.04, z + depth], [stripe, 0.04])
  }
}

/** Cubierta a dos aguas sobre `area`; la cumbrera corre a lo largo de `ridge` ('x' | 'z'). */
export function gableRoof(brush, layer, y, { cx, cz, hw, hd }, height, ridge = 'x') {
  if (ridge === 'x') brush.custom(layer, GABLE, { translation: [cx, y, cz], scale: [hw * 2, height, hd * 2] })
  else brush.custom(layer, GABLE, { translation: [cx, y, cz], rotation: quatY(Math.PI / 2), scale: [hd * 2, height, hw * 2] })
}

/** Cubierta curva (bóveda) sobre `area`, con la generatriz a lo largo de x. */
export function vaultRoof(brush, layer, y, { cx, cz, hw, hd }, height) {
  const geometry = brush.detail >= 1 ? VAULT_FINE : VAULT_COARSE
  brush.custom(layer, geometry, { translation: [cx, y, cz], scale: [hw * 2, height, hd * 2] })
}

/**
 * Cubierta en diente de sierra: `teeth` cuerpos con la pared vertical acristalada hacia +Z (hacia la
 * fachada) y la pendiente hacia el fondo, desde z0 hasta z1.
 */
export function sawtoothRoof(brush, { y, cx = 0, width, z0, z1, teeth, height, roof = 'trim', glass = 'glass' }) {
  const pitch = (z1 - z0) / teeth
  for (let k = 0; k < teeth; k += 1) {
    const zc = z0 + pitch * (k + 0.5)
    brush.custom(roof, WEDGE, { translation: [cx, y, zc], rotation: quatY(Math.PI), scale: [width, height, pitch] })
    brush.frame([cx, 0, zc + pitch / 2], 0, () => pane(brush, glass, [0, y + height * 0.1, SKIN], [width - 0.1, height * 0.75]))
  }
}

/** Antepecho de `thickness` alrededor de `area` en la cota y. */
export function parapet(brush, layer, y, { cx, cz, hw, hd }, { height = 0.06, thickness = 0.04 } = {}) {
  brush.box(layer, [cx, y, cz + hd - thickness / 2], [hw * 2, height, thickness])
  brush.box(layer, [cx, y, cz - hd + thickness / 2], [hw * 2, height, thickness])
  const inner = hd * 2 - thickness * 2
  brush.box(layer, [cx + hw - thickness / 2, y, cz], [thickness, height, inner])
  brush.box(layer, [cx - hw + thickness / 2, y, cz], [thickness, height, inner])
}

/** Aro (toro) centrado en `at`: horizontal por defecto; `rotation` lo vuelca (arcos, esculturas). */
export function ring(brush, layer, at, radius, tube = 0.014, rotation) {
  const tubularSegments = brush.detail >= 1 ? 28 : 14
  brush.custom(layer, createTorus({ radius, tube, radialSegments: 4, tubularSegments }), { translation: at, rotation })
}

// ---- Estructuras lineales ------------------------------------------------------------------------------

const midpoint = (from, to) => from.map((value, axis) => (value + to[axis]) / 2)
const distance = (from, to) => Math.hypot(...from.map((value, axis) => to[axis] - value))

/** Tubería cilíndrica entre dos puntos (conductos, mástiles inclinados). */
export function pipe(brush, layer, from, to, radius = 0.025) {
  const height = distance(from, to)
  const [x, y, z] = midpoint(from, to)
  brush.cylinder(layer, [x, y - height / 2, z], { radius, height, segments: 6, rotation: quatYTo(to.map((value, axis) => value - from[axis])) })
}

/** Viga o cinta plana entre dos puntos: `size` = [ancho, grosor] (cintas transportadoras, pasarelas, rampas). */
export function beam(brush, layer, from, to, [width, thickness]) {
  const length = distance(from, to)
  const [x, y, z] = midpoint(from, to)
  brush.box(layer, [x, y - length / 2, z], [width, length, thickness], quatYTo(to.map((value, axis) => value - from[axis])))
}

// ---- Azoteas ------------------------------------------------------------------------------------------

/** Generador pseudoaleatorio determinista (para repartir equipos sin que cambie entre cargas). */
export function seeded(seed) {
  let state = seed * 9301 + 49297
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

/** Unidades de climatización, rejillas y extractores repartidos por una azotea (no hacen nada con detalle 0). */
export function rooftopUnits(brush, y, { cx, cz, hw, hd }, { count = 4, seed = 1 } = {}) {
  if (brush.detail < 1) return
  const next = seeded(seed)
  for (let k = 0; k < count; k += 1) {
    const x = cx + (next() * 2 - 1) * (hw - 0.14)
    const z = cz + (next() * 2 - 1) * (hd - 0.14)
    if (k % 3 === 2) {
      brush.cylinder('dark', [x, y, z], { radius: 0.045, height: 0.05, segments: 8 })
      continue
    }
    brush.box('concrete', [x, y, z], [0.16, 0.07, 0.11])
    if (k % 3 === 1) brush.box('trim', [x, y + 0.07, z], [0.1, 0.02, 0.07])
  }
}

/** Paneles solares inclinados en hilera (capa «panel») sobre un bastidor de carbón. */
export function solarRow(brush, { x, y, z, width, rows = 2, depth = 0.16, tilt = 0.45 }) {
  for (let row = 0; row < rows; row += 1) {
    const zz = z + row * (depth + 0.07)
    quad(brush, 'panel', [x, y + 0.05, zz], [width, depth], quatX(-Math.PI / 2 + tilt))
    brush.box('trim', [x, y, zz - depth / 2 + 0.02], [width, 0.03, 0.02])
  }
}

// ---- Vegetación y mobiliario ---------------------------------------------------------------------------

/**
 * Árbol: `kind` 0 redondo con tronco, 1 cónico, 2 columnar; `base` es la cota del suelo (azoteas ajardinadas).
 * Con detalle completo suma un segundo volumen de copa.
 */
export function tree(brush, x, z, { height = 0.34, crown = 0.15, kind = 0, base = 0 } = {}) {
  const variant = kind % 3
  if (variant === 1) {
    brush.cylinder('leaf', [x, base + height * 0.18, z], { radius: crown * 0.95, radiusTop: 0, height: height * 1.1, segments: 8 })
    return
  }
  if (variant === 2) {
    brush.box('trim', [x, base, z], [0.025, height * 0.3, 0.025])
    brush.cylinder('leafLight', [x, base + height * 0.28, z], { radius: crown * 0.8, radiusTop: crown * 0.55, height: height * 0.9, segments: 8 })
    return
  }
  brush.box('trim', [x, base, z], [0.03, height, 0.03])
  brush.sphere('leaf', [x, base + height + crown * 0.55, z], crown, 8)
  if (brush.detail >= 1) brush.sphere('leafLight', [x + crown * 0.35, base + height + crown * 1.05, z - crown * 0.2], crown * 0.62, 8)
}

/** Seto o parterre bajo: caja de follaje con la base en `base`. */
export function hedge(brush, x, z, width, depth, { height = 0.1, layer = 'leaf', base = 0 } = {}) {
  brush.box(layer, [x, base, z], [width, height, depth])
}

/** Jardinera: marco de hormigón y tapiz vegetal. */
export function planter(brush, x, z, width, depth, { height = 0.08 } = {}) {
  brush.box('concrete', [x, 0, z], [width, height, depth])
  brush.box('leafLight', [x, height, z], [width - 0.04, 0.03, depth - 0.04])
}

/**
 * Farola: poste de carbón y luminaria cálida. Con `lean` ([dx, dz]) la luminaria sale en voladizo
 * (alumbrado de calzada).
 */
export function lampPost(brush, x, z, { height = 0.42, lean = null } = {}) {
  brush.box('trim', [x, 0, z], [0.022, height, 0.022])
  if (!lean) {
    brush.box('lamp', [x, height, z], [0.06, 0.02, 0.06])
    return
  }
  brush.box('trim', [x + lean[0] / 2, height - 0.012, z + lean[1] / 2], [Math.max(0.018, Math.abs(lean[0])), 0.018, Math.max(0.018, Math.abs(lean[1]))])
  brush.box('lamp', [x + lean[0], height - 0.03, z + lean[1]], [0.06, 0.018, 0.06])
}

/** Banco con respaldo, mirando a +Z en su marco (gira con `yaw`). */
export function bench(brush, x, z, yaw = 0, length = 0.2) {
  brush.frame([x, 0, z], yaw, () => {
    brush.box('trim', [0, 0, 0], [length - 0.04, 0.03, 0.04])
    brush.box('concrete', [0, 0.03, 0], [length, 0.022, 0.07])
    brush.box('trim', [0, 0.052, -0.035], [length, 0.045, 0.012])
  })
}

/** Mesa con sombrilla: tablero, pie y sombrilla cónica. */
export function parasolTable(brush, x, z, { layer = 'accent', radius = 0.17 } = {}) {
  brush.cylinder('trim', [x, 0, z], { radius: 0.09, height: 0.07, segments: 8 })
  brush.box('trim', [x - 0.006, 0.07, z - 0.006], [0.012, 0.16, 0.012])
  brush.cylinder(layer, [x, 0.2, z], { radius, radiusTop: 0.012, height: 0.05, segments: 8 })
}

// ---- Vehículos ------------------------------------------------------------------------------------------

const CAR = { width: 0.26, length: 0.55 }

/**
 * Coche estilizado de ~0,55 de largo con el frente hacia +Z en su marco. `layers` asigna capas a la
 * carrocería (`body`), la cabina (`glass`), los faros (`light`) y el bajo (`base`).
 */
export function paintCar(brush, { at = [0, 0], yaw = 0, layers }) {
  const { body, glass, light, base = 'dark' } = layers
  brush.frame([at[0], 0, at[1]], yaw, () => {
    const { width, length } = CAR
    brush.box(base, [0, 0.015, 0], [width - 0.03, 0.04, length - 0.06])
    brush.box(body, [0, 0.04, 0], [width, 0.065, length])
    brush.box(glass, [0, 0.105, -0.04], [width - 0.04, 0.06, length * 0.5])
    brush.box(body, [0, 0.165, -0.04], [width - 0.03, 0.012, length * 0.54])
    for (const side of [-1, 1]) brush.box(light, [side * 0.085, 0.07, length / 2], [0.05, 0.022, 0.012])
    if (brush.detail < 1) return
    for (const side of [-1, 1]) {
      for (const end of [-1, 1]) brush.box('dark', [side * (width / 2), 0, end * 0.17], [0.03, 0.05, 0.09])
    }
  })
}

/** Camión de carga de ~0,9 de largo (cabina al frente, +Z) con remolque de la capa `trailer`. */
export function paintTruck(brush, { at = [0, 0], yaw = 0, trailer = 'wall', cab = 'accent' }) {
  brush.frame([at[0], 0, at[1]], yaw, () => {
    brush.box('dark', [0, 0.015, -0.05], [0.24, 0.04, 0.8])
    brush.box(trailer, [0, 0.05, -0.18], [0.28, 0.24, 0.62])
    brush.box(cab, [0, 0.05, 0.27], [0.27, 0.15, 0.2])
    brush.box('glass', [0, 0.12, 0.34], [0.25, 0.07, 0.07])
    brush.box('lamp', [0, 0.07, 0.375], [0.2, 0.02, 0.01])
    if (brush.detail < 1) return
    for (const side of [-1, 1]) {
      for (const z of [-0.4, -0.25, 0.28]) brush.box('dark', [side * 0.14, 0, z], [0.03, 0.055, 0.09])
    }
  })
}
