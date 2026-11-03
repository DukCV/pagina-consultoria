import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FAR, FOV_DEG, MAX_POINTER_YAW_DEG, NEAR, STOPS, cameraAngle, cameraFor } from './cityCamera.js'
import { projectToScreen } from '../../services/helix3d/helixRig.js'
import { CITY, DISTRICT_COUNT, DISTRICT_STEP, polar } from './cityRig.js'
import { SWAP_FRACTION, createMotion, durationFor } from './cityMotion.js'

const near = (a, b, tolerance = 1e-6) => Math.abs(a - b) < tolerance
const dist = (a, b) => Math.hypot(...a.map((value, axis) => value - b[axis]))
const lastStop = DISTRICT_COUNT - 1

test('En cada parada la cámara está sobre el eje de su distrito, fuera de la ciudad y mirando hacia el centro', () => {
  for (let stop = 0; stop <= lastStop; stop += 1) {
    const { eye, target, fovDeg } = cameraFor(stop)
    const [ax, az] = polar(stop * DISTRICT_STEP, 1)
    assert.ok(near(eye[0] * az - eye[2] * ax, 0, 1e-6), `parada ${stop}: fuera del eje`)
    assert.ok(Math.hypot(eye[0], eye[2]) > CITY.radius, `parada ${stop}: cámara dentro del disco`)
    assert.ok(eye[1] > 5, `parada ${stop}: demasiado baja`)
    assert.ok(Math.hypot(target[0], target[2]) < 7, `parada ${stop}: mira demasiado lejos del centro`)
    assert.equal(fovDeg, FOV_DEG)
  }
})

test('La ciudad queda entre los planos de corte con margen y la relación far/near es moderada', () => {
  for (let p = 0; p <= lastStop; p += 0.25) {
    const { eye } = cameraFor(p)
    const nearestRoof = Math.hypot(eye[0], eye[2]) - CITY.radius // distancia horizontal al borde de la ciudad
    assert.ok(nearestRoof > NEAR + 3, `p=${p}: plano cercano demasiado próximo`)
    assert.ok(Math.hypot(...eye) + CITY.radius < FAR, `p=${p}: plano lejano corta la ciudad`)
  }
  assert.ok(FAR / NEAR <= 20)
})

test('El ángulo crece siempre en el mismo sentido: 72° por paso, sin vueltas largas', () => {
  assert.ok(near(cameraAngle(1) - cameraAngle(0), DISTRICT_STEP))
  let previous = -Infinity
  for (let p = 0; p <= lastStop; p += 0.05) {
    const angle = cameraAngle(p)
    assert.ok(angle > previous)
    previous = angle
  }
  assert.ok(cameraAngle(lastStop) < Math.PI * 2, 'el recorrido completo no da la vuelta entera')
})

test('El recorrido es continuo: ningún paso pequeño de progreso mueve la cámara a saltos', () => {
  const step = 0.01
  let previous = cameraFor(0)
  let maxEye = 0
  let maxTarget = 0
  for (let p = step; p <= lastStop + 1e-9; p += step) {
    const current = cameraFor(p)
    maxEye = Math.max(maxEye, dist(previous.eye, current.eye))
    maxTarget = Math.max(maxTarget, dist(previous.target, current.target))
    previous = current
  }
  // 72° a radio 20 son ≈ 25 u por tramo: 0,25 u por centésima de tramo
  assert.ok(maxEye < 0.45, `salto de cámara ${maxEye.toFixed(3)}`)
  assert.ok(maxTarget < 0.2, `salto del punto de mira ${maxTarget.toFixed(3)}`)
})

test('La cámara asciende y se aleja a mitad de cada tramo y vuelve a su encuadre en las paradas', () => {
  for (let stop = 0; stop < lastStop; stop += 1) {
    const start = cameraFor(stop)
    const middle = cameraFor(stop + 0.5)
    const baseline = (STOPS[stop].height + STOPS[stop + 1].height) / 2
    assert.ok(middle.eye[1] > baseline + 1, `tramo ${stop}: sin vuelo`)
    assert.ok(near(start.eye[1], STOPS[stop].height, 1e-6))
  }
})

test('El progreso se limita al rango de paradas', () => {
  assert.deepEqual(cameraFor(-3), cameraFor(0))
  assert.deepEqual(cameraFor(99), cameraFor(lastStop))
})

