/**
 * Geometría y movimiento de la doble hélice 3D (funciones puras, sin DOM ni WebGL).
 *
 * Mundo: Y hacia arriba, X a la derecha, Z hacia el observador. Dos hilos de radio `radius` giran
 * alrededor del eje Y; los servicios cuelgan de ellos y descienden con el número de servicio, de modo
 * que al avanzar por la página el contenido sube, como en cualquier scroll.
 *
 * Todo el conjunto es un cuerpo rígido: la hélice gira un cuarto de vuelta por servicio y la cámara
 * desciende `spacing` por servicio. Con esa elección los hilos se alternan solos (los servicios pares
 * van por un hilo y los impares por el otro), el servicio activo queda siempre al frente y sus vecinos
 * a ±90°, de modo que cada paso es la misma imagen desplazada: continuidad sin saltos.
 */

export const HELIX = {
  radius: 1,
  spacing: 1.5, // distancia vertical entre un servicio y el siguiente
  turnPerStep: Math.PI / 2, // giro de la hélice por servicio
  objectOffset: 0.8, // cuánto sobresale el objeto de un servicio respecto a su hilo
  minScale: 0.5, // escala del objeto de un servicio secundario
  maxScale: 1.0, // escala del objeto del servicio protagonista
  faceFactor: 0.6, // fracción del giro de la hélice que compensa el objeto (lo mantiene casi de frente)
  cameraDistance: 8.4,
  cameraLift: 0,
  fovDeg: 34,
  pointerAmplitude: 0.35, // desplazamiento máximo de la cámara por el cursor (unidades de mundo)
}

export const SERVICE_COUNT = 6

export const clamp01 = (value) => Math.min(1, Math.max(0, value))

export function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10)
const lerp = (from, to, t) => from + (to - from) * t

// ---- Estructura de la hélice ---------------------------------------------------------------------------

/** Altura de un servicio (desciende con el índice). */
export const serviceHeight = (index, helix = HELIX) => -index * helix.spacing

/** Velocidad angular de los hilos respecto a la altura (rad por unidad): una vuelta cada 4·spacing. */
export const strandRate = (helix = HELIX) => (Math.PI - helix.turnPerStep) / helix.spacing

/** Punto de un hilo (0 o 1) a la altura `y`, en coordenadas locales de la hélice. */
export function strandPoint(strand, y, helix = HELIX) {
  const angle = strandRate(helix) * y + strand * Math.PI
  return [helix.radius * Math.sin(angle), y, helix.radius * Math.cos(angle)]
}

/** Ángulo local (fijo respecto a la hélice) del servicio `index`. */
export const serviceAngle = (index, helix = HELIX) => helix.turnPerStep * index

/** Giro de la hélice entera para un punto del recorrido. */
export const helixRotation = (progress, helix = HELIX) => -helix.turnPerStep * progress

// ---- Estado de cada servicio ----------------------------------------------------------------------------

/**
 * Estado de un servicio para `progress` (0…N-1, admite decimales).
 * `local` son coordenadas respecto a la hélice (que a su vez gira); `world` las del mundo.
 */
export function serviceState(index, progress, helix = HELIX) {
  const angleLocal = serviceAngle(index, helix)
  const angleWorld = angleLocal + helixRotation(progress, helix)
  const y = serviceHeight(index, helix)
  const distance = Math.abs(index - progress)
  const activeness = 1 - smoothstep(0, 1, distance)
  // Los servicios a más de un paso se encogen hasta desaparecer: entran y salen creciendo, no recortados por el borde
  const presence = 1 - smoothstep(1.3, 2.3, distance)

  const outward = [Math.sin(angleLocal), Math.cos(angleLocal)]
  const nodeLocal = [helix.radius * outward[0], y, helix.radius * outward[1]]
  const reach = helix.radius + helix.objectOffset
  const objectLocal = [reach * outward[0], y, reach * outward[1]]
  const objectWorld = [
    reach * Math.sin(angleWorld),
    y,
    reach * Math.cos(angleWorld),
  ]
  // El objeto compensa parte del giro de la hélice para mostrarse casi de frente al observador
  const yawWorld = -helix.faceFactor * angleWorld
  const yawLocal = yawWorld - helixRotation(progress, helix)

  return {
    index,
    activeness,
    angleWorld,
    nodeLocal,
    objectLocal,
    objectWorld,
    yawLocal,
    yawWorld,
    presence,
    scale: lerp(helix.minScale, helix.maxScale, activeness) * presence,
    haloScale: smoothstep(0.35, 1, activeness),
  }
}

