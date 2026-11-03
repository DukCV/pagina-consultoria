import { createGear } from '../../../../engine3d/primitives.js'
import { quatX } from '../../../scene3d/sceneKit.js'
import {
  beam,
  block,
  floorPane,
  gableRoof,
  glassBand,
  lampPost,
  lotArea,
  onFace,
  onFaces,
  opening,
  paintCar,
  paintTruck,
  pane,
  parapet,
  pipe,
  quad,
  rect,
  rooftopUnits,
  sawtoothRoof,
  slab,
  solarRow,
  tree,
  windowGrid,
} from '../buildingKit.js'

/**
 * Distrito 4 · Industria y operaciones: fábrica de dientes de sierra con chimeneas y tuberías, almacén con
 * muelles y contenedores, taller con engranaje, patio de silos con cintas y centro de operaciones con antenas.
 */

const PAVED_Y = 0.02
const FACE_UP = quatX(Math.PI / 2) // gira el eje del engranaje (Y) hacia +Z
const DOCK_HEIGHT = 0.1

// ---- Fábrica ---------------------------------------------------------------------------------------------------

function paintFactory(brush, lot) {
  const area = lotArea(lot)
  const hall = rect(0, -0.45, area.hw * 2, 1.5)
  block(brush, 'trim', 0, rect(0, -0.45, area.hw * 2 + 0.04, 1.54), 0.05)
  block(brush, 'concrete', 0.05, hall, 0.75)
  slab(brush, 'trim', 0.8, hall, { over: 0.02, height: 0.03 })
  sawtoothRoof(brush, { y: 0.83, width: area.hw * 2 - 0.1, z0: -1.18, z1: 0.26, teeth: 5, height: 0.3, roof: 'wall' })

  onFace(brush, 'front', hall, (span) => {
    glassBand(brush, { width: span - 0.3, y: 0.52, height: 0.2, mullions: 9 })
    for (const x of [-0.9, 0, 0.9]) {
      opening(brush, { x, width: 0.5, height: 0.38, y: 0.05, lintel: 'accent' })
    }
  })
  onFaces(brush, ['left', 'right'], hall, (span) => windowGrid(brush, { width: span, y: 0.3, floors: 1, floorHeight: 0.4, cols: 4 }))

  paintStacks(brush)
  paintFactoryYard(brush, area)
}

/** Chimeneas con bandas y baliza, y el haz de tuberías que baja a la nave. */
function paintStacks(brush) {
  const stacks = [
    { x: -1.1, z: -1.0, height: 1.9 },
    { x: -0.78, z: -0.98, height: 1.5 },
  ]
  stacks.forEach(({ x, z, height }) => {
    brush.cylinder('concrete', [x, 0.83, z], { radius: 0.1, radiusTop: 0.07, height, segments: 10 })
    brush.cylinder('accent', [x, 0.83 + height - 0.16, z], { radius: 0.078, radiusTop: 0.078, height: 0.05, segments: 10 })
    brush.cylinder('trim', [x, 0.83 + height, z], { radius: 0.085, radiusTop: 0.085, height: 0.03, segments: 10 })
    brush.box('lamp', [x, 0.86 + height, z], [0.03, 0.03, 0.03])
  })
  pipe(brush, 'trim', [-0.95, 1.2, -1.0], [0.4, 1.2, -1.0], 0.03)
  pipe(brush, 'trim', [0.4, 1.2, -1.0], [0.4, 0.85, -1.0], 0.03)
  pipe(brush, 'accent', [-0.95, 1.3, -1.05], [1.2, 1.3, -1.05], 0.02)
  pipe(brush, 'trim', [1.2, 1.3, -1.05], [1.2, 0.85, -1.05], 0.02)
}

