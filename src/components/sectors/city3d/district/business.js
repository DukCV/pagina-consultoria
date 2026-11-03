import {
  SIDES,
  block,
  columns,
  floorPane,
  glassBand,
  glowSign,
  hedge,
  lampPost,
  lotArea,
  onFace,
  onFaces,
  opening,
  paintCar,
  parapet,
  planter,
  quad,
  rect,
  ring,
  rooftopUnits,
  slab,
  solarRow,
  tree,
  windowGrid,
} from '../buildingKit.js'

/**
 * Distrito 2 · Zona empresarial: las dos torres de la hilera trasera (muro cortina y escalonada) y, delante,
 * oficinas medias, la sede con voladizo y atrio, y un edificio bajo con helipuerto.
 */

const PAVED_Y = 0.02
const TOWER_MODULE = { width: 1.4, height: 2.8 } // proporción 1:2 de la textura de fachada
const PLAZA_CAR = { body: 'wall', glass: 'glassDark', light: 'lamp' }

// ---- Torre de muro cortina ----------------------------------------------------------------------------------

function paintTowerA(brush, lot) {
  const area = lotArea(lot)
  const podium = rect(0, -0.15, 1.9, 1.9)
  const shaft = rect(0, -0.15, TOWER_MODULE.width, TOWER_MODULE.width)
  const { height } = TOWER_MODULE
  const base = 0.45

  block(brush, 'concrete', 0, rect(0, -0.15, 1.96, 1.96), 0.05)
  block(brush, 'wall', 0.05, podium, base - 0.05)
  slab(brush, 'trim', base, podium, { over: 0.03, height: 0.04 })
  onFace(brush, 'front', podium, (span) => glassBand(brush, { width: span - 0.2, y: 0.12, height: 0.25, layer: 'glassDark', mullions: 6 }))
  onFace(brush, 'right', podium, (span) => glassBand(brush, { width: span - 0.3, y: 0.12, height: 0.25, layer: 'glassDark', mullions: 5 }))

  // Dos módulos de fachada 1:2 separados por un forjado técnico
  brush.box('facadeOffice', [0, base + 0.04, -0.15], [TOWER_MODULE.width, height, TOWER_MODULE.width])
  slab(brush, 'trim', base + 0.04 + height, shaft, { over: 0.03, height: 0.06 })
  brush.box('facadeOffice', [0, base + 0.1 + height, -0.15], [TOWER_MODULE.width, height, TOWER_MODULE.width])
  const top = base + 0.1 + height * 2
  slab(brush, 'trim', top, shaft, { over: 0.04, height: 0.05 })

  // Coronación: sala de máquinas, aro luminoso y antena con baliza
  brush.box('concrete', [0, top + 0.05, -0.15], [0.9, 0.26, 0.9])
  slab(brush, 'trim', top + 0.31, rect(0, -0.15, 0.9, 0.9), { over: 0.03, height: 0.03 })
  brush.box('lamp', [0, top + 0.2, -0.15], [0.94, 0.02, 0.94])
  brush.box('trim', [0.2, top + 0.34, -0.3], [0.025, 0.4, 0.025])
  brush.box('lamp', [0.2, top + 0.74, -0.3], [0.05, 0.05, 0.05])
  rooftopUnits(brush, top + 0.05, rect(0, -0.15, 1.2, 1.2), { count: 2, seed: 41 })

  paintForecourt(brush, area, 0.9)
}

/** Explanada de la torre: solado, árboles y farola entre la fachada y la acera. */
function paintForecourt(brush, area, zStart) {
  floorPane(brush, 'paving', [0, PAVED_Y, (zStart + area.hd) / 2], [area.hw * 2, area.hd - zStart])
  tree(brush, -0.7, area.hd - 0.12, { height: 0.28, crown: 0.13, kind: 2 })
  tree(brush, 0.7, area.hd - 0.12, { height: 0.28, crown: 0.13, kind: 2 })
  if (brush.detail >= 1) planter(brush, 0, area.hd - 0.1, 0.7, 0.1)
}

// ---- Torre escalonada -----------------------------------------------------------------------------------------

