import {
  bench,
  block,
  columns,
  floorPane,
  gableRoof,
  glassBand,
  hedge,
  lampPost,
  lotArea,
  onFace,
  opening,
  paintCar,
  pane,
  parapet,
  planter,
  rect,
  rooftopUnits,
  slab,
  solarRow,
  steps,
  tree,
  vaultRoof,
  windowGrid,
} from '../buildingKit.js'

/**
 * Distrito 1 · Comercio y atención al público: locales con marquesina y aparcamiento, centro de atención
 * (clínica) con cruz luminosa y ambulancia, edificio administrativo con pórtico y centro comunitario con patio.
 */

const PAVED_Y = 0.02
const CAR_LAYERS = [
  { body: 'wall', glass: 'glassDark', light: 'lamp' },
  { body: 'trim', glass: 'glassDark', light: 'lamp' },
  { body: 'accent', glass: 'glassDark', light: 'lamp' },
]

// ---- Locales con escaparate y marquesina ----------------------------------------------------------------

/** Tira comercial moderna: escaparates entre pilares, marquesina corrida, rótulos luminosos y aparcamiento. */
function paintStrip(brush, lot, { bays, wall, canopy, tower }) {
  const area = lotArea(lot)
  const width = area.hw * 2
  const towerWidth = 0.7
  const bodyWidth = width - towerWidth
  const bodyX = (-tower * towerWidth) / 2
  const towerX = (tower * bodyWidth) / 2
  const body = rect(bodyX, -0.53, bodyWidth, 1.4)
  const core = rect(towerX, -0.53, towerWidth, 1.4)

  block(brush, 'trim', 0, rect(0, -0.53, width, 1.42), 0.06)
  block(brush, wall, 0.06, body, 0.78)
  slab(brush, 'trim', 0.84, body, { over: 0.03 })
  block(brush, 'concrete', 0.06, core, 1.45)
  slab(brush, 'trim', 1.51, core, { over: 0.035 })

  onFace(brush, 'front', body, (span) => {
    const pitch = span / bays
    for (let bay = 0; bay < bays; bay += 1) {
      const x = -span / 2 + pitch * (bay + 0.5)
      glassBand(brush, { x, width: pitch - 0.12, y: 0.1, height: 0.46, mullions: 1 })
      pane(brush, 'lamp', [x, 0.66, 0.012], [pitch - 0.2, 0.1])
      brush.box('concrete', [x - pitch / 2, 0.06, 0.02], [0.07, 0.72, 0.05])
    }
    brush.box('concrete', [span / 2, 0.06, 0.02], [0.07, 0.72, 0.05])
    brush.box('trim', [0, 0.58, 0.2], [span + 0.06, 0.035, 0.4]) // marquesina corrida
    brush.box(canopy, [0, 0.575, 0.4], [span + 0.06, 0.03, 0.02])
  })
  onFace(brush, 'front', core, (span) => {
    glassBand(brush, { width: span - 0.2, y: 0.1, height: 0.46, mullions: 1 })
    windowGrid(brush, { width: span, y: 0.62, floors: 2, floorHeight: 0.42, cols: 2, layer: 'glassDark' })
    pane(brush, 'accent', [0, 1.42, 0.012], [span - 0.2, 0.05])
  })
  onFace(brush, tower > 0 ? 'right' : 'left', core, (span) => windowGrid(brush, { width: span, y: 0.12, floors: 3, floorHeight: 0.45, cols: 3 }))
  rooftopUnits(brush, 0.88, rect(bodyX, -0.55, bodyWidth - 0.2, 1.1), { count: 4, seed: 11 + bays })

  paintParking(brush, area)
}

function paintParking(brush, area) {
  floorPane(brush, 'paving', [0, PAVED_Y, 0.82], [area.hw * 2, 0.8])
  const spots = [-0.95, -0.35, 0.65]
  spots.forEach((x, k) => paintCar(brush, { at: [x, 0.86], yaw: Math.PI, layers: CAR_LAYERS[k % CAR_LAYERS.length] }))
  tree(brush, 1.3, 1.02, { height: 0.3, crown: 0.14, kind: 0 })
  if (brush.detail >= 1) lampPost(brush, 0.15, 1.1, { height: 0.38 })
}