function paintFactoryYard(brush, area) {
  floorPane(brush, 'paving', [0, PAVED_Y, 0.78], [area.hw * 2, 0.9])
  brush.box('concrete', [0, 0.02, 0.38], [2.0, DOCK_HEIGHT, 0.14]) // rampa de carga
  brush.box('trim', [0, 0.46, 0.7], [2.0, 0.025, 0.55]) // marquesina
  for (const x of [-0.98, 0.98]) brush.box('trim', [x, 0.02, 0.95], [0.025, 0.44, 0.025])
  paintTruck(brush, { at: [-0.5, 0.78], yaw: 0, trailer: 'wall', cab: 'deep' })
  brush.cylinder('concrete', [1.1, 0, 0.95], { radius: 0.2, height: 0.3, segments: 12 })
  brush.cylinder('trim', [1.1, 0.3, 0.95], { radius: 0.2, radiusTop: 0.12, height: 0.08, segments: 12 })
  if (brush.detail >= 1) lampPost(brush, 1.35, 0.5, { height: 0.4 })
}

// ---- Almacén ----------------------------------------------------------------------------------------------------

const CONTAINER_LAYERS = ['deep', 'accent', 'wall', 'deep', 'accent', 'trim']
const CONTAINER = { length: 0.42, height: 0.13, depth: 0.17 }

function paintContainer(brush, x, y, z, layer) {
  brush.box(layer, [x, y, z], [CONTAINER.length, CONTAINER.height, CONTAINER.depth])
  if (brush.detail >= 1) brush.box('dark', [x + CONTAINER.length / 2, y + 0.01, z], [0.006, CONTAINER.height - 0.02, CONTAINER.depth - 0.03])
}

/** Pilas de contenedores en dos filas; la altura de cada pila sale de la tabla. */
function paintContainerYard(brush) {
  const stacks = [
    [0.35, 0.55, 3],
    [0.8, 0.55, 2],
    [1.25, 0.55, 1],
    [0.35, 0.9, 1],
    [0.8, 0.9, 3],
    [1.25, 0.9, 2],
  ]
  stacks.forEach(([x, z, levels], index) => {
    for (let level = 0; level < levels; level += 1) {
      paintContainer(brush, x, level * CONTAINER.height + 0.01, z, CONTAINER_LAYERS[(index + level) % CONTAINER_LAYERS.length])
    }
  })
}

function paintWarehouse(brush, lot) {
  const area = lotArea(lot)
  const hall = rect(0, -0.65, area.hw * 2, 1.1)
  block(brush, 'trim', 0, rect(0, -0.65, area.hw * 2 + 0.04, 1.14), 0.05)
  block(brush, 'wall', 0.05, hall, 0.7)
  slab(brush, 'trim', 0.75, hall, { over: 0.03 })
  parapet(brush, 'concrete', 0.79, hall, { height: 0.06, thickness: 0.04 })
  onFace(brush, 'front', hall, (span) => {
    for (const x of [-1.15, -0.55, 0.05, 0.65, 1.2]) {
      opening(brush, { x, width: 0.36, height: 0.4, y: DOCK_HEIGHT + 0.03 })
      brush.box('accent', [x, DOCK_HEIGHT + 0.43, 0.02], [0.42, 0.03, 0.03])
    }
    brush.box('concrete', [0, 0, 0.1], [span, DOCK_HEIGHT, 0.2])
    pane(brush, 'accent', [0, 0.58, 0.012], [span - 0.2, 0.06])
  })
  onFaces(brush, ['left', 'right', 'back'], hall, (span) => pane(brush, 'glassDark', [0, 0.45, 0.012], [span - 0.3, 0.12]))
  solarRow(brush, { x: -0.4, y: 0.8, z: -1.0, width: 1.5, rows: 3, depth: 0.22 })
  rooftopUnits(brush, 0.8, rect(1.0, -0.65, 0.8, 0.8), { count: 3, seed: 91 })

  floorPane(brush, 'paving', [0, PAVED_Y, 0.7], [area.hw * 2, 1.0])
  paintTruck(brush, { at: [-0.85, 0.62], yaw: 0, trailer: 'wall', cab: 'accent' })
  paintContainerYard(brush)
}

