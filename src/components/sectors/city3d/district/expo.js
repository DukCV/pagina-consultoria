import {
  bench,
  block,
  floorPane,
  gableRoof,
  glassBand,
  hedge,
  lampPost,
  lotArea,
  onFace,
  onFaces,
  opening,
  parapet,
  planter,
  quad,
  rect,
  ring,
  rooftopUnits,
  slab,
  solarRow,
  steps,
  tree,
  vaultRoof,
  windowGrid,
} from '../buildingKit.js'
import { composeQuat, quatX, quatY } from '../../../scene3d/sceneKit.js'

/**
 * Distrito 3 · Exhibición, experiencias y educación: pabellón de cúpula de cristal, escuela con torre,
 * edificio universitario escalonado con pasarela, nave de exposiciones con cubierta curva y plaza con una
 * instalación artística de aros.
 */

const PAVED_Y = 0.02
const PYRAMID_TURN = [0, 0.3827, 0, 0.9239] // 45° sobre Y: un cono de 4 caras queda con las aristas alineadas

// ---- Pabellón de cúpula -------------------------------------------------------------------------------------

const DOME = { center: [0, -0.1], plinth: 0.9, radius: 0.84, equator: 0.46 }

function paintDome(brush, lot) {
  const area = lotArea(lot)
  const [cx, cz] = DOME.center
  brush.cylinder('concrete', [cx, 0, cz], { radius: DOME.plinth + 0.04, height: 0.06, segments: 20 })
  brush.cylinder('wall', [cx, 0.06, cz], { radius: DOME.plinth, height: DOME.equator - 0.06, segments: 20 })
  ring(brush, 'accent', [cx, 0.3, cz], DOME.plinth + 0.005, 0.012)
  brush.sphere('glass', [cx, DOME.equator, cz], DOME.radius, 14)
  ring(brush, 'lamp', [cx, DOME.equator + 0.01, cz], DOME.radius + 0.02, 0.014)
  for (const height of [0.25, 0.5, 0.7]) {
    ring(brush, 'accent', [cx, DOME.equator + height, cz], Math.sqrt(DOME.radius ** 2 - height ** 2) + 0.012, 0.012)
  }
  brush.cylinder('trim', [cx, DOME.equator + DOME.radius - 0.05, cz], { radius: 0.1, height: 0.09, segments: 8 })
  brush.box('lamp', [cx, DOME.equator + DOME.radius + 0.04, cz], [0.05, 0.04, 0.05])

  paintDomeEntrance(brush, area)
}

function paintDomeEntrance(brush, area) {
  const hall = rect(0, 0.88, 0.8, 0.4)
  block(brush, 'wall', 0, hall, 0.4)
  slab(brush, 'trim', 0.4, hall, { over: 0.04 })
  onFace(brush, 'front', hall, (span) => {
    glassBand(brush, { width: span - 0.2, y: 0.08, height: 0.28, layer: 'glassDark', mullions: 3 })
    opening(brush, { width: 0.2, height: 0.28, y: 0.04, layer: 'trim', lintel: 'accent' })
  })
  steps(brush, 'concrete', { z: 1.1, width: 0.7, count: 2 })
  floorPane(brush, 'paving', [0, PAVED_Y, 1.2], [area.hw * 2, 0.25])
  tree(brush, -0.8, 1.12, { height: 0.26, crown: 0.12, kind: 2 })
  tree(brush, 0.8, 1.12, { height: 0.26, crown: 0.12, kind: 2 })
  block(brush, 'trim', 0, rect(0, -1.1, 0.5, 0.3), 0.28)
  if (brush.detail >= 1) lampPost(brush, 0.5, 1.12, { height: 0.34 })
}

// ---- Escuela -----------------------------------------------------------------------------------------------------

