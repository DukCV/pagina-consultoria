import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateCapabilities } from './graphicsCapabilities.js'

const FAST = { tier: 'fast', saveData: false, effectiveType: '4g' }
const GOOD_GPU = { webgl2: true, softwareRenderer: false, rendererName: 'GPU', maxTextureSize: 16384 }
const decide = (overrides = {}) =>
  evaluateCapabilities({ probe: GOOD_GPU, network: FAST, deviceMemoryGb: 8, cpuCores: 8, ...overrides })

test('GPU real y red rápida: experiencia 3D completa', () => {
  const result = decide()
  assert.equal(result.canRender3D, true)
  assert.equal(result.startLevel, 'full')
  assert.equal(result.reason, 'ok')
})

test('WebGL2 no disponible: 2D', () => {
  const result = decide({ probe: { webgl2: false, reason: 'webgl2-unavailable' } })
  assert.equal(result.startLevel, 'static')
  assert.equal(result.reason, 'webgl2-unavailable')
})

test('Render por software: 2D aunque WebGL2 «funcione»', () => {
  const result = decide({ probe: { ...GOOD_GPU, softwareRenderer: true } })
  assert.equal(result.startLevel, 'static')
  assert.equal(result.reason, 'software-renderer')
})

test('Límite de textura insuficiente: 2D', () => {
  const result = decide({ probe: { ...GOOD_GPU, maxTextureSize: 1024 } })
  assert.equal(result.startLevel, 'static')
  assert.equal(result.reason, 'low-texture-limit')
})

test('Ahorro de datos o 2G con GPU capaz: 2D para no descargar modelos', () => {
  const saveData = decide({ network: { tier: 'constrained', saveData: true, effectiveType: '4g' } })
  assert.equal(saveData.startLevel, 'static')
  assert.equal(saveData.reason, 'save-data')

  const slow = decide({ network: { tier: 'constrained', saveData: false, effectiveType: '2g' } })
  assert.equal(slow.startLevel, 'static')
  assert.equal(slow.reason, 'slow-network')
})

test('Red moderada (3G): se mantiene el 3D (los modelos se piden al llegar a su diapositiva)', () => {
  const result = decide({ network: { tier: 'moderate', saveData: false, effectiveType: '3g' } })
  assert.equal(result.canRender3D, true)
  assert.equal(result.startLevel, 'full')
})

test('Poca memoria o pocos núcleos: arranca en calidad equilibrada, no en 2D', () => {
  assert.equal(decide({ deviceMemoryGb: 2 }).startLevel, 'balanced')
  assert.equal(decide({ cpuCores: 2 }).startLevel, 'balanced')
  assert.equal(decide({ deviceMemoryGb: 2 }).reason, 'low-end-hints')
})

test('Pistas desconocidas (null) no penalizan: navegadores que no exponen memoria o núcleos', () => {
  assert.equal(decide({ deviceMemoryGb: null, cpuCores: null }).startLevel, 'full')
})

test('La decisión no depende del tipo de dispositivo: solo de señales medidas', () => {
  // Un móvil con buena GPU obtiene 3D; un equipo de escritorio con render por software, no
  const phoneWithGoodGpu = decide({ deviceMemoryGb: 6, cpuCores: 8 })
  const desktopWithSoftwareGl = decide({
    probe: { ...GOOD_GPU, softwareRenderer: true },
    deviceMemoryGb: 32,
    cpuCores: 16,
  })
  assert.equal(phoneWithGoodGpu.startLevel, 'full')
  assert.equal(desktopWithSoftwareGl.startLevel, 'static')
})