// ---- Taller -----------------------------------------------------------------------------------------------------

const GEAR_THICKNESS = 0.05
const GEARS = [
  { at: [0.75, 0.65], outer: 0.24, layer: 'accent', teeth: 12 },
  { at: [1.05, 0.46], outer: 0.14, layer: 'trim', teeth: 8 },
]

/** Engranajes decorativos sobre el plano de la fachada (se llama dentro de `onFace`). */
function paintGears(brush) {
  GEARS.forEach(({ at, outer, layer, teeth }) => {
    const geometry = createGear({ teeth: brush.detail >= 1 ? teeth : teeth / 2, outerRadius: outer, thickness: GEAR_THICKNESS, boreRadius: outer * 0.25 })
    brush.custom(layer, geometry, { translation: [at[0], at[1], GEAR_THICKNESS * 0.7], rotation: FACE_UP })
  })
}

function paintWorkshop(brush, lot) {
  const area = lotArea(lot)
  const shop = rect(-0.3, -0.45, 2.3, 1.5)
  const shed = rect(1.15, -0.5, 0.58, 1.0)
  const front = shop.cz + shop.hd

  block(brush, 'trim', 0, rect(-0.3, -0.45, 2.34, 1.54), 0.05)
  block(brush, 'wall', 0.05, shop, 0.8)
  slab(brush, 'trim', 0.85, shop, { over: 0.03, height: 0.03 })
  gableRoof(brush, 'trim', 0.88, shop, 0.32, 'x')
  onFace(brush, 'front', shop, () => {
    opening(brush, { x: -0.35, width: 0.9, height: 0.58, y: 0.05, layer: 'dark', lintel: 'accent' })
    glassBand(brush, { x: 0.55, width: 0.5, y: 0.45, height: 0.22, mullions: 2 })
    for (let k = 0; k < 5; k += 1) pane(brush, 'trim', [-0.35, 0.1 + k * 0.1, 0.014], [0.86, 0.012])
    paintGears(brush)
  })
  onFace(brush, 'left', shop, (span) => windowGrid(brush, { width: span, y: 0.35, floors: 1, floorHeight: 0.4, cols: 4 }))

  block(brush, 'concrete', 0.05, shed, 0.45)
  slab(brush, 'trim', 0.5, shed, { over: 0.025 })
  solarRow(brush, { x: 1.15, y: 0.55, z: -0.7, width: 0.4, rows: 2, depth: 0.2 })

  paintWorkshopYard(brush, area, front)
}

/** Patio del taller: banco de trabajo, palés con cajas, barriles y una carretilla elevadora. */
function paintWorkshopYard(brush, area, front) {
  floorPane(brush, 'paving', [0, PAVED_Y, (front + area.hd) / 2 + 0.05], [area.hw * 2, area.hd - front + 0.05])
  brush.box('concrete', [-1.1, 0.06, 0.62], [0.4, 0.03, 0.2])
  for (const x of [-1.27, -0.93]) brush.box('trim', [x, 0, 0.62], [0.03, 0.06, 0.18])
  for (const [x, z] of [[0.7, 0.62], [0.95, 0.72]]) {
    brush.box('wall', [x, 0, z], [0.2, 0.03, 0.2])
    brush.box('accent', [x, 0.03, z], [0.16, 0.1, 0.16])
  }
  if (brush.detail >= 1) {
    for (const x of [1.3, 1.4]) brush.cylinder('deep', [x, 0, 0.55], { radius: 0.05, height: 0.12, segments: 8 })
    brush.box('accent', [-0.3, 0.02, 0.75], [0.14, 0.09, 0.22])
    brush.box('trim', [-0.3, 0.02, 0.9], [0.02, 0.2, 0.02])
    brush.box('trim', [-0.3, 0.05, 0.95], [0.12, 0.02, 0.1])
    tree(brush, 0.2, 1.1, { height: 0.26, crown: 0.12, kind: 1 })
  }
}