const TOWER_B_TIERS = [
  { area: rect(0, -0.1, 1.9, 2.2), floors: 3, glass: 'glassDark' },
  { area: rect(0.1, -0.2, 1.56, 1.76), floors: 3, glass: 'glass' },
  { area: rect(0.2, -0.3, 1.1, 1.3), floors: 3, glass: 'glassDark' },
  { area: rect(0.28, -0.35, 0.7, 0.86), floors: 2, glass: 'glass' },
]
const TIER_FLOOR = 0.4

function paintTowerB(brush) {
  let y = 0.05
  block(brush, 'concrete', 0, rect(0, -0.1, 1.96, 2.3), 0.05)
  TOWER_B_TIERS.forEach(({ area, floors, glass }, tier) => {
    const height = floors * TIER_FLOOR
    block(brush, 'wall', y, area, height)
    onFaces(brush, SIDES, area, (span, face) => {
      if (tier === 0 && face === 'front') paintLobbyFront(brush, span, y)
      else windowGrid(brush, { width: span, y: y + 0.02, floors, floorHeight: TIER_FLOOR, cols: 1, layer: glass, margin: 0.06 })
    })
    slab(brush, 'trim', y + height, area, { over: 0.03, height: 0.04 })
    y += height + 0.04
    if (tier < TOWER_B_TIERS.length - 1) paintTerraceGarden(brush, area, TOWER_B_TIERS[tier + 1].area, y)
  })
  // Remate: antena escalonada y baliza
  brush.box('accent', [0.28, y, -0.35], [0.4, 0.16, 0.4])
  brush.box('trim', [0.28, y + 0.16, -0.35], [0.03, 0.55, 0.03])
  brush.box('lamp', [0.28, y + 0.71, -0.35], [0.06, 0.05, 0.06])
  paintTowerBPlaza(brush)
}

function paintLobbyFront(brush, span, y) {
  glassBand(brush, { width: span - 0.3, y: y + 0.04, height: 0.3, layer: 'glassDark', mullions: 6 })
  opening(brush, { width: 0.3, height: 0.3, y: y + 0.04, layer: 'trim' })
  windowGrid(brush, { width: span, y: y + 0.42, floors: 2, floorHeight: TIER_FLOOR, cols: 1, layer: 'glassDark', margin: 0.06 })
}

/** Terraza de un retranqueo: vegetación en el hueco que deja el piso superior. */
function paintTerraceGarden(brush, lower, upper, y) {
  if (brush.detail < 1) return
  floorPane(brush, 'leafLight', [lower.cx, y + 0.005, (lower.cz + lower.hd + upper.cz + upper.hd) / 2], [lower.hw * 2 - 0.1, lower.cz + lower.hd - upper.cz - upper.hd - 0.06])
  tree(brush, lower.cx - lower.hw + 0.18, lower.cz + lower.hd - 0.14, { base: y, height: 0.12, crown: 0.07, kind: 1 })
  hedge(brush, lower.cx + lower.hw - 0.18, lower.cz + lower.hd - 0.12, 0.3, 0.08, { base: y, height: 0.05 })
}

function paintTowerBPlaza(brush) {
  floorPane(brush, 'paving', [0, PAVED_Y, 1.08], [1.96, 0.45])
  tree(brush, -0.75, 1.15, { height: 0.26, crown: 0.12, kind: 0 })
  tree(brush, 0.75, 1.15, { height: 0.26, crown: 0.12, kind: 1 })
  if (brush.detail >= 1) lampPost(brush, 0, 1.18, { height: 0.34 })
}

// ---- Oficinas medias -------------------------------------------------------------------------------------------

