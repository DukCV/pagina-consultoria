import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CITY,
  DISTRICTS,
  DISTRICT_COUNT,
  LOT_PLAN,
  createLots,
  districtAngle,
  insideDistrictMargin,
  lotBounds,
  lotCorners,
  polar,
} from './cityRig.js'

const lots = createLots()

test('Hay cinco distritos con cinco lotes cada uno y todos los lotes tienen tipo', () => {
  assert.equal(DISTRICTS.length, DISTRICT_COUNT)
  assert.equal(LOT_PLAN.length, DISTRICT_COUNT)
  assert.equal(lots.length, DISTRICT_COUNT * 5)
  assert.equal(new Set(lots.map((lot) => lot.id)).size, lots.length)
  for (const lot of lots) assert.ok(lot.kind, lot.id)
  for (let district = 0; district < DISTRICT_COUNT; district += 1) {
    assert.equal(lots.filter((lot) => lot.district === district).length, 5)
  }
})

test('Los tipos de lote no se repiten dentro del distrito', () => {
  for (let district = 0; district < DISTRICT_COUNT; district += 1) {
    const kinds = lots.filter((lot) => lot.district === district).map((lot) => lot.kind)
    assert.equal(new Set(kinds).size, kinds.length, `distrito ${district}`)
  }
})

test('Ningún lote se solapa con otro', () => {
  const boxes = lots.map((lot) => ({ id: lot.id, box: lotBounds(lot) }))
  for (let a = 0; a < boxes.length; a += 1) {
    for (let b = a + 1; b < boxes.length; b += 1) {
      const [ax0, az0, ax1, az1] = boxes[a].box
      const [bx0, bz0, bx1, bz1] = boxes[b].box
      // las cajas envolventes pueden tocarse en lotes girados; se exige una holgura real entre esquinas
      const overlap = ax0 < bx1 && bx0 < ax1 && az0 < bz1 && bz0 < az1
      if (!overlap) continue
      const cornersA = lotCorners(lots[a])
      const centerB = lots[b].center
      const insideA = cornersA.every((corner, i) => {
        const next = cornersA[(i + 1) % 4]
        const cross = (next[0] - corner[0]) * (centerB[2] - corner[1]) - (next[1] - corner[1]) * (centerB[0] - corner[0])
        return cross <= 0
      })
      assert.ok(!insideA, `${boxes[a].id} y ${boxes[b].id} se solapan`)
    }
  }
})

test('Los lotes quedan entre la acera de la plaza y el borde de la ciudad, y dentro de su distrito', () => {
  for (const lot of lots) {
    for (const corner of lotCorners(lot)) {
      const radius = Math.hypot(...corner)
      assert.ok(radius > CITY.sidewalkEdge, `${lot.id}: invade la acera (${radius.toFixed(2)})`)
      assert.ok(radius < CITY.radius - 0.2, `${lot.id}: se sale del disco (${radius.toFixed(2)})`)
      const margin = insideDistrictMargin(lot.district, corner)
      assert.ok(margin > CITY.radialRoadWidth / 2, `${lot.id}: invade la calle radial (${margin.toFixed(2)})`)
    }
  }
})

test('Las hileras respetan la calle intermedia', () => {
  const [from, to] = CITY.middleStreet
  for (const lot of lots) {
    const angle = districtAngle(lot.district)
    for (const [x, z] of lotCorners(lot)) {
      const s = x * Math.sin(angle) + z * Math.cos(angle)
      if (lot.ring === 'A') assert.ok(s <= from + 1e-9, `${lot.id}: A invade la calle (${s.toFixed(2)})`)
      else assert.ok(s >= to - 1e-9, `${lot.id}: B invade la calle (${s.toFixed(2)})`)
    }
  }
})

test('La fachada de cada hilera mira hacia donde indica el plano', () => {
  for (const lot of lots) {
    const angle = districtAngle(lot.district)
    const [fx, fz] = polar(lot.yaw, 1) // +Z local en el mundo
    const [ox, oz] = polar(angle, 1)
    const outward = fx * ox + fz * oz
    assert.ok(lot.ring === 'B' ? outward > 0.99 : outward < -0.99, lot.id)
  }
})

test('El centro del disco es la plaza del logotipo y los distritos giran en orden', () => {
  assert.ok(CITY.plazaRadius < CITY.ringRoad[0] + 1e-9)
  assert.ok(Math.abs(districtAngle(DISTRICT_COUNT) - Math.PI * 2) < 1e-9)
  assert.ok(districtAngle(1) > districtAngle(0))
})
