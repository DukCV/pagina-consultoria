import { createBrush } from '../../scene3d/brush.js'
import { LOT_PAINTERS } from './district/index.js'
import { createLots } from './cityRig.js'
import { paintStreetProps } from './props.js'

/**
 * Geometría estática de la ciudad: los 25 lotes con su edificio y el mobiliario de las calles, todo en un
 * pincel que fusiona por capa (ver `cityMaterials.js`). Pura (sin DOM ni WebGL), así que se puede medir en
 * pruebas. El monumento del logotipo y los vehículos son nodos propios porque se animan.
 *
 * @param {{ detail?: 0 | 1 }} options `detail: 0` reduce segmentos y adornos (nivel `balanced`).
 */
export function buildCityGeometry({ detail = 1 } = {}) {
  const brush = createBrush({ detail })
  for (const lot of createLots()) {
    const paint = LOT_PAINTERS[lot.kind]
    if (!paint) throw new Error(`No hay pintor para el lote «${lot.kind}» (${lot.id})`)
    brush.frame(lot.center, lot.yaw, () => paint(brush, lot))
  }
  paintStreetProps(brush)
  return brush
}