function paintOfficeMid(brush, lot) {
  const area = lotArea(lot)
  const main = rect(-0.42, -0.45, 2.0, 1.5)
  const annex = rect(1.0, -0.3, 0.92, 1.3)
  const floors = 7
  const top = 0.13 + floors * 0.4

  block(brush, 'trim', 0, rect(-0.42, -0.45, 2.04, 1.54), 0.07)
  block(brush, 'wall', 0.07, main, top - 0.07)
  slab(brush, 'trim', top, main, { over: 0.035 })
  onFaces(brush, ['front', 'back', 'left'], main, (span) => windowGrid(brush, { width: span, y: 0.16, floors, floorHeight: 0.4, cols: 7, layer: 'glassDark', margin: 0.1 }))
  onFace(brush, 'front', main, (span) => {
    for (let k = 0; k <= 7; k += 1) brush.box('concrete', [-span / 2 + 0.1 + ((span - 0.2) * k) / 7, 0.07, 0.03], [0.03, top - 0.07, 0.04])
    opening(brush, { x: 0, width: 0.46, height: 0.3, y: 0.07, layer: 'glassDark', lintel: 'accent' })
  })
  brush.box('concrete', [-0.42, top + 0.04, -0.7], [0.8, 0.22, 0.6])
  rooftopUnits(brush, top + 0.04, rect(-0.42, -0.45, 1.6, 1.2), { count: 4, seed: 51 })

  block(brush, 'wall', 0.07, annex, 1.0)
  slab(brush, 'trim', 1.07, annex, { over: 0.03 })
  onFaces(brush, ['front', 'right'], annex, (span) => windowGrid(brush, { width: span, y: 0.14, floors: 2, floorHeight: 0.46, cols: 3, margin: 0.1 }))
  floorPane(brush, 'leafLight', [1.0, 1.115, -0.3], [0.8, 1.2])
  solarRow(brush, { x: 1.0, y: 1.12, z: -0.7, width: 0.5, rows: 1 })

  floorPane(brush, 'paving', [0, PAVED_Y, 0.9], [area.hw * 2, 0.7])
  paintCar(brush, { at: [0.95, 0.92], yaw: Math.PI / 2, layers: PLAZA_CAR })
  tree(brush, -1.1, 1.05, { height: 0.28, crown: 0.13, kind: 0 })
  tree(brush, 0.1, 1.1, { height: 0.26, crown: 0.12, kind: 2 })
}

// ---- Sede corporativa -----------------------------------------------------------------------------------------

function paintHq(brush, lot) {
  const area = lotArea(lot)
  const lower = rect(0, -0.45, 2.5, 1.5)
  const upper = rect(0, -0.4, 2.94, 1.7)
  const crown = rect(0.25, -0.5, 1.9, 1.1)
  const floorY = 0.55

  block(brush, 'trim', 0, rect(0, -0.4, 3.0, 1.76), 0.05)
  block(brush, 'glassDark', 0.05, lower, floorY - 0.05)
  columns(brush, 'wall', { x0: -1.38, x1: 1.38, z: 0.4, y: 0.05, height: floorY - 0.05, radius: 0.03, count: 7 })
  block(brush, 'wall', floorY, upper, 0.7)
  slab(brush, 'trim', floorY + 0.7, upper, { over: 0.03 })
  onFaces(brush, SIDES, upper, (span, face) => {
    windowGrid(brush, { width: span, y: floorY + 0.06, floors: 2, floorHeight: 0.35, cols: face === 'front' || face === 'back' ? 9 : 5, layer: 'glassDark', margin: 0.08 })
  })

  const roofY = floorY + 0.74
  block(brush, 'wall', roofY, crown, 0.32)
  slab(brush, 'trim', roofY + 0.32, crown, { over: 0.025, height: 0.035 })
  onFace(brush, 'front', crown, (span) => glassBand(brush, { width: span - 0.2, y: roofY + 0.06, height: 0.2, mullions: 6 }))
  floorPane(brush, 'leafLight', [-0.95, roofY + 0.005, -0.3], [0.7, 1.2])
  tree(brush, -1.2, -0.1, { base: roofY, height: 0.12, crown: 0.08, kind: 1 })
  tree(brush, -0.75, -0.6, { base: roofY, height: 0.12, crown: 0.08, kind: 0 })

  paintAtrium(brush)
  floorPane(brush, 'paving', [0, PAVED_Y, 1.0], [area.hw * 2, 0.5])
  tree(brush, 1.25, 1.05, { height: 0.26, crown: 0.12, kind: 2 })
  if (brush.detail >= 1) glowSign(brush, { x: -1.2, y: 0.05, z: 1.05, width: 0.4, height: 0.06, layer: 'accent' })
}