// ---- Centro de atención (clínica) ------------------------------------------------------------------------

/** Ambulancia estilizada: furgón, cabina, franja esmeralda y luz de techo. */
function paintAmbulance(brush, at) {
  brush.frame([at[0], 0, at[1]], 0, () => {
    brush.box('dark', [0, 0.015, 0], [0.24, 0.04, 0.58])
    brush.box('wall', [0, 0.04, -0.06], [0.28, 0.17, 0.46])
    brush.box('wall', [0, 0.04, 0.24], [0.27, 0.1, 0.16])
    brush.box('glass', [0, 0.1, 0.27], [0.26, 0.06, 0.1])
    for (const side of [-1, 1]) {
      pane(brush, 'accent', [side * 0.141, 0.1, -0.05], [0.02, 0.05])
      brush.box('accent', [side * 0.141, 0.1, -0.06], [0.004, 0.03, 0.4])
    }
    brush.box('lamp', [0, 0.21, 0.0], [0.1, 0.02, 0.04])
    if (brush.detail < 1) return
    for (const side of [-1, 1]) {
      for (const end of [-1, 1]) brush.box('dark', [side * 0.14, 0, end * 0.18], [0.03, 0.05, 0.09])
    }
  })
}

function paintClinic(brush, lot) {
  const area = lotArea(lot)
  const core = rect(0, -0.6, 1.14, 1.2)
  const wingLeft = rect(-1.0, -0.55, 0.96, 1.1)
  const wingRight = rect(1.0, -0.55, 0.96, 1.1)
  const lobby = rect(0, 0.18, 1.5, 0.5)

  for (const wing of [wingLeft, wingRight]) {
    block(brush, 'wall', 0, wing, 0.95)
    slab(brush, 'trim', 0.95, wing, { over: 0.03 })
    onFace(brush, 'front', wing, (span) => windowGrid(brush, { width: span, y: 0.08, floors: 2, floorHeight: 0.43, cols: 3 }))
    onFace(brush, 'back', wing, (span) => windowGrid(brush, { width: span, y: 0.08, floors: 2, floorHeight: 0.43, cols: 3 }))
  }
  solarRow(brush, { x: -1.0, y: 1.0, z: -0.8, width: 0.7, rows: 2 })
  rooftopUnits(brush, 0.99, wingRight, { count: 3, seed: 21 })

  block(brush, 'wall', 0, core, 1.4)
  block(brush, 'wall', 1.4, rect(0, -0.62, 0.9, 0.9), 0.3) // planta retranqueada
  slab(brush, 'trim', 1.4, core, { over: 0.035, height: 0.035 })
  slab(brush, 'trim', 1.7, rect(0, -0.62, 0.9, 0.9), { over: 0.03 })
  onFace(brush, 'front', rect(0, -0.62, 0.9, 0.9), (span) => glassBand(brush, { width: span - 0.2, y: 1.45, height: 0.2, mullions: 4 }))
  onFace(brush, 'front', core, (span) => {
    windowGrid(brush, { width: span, y: 0.58, floors: 1, floorHeight: 0.4, cols: 4 })
    // cruz esmeralda luminosa
    brush.box('trim', [0, 0.95, 0.008], [0.4, 0.4, 0.01])
    pane(brush, 'accent', [0, 0.97, 0.02], [0.1, 0.36])
    pane(brush, 'accent', [0, 1.1, 0.022], [0.36, 0.1])
  })
  onFace(brush, 'back', core, (span) => windowGrid(brush, { width: span, y: 0.1, floors: 3, floorHeight: 0.45, cols: 4 }))

  block(brush, 'wall', 0, lobby, 0.5)
  slab(brush, 'trim', 0.5, lobby, { over: 0.04 })
  onFace(brush, 'front', lobby, (span) => {
    glassBand(brush, { width: span - 0.3, y: 0.08, height: 0.36, mullions: 5 })
    opening(brush, { width: 0.26, height: 0.36, y: 0.04, layer: 'glassDark' })
  })
  paintPorch(brush, area)
}

