import { SERVICE_COUNT, clamp01, smoothstep } from './helix3d/helixRig.js'

/**
 * Fotogramas pre-renderizados de la hélice para el nivel 2D: la misma escena 3D vista en cada uno de
 * los seis servicios (los genera `tools/render-helix-frames.mjs` con el propio motor). Aquí solo está
 * la lógica de nombres y de cómo se encadenan al avanzar el recorrido.
 */
export const FRAME_WIDTHS = [640, 1100, 1600]

const FRAMES_BASE = `${import.meta.env?.BASE_URL ?? '/'}models/renders-2d`

export const frameSrc = (step, width) => `${FRAMES_BASE}/helix-step-${step + 1}-${width}.webp`
export const frameSrcSet = (step) => FRAME_WIDTHS.map((width) => `${frameSrc(step, width)} ${width}w`).join(', ')

/** Pasos cuyas imágenes conviene tener montadas: el activo y sus vecinos inmediatos. */
export function framesToMount(activeIndex) {
  return [activeIndex - 1, activeIndex, activeIndex + 1].filter((step) => step >= 0 && step < SERVICE_COUNT)
}

/**
 * Estilo de la capa de un paso para un punto del recorrido: la capa propia se funde y asciende a la vez
 * que la siguiente llega desde abajo, imitando el descenso de la cámara (profundidad por parallax).
 */
export function frameLayerStyle(step, progress) {
  const delta = progress - step
  const distance = Math.abs(delta)
  return {
    opacity: smoothstep(0, 1, clamp01(1 - distance)),
    translateYPercent: -delta * 14,
    scale: 1 + 0.06 * Math.min(distance, 1),
  }
}