function paintSchool(brush, lot) {
  const area = lotArea(lot)
  const main = rect(0, -0.85, area.hw * 2, 0.96)
  const wing = rect(-0.7, -0.12, 0.52, 0.7)
  const tower = rect(0.72, -0.75, 0.42, 0.42)

  block(brush, 'wall', 0, main, 0.92)
  slab(brush, 'trim', 0.92, main, { over: 0.02, height: 0.03 })
  gableRoof(brush, 'deep', 0.95, main, 0.26, 'x')
  onFaces(brush, ['front', 'back'], main, (span) => windowGrid(brush, { width: span, y: 0.1, floors: 2, floorHeight: 0.42, cols: 6, margin: 0.12 }))
  onFace(brush, 'front', main, () => opening(brush, { x: -0.3, width: 0.24, height: 0.3, y: 0, layer: 'glassDark', lintel: 'accent' }))
  brush.box('trim', [-0.3, 0.34, -0.34], [0.5, 0.03, 0.3]) // marquesina de entrada

  block(brush, 'wall', 0, wing, 0.5)
  slab(brush, 'trim', 0.5, wing, { over: 0.025 })
  parapet(brush, 'wall', 0.53, wing, { height: 0.04, thickness: 0.03 })
  onFace(brush, 'front', wing, (span) => windowGrid(brush, { width: span, y: 0.08, floors: 1, floorHeight: 0.4, cols: 3 }))
  rooftopUnits(brush, 0.53, wing, { count: 2, seed: 71 })

  block(brush, 'wall', 0, tower, 1.5)
  slab(brush, 'trim', 1.5, tower, { over: 0.03 })
  brush.cylinder('deep', [0.72, 1.53, -0.75], { radius: 0.3, radiusTop: 0, height: 0.32, segments: 4, rotation: PYRAMID_TURN })
  onFace(brush, 'front', tower, (span) => {
    quad(brush, 'lamp', [0, 1.2, 0.012], [0.16, 0.16])
    windowGrid(brush, { width: span, y: 0.1, floors: 2, floorHeight: 0.4, cols: 1, margin: 0.1 })
  })
  paintSchoolYard(brush, area)
}

/** Patio con pista marcada, arbolado y mástil. */
function paintSchoolYard(brush, area) {
  floorPane(brush, 'paving', [0, PAVED_Y, 0.55], [area.hw * 2, 1.5])
  floorPane(brush, 'wall', [0.25, PAVED_Y + 0.003, 0.7], [0.92, 0.64])
  floorPane(brush, 'deep', [0.25, PAVED_Y + 0.006, 0.7], [0.88, 0.6])
  tree(brush, -0.75, 0.55, { height: 0.3, crown: 0.14, kind: 0 })
  tree(brush, -0.75, 1.1, { height: 0.26, crown: 0.12, kind: 1 })
  tree(brush, 0.8, 1.15, { height: 0.26, crown: 0.12, kind: 2 })
  if (brush.detail < 1) return
  brush.box('trim', [-0.35, 0, 0.1], [0.012, 0.6, 0.012])
  quad(brush, 'accent', [-0.29, 0.54, 0.1], [0.12, 0.07])
  bench(brush, -0.3, 1.1, 0, 0.3)
}

// ---- Edificio universitario ------------------------------------------------------------------------------------

const CAMPUS_STEPS = [
  { area: rect(-0.6, -0.35, 1.76, 1.0), height: 0.6 },
  { area: rect(-0.5, -0.7, 1.4, 0.7), height: 1.1 },
  { area: rect(-0.35, -0.9, 1.0, 0.36), height: 1.6 },
]

