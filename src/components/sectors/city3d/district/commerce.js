import {
  awning,
  bench,
  block,
  floorPane,
  gableRoof,
  glassBand,
  glowSign,
  hedge,
  lampPost,
  lotArea,
  onFace,
  opening,
  paintCar,
  parapet,
  parasolTable,
  planter,
  rect,
  rooftopUnits,
  slab,
  tree,
  windowGrid,
} from '../buildingKit.js'

/**
 * Distrito 0 · Comercio y pequeños negocios: cafetería con terraza, oficina pequeña, hileras de tiendas
 * con toldos y un mercado cubierto con puestos. Escala baja y cálida (toldos, sombrillas, arbolado).
 */

const PAVED_Y = 0.02
const STREET_CAR = { body: 'accent', glass: 'glassDark', light: 'lamp' }

// ---- Cafetería con terraza ----------------------------------------------------------------------------

function paintCafe(brush, lot) {
  const area = lotArea(lot)
  const hall = rect(0, -0.5, 1.84, 1.5)
  const upper = rect(-0.22, -0.68, 1.3, 1.0)
  block(brush, 'concrete', 0, rect(0, -0.5, 1.9, 1.56), 0.04)
  block(brush, 'wall', 0.04, hall, 0.76)
  slab(brush, 'trim', 0.8, hall, { over: 0.035 })
  block(brush, 'wall', 0.84, upper, 0.42)
  slab(brush, 'trim', 1.26, upper, { over: 0.03 })

  onFace(brush, 'front', hall, (span) => {
    glassBand(brush, { x: -0.22, width: span * 0.6, y: 0.1, height: 0.5, mullions: 3, transoms: 1 })
    opening(brush, { x: span * 0.34, width: 0.22, height: 0.5, y: 0.04, lintel: 'accent' })
    awning(brush, { y: 0.7, width: span - 0.06, depth: 0.32, drop: 0.12, stripes: 8, layers: ['accent', 'wall'] })
    glowSign(brush, { x: span * 0.34, y: 0.6, z: 0.0, width: 0.2, height: 0.05, layer: 'accent' })
  })
  onFace(brush, 'front', upper, (span) => windowGrid(brush, { width: span, y: 0.84, floors: 1, floorHeight: 0.42, cols: 4 }))
  onFace(brush, 'right', upper, (span) => windowGrid(brush, { width: span, y: 0.84, floors: 1, floorHeight: 0.42, cols: 3 }))
  onFace(brush, 'back', hall, (span) => {
    windowGrid(brush, { width: span, y: 0.1, floors: 1, floorHeight: 0.6, cols: 4, margin: 0.2 })
    opening(brush, { x: 0.6, width: 0.2, height: 0.42, y: 0.04, layer: 'trim' })
  })

  brush.box('trim', [0.62, 0.84, -0.9], [0.1, 0.3, 0.1]) // chimenea de extracción
  rooftopUnits(brush, 0.84, rect(0.66, -0.5, 0.4, 1.2), { count: 3, seed: 3 })
  floorPane(brush, 'leafLight', [-0.22, 1.3, -0.68], [1.1, 0.8]) // cubierta ajardinada

  paintTerrace(brush, area)
}

/** Terraza a pie de calle: solado, mesas con sombrilla, jardineras y un árbol. */
function paintTerrace(brush, area) {
  floorPane(brush, 'paving', [0, PAVED_Y, 0.8], [1.96, 1.0])
  const shades = ['accent', 'deep', 'wall']
  ;[-0.62, 0.08, 0.7].forEach((x, k) => parasolTable(brush, x, 0.82 + (k % 2) * 0.1, { layer: shades[k] }))
  if (brush.detail < 1) return
  planter(brush, -0.72, area.hd - 0.06, 0.5, 0.1)
  planter(brush, 0.72, area.hd - 0.06, 0.5, 0.1)
  tree(brush, 0.88, 1.05, { height: 0.3, crown: 0.14, kind: 0 })
  lampPost(brush, -0.9, 1.1, { height: 0.34 })
}

// ---- Oficina pequeña ------------------------------------------------------------------------------------

