import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  mat3NormalFromMat4,
  mat4Create,
  mat4Determinant3,
  mat4FromTRS,
  mat4TransformPoint,
  quatNormalize,
  vec3Cross,
  vec3Dot,
  vec3Normalize,
  vec3Sub,
} from './math3d.js'

const close = (actual, expected, message = '') => {
  assert.ok(Math.abs(actual - expected) < 1e-5, `${message} ${actual} ≠ ${expected}`)
}

describe('mat3NormalFromMat4', () => {
  it('con escala no uniforme da la normal del elipsoide, no la deformada por la matriz', () => {
    const m = mat4FromTRS(mat4Create(), [0, 0, 0], [0, 0, 0, 1], [2, 1, 1])
    const normalMat = mat3NormalFromMat4(new Float32Array(9), m)
    // Normal de la superficie x²/4 + y² + z² = 1 en (√2, √0.5, 0): gradiente (x/4, y, z)
    const point = [Math.SQRT2, Math.SQRT1_2, 0]
    const sphereNormal = [point[0] / 2, point[1], 0] // normal de la esfera unitaria antes de escalar
    const transformed = [
      normalMat[0] * sphereNormal[0] + normalMat[3] * sphereNormal[1],
      normalMat[1] * sphereNormal[0] + normalMat[4] * sphereNormal[1],
      0,
    ]
    const gradient = [point[0] / 4, point[1], 0]
    const scale = Math.hypot(...gradient) / Math.hypot(...transformed)
    close(transformed[0] * scale, gradient[0], 'x')
    close(transformed[1] * scale, gradient[1], 'y')
  })

  it('con rotación pura equivale a la propia matriz y es singular con escala 0', () => {
    const half = Math.SQRT1_2
    const m = mat4FromTRS(mat4Create(), [4, 5, 6], [0, 0, half, half], [1, 1, 1])
    const normalMat = mat3NormalFromMat4(new Float32Array(9), m)
    for (const [i, j] of [[0, 0], [1, 1], [2, 2], [3, 4], [4, 5]]) {
      close(normalMat[i], m[j], `elemento ${i}`)
    }
    assert.equal(mat3NormalFromMat4(new Float32Array(9), mat4FromTRS(mat4Create(), [0, 0, 0], [0, 0, 0, 1], [1, 0, 1])), null)
  })
})

describe('mat4Determinant3', () => {
  it('es negativo cuando la transformación refleja', () => {
    assert.ok(mat4Determinant3(mat4FromTRS(mat4Create(), [0, 0, 0], [0, 0, 0, 1], [-1, 1, 1])) < 0)
    close(mat4Determinant3(mat4FromTRS(mat4Create(), [0, 0, 0], [0, 0, 0, 1], [2, 3, 4])), 24)
  })
})

describe('mat4TransformPoint', () => {
  it('aplica escala, rotación y traslación', () => {
    const half = Math.SQRT1_2
    const m = mat4FromTRS(mat4Create(), [1, 2, 3], [0, 0, half, half], [2, 2, 2])
    const out = mat4TransformPoint([0, 0, 0], m, [1, 0, 0])
    close(out[0], 1)
    close(out[1], 4)
    close(out[2], 3)
  })
})

describe('utilidades de vectores y cuaterniones', () => {
  it('cross, dot, sub y normalize', () => {
    assert.deepEqual(vec3Cross([0, 0, 0], [1, 0, 0], [0, 1, 0]), [0, 0, 1])
    assert.equal(vec3Dot([1, 2, 3], [4, 5, 6]), 32)
    assert.deepEqual(vec3Sub([0, 0, 0], [3, 2, 1], [1, 1, 1]), [2, 1, 0])
    const unit = vec3Normalize([0, 0, 0], [0, 3, 4])
    close(unit[1], 0.6)
    close(unit[2], 0.8)
    assert.deepEqual(vec3Normalize([9, 9, 9], [0, 0, 0]), [0, 0, 0], 'el vector nulo no produce NaN')
  })

  it('quatNormalize devuelve la identidad para un cuaternión nulo', () => {
    const q = quatNormalize([0, 0, 0, 0], [0, 0, 2, 0])
    assert.deepEqual([...q], [0, 0, 1, 0])
    assert.deepEqual([...quatNormalize([5, 5, 5, 5], [0, 0, 0, 0])], [0, 0, 0, 1])
  })
})