/** Atrio acristalado de doble altura que sobresale del voladizo, con estructura de carbón. */
function paintAtrium(brush) {
  const atrium = rect(-0.55, 0.52, 1.1, 0.7)
  block(brush, 'glass', 0.05, atrium, 1.1)
  slab(brush, 'trim', 1.15, atrium, { over: 0.03, height: 0.05 })
  onFaces(brush, ['front', 'right', 'left'], atrium, (span) => {
    glassBand(brush, { width: span - 0.04, y: 0.1, height: 1.0, layer: 'glass', mullions: Math.round(span / 0.18), transoms: 3 })
  })
}

// ---- Edificio bajo con helipuerto -----------------------------------------------------------------------------

const HELIPAD = { at: [0.7, -0.55], radius: 0.5 }

function paintOfficeLow(brush, lot) {
  const area = lotArea(lot)
  const body = rect(0, -0.5, 2.7, 1.6)
  const height = 1.3
  block(brush, 'trim', 0, rect(0, -0.5, 2.76, 1.66), 0.06)
  block(brush, 'concrete', 0.06, body, height - 0.06)
  for (const floor of [0.5, 0.9]) slab(brush, 'trim', floor, body, { over: 0.025, height: 0.03 })
  slab(brush, 'trim', height, body, { over: 0.04 })
  parapet(brush, 'concrete', height + 0.04, rect(0, -0.5, 2.7, 1.6), { height: 0.05, thickness: 0.04 })
  onFaces(brush, ['front', 'back'], body, (span) => windowGrid(brush, { width: span, y: 0.12, floors: 3, floorHeight: 0.4, cols: 8, layer: 'glassDark', margin: 0.14 }))
  onFace(brush, 'right', body, (span) => windowGrid(brush, { width: span, y: 0.12, floors: 3, floorHeight: 0.4, cols: 4, layer: 'glassDark' }))
  onFace(brush, 'front', body, () => opening(brush, { x: -0.6, width: 0.4, height: 0.36, y: 0.06, layer: 'glass', lintel: 'accent' }))

  paintHelipad(brush, height + 0.04)
  rooftopUnits(brush, height + 0.04, rect(-0.6, -0.5, 1.2, 1.3), { count: 3, seed: 61 })

  floorPane(brush, 'paving', [0, PAVED_Y, 0.98], [area.hw * 2, 0.55])
  paintCar(brush, { at: [-1.0, 1.0], yaw: Math.PI / 2, layers: { ...PLAZA_CAR, body: 'trim' } })
  paintCar(brush, { at: [-0.4, 1.0], yaw: Math.PI / 2, layers: { ...PLAZA_CAR, body: 'accent' } })
  tree(brush, 0.9, 1.05, { height: 0.26, crown: 0.12, kind: 1 })
}

function paintHelipad(brush, y) {
  const [x, z] = HELIPAD.at
  brush.cylinder('concrete', [x, y, z], { radius: HELIPAD.radius, height: 0.05, segments: 20 })
  brush.cylinder('trim', [x, y + 0.05, z], { radius: HELIPAD.radius - 0.05, height: 0.006, segments: 20 })
  ring(brush, 'lamp', [x, y + 0.062, z], HELIPAD.radius - 0.1, 0.01)
  quad(brush, 'lamp', [x, y + 0.064, z], [0.05, 0.3], [-Math.SQRT1_2, 0, 0, Math.SQRT1_2])
  quad(brush, 'lamp', [x, y + 0.064, z], [0.3, 0.05], [-Math.SQRT1_2, 0, 0, Math.SQRT1_2])
  brush.box('trim', [x + HELIPAD.radius + 0.1, y, z - 0.2], [0.012, 0.3, 0.012]) // manga de viento
  brush.box('accent', [x + HELIPAD.radius + 0.14, y + 0.25, z - 0.2], [0.07, 0.04, 0.012])
}

export const PAINTERS = {
  'tower-a': paintTowerA,
  'tower-b': paintTowerB,
  'hq': paintHq,
  'office-mid': paintOfficeMid,
  'office-low': paintOfficeLow,
}
