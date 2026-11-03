import { createPlane } from '../../../engine3d/primitives.js'
import { createBrush } from '../../scene3d/brush.js'
import { groupNode, meshNode, solid, sprite } from '../../scene3d/sceneKit.js'

/**
 * Monumento del logotipo de Overlayer en la plaza central: el isotipo (dos anillos rómbicos, indigo arriba
 * y esmeralda abajo, que se cruzan en un prisma lima a la derecha) hecho volumen sobre un pedestal. Las
 * proporciones son las del logotipo plano (`RING_METRICS`): el desplazamiento entre anillos es el 71 % de
 * la semialtura del rombo y el prisma lima es la intersección derecha de las dos bandas. Además los
 * anillos están a dos alturas (el índigo, por encima), así que se leen como capas superpuestas. El runtime
 * gira todo el grupo `logo` hacia la cámara para que, desde cada parada, el isotipo se vea de frente.
 *
 * Medidas (unidades de mundo, 1,5 = semidiagonal del rombo exterior): hueco de 0,68; centros de los
 * anillos a ±0,53 en profundidad; prisma lima centrado a 0,56 a la derecha con 0,41 de semidiagonal.
 */

export const MONUMENT_SCALE = 1.3
const OUTER_SIDE = 2.12 // lado del cuadrado exterior (semidiagonal 1,5)
const INNER_SIDE = 0.96 // lado del hueco (semidiagonal 0,68)
const BAND = (OUTER_SIDE - INNER_SIDE) / 2
const RING_Z = 0.53 // cada anillo se aparta 0,53 del centro (1,06 entre ambos)
const BASE_HEIGHT = 0.5
const RING_HEIGHT = 0.24
const LAYER_STEP = 0.3 // el anillo índigo va esta altura por encima del esmeralda
const LOWER_RING_Y = BASE_HEIGHT + 0.16
// El runtime amplía los anillos sobre su cara inferior (el pedestal no cambia) para que el isotipo se lea de lejos
export const RING_SCALE = 1.5
export const RING_ANCHOR_Y = LOWER_RING_Y - 0.01
const UPPER_RING_Y = LOWER_RING_Y + LAYER_STEP
const LIME_CENTER_X = 0.56
const LIME_SIDE = 0.58 // cuadrado girado 45° de semidiagonal 0,41

/** Aro cuadrado girado 45° (rombo visto desde arriba): cuatro tablones. */
function paintRing(brush, layer, y, z) {
  brush.frame([0, y, z], Math.PI / 4, () => {
    const half = OUTER_SIDE / 2
    brush.box(layer, [0, 0, half - BAND / 2], [OUTER_SIDE, RING_HEIGHT, BAND])
    brush.box(layer, [0, 0, -half + BAND / 2], [OUTER_SIDE, RING_HEIGHT, BAND])
    brush.box(layer, [half - BAND / 2, 0, 0], [BAND, RING_HEIGHT, INNER_SIDE])
    brush.box(layer, [-half + BAND / 2, 0, 0], [BAND, RING_HEIGHT, INNER_SIDE])
  })
}

export function buildLogoMonument({ detail = 1, textures }) {
  const base = createBrush({ detail })
  base.cylinder('concrete', [0, 0, 0], { radius: 2.15, height: 0.18, segments: 36 })
  base.cylinder('paving', [0, 0.18, 0], { radius: 1.9, height: 0.12, segments: 36 })
  base.cylinder('concrete', [0, 0.3, 0], { radius: 0.95, height: BASE_HEIGHT - 0.3, segments: 24 })
  // Aro luminoso del pedestal
  base.cylinder('accent', [0, 0.18, 0], { radius: 2.0, height: 0.02, segments: 36 })

  const rings = createBrush({ detail })
  paintRing(rings, 'ringEmerald', LOWER_RING_Y, RING_Z)
  paintRing(rings, 'ringIndigo', UPPER_RING_Y, -RING_Z)
  // Prisma lima: la intersección derecha de las dos bandas, de la cara inferior del esmeralda a la superior del índigo
  rings.frame([LIME_CENTER_X, LOWER_RING_Y - 0.01, 0], Math.PI / 4, () => {
    rings.box('lime', [0, 0, 0], [LIME_SIDE, UPPER_RING_Y - LOWER_RING_Y + RING_HEIGHT + 0.02, LIME_SIDE])
  })

  const materials = {
    concrete: solid('monument-concrete', '#8E8D8C', { metallic: 0.05, roughness: 0.75 }),
    paving: solid('monument-paving', '#6A6368', { metallic: 0.05, roughness: 0.8 }),
    accent: solid('monument-accent', 'emerald', { metallic: 0.2, roughness: 0.35, glow: 0.7 }),
    ringEmerald: solid('monument-ring-emerald', 'emerald', { metallic: 0.35, roughness: 0.3, glow: 0.3 }),
    ringIndigo: solid('monument-ring-indigo', 'indigo', { metallic: 0.35, roughness: 0.3, glow: 0.45 }),
    lime: solid('monument-lime', 'lime', { metallic: 0.1, roughness: 0.35, glow: 0.45 }),
  }

  return groupNode('logo', { scale: MONUMENT_SCALE }, [
    ...base.nodes('logo-base', materials),
    groupNode('logo-rings', {}, rings.nodes('logo-ring', materials)),
    // Resplandor lima sobre el pedestal
    meshNode('logo-glow', createPlane({ width: 5.2, height: 5.2 }), sprite('monument-glow', textures.glow, 'lime', 0.26, { additive: true }), {
      translation: [0, 0.34, 0],
      rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2],
    }),
  ])
}