// ---- Patio de silos ----------------------------------------------------------------------------------------------

const SILOS = [
  { x: -0.66, height: 2.3, layer: 'concrete' },
  { x: 0, height: 1.7, layer: 'wall' },
  { x: 0.66, height: 2.7, layer: 'concrete' },
]
const SILO = { z: -0.6, radius: 0.28, base: 0.12 }

function paintSilo(brush, { x, height, layer }) {
  brush.cylinder('trim', [x, 0, SILO.z], { radius: SILO.radius + 0.03, height: SILO.base, segments: 14 })
  brush.cylinder(layer, [x, SILO.base, SILO.z], { radius: SILO.radius, height, segments: 14 })
  for (const band of brush.detail >= 1 ? [0.3, 0.45, 0.62, 0.8] : [0.5]) {
    brush.cylinder('trim', [x, SILO.base + height * band, SILO.z], { radius: SILO.radius + 0.01, height: 0.03, segments: 14 })
  }
  brush.cylinder('trim', [x, SILO.base + height, SILO.z], { radius: SILO.radius + 0.02, radiusTop: 0.05, height: 0.2, segments: 14 })
  brush.box('lamp', [x, SILO.base + height + 0.2, SILO.z], [0.04, 0.04, 0.04])
  brush.box('trim', [x + 0.05, SILO.base, SILO.z + SILO.radius + 0.012], [0.05, height, 0.012]) // escalera de gato
}

function paintSiloYard(brush, lot) {
  const area = lotArea(lot)
  SILOS.forEach((silo) => paintSilo(brush, silo))
  paintConveyor(brush)
  floorPane(brush, 'paving', [0, PAVED_Y, 0.4], [area.hw * 2, 1.7])
  brush.box('wall', [-0.7, 0.02, 0.75], [0.5, 0.32, 0.36])
  slab(brush, 'trim', 0.34, rect(-0.7, 0.75, 0.5, 0.36), { over: 0.025 })
  onFace(brush, 'front', rect(-0.7, 0.75, 0.5, 0.36), (span) => glassBand(brush, { width: span - 0.2, y: 0.1, height: 0.14, mullions: 2 }))
  paintTruck(brush, { at: [0.55, 0.9], yaw: Math.PI, trailer: 'deep', cab: 'trim' })
  if (brush.detail >= 1) lampPost(brush, 0.9, 0.4, { height: 0.4 })
}

/** Tolva sobre patas y cinta inclinada hasta la cima del silo central. */
function paintConveyor(brush) {
  brush.cylinder('concrete', [0, 0.26, 0.35], { radius: 0.2, radiusTop: 0.07, height: 0.22, rotation: [1, 0, 0, 0] })
  for (const [x, z] of [[-0.12, 0.28], [0.12, 0.28], [-0.12, 0.42], [0.12, 0.42]]) brush.box('trim', [x, 0, z], [0.025, 0.28, 0.025])
  beam(brush, 'trim', [0, 0.25, 0.3], [0, 1.78, -0.28], [0.12, 0.04])
  beam(brush, 'dark', [0, 0.275, 0.3], [0, 1.795, -0.28], [0.09, 0.02])
  if (brush.detail >= 1) {
    for (const t of [0.35, 0.7]) {
      const [y, z] = [0.25 + 1.53 * t, 0.3 - 0.58 * t]
      brush.box('trim', [-0.05, 0, z], [0.02, y, 0.02])
      brush.box('trim', [0.05, 0, z], [0.02, y, 0.02])
    }
  }
}

// ---- Centro de operaciones ------------------------------------------------------------------------------------------