test('En pantallas estrechas la cámara se aleja y el cursor solo inclina unos grados', () => {
  const wide = cameraFor(2, { aspect: 1.9 })
  const narrow = cameraFor(2, { aspect: 1 })
  assert.ok(Math.hypot(narrow.eye[0], narrow.eye[2]) > Math.hypot(wide.eye[0], wide.eye[2]) * 1.3)

  const rest = cameraFor(2)
  const moved = cameraFor(2, { pointer: { x: 1, y: -1 } })
  assert.deepEqual(rest.target, moved.target)
  const yawOf = (camera) => Math.atan2(camera.eye[0], camera.eye[2]) * (180 / Math.PI)
  assert.ok(near(yawOf(moved) - yawOf(rest), MAX_POINTER_YAW_DEG, 1e-6))
})

test('El eje de la escena desplaza el centro de la ciudad en pantalla sin girar la cámara', () => {
  const width = 1440
  const height = 810
  const centered = cameraFor(1, { aspect: width / height })
  const shifted = cameraFor(1, { aspect: width / height, axisScreenX: 0.66 })
  const forward = (camera) => camera.target.map((value, axis) => value - camera.eye[axis])
  assert.ok(near(dist(forward(centered), forward(shifted)), 0, 1e-9), 'misma dirección de vista')
  const at = (camera) => projectToScreen(camera, centered.target, width, height).x / width
  assert.ok(near(at(centered), 0.5, 1e-6))
  assert.ok(near(at(shifted), 0.66, 1e-6), `el punto de mira queda en ${at(shifted).toFixed(3)}`)
})

// ---- Movimiento --------------------------------------------------------------------------------------------

test('Un viaje parte del origen, llega al destino y nunca retrocede', () => {
  const motion = createMotion(0)
  motion.retarget(1, 0)
  let previous = -1
  for (let t = 0; t <= durationFor(1) + 50; t += 16) {
    const { value } = motion.sample(t)
    assert.ok(value >= previous - 1e-12, `retrocede en t=${t}`)
    assert.ok(value <= 1 + 1e-12)
    previous = value
  }
  const end = motion.sample(durationFor(1) + 100)
  assert.equal(end.value, 1)
  assert.equal(end.isMoving, false)
})

test('La velocidad es nula al empezar y al llegar, y máxima hacia la mitad', () => {
  const motion = createMotion(0)
  motion.retarget(1, 0)
  const duration = durationFor(1)
  const speed = (t) => Math.abs(motion.sample(t + 1).value - motion.sample(t - 1).value) / 2
  assert.ok(speed(2) < 0.0005)
  assert.ok(speed(duration - 2) < 0.0005)
  assert.ok(speed(duration / 2) > speed(duration * 0.1))
})

test('Pulsar de nuevo a mitad de viaje continúa sin saltos de posición ni de velocidad', () => {
  const motion = createMotion(0)
  motion.retarget(1, 0)
  const now = 500
  const before = motion.sample(now)
  const speedBefore = (motion.sample(now + 1).value - motion.sample(now - 1).value) / 2
  motion.retarget(2, now)
  const after = motion.sample(now)
  assert.ok(near(after.value, before.value, 1e-9), 'la posición no salta')
  const speedAfter = motion.sample(now + 1).value - motion.sample(now).value // diferencia hacia delante: antes de `now` el viaje nuevo aún no existe
  assert.ok(Math.abs(speedAfter - speedBefore) < 0.0005, `la velocidad no salta (${speedBefore} → ${speedAfter})`)
  assert.equal(motion.sample(durationFor(1) * 3).value, 2)
})

test('Volver atrás a mitad de viaje regresa por el mismo camino y llega al origen', () => {
  const motion = createMotion(1)
  motion.retarget(2, 0)
  motion.retarget(1, 400)
  assert.equal(motion.sample(400 + durationFor(1) + 200).value, 1)
})

test('Un salto largo dura más, con un tope, y el movimiento inmediato no anima', () => {
  assert.ok(durationFor(3) > durationFor(1))
  assert.ok(durationFor(40) <= 2300)
  const motion = createMotion(0)
  motion.retarget(3, 0, { immediate: true })
  assert.deepEqual(motion.sample(1), { value: 3, fraction: 1, isMoving: false })
})

test('La diapositiva nueva entra cuando la cámara ya casi ha llegado', () => {
  assert.ok(SWAP_FRACTION > 0.4 && SWAP_FRACTION < 0.75)
})