function paintMiniOffice(brush, lot) {
  const area = lotArea(lot)
  const body = rect(0, -0.3, 1.7, 1.7)
  slab(brush, 'trim', 0, body, { over: 0.02, height: 0.07 })
  block(brush, 'wall', 0.07, body, 1.43)
  slab(brush, 'trim', 0.75, body, { over: 0.03, height: 0.03 })
  slab(brush, 'trim', 1.5, body, { over: 0.04 })
  parapet(brush, 'concrete', 1.54, rect(0, -0.3, 1.66, 1.66), { height: 0.05 })

  onFace(brush, 'front', body, (span) => {
    glassBand(brush, { x: -0.3, width: span * 0.58, y: 0.12, height: 0.55, mullions: 3 })
    opening(brush, { x: span * 0.32, width: 0.3, height: 0.55, y: 0.07, layer: 'glassDark', lintel: 'trim' })
    brush.box('trim', [span * 0.32, 0.66, 0.15], [0.46, 0.035, 0.3]) // marquesina de acceso
    windowGrid(brush, { width: span, y: 0.78, floors: 1, floorHeight: 0.7, cols: 5 })
    glowSign(brush, { x: -0.2, y: 1.56, z: 0.0, width: 0.8, height: 0.13, layer: 'accent' })
  })
  onFace(brush, 'back', body, (span) => windowGrid(brush, { width: span, y: 0.12, floors: 2, floorHeight: 0.7, cols: 4 }))
  onFace(brush, 'right', body, (span) => windowGrid(brush, { width: span, y: 0.12, floors: 2, floorHeight: 0.7, cols: 3 }))

  brush.box('concrete', [-0.45, 1.54, -0.75], [0.5, 0.26, 0.5]) // sala de máquinas
  rooftopUnits(brush, 1.54, rect(0.4, -0.3, 0.7, 1.2), { count: 3, seed: 5 })

  floorPane(brush, 'paving', [0, PAVED_Y, 0.95], [1.96, 0.7])
  paintCar(brush, { at: [-0.45, 1.0], yaw: Math.PI / 2, layers: { ...STREET_CAR, body: 'trim' } })
  tree(brush, 0.7, 1.0, { height: 0.32, crown: 0.15, kind: 1 })
  if (brush.detail >= 1) hedge(brush, 0, area.hd - 0.03, 1.9, 0.06, { height: 0.08 })
}

// ---- Hilera de tiendas -----------------------------------------------------------------------------------

const SHOP_DEPTH = 1.9

/** Una fachada comercial: zócalo, escaparate, puerta, toldo a rayas, plantas altas y cornisa. */
function paintShop(brush, { x, front, width, height, wall, stripes, doorSide }) {
  const body = rect(x, front - SHOP_DEPTH / 2, width - 0.02, SHOP_DEPTH)
  slab(brush, 'trim', 0, body, { over: 0.01, height: 0.06 })
  block(brush, wall, 0.06, body, height - 0.06)
  slab(brush, 'trim', height, body, { over: 0.025 })
  onFace(brush, 'front', body, (span) => {
    glassBand(brush, { x: -doorSide * span * 0.14, width: span * 0.6, y: 0.1, height: 0.46, mullions: 2 })
    opening(brush, { x: doorSide * span * 0.3, width: 0.17, height: 0.46, y: 0.06 })
    awning(brush, { y: 0.66, width: span - 0.04, depth: 0.2, drop: 0.1, stripes: 5, layers: stripes })
    const floors = Math.floor((height - 0.72) / 0.36)
    if (floors > 0) windowGrid(brush, { width: span, y: 0.72, floors, floorHeight: 0.36, cols: 2 })
  })
  rooftopUnits(brush, height + 0.04, rect(x, front - SHOP_DEPTH / 2, width - 0.1, SHOP_DEPTH - 0.2), { count: 1, seed: Math.round(x * 10) + 7 })
}

function paintShopRow(brush, lot, shops, { sidewalkTrees }) {
  const area = lotArea(lot)
  const front = 0.66
  const total = shops.reduce((sum, shop) => sum + shop.width, 0)
  const scale = (area.hw * 2) / total
  let cursor = -area.hw
  shops.forEach((shop, index) => {
    const width = shop.width * scale
    paintShop(brush, { ...shop, x: cursor + width / 2, front, width, doorSide: index % 2 ? -1 : 1 })
    cursor += width
  })
  floorPane(brush, 'paving', [0, PAVED_Y, (front + area.hd) / 2 + 0.02], [area.hw * 2, area.hd - front])
  sidewalkTrees.forEach((x, kind) => tree(brush, x, area.hd - 0.14, { height: 0.3, crown: 0.14, kind }))
  if (brush.detail >= 1) {
    bench(brush, 0.15, area.hd - 0.12, 0)
    lampPost(brush, -area.hw + 0.08, area.hd - 0.12, { height: 0.36 })
  }
}

