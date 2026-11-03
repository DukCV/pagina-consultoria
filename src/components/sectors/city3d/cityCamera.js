import { DISTRICT_COUNT, DISTRICT_STEP, polar } from './cityRig.js'

/**
 * Cámara orbital de la ciudad (pura). El progreso `p` va de 0 a 4 (una parada por distrito): el ángulo de
 * la cámara crece de forma lineal con `p` (cada paso es un arco de 72° alrededor del logotipo, siempre en
 * el mismo sentido) y el resto de parámetros —radio, altura, punto al que mira— se interpolan entre
 * paradas con una curva suave. A mitad de cada tramo la cámara asciende y se aleja un poco («vuelo») para
 * que el recorrido tenga relieve sin marear. Quien llama suaviza `p` con `cityMotion.js`.
 *
 * La cámara se coloca sobre el eje del distrito, por fuera de la ciudad, mirando hacia el centro: el
 * distrito protagonista queda en primer plano y el logotipo en el centro de la imagen.
 */

export const FOV_DEG = 30
// La cámara siempre está lejos (≥ 15 u de lo más cercano): un plano de corte cercano concentra la precisión de
// profundidad donde está la ciudad y evita el parpadeo (z-fighting) entre superficies casi coplanares
export const NEAR = 6
export const FAR = 90
// Proporción de la escena para la que se calibró la distancia; con menos ancho la cámara se aleja
export const REFERENCE_ASPECT = 1.45
export const MAX_POINTER_YAW_DEG = 2.2
export const MAX_POINTER_PITCH_DEG = 1.2
const FLIGHT = { radius: 1.6, height: 2.4 }

/** Encuadre de cada parada: `radius`/`height` de la cámara, `pull` (cuánto se adelanta el punto de mira hacia el distrito) y `lookY`. */
export const STOPS = [
  { radius: 28, height: 14, pull: 3.4, lookY: 0.9 },
  { radius: 28.5, height: 14.3, pull: 3.2, lookY: 0.9 },
  { radius: 27, height: 20.5, pull: 2, lookY: 1.4 },
  { radius: 28, height: 14, pull: 3.4, lookY: 1.1 },
  { radius: 28, height: 13.7, pull: 3.4, lookY: 0.9 },
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
export const smoothstep01 = (t) => t * t * (3 - 2 * t)
const lerp = (a, b, t) => a + (b - a) * t

/** Ángulo de la cámara (rad) para el progreso `p`. */
export const cameraAngle = (p) => p * DISTRICT_STEP

/**
 * Cámara para el progreso `p` (0‥4, con decimales durante el viaje).
 * @returns {{ eye: number[], target: number[], fovDeg: number }}
 */
export function cameraFor(p, { aspect = REFERENCE_ASPECT, pointer = { x: 0, y: 0 }, axisScreenX = 0.5 } = {}) {
  const progress = clamp(p, 0, DISTRICT_COUNT - 1)
  const index = Math.min(DISTRICT_COUNT - 2, Math.floor(progress))
  const frac = progress - index
  const k = smoothstep01(frac)
  const from = STOPS[index]
  const to = STOPS[index + 1]
  // Campana con pendiente cero en las dos paradas: el vuelo no altera la llegada
  const flight = Math.sin(Math.PI * frac) ** 2

  const distanceScale = Math.max(1, REFERENCE_ASPECT / aspect)
  const radius = (lerp(from.radius, to.radius, k) + FLIGHT.radius * flight) * distanceScale
  const height = (lerp(from.height, to.height, k) + FLIGHT.height * flight) * (0.5 + 0.5 * distanceScale)
  const pull = lerp(from.pull, to.pull, k)
  const lookY = lerp(from.lookY, to.lookY, k)

  const angle = cameraAngle(progress)
  const [tx, tz] = polar(angle, pull)

  // El cursor inclina el punto de vista unos grados alrededor del punto de mira
  const yaw = angle + (pointer.x * MAX_POINTER_YAW_DEG * Math.PI) / 180
  const [ex, ez] = polar(yaw, radius)
  const pitchShift = (-pointer.y * MAX_POINTER_PITCH_DEG * Math.PI) / 180
  const eyeY = height + Math.tan(pitchShift) * radius

  // El CSS decide dónde queda el centro de la ciudad (0‥1 del ancho): se desplaza la cámara en paralelo, sin girarla
  const shift = -(axisScreenX - 0.5) * 2 * Math.tan((FOV_DEG * Math.PI) / 360) * aspect * Math.hypot(ex - tx, eyeY - lookY, ez - tz)
  const [rx, rz] = [Math.cos(yaw), -Math.sin(yaw)]
  return { eye: [ex + rx * shift, eyeY, ez + rz * shift], target: [tx + rx * shift, lookY, tz + rz * shift], fovDeg: FOV_DEG, near: NEAR, far: FAR }
}
