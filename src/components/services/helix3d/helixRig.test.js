import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  HELIX,
  SERVICE_COUNT,
  cameraFor,
  displayProgress,
  helixRotation,
  progressFromScroll,
  projectToScreen,
  scrollForStep,
  serviceAngle,
  serviceHeight,
  serviceState,
  strandPoint,
} from './helixRig.js'

const near = (a, b, tolerance = 1e-9) => Math.abs(a - b) < tolerance
const wrap = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle)) // a (-π, π]
const OBJECT_RADIUS = 0.75 // radio aproximado del objeto de un servicio a escala 1 (unidades de mundo)

test('Cada servicio está sobre su hilo: los pares en uno y los impares en el otro', () => {
  for (let index = 0; index < SERVICE_COUNT; index += 1) {
    const { nodeLocal } = serviceState(index, 0)
    const onStrand = strandPoint(index % 2, serviceHeight(index))
    nodeLocal.forEach((value, axis) => assert.ok(near(value, onStrand[axis]), `servicio ${index + 1}, eje ${axis}`))
    const other = strandPoint((index + 1) % 2, serviceHeight(index))
    assert.ok(Math.hypot(nodeLocal[0] - other[0], nodeLocal[2] - other[2]) > 1.9 * HELIX.radius, 'el otro hilo queda al lado opuesto')
  }
})

test('El servicio activo queda al frente del eje en cada paso y sus vecinos a ±90°', () => {
  for (let step = 0; step < SERVICE_COUNT; step += 1) {
    const active = serviceState(step, step)
    assert.ok(near(wrap(active.angleWorld), 0), `servicio ${step + 1} al frente`)
    assert.ok(near(active.objectWorld[0], 0) && active.objectWorld[2] > HELIX.radius)
    assert.ok(near(active.activeness, 1) && near(active.scale, HELIX.maxScale))

    if (step + 1 < SERVICE_COUNT) assert.ok(near(wrap(serviceState(step + 1, step).angleWorld), Math.PI / 2), 'siguiente a la derecha')
    if (step > 0) assert.ok(near(wrap(serviceState(step - 1, step).angleWorld), -Math.PI / 2), 'anterior a la izquierda')
  }
})

test('La hélice gira un cuarto de vuelta por servicio y la cámara baja un espaciado', () => {
  assert.ok(near(helixRotation(1) - helixRotation(0), -Math.PI / 2))
  assert.ok(near(serviceAngle(3) - serviceAngle(2), Math.PI / 2))
  const [first, second] = [cameraFor(2), cameraFor(3)]
  assert.ok(near(first.target[1] - second.target[1], HELIX.spacing))
  assert.ok(near(first.eye[2], HELIX.cameraDistance))
})

test('El eje de la hélice se proyecta en la posición de pantalla pedida', () => {
  const width = 1600
  const height = 900
  for (const axisScreenX of [0.5, 0.64, 0.7]) {
    const camera = cameraFor(2, { aspect: width / height, axisScreenX })
    const projected = projectToScreen(camera, [0, camera.target[1], 0], width, height)
    assert.ok(near(projected.x / width, axisScreenX, 1e-9), `eje en ${axisScreenX}`)
  }
})

test('Los objetos de servicios distintos no se solapan en pantalla en ningún punto del recorrido', () => {
  const width = 1600
  const height = 900
  let worst = Infinity
  let worstAt = ''
  for (let raw = 0; raw <= SERVICE_COUNT - 1 + 1e-9; raw += 0.01) {
    const progress = displayProgress(raw)
    const camera = cameraFor(progress, { aspect: width / height, axisScreenX: 0.64 })
    const items = Array.from({ length: SERVICE_COUNT }, (_, index) => {
      const state = serviceState(index, progress)
      const screen = projectToScreen(camera, state.objectWorld, width, height)
      return { index, x: screen.x, y: screen.y, radius: (OBJECT_RADIUS * state.scale * screen.focalPx) / screen.depth }
    }).filter((item) => item.x > -item.radius && item.x < width + item.radius && item.y > -item.radius && item.y < height + item.radius)

    for (let a = 0; a < items.length; a += 1) {
      for (let b = a + 1; b < items.length; b += 1) {
        const ratio = Math.hypot(items[a].x - items[b].x, items[a].y - items[b].y) / (items[a].radius + items[b].radius)
        if (ratio < worst) {
          worst = ratio
          worstAt = `p=${progress.toFixed(2)} servicios ${items[a].index + 1}-${items[b].index + 1}`
        }
      }
    }
  }
  assert.ok(worst >= 0.85, `solape máximo: distancia/suma de radios = ${worst.toFixed(2)} en ${worstAt}`)
})

test('El progreso mostrado es monótono, respeta los enteros y deja mesetas junto a cada servicio', () => {
  let previous = -1
  for (let raw = 0; raw <= SERVICE_COUNT - 1; raw += 0.005) {
    const shown = displayProgress(raw)
    assert.ok(shown >= previous - 1e-12)
    previous = shown
  }
  for (let index = 0; index < SERVICE_COUNT; index += 1) {
    assert.ok(near(displayProgress(index), index))
    assert.ok(near(displayProgress(index + 0.05), index), 'meseta tras el servicio')
  }
  assert.ok(near(displayProgress(1.5), 1.5, 1e-9), 'punto medio sin sesgo')
})

test('La conversión entre scroll y progreso es consistente en ambos sentidos', () => {
  const geometry = { trackTop: 900, trackHeight: 4200, pinHeight: 720, stickyTop: 86 }
  for (let index = 0; index < SERVICE_COUNT; index += 1) {
    const scrollY = scrollForStep({ index, ...geometry })
    assert.ok(near(progressFromScroll({ scrollY, ...geometry }), index, 1e-9), `servicio ${index + 1}`)
  }
  assert.equal(progressFromScroll({ scrollY: 0, ...geometry }), 0)
  assert.equal(progressFromScroll({ scrollY: 99999, ...geometry }), SERVICE_COUNT - 1)
})
