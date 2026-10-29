import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFramePerformanceMonitor } from './framePerformanceMonitor.js'

/** Alimenta el monitor con fotogramas a intervalo fijo y devuelve el instante de la degradación (o null). */
function feed(monitor, { fromMs = 0, toMs, frameMs }) {
  for (let now = fromMs; now <= toMs; now += frameMs) {
    if (monitor.sample(now) === 'downgrade') return now
  }
  return null
}

test('60 fps sostenidos no degradan nunca', () => {
  const monitor = createFramePerformanceMonitor()
  assert.equal(feed(monitor, { toMs: 60000, frameMs: 16.7 }), null)
})

test('15 fps sostenidos degradan tras dos ventanas lentas consecutivas', () => {
  const monitor = createFramePerformanceMonitor()
  const at = feed(monitor, { toMs: 30000, frameMs: 66 })
  assert.ok(at !== null && at >= 2 * 2400 && at < 8000, `degradó en ${at} ms`)
})

test('Caso extremo de ~0,6 fps (render por software) también degrada', () => {
  const monitor = createFramePerformanceMonitor()
  const at = feed(monitor, { toMs: 60000, frameMs: 1600 })
  assert.ok(at !== null, 'debe detectar fotogramas de más de un segundo')
})

test('Un tirón puntual (una ventana lenta) no degrada', () => {
  const monitor = createFramePerformanceMonitor()
  assert.equal(feed(monitor, { toMs: 2500, frameMs: 100 }), null)
  assert.equal(feed(monitor, { fromMs: 2500, toMs: 30000, frameMs: 16.7 }), null)
})

test('El calentamiento ignora el arranque lento (montaje de escena)', () => {
  const monitor = createFramePerformanceMonitor()
  monitor.reset(0, 6000)
  assert.equal(feed(monitor, { toMs: 5900, frameMs: 200 }), null)
})

test('Una pausa (pestaña oculta) no cuenta como lentitud', () => {
  const monitor = createFramePerformanceMonitor()
  feed(monitor, { toMs: 5000, frameMs: 16.7 })
  monitor.suspend()
  // La pestaña vuelve 10 minutos después: el primer fotograma no aporta un delta gigante
  assert.equal(monitor.sample(600000), null)
  assert.equal(feed(monitor, { fromMs: 600016, toMs: 640000, frameMs: 16.7 }), null)
})

test('Un único fotograma enorme no basta para degradar', () => {
  const monitor = createFramePerformanceMonitor()
  feed(monitor, { toMs: 1000, frameMs: 16.7 })
  assert.equal(monitor.sample(9000), null)
  assert.equal(feed(monitor, { fromMs: 9016, toMs: 60000, frameMs: 16.7 }), null)
})
