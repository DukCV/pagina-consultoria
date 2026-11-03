import { PAINTERS as business } from './business.js'
import { PAINTERS as civic } from './civic.js'
import { PAINTERS as commerce } from './commerce.js'
import { PAINTERS as expo } from './expo.js'
import { PAINTERS as industry } from './industry.js'

/**
 * Pintores de lotes por tipo (`LOT_PLAN` en cityRig.js). Cada uno recibe `(brush, lot)` y dibuja en el
 * sistema local del lote: origen en su centro y a nivel del suelo, x tangente (±lot.size[0]/2), z de fondo
 * (±lot.size[1]/2) con la fachada principal hacia +Z.
 */
export const LOT_PAINTERS = { ...commerce, ...civic, ...business, ...expo, ...industry }