/** Acceso cubierto con la ambulancia en su puesto. */
function paintPorch(brush, area) {
  floorPane(brush, 'paving', [0, PAVED_Y, 0.8], [area.hw * 2, 0.9])
  brush.box('trim', [0, 0.6, 0.72], [1.7, 0.04, 0.56])
  brush.box('accent', [0, 0.595, 0.995], [1.7, 0.03, 0.02])
  columns(brush, 'wall', { x0: -0.78, x1: 0.78, z: 0.97, height: 0.6, radius: 0.02, count: 4 })
  paintAmbulance(brush, [0.45, 0.76])
  tree(brush, -1.3, 1.0, { height: 0.3, crown: 0.14, kind: 1 })
  tree(brush, 1.3, 1.0, { height: 0.3, crown: 0.14, kind: 0 })
  if (brush.detail >= 1) {
    planter(brush, -0.62, 1.12, 0.5, 0.1)
    lampPost(brush, 1.05, 1.12, { height: 0.36 })
  }
}

// ---- Edificio administrativo -------------------------------------------------------------------------------

function paintAdmin(brush, lot) {
  const area = lotArea(lot)
  const body = rect(0, -0.45, 1.84, 1.7)
  block(brush, 'concrete', 0, rect(0, -0.4, 1.94, 1.84), 0.08)
  block(brush, 'wall', 0.08, body, 1.12)
  slab(brush, 'trim', 1.2, body, { over: 0.04, height: 0.05 })
  parapet(brush, 'wall', 1.25, rect(0, -0.45, 1.84, 1.7), { height: 0.07, thickness: 0.05 })

  onFace(brush, 'front', body, (span) => windowGrid(brush, { width: span, y: 0.14, floors: 2, floorHeight: 0.5, cols: 5, margin: 0.14 }))
  onFace(brush, 'back', body, (span) => windowGrid(brush, { width: span, y: 0.14, floors: 2, floorHeight: 0.5, cols: 5, margin: 0.14 }))
  for (const face of ['left', 'right']) {
    onFace(brush, face, body, (span) => windowGrid(brush, { width: span, y: 0.14, floors: 2, floorHeight: 0.5, cols: 4, margin: 0.2 }))
  }

  // Pórtico: fuste de columnas, arquitrabe y frontón
  columns(brush, 'wall', { x0: -0.78, x1: 0.78, z: 0.64, y: 0.08, height: 0.88, radius: 0.034, count: 6 })
  brush.box('trim', [0, 0.96, 0.52], [1.78, 0.09, 0.4])
  gableRoof(brush, 'wall', 1.05, rect(0, 0.52, 1.74, 0.4), 0.22, 'z')
  onFace(brush, 'front', rect(0, 0.35, 1.0, 0.1), () => opening(brush, { width: 0.36, height: 0.5, y: 0.08, layer: 'glassDark' }))
  steps(brush, 'concrete', { z: 0.78, width: 1.7, count: 3 })

  // Cubierta con claraboya piramidal, mástil y equipos
  brush.cylinder('glass', [0, 1.29, -0.55], { radius: 0.35, radiusTop: 0.05, height: 0.3, segments: 4, rotation: [0, 0.3827, 0, 0.9239] })
  brush.box('trim', [0.6, 1.29, -0.5], [0.012, 0.55, 0.012])
  pane(brush, 'accent', [0.67, 1.66, -0.5], [0.13, 0.08])
  rooftopUnits(brush, 1.29, rect(-0.4, -0.55, 0.9, 1.1), { count: 3, seed: 31 })

  floorPane(brush, 'paving', [0, PAVED_Y, 1.05], [area.hw * 2, 0.5])
  tree(brush, -0.85, 1.12, { height: 0.28, crown: 0.13, kind: 2 })
  tree(brush, 0.85, 1.12, { height: 0.28, crown: 0.13, kind: 2 })
  if (brush.detail >= 1) lampPost(brush, 0, 1.15, { height: 0.34 })
}

