import { DISTRICT_COUNT } from './city3d/cityRig.js'

/**
 * Fotogramas pre-renderizados de la ciudad para el nivel 2D: la misma escena 3D vista desde cada una de
 * las cinco paradas de la cámara (los genera `tools/render-city-frames.mjs` con el propio motor). Hay dos
 * juegos según la composición: `wide` (escritorio: la ciudad a pantalla completa con su centro en
 * `--ov-sec-axis`, a la derecha del texto) y `square` (tableta y móvil: la ciudad entre el título y el
 * panel, centrada). Las imágenes cubren el escenario (`object-fit: cover`). Aquí solo está la lógica de
 * nombres y de cómo se encadenan.
 */
export const FRAME_VARIANTS = {
  wide: { aspect: 1.78, axis: 0.66, widths: [960, 1600] },
  square: { aspect: 1.2, axis: 0.5, widths: [520, 900] },
}
export const WIDE_QUERY = '(min-width: 1024px)'

const FRAMES_BASE = `${import.meta.env?.BASE_URL ?? '/'}models/renders-2d`

export const frameSrc = (variant, step, width) => `${FRAMES_BASE}/city-${variant}-${step + 1}-${width}.webp`
export const frameSrcSet = (variant, step) =>
  FRAME_VARIANTS[variant].widths.map((width) => `${frameSrc(variant, step, width)} ${width}w`).join(', ')

/** Pasos cuyas imágenes conviene tener montadas: el activo y sus vecinos inmediatos. */
export function framesToMount(activeIndex) {
  return [activeIndex - 1, activeIndex, activeIndex + 1].filter((step) => step >= 0 && step < DISTRICT_COUNT)
}

/**
 * Estilo de la capa de un paso para el progreso de la cámara `value`: la capa propia se funde con la del
 * paso vecino mientras se desliza lateralmente, imitando el giro de la cámara alrededor de la ciudad.
 */
export function frameLayerStyle(step, value) {
  const delta = value - step
  const weight = Math.max(0, 1 - Math.abs(delta))
  const opacity = weight * weight * (3 - 2 * weight)
  return { opacity, translateXPercent: -delta * 7, scale: 1 + 0.05 * Math.min(1, Math.abs(delta)) }
}