function paintDish(brush, x, y, z, { radius = 0.12, turn = -0.6 } = {}) {
  brush.box('trim', [x, y, z], [0.02, 0.1, 0.02])
  brush.cylinder('wall', [x, y + 0.1, z], { radius: 0.015, radiusTop: radius, height: 0.07, segments: 10, rotation: quatX(turn) })
  brush.box('lamp', [x, y + 0.16, z + 0.04], [0.015, 0.015, 0.015])
}

function paintOpsCenter(brush, lot) {
  const area = lotArea(lot)
  const body = rect(0, -0.3, 1.7, 1.6)
  const height = 1.2
  block(brush, 'trim', 0, rect(0, -0.3, 1.76, 1.66), 0.06)
  block(brush, 'concrete', 0.06, body, height - 0.06)
  slab(brush, 'trim', height, body, { over: 0.04 })
  parapet(brush, 'concrete', height + 0.04, rect(0, -0.3, 1.7, 1.6), { height: 0.05, thickness: 0.04 })
  onFaces(brush, ['front', 'back'], body, (span) => {
    windowGrid(brush, { width: span, y: 0.3, floors: 2, floorHeight: 0.4, cols: 6, layer: 'glassDark', margin: 0.2 })
    pane(brush, 'accent', [0, 0.16, 0.012], [span - 0.2, 0.04])
  })
  onFaces(brush, ['left', 'right'], body, (span) => windowGrid(brush, { width: span, y: 0.3, floors: 2, floorHeight: 0.4, cols: 4, layer: 'glassDark', margin: 0.2 }))
  onFace(brush, 'front', body, () => opening(brush, { x: 0.5, width: 0.3, height: 0.3, y: 0.06, layer: 'glassDark', lintel: 'accent' }))

  paintRoofEquipment(brush, height + 0.04)
  paintSolarCarport(brush, area)
}

/** Cúpula de radar, parabólicas, mástiles con balizas y paneles solares. */
function paintRoofEquipment(brush, y) {
  brush.cylinder('trim', [-0.45, y, -0.55], { radius: 0.3, height: 0.1, segments: 14 })
  brush.sphere('wall', [-0.45, y + 0.1, -0.55], 0.28, 12)
  paintDish(brush, 0.45, y, -0.15, { radius: 0.15, turn: -0.7 })
  paintDish(brush, 0.0, y, 0.2, { radius: 0.1, turn: -0.5 })
  for (const [x, z, height] of [[0.6, -0.8, 0.9], [-0.1, -0.9, 0.6]]) {
    brush.box('trim', [x, y, z], [0.025, height, 0.025])
    brush.box('lamp', [x, y + height, z], [0.05, 0.04, 0.05])
    brush.box('trim', [x, y + height * 0.7, z], [0.18, 0.012, 0.012])
  }
  solarRow(brush, { x: -0.45, y, z: 0.2, width: 0.7, rows: 2, depth: 0.18 })
}

function paintSolarCarport(brush, area) {
  floorPane(brush, 'paving', [0, PAVED_Y, 1.0], [area.hw * 2, 0.6])
  for (const x of [-0.8, 0.8]) for (const z of [0.82, 1.18]) brush.box('trim', [x, 0, z], [0.025, 0.28, 0.025])
  quad(brush, 'panel', [0, 0.32, 1.0], [1.7, 0.42], quatX(-Math.PI / 2 + 0.12))
  brush.box('trim', [0, 0.28, 1.2], [1.74, 0.025, 0.025])
  paintCar(brush, { at: [-0.4, 1.0], yaw: Math.PI / 2, layers: { body: 'wall', glass: 'glassDark', light: 'lamp' } })
  paintCar(brush, { at: [0.35, 1.0], yaw: Math.PI / 2, layers: { body: 'accent', glass: 'glassDark', light: 'lamp' } })
}

export const PAINTERS = {
  'factory': paintFactory,
  'warehouse': paintWarehouse,
  'workshop': paintWorkshop,
  'silo-yard': paintSiloYard,
  'ops-center': paintOpsCenter,
}