// ---- Centro comunitario con patio ---------------------------------------------------------------------------

function paintCommunity(brush, lot) {
  const area = lotArea(lot)
  const hall = rect(0, -0.87, area.hw * 2, 0.92)
  const wingLeft = rect(-0.8, 0.1, 0.36, 1.1)
  const wingRight = rect(0.8, 0.1, 0.36, 1.1)

  block(brush, 'wall', 0, hall, 0.7)
  slab(brush, 'trim', 0.7, hall, { over: 0.03 })
  vaultRoof(brush, 'deep', 0.74, hall, 0.34)
  onFace(brush, 'front', hall, (span) => {
    glassBand(brush, { width: span - 0.3, y: 0.1, height: 0.45, mullions: 7, transoms: 1 })
    opening(brush, { width: 0.26, height: 0.45, y: 0.04, layer: 'glassDark', lintel: 'accent' })
  })
  onFace(brush, 'back', hall, (span) => windowGrid(brush, { width: span, y: 0.12, floors: 1, floorHeight: 0.5, cols: 5 }))

  block(brush, 'wall', 0, wingLeft, 0.58)
  slab(brush, 'trim', 0.58, wingLeft, { over: 0.025 })
  floorPane(brush, 'leafLight', [-0.8, 0.63, 0.1], [0.3, 1.0])
  block(brush, 'wall', 0, wingRight, 0.88)
  slab(brush, 'trim', 0.88, wingRight, { over: 0.025 })
  solarRow(brush, { x: 0.8, y: 0.93, z: -0.2, width: 0.24, rows: 3, depth: 0.2 })
  for (const [wing, face, floors] of [[wingLeft, 'right', 1], [wingRight, 'left', 2]]) {
    onFace(brush, face, wing, (span) => windowGrid(brush, { width: span, y: 0.1, floors, floorHeight: 0.43, cols: 3 }))
  }
  onFace(brush, 'front', wingRight, (span) => windowGrid(brush, { width: span, y: 0.1, floors: 2, floorHeight: 0.43, cols: 1, margin: 0.06 }))

  paintCourtyard(brush)
}

/** Patio central: solado, estanque, arbolado y bancos, con un muro bajo y portada hacia la calle. */
function paintCourtyard(brush) {
  floorPane(brush, 'paving', [0, PAVED_Y, 0.15], [1.24, 1.5])
  floorPane(brush, 'deep', [0.0, PAVED_Y + 0.004, 0.1], [0.42, 0.36])
  tree(brush, -0.3, -0.15, { height: 0.34, crown: 0.16, kind: 0 })
  tree(brush, 0.32, 0.62, { height: 0.32, crown: 0.15, kind: 0 })
  tree(brush, -0.35, 0.78, { height: 0.26, crown: 0.13, kind: 1 })
  hedge(brush, -0.6, 1.2, 0.3, 0.07)
  hedge(brush, 0.6, 1.2, 0.3, 0.07)
  if (brush.detail < 1) return
  bench(brush, 0.34, 0.05, Math.PI / 2)
  bench(brush, -0.3, 0.45, -Math.PI / 2)
}

export const PAINTERS = {
  'storefronts': (brush, lot) => paintStrip(brush, lot, { bays: 4, wall: 'wall', canopy: 'accent', tower: 1 }),
  'storefronts-b': (brush, lot) => paintStrip(brush, lot, { bays: 3, wall: 'concrete', canopy: 'lamp', tower: -1 }),
  'clinic': paintClinic,
  'admin': paintAdmin,
  'community': paintCommunity,
}
