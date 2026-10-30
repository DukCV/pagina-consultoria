import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FRAME_WIDTHS, frameLayerStyle, frameSrc, frameSrcSet, framesToMount } from './frameSequence.js'

test('Los nombres de archivo coinciden con los que genera tools/render-helix-frames.mjs', () => {
  assert.deepEqual(FRAME_WIDTHS, [640, 1100, 1600])
  assert.equal(frameSrc(0, 1100), '/models/renders-2d/helix-step-1-1100.webp')
  assert.equal(frameSrc(5, 640), '/models/renders-2d/helix-step-6-640.webp')
  assert.equal(frameSrcSet(2).split(', ').length, 3)
  assert.match(frameSrcSet(2), /helix-step-3-640\.webp 640w, .*helix-step-3-1100\.webp 1100w, .*helix-step-3-1600\.webp 1600w/)
})

test('Solo se montan los fotogramas del servicio activo y de sus vecinos', () => {
  assert.deepEqual(framesToMount(0), [0, 1])
  assert.deepEqual(framesToMount(3), [2, 3, 4])
  assert.deepEqual(framesToMount(5), [4, 5])
})

test('En cada paso entero solo se ve la capa de ese paso; entre dos pasos se encadenan', () => {
  for (let step = 0; step < 6; step += 1) {
    assert.equal(frameLayerStyle(step, step).opacity, 1)
    assert.equal(Math.abs(frameLayerStyle(step, step).translateYPercent), 0)
    if (step > 0) assert.equal(frameLayerStyle(step - 1, step).opacity, 0)
  }
  const halfway = [frameLayerStyle(1, 1.5), frameLayerStyle(2, 1.5)]
  assert.ok(Math.abs(halfway[0].opacity - halfway[1].opacity) < 1e-9, 'a mitad de camino ambas capas pesan lo mismo')
  assert.ok(halfway[0].opacity > 0.3 && halfway[0].opacity < 0.7)
  // La capa saliente asciende y la entrante llega desde abajo (descenso de cámara)
  assert.ok(halfway[0].translateYPercent < 0 && halfway[1].translateYPercent > 0)
})