function paintCampus(brush) {
  const library = rect(1.15, -0.5, 0.6, 1.2)
  CAMPUS_STEPS.forEach(({ area, height }, tier) => {
    block(brush, tier === 1 ? 'concrete' : 'wall', 0, area, height)
    slab(brush, 'trim', height, area, { over: 0.025, height: 0.035 })
    const floors = Math.round(height / 0.4)
    onFaces(brush, tier === 0 ? ['front', 'right'] : ['front', 'right', 'left'], area, (span) => {
      windowGrid(brush, { width: span, y: 0.08, floors, floorHeight: height / floors, cols: Math.max(2, Math.round(span / 0.28)), layer: 'glassDark', margin: 0.1 })
    })
  })
  floorPane(brush, 'leafLight', [-0.6, 0.64, -0.2], [1.5, 0.6])
  floorPane(brush, 'leafLight', [-0.5, 1.14, -0.55], [1.2, 0.2])
  solarRow(brush, { x: -0.35, y: 1.64, z: -0.95, width: 0.7, rows: 1 })

  block(brush, 'wall', 0, library, 1.0)
  slab(brush, 'trim', 1.0, library, { over: 0.03 })
  onFaces(brush, ['front', 'right'], library, (span) => windowGrid(brush, { width: span, y: 0.08, floors: 2, floorHeight: 0.45, cols: 2, margin: 0.08 }))
  rooftopUnits(brush, 1.04, library, { count: 2, seed: 81 })
  paintWalkway(brush)
  paintCampusGarden(brush)
}

/** Pasarela acristalada entre el bloque escalonado y la biblioteca. */
function paintWalkway(brush) {
  brush.box('trim', [0.52, 0.62, -0.5], [0.72, 0.04, 0.24])
  brush.box('glass', [0.52, 0.66, -0.5], [0.66, 0.14, 0.2])
  brush.box('trim', [0.52, 0.8, -0.5], [0.72, 0.03, 0.26])
  if (brush.detail >= 1) {
    for (const x of [0.28, 0.76]) brush.box('trim', [x, 0, -0.5], [0.04, 0.62, 0.04])
  }
}

function paintCampusGarden(brush) {
  floorPane(brush, 'leaf', [0.55, 0.012, 0.55], [1.7, 1.3])
  floorPane(brush, 'paving', [0.4, PAVED_Y, 0.55], [0.18, 1.3])
  floorPane(brush, 'paving', [-0.6, PAVED_Y, 0.9], [1.7, 0.3])
  tree(brush, 0.9, 0.5, { height: 0.3, crown: 0.14, kind: 0 })
  tree(brush, 1.2, 0.95, { height: 0.26, crown: 0.12, kind: 1 })
  tree(brush, 0.2, 0.2, { height: 0.26, crown: 0.12, kind: 1 })
  if (brush.detail < 1) return
  bench(brush, 0.55, 0.9, 0, 0.26)
  hedge(brush, -0.7, 1.15, 1.4, 0.07)
  lampPost(brush, -1.35, 1.0, { height: 0.34 })
}

// ---- Nave de exposiciones ---------------------------------------------------------------------------------------

const SCREEN_TILT = quatX(-0.35)

function paintExpoHall(brush, lot) {
  const area = lotArea(lot)
  const hall = rect(0, -0.5, area.hw * 2, 1.5)
  block(brush, 'trim', 0, rect(0, -0.5, area.hw * 2 + 0.04, 1.54), 0.05)
  block(brush, 'wall', 0.05, hall, 0.65)
  vaultRoof(brush, 'concrete', 0.7, hall, 0.55)
  // cintas esmeralda que abrazan la bóveda
  for (const x of [-1.0, 0, 1.0]) vaultRoof(brush, 'accent', 0.7, rect(x, -0.5, 0.08, 1.54), 0.57)

  onFace(brush, 'front', hall, (span) => {
    glassBand(brush, { width: 1.4, y: 0.1, height: 0.55, layer: 'glassDark', mullions: 7, transoms: 1 })
    brush.box('accent', [0, 0.62, 0.02], [1.5, 0.04, 0.05])
    for (const side of [-1, 1]) glassBand(brush, { x: side * (span / 2 - 0.35), width: 0.4, y: 0.12, height: 0.4, mullions: 1 })
  })
  onFaces(brush, ['left', 'right'], hall, (span) => glassBand(brush, { width: span - 0.4, y: 0.14, height: 0.3, mullions: 8 }))

  paintInstallations(brush, area)
}

