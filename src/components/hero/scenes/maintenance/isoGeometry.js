/**
 * Geometría isométrica 2:1 compartida por la escena «Mantenimiento y mejoras».
 * Todas las funciones son puras y devuelven cadenas listas para atributos SVG.
 */

export const ISO_RATIO = 0.5

const round = (value) => Math.round(value * 100) / 100
const toPoints = (vertices) =>
  vertices.map(([x, y]) => `${round(x)},${round(y)}`).join(' ')

/**
 * Losa cuadrada: cara superior (rombo) y las dos caras laterales visibles.
 * `half` es el semiancho de proyección; la superficie se direcciona en un plano local 100×100.
 */
export function createSlab({ cx, cy, half, thickness }) {
  const halfHeight = half * ISO_RATIO
  const back = [cx, cy - halfHeight]
  const right = [cx + half, cy]
  const front = [cx, cy + halfHeight]
  const left = [cx - half, cy]
  const lower = ([x, y]) => [x, y + thickness]

  return {
    origin: back,
    scale: half / 100,
    thickness,
    corners: { back, right, front, left },
    top: toPoints([back, right, front, left]),
    leftFace: toPoints([left, front, lower(front), lower(left)]),
    rightFace: toPoints([right, front, lower(front), lower(right)]),
  }
}

/** Matriz SVG que proyecta el plano local 100×100 sobre la cara superior de la losa. */
export function slabSurfaceTransform({ origin: [originX, originY], scale }) {
  const skew = scale * ISO_RATIO
  return `matrix(${scale} ${skew} ${-scale} ${skew} ${originX} ${originY})`
}

/** Punto del plano local (0–100) → coordenadas de pantalla. */
export function slabPointToScreen({ origin: [originX, originY], scale }, localX, localY) {
  return [
    originX + scale * (localX - localY),
    originY + scale * ISO_RATIO * (localX + localY),
  ]
}

/** Cubo isométrico; (x, y) es el centro de su base y `height` su altura en pantalla. */
export function createCube({ x, y, half, height }) {
  const halfHeight = half * ISO_RATIO
  const roofY = y - height

  return {
    top: toPoints([
      [x, roofY - halfHeight],
      [x + half, roofY],
      [x, roofY + halfHeight],
      [x - half, roofY],
    ]),
    leftFace: toPoints([
      [x - half, roofY],
      [x, roofY + halfHeight],
      [x, y + halfHeight],
      [x - half, y],
    ]),
    rightFace: toPoints([
      [x + half, roofY],
      [x, roofY + halfHeight],
      [x, y + halfHeight],
      [x + half, y],
    ]),
  }
}

/**
 * Contorno de engranaje centrado en el origen con dientes trapezoidales.
 * `phaseDeg` orienta el centro del primer diente para poder engranar dos ruedas.
 */
export function createGearPath({ teeth, rootRadius, tipRadius, phaseDeg = 0 }) {
  const pitch = (Math.PI * 2) / teeth
  const baseHalfAngle = pitch * 0.3
  const tipHalfAngle = pitch * 0.15
  const phase = (phaseDeg * Math.PI) / 180
  const at = (radius, angle) =>
    `${round(radius * Math.cos(angle))} ${round(radius * Math.sin(angle))}`
  const rootArc = `A ${rootRadius} ${rootRadius} 0 0 1`

  let path = ''
  for (let tooth = 0; tooth < teeth; tooth += 1) {
    const center = phase + tooth * pitch
    path += `${tooth === 0 ? 'M' : rootArc} ${at(rootRadius, center - baseHalfAngle)} `
    path += `L ${at(tipRadius, center - tipHalfAngle)} `
    path += `L ${at(tipRadius, center + tipHalfAngle)} `
    path += `L ${at(rootRadius, center + baseHalfAngle)} `
  }
  return `${path}${rootArc} ${at(rootRadius, phase - baseHalfAngle)} Z`
}
