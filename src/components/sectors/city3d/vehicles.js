import { createBrush } from '../../scene3d/brush.js'
import { groupNode, solid } from '../../scene3d/sceneKit.js'
import { paintCar } from './buildingKit.js'
import { VEHICLES } from './cityRig.js'

/**
 * Vehículos de la avenida circular. Contrato con el runtime: `buildVehicleNodes({ detail })` devuelve un
 * nodo por cada entrada de `VEHICLES`, llamado `car-0`, `car-1`…, modelado a nivel del suelo con el frente
 * hacia +Z y centrado en el origen. Cada coche es un grupo (el runtime mueve el grupo) con una malla por
 * material: carrocería, cabina, faros y bajos.
 */

const BODY_TONES = ['lightGray', 'charcoal', 'emerald'] // tres variantes de color, repartidas por índice
const CAR_LAYERS = { body: 'body', glass: 'glass', light: 'light', base: 'dark' }

function carMaterials(tone, variant) {
  return {
    body: solid(`car-body-${variant}`, tone, { metallic: 0.45, roughness: 0.32 }),
    glass: solid('car-glass', 'indigoDeep', { metallic: 0.6, roughness: 0.14, glow: 0.2 }),
    light: solid('car-light', '#F2EBC9', { glow: 1 }),
    dark: solid('car-dark', 'charcoalDeep', { metallic: 0.3, roughness: 0.5 }),
  }
}

// Con detalle reducido circula un coche de cada dos: la avenida sigue viva con la mitad de mallas
const REDUCED_DETAIL_STEP = 2

export function buildVehicleNodes({ detail = 1 } = {}) {
  const indices = VEHICLES.map((_, index) => index).filter((index) => detail >= 1 || index % REDUCED_DETAIL_STEP === 0)
  return indices.map((index) => {
    const variant = index % BODY_TONES.length
    const brush = createBrush({ detail })
    paintCar(brush, { layers: CAR_LAYERS })
    return groupNode(`car-${index}`, {}, brush.nodes(`car-${index}`, carMaterials(BODY_TONES[variant], variant)))
  })
}
