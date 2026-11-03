import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildCityGeometry } from './buildCityGeometry.js'
import { LAYER_NAMES } from './cityMaterials.js'
import { buildVehicleNodes } from './vehicles.js'
import { VEHICLES } from './cityRig.js'

const BUDGET = { 1: 52000, 0: 24000 }

test('La geometría de la ciudad cabe en el presupuesto de vértices de cada nivel', () => {
  for (const detail of [1, 0]) {
    const vertices = buildCityGeometry({ detail }).vertexCount()
    assert.ok(vertices > 0 && vertices <= BUDGET[detail], `detalle ${detail}: ${vertices} vértices`)
  }
})

test('La ciudad solo usa capas conocidas y nunca la reservada al monumento', () => {
  const materials = Object.fromEntries(LAYER_NAMES.map((name) => [name, { name }]))
  const names = buildCityGeometry({ detail: 1 })
    .nodes('city', materials)
    .map((node) => node.name)
  assert.ok(names.length > 0)
  assert.ok(!names.includes('city-lime'))
})

test('Hay un nodo de coche por cada vehículo, con el nombre que mueve el runtime', () => {
  const nodes = buildVehicleNodes({ detail: 1 })
  assert.deepEqual(
    nodes.map((node) => node.name),
    VEHICLES.map((_, index) => `car-${index}`),
  )
})