const SHOPS_A = [
  { width: 0.74, height: 0.95, wall: 'wall', stripes: ['accent', 'wall'] },
  { width: 0.72, height: 1.3, wall: 'deep', stripes: ['wall', 'trim'] },
  { width: 0.78, height: 0.82, wall: 'concrete', stripes: ['accent', 'trim'] },
  { width: 0.74, height: 1.45, wall: 'wall', stripes: ['deep', 'wall'] },
]
const SHOPS_B = [
  { width: 0.8, height: 1.35, wall: 'concrete', stripes: ['deep', 'wall'] },
  { width: 0.7, height: 0.88, wall: 'wall', stripes: ['accent', 'wall'] },
  { width: 0.7, height: 1.1, wall: 'deep', stripes: ['accent', 'trim'] },
  { width: 0.76, height: 0.8, wall: 'wall', stripes: ['trim', 'wall'] },
]

// ---- Mercado ---------------------------------------------------------------------------------------------

const STALL_LAYERS = [
  ['accent', 'wall'],
  ['deep', 'wall'],
  ['wall', 'accent'],
  ['accent', 'deep'],
  ['deep', 'wall'],
]

function paintStall(brush, x, layers) {
  brush.box('concrete', [x, 0.02, 0.62], [0.42, 0.1, 0.22])
  awning(brush, { x, y: 0.36, z: 0.46, width: 0.5, depth: 0.34, drop: 0.07, stripes: 4, layers })
  if (brush.detail < 1) return
  for (const side of [-1, 1]) brush.box('trim', [x + side * 0.23, 0.02, 0.8], [0.016, 0.34, 0.016])
  brush.box(layers[0], [x - 0.08, 0.12, 0.62], [0.1, 0.06, 0.1])
  brush.box('wall', [x + 0.1, 0.12, 0.62], [0.09, 0.05, 0.12])
}

function paintMarket(brush, lot) {
  const area = lotArea(lot)
  const hall = rect(0, -0.52, area.hw * 2 - 0.04, 1.3)
  block(brush, 'concrete', 0, rect(0, -0.52, area.hw * 2, 1.34), 0.05)
  block(brush, 'wall', 0.05, hall, 0.55)
  slab(brush, 'trim', 0.6, hall, { over: 0.04 })
  gableRoof(brush, 'trim', 0.64, rect(0, -0.52, area.hw * 2 - 0.02, 1.3), 0.42, 'x')
  // linterna de cristal sobre la cumbrera
  brush.box('glass', [0, 1.0, -0.52], [area.hw * 2 - 0.5, 0.1, 0.3])
  gableRoof(brush, 'wall', 1.1, rect(0, -0.52, area.hw * 2 - 0.4, 0.34), 0.1, 'x')

  onFace(brush, 'front', hall, (span) => {
    glassBand(brush, { width: span - 0.5, y: 0.12, height: 0.38, mullions: 6 })
    opening(brush, { x: 0, width: 0.4, height: 0.44, y: 0.05, layer: 'dark', lintel: 'accent' })
  })
  onFace(brush, 'right', hall, (span) => windowGrid(brush, { width: span, y: 0.1, floors: 1, floorHeight: 0.4, cols: 3 }))
  onFace(brush, 'left', hall, (span) => windowGrid(brush, { width: span, y: 0.1, floors: 1, floorHeight: 0.4, cols: 3 }))

  floorPane(brush, 'paving', [0, PAVED_Y, 0.72], [area.hw * 2, 1.0])
  ;[-1.12, -0.56, 0, 0.56, 1.12].forEach((x, k) => paintStall(brush, x, STALL_LAYERS[k]))
  tree(brush, -1.38, 1.1, { height: 0.28, crown: 0.13, kind: 0 })
  tree(brush, 1.38, 1.1, { height: 0.28, crown: 0.13, kind: 2 })
}

export const PAINTERS = {
  'cafe': paintCafe,
  'mini-office': paintMiniOffice,
  'shop-row': (brush, lot) => paintShopRow(brush, lot, SHOPS_A, { sidewalkTrees: [-0.7, 0.95] }),
  'shop-row-b': (brush, lot) => paintShopRow(brush, lot, SHOPS_B, { sidewalkTrees: [-1.0, 0.5] }),
  'market': paintMarket,
}
