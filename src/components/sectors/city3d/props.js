import { bench, hedge, lampPost, planter, tree } from './buildingKit.js'
import { DISTRICT_COUNT, createLots, districtAngle, districtToWorld, polar } from './cityRig.js'

/**
 * Mobiliario urbano en coordenadas del mundo (suelo en y = 0): farolas, bancos y jardineras en la plaza,
 * arbolado de la avenida y de las calles radiales, farolas de la calle intermedia y setos del cinturón.
 * Nada pisa las calzadas. Con `brush.detail === 0` se reduce el arbolado a la mitad y se omiten bancos,
 * jardineras y farolas secundarias.
 */

const DEG = Math.PI / 180

const PLAZA = { radius: 2.92, step: 15 * DEG } // junto al pedestal, antes de la avenida
const RING_SIDEWALK = { radius: 4.53, treeOffsets: [-24, -12, 0, 12, 24], lampOffsets: [-18, -6, 6, 18] }
const MIDDLE_STREET = { aSide: 7.8, bSide: 9.0, rows: [-4, -2, 0, 2, 4], lamp: 0.1 }
const RADIAL = { lateral: 0.62, distances: [5.2, 6.5, 7.8, 9.0, 11.8], limit: 36 * DEG }
const BELT = { radius: 12.45, reach: 31, step: 3, hedgeLength: 0.34, hedgeDepth: 0.18, clearance: 0.2 }

const lampLean = (angle, size) => [-Math.sin(angle) * size, -Math.cos(angle) * size]
const forEachDistrict = (draw) => {
  for (let district = 0; district < DISTRICT_COUNT; district += 1) draw(district, districtAngle(district))
}

/** Plaza: farola, banco y jardinera se alternan alrededor del pedestal; el banco mira al monumento. */
function paintPlaza(brush) {
  const count = Math.round((Math.PI * 2) / PLAZA.step)
  for (let k = 0; k < count; k += 1) {
    const angle = k * PLAZA.step
    const [x, z] = polar(angle, PLAZA.radius)
    if (k % 3 === 0) lampPost(brush, x, z, { height: 0.34 })
    else if (brush.detail >= 1 && k % 3 === 1) bench(brush, x, z, angle + Math.PI, 0.2)
    else if (brush.detail >= 1) planter(brush, x, z, 0.14, 0.1)
  }
}

/** Acera exterior de la avenida circular: árboles y farolas con la luminaria sobre la calzada. */
function paintRingSidewalk(brush) {
  const keep = brush.detail >= 1 ? 1 : 2
  forEachDistrict((district, base) => {
    RING_SIDEWALK.treeOffsets.forEach((offset, k) => {
      if (k % keep) return
      const [x, z] = polar(base + offset * DEG, RING_SIDEWALK.radius)
      tree(brush, x, z, { height: 0.26, crown: 0.12, kind: (district + k) % 3 })
    })
    RING_SIDEWALK.lampOffsets.forEach((offset, k) => {
      if (k % keep) return
      const angle = base + offset * DEG
      const [x, z] = polar(angle, RING_SIDEWALK.radius)
      lampPost(brush, x, z, { height: 0.4, lean: lampLean(angle, 0.1) })
    })
  })
}

/** Calle recta entre las hileras: farolas escalonadas en ambas aceras, con la luminaria sobre el asfalto. */
function paintMiddleStreets(brush) {
  const { aSide, bSide, rows, lamp } = MIDDLE_STREET
  forEachDistrict((district) => {
    rows.forEach((t) => {
      const lean = districtToWorld(district, 0, lamp)
      const [ax, az] = districtToWorld(district, t, aSide)
      lampPost(brush, ax, az, { height: 0.4, lean })
      if (brush.detail < 1) return
      const [bx, bz] = districtToWorld(district, t + 1, bSide)
      lampPost(brush, bx, bz, { height: 0.4, lean: lean.map((value) => -value) })
    })
  })
}

/** Aceras de las calles radiales (límites entre distritos): árboles a ambos lados, fuera del cruce con la calle recta. */
function paintRadialTrees(brush) {
  const keep = brush.detail >= 1 ? 1 : 3
  forEachDistrict((district, base) => {
    const angle = base + RADIAL.limit
    const along = [Math.sin(angle), Math.cos(angle)]
    const across = [Math.cos(angle), -Math.sin(angle)]
    RADIAL.distances.forEach((distance, k) => {
      for (const side of [-1, 1]) {
        if ((k + (side > 0 ? 1 : 0)) % keep) continue
        const x = along[0] * distance + across[0] * RADIAL.lateral * side
        const z = along[1] * distance + across[1] * RADIAL.lateral * side
        tree(brush, x, z, { height: 0.24, crown: 0.11, kind: (k + district) % 3 === 0 ? 0 : 1 + (k % 2) })
      }
    })
  })
}

/** ¿El punto cae sobre alguna parcela (con holgura)? Se usa para no poner setos donde hay edificios. */
function isOnLot(lots, [x, z], clearance) {
  return lots.some((lot) => {
    const dx = x - lot.center[0]
    const dz = z - lot.center[2]
    const sin = Math.sin(lot.yaw)
    const cos = Math.cos(lot.yaw)
    const lx = dx * cos - dz * sin
    const lz = dx * sin + dz * cos
    return Math.abs(lx) < lot.size[0] / 2 + clearance && Math.abs(lz) < lot.size[1] / 2 + clearance
  })
}

/** Cinturón verde del borde: setos tangenciales a tramos, con algún árbol, sin pisar las parcelas. */
function paintBelt(brush) {
  const lots = createLots()
  const step = brush.detail >= 1 ? BELT.step : BELT.step * 2
  forEachDistrict((_, base) => {
    for (let offset = -BELT.reach; offset <= BELT.reach; offset += step) {
      const angle = base + offset * DEG
      const point = polar(angle, BELT.radius)
      if (isOnLot(lots, point, BELT.clearance)) continue
      const index = Math.round((offset + BELT.reach) / BELT.step)
      if (index % 5 === 2) tree(brush, point[0], point[1], { height: 0.2, crown: 0.11, kind: 1 })
      else {
        brush.frame([point[0], 0, point[1]], angle, () => {
          hedge(brush, 0, 0, BELT.hedgeLength, BELT.hedgeDepth, { height: index % 2 ? 0.06 : 0.08, layer: index % 6 ? 'leaf' : 'leafLight' })
        })
      }
    }
  })
}

export function paintStreetProps(brush) {
  paintPlaza(brush)
  paintRingSidewalk(brush)
  paintMiddleStreets(brush)
  paintRadialTrees(brush)
  paintBelt(brush)
}
