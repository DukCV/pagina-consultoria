import assert from 'node:assert/strict'
import { test } from 'node:test'
import { GABLE, VAULT_COARSE, VAULT_FINE, WEDGE } from './prism.js'

const vertex = (geometry, index) => [0, 1, 2].map((axis) => geometry.positions[index * 3 + axis])

test('Los prismas tienen los vértices esperados (dos tapas y un lado por arista)', () => {
  assert.equal(WEDGE.positions.length / 3, 18)
  assert.equal(GABLE.positions.length / 3, 18)
  assert.equal(VAULT_COARSE.positions.length / 3, 5 * 2 + 5 * 4)
  assert.ok(VAULT_FINE.positions.length > VAULT_COARSE.positions.length)
})

test('Cada triángulo mira hacia la normal declarada y hacia fuera del volumen', () => {
  for (const geometry of [WEDGE, GABLE, VAULT_FINE, VAULT_COARSE]) {
    for (let k = 0; k < geometry.indices.length; k += 3) {
      const [a, b, c] = [0, 1, 2].map((offset) => vertex(geometry, geometry.indices[k + offset]))
      const u = b.map((value, axis) => value - a[axis])
      const v = c.map((value, axis) => value - a[axis])
      const cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
      const normal = [0, 1, 2].map((axis) => geometry.normals[geometry.indices[k] * 3 + axis])
      assert.ok(cross.reduce((sum, value, axis) => sum + value * normal[axis], 0) > 0)
    }
  }
})

test('El prisma queda dentro de la caja unidad (largo y fondo de -0,5 a 0,5, alto de 0 a 1)', () => {
  for (const geometry of [WEDGE, GABLE, VAULT_FINE]) {
    for (let index = 0; index < geometry.positions.length / 3; index += 1) {
      const [x, y, z] = vertex(geometry, index)
      assert.ok(Math.abs(x) <= 0.5 + 1e-6 && Math.abs(z) <= 0.5 + 1e-6 && y >= -1e-6 && y <= 1 + 1e-6)
    }
  }
})