// ---- Cámara ----------------------------------------------------------------------------------------------

/**
 * Cámara para un punto del recorrido. `axisScreenX` (0–1) es dónde queda el eje de la hélice en
 * pantalla: se desplaza la cámara en lugar de la escena, de modo que la perspectiva es la correcta.
 * `pointer` (-1…1) añade un paralaje sutil con el cursor. `distanceScale` aleja la cámara en pantallas
 * estrechas, para que quepa el mismo ancho de escena.
 */
export function cameraFor(
  progress,
  { aspect = 16 / 9, axisScreenX = 0.5, pointer = { x: 0, y: 0 }, distanceScale = 1 } = {},
  helix = HELIX,
) {
  const distance = helix.cameraDistance * distanceScale
  const halfWidth = distance * Math.tan((helix.fovDeg * Math.PI) / 360) * aspect
  const shiftX = -(axisScreenX - 0.5) * 2 * halfWidth
  const centerY = serviceHeight(progress, helix) + helix.cameraLift
  const px = pointer.x * helix.pointerAmplitude
  const py = pointer.y * helix.pointerAmplitude * 0.6

  return {
    eye: [shiftX + px, centerY + py, distance],
    target: [shiftX, centerY, 0],
    fovDeg: helix.fovDeg,
  }
}

/** Proyecta un punto del mundo a píxeles CSS del lienzo (misma convención que `stage.project`). */
export function projectToScreen(camera, point, width, height) {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const normalize = (a) => {
    const length = Math.hypot(...a)
    return a.map((v) => v / length)
  }

  const forward = normalize(sub(camera.target, camera.eye))
  const right = normalize(cross(forward, [0, 1, 0]))
  const up = cross(right, forward)
  const relative = sub(point, camera.eye)
  const depth = dot(relative, forward)
  const focal = 1 / Math.tan((camera.fovDeg * Math.PI) / 360)
  const ndcX = ((dot(relative, right) / depth) * focal) / (width / height)
  const ndcY = (dot(relative, up) / depth) * focal

  return { x: (ndcX * 0.5 + 0.5) * width, y: (0.5 - ndcY * 0.5) * height, depth, focalPx: (focal * height) / 2 }
}

// ---- Progreso y scroll -----------------------------------------------------------------------------------

/**
 * Progreso mostrado a partir del bruto: cerca de cada servicio la hélice «se asienta» (meseta) y
 * el cambio ocurre en la parte central del tramo, de modo que el reposo casi siempre deja un
 * servicio protagonista claro sin forzar ni capturar el scroll.
 */
export function displayProgress(raw, plateau = 0.1) {
  const whole = Math.floor(raw)
  const fraction = raw - whole
  return whole + smootherstep(clamp01((fraction - plateau) / (1 - 2 * plateau)))
}

/** Progreso bruto (0…steps-1) a partir de la posición de scroll y la geometría de la pista fijada. */
export function progressFromScroll({ scrollY, trackTop, trackHeight, pinHeight, stickyTop, steps = SERVICE_COUNT }) {
  const travel = Math.max(1, trackHeight - pinHeight)
  return clamp01((scrollY + stickyTop - trackTop) / travel) * (steps - 1)
}

/** Posición de scroll en la que un servicio queda exactamente como protagonista. */
export function scrollForStep({ index, trackTop, trackHeight, pinHeight, stickyTop, steps = SERVICE_COUNT }) {
  const travel = Math.max(1, trackHeight - pinHeight)
  return trackTop - stickyTop + (index / (steps - 1)) * travel
}