/** Pantallas inclinadas e instalaciones interactivas en la explanada de acceso. */
function paintInstallations(brush, area) {
  floorPane(brush, 'paving', [0, PAVED_Y, 0.78], [area.hw * 2, 0.9])
  ;[-1.0, -0.35, 0.3, 0.95].forEach((x, k) => {
    brush.box('trim', [x, 0, 0.8], [0.03, 0.15, 0.03])
    quad(brush, 'accent', [x, 0.3, 0.8], [0.38, 0.25], SCREEN_TILT)
    quad(brush, 'glass', [x, 0.3, 0.81], [0.33, 0.2], SCREEN_TILT)
    if (brush.detail >= 1 && k % 2 === 0) planter(brush, x, 1.1, 0.4, 0.08)
  })
  tree(brush, -1.38, 1.1, { height: 0.26, crown: 0.12, kind: 2 })
  tree(brush, 1.38, 1.1, { height: 0.26, crown: 0.12, kind: 2 })
}

// ---- Plaza con instalación artística -----------------------------------------------------------------------------

const ART_HOOPS = [
  { radius: 0.2, layer: 'accent', turn: 0 },
  { radius: 0.32, layer: 'lamp', turn: 0.9 },
  { radius: 0.44, layer: 'glass', turn: -0.9 },
]

function paintPlazaArt(brush, lot) {
  const area = lotArea(lot)
  floorPane(brush, 'paving', [0, PAVED_Y, 0], [area.hw * 2, area.hd * 2])
  floorPane(brush, 'concrete', [0, PAVED_Y + 0.003, 0.1], [1.2, 1.2])
  floorPane(brush, 'deep', [0, PAVED_Y + 0.006, 0.1], [1.1, 1.1])
  brush.cylinder('concrete', [0, 0, 0.1], { radius: 0.16, height: 0.1, segments: 12 })
  ART_HOOPS.forEach(({ radius, layer, turn }) => {
    ring(brush, layer, [0, 0.1 + radius * 0.9, 0.1], radius, 0.022, composeQuat(quatY(turn), quatX(Math.PI / 2)))
  })
  paintPergola(brush, area)
  tree(brush, -1.3, 0.9, { height: 0.3, crown: 0.14, kind: 0 })
  tree(brush, 1.3, 0.9, { height: 0.3, crown: 0.14, kind: 0 })
  tree(brush, 1.3, -0.1, { height: 0.26, crown: 0.12, kind: 1 })
  if (brush.detail >= 1) {
    lampPost(brush, -1.0, 1.1, { height: 0.36 })
    lampPost(brush, 1.0, 1.1, { height: 0.36 })
  }
}

/** Pérgola de listones sobre el fondo de la plaza, con bancos debajo. */
function paintPergola(brush, area) {
  const z = -area.hd + 0.4
  for (const x of [-1.2, 1.2]) {
    for (const dz of [-0.28, 0.28]) brush.box('trim', [x, 0, z + dz], [0.04, 0.5, 0.04])
  }
  brush.box('trim', [0, 0.5, z - 0.28], [2.5, 0.04, 0.05])
  brush.box('trim', [0, 0.5, z + 0.28], [2.5, 0.04, 0.05])
  const slats = brush.detail >= 1 ? 12 : 6
  for (let k = 0; k < slats; k += 1) brush.box('wall', [-1.2 + (2.4 * k) / (slats - 1), 0.54, z], [0.04, 0.025, 0.66])
  if (brush.detail < 1) return
  bench(brush, -0.5, z, 0, 0.5)
  bench(brush, 0.6, z, 0, 0.5)
}

export const PAINTERS = {
  'dome': paintDome,
  'school': paintSchool,
  'campus': paintCampus,
  'expo-hall': paintExpoHall,
  'plaza-art': paintPlazaArt,
}

