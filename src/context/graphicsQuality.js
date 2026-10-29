import { createContext, useContext } from 'react'

/**
 * Niveles de calidad gráfica del hero, de mayor a menor coste. La degradación es progresiva:
 * primero se reduce la resolución y los efectos decorativos y, solo si no basta, los modelos
 * 3D se sustituyen por sus renders 2D.
 *
 *  - full:     WebGL a resolución nativa (hasta 2× / 1,5× en táctiles) y todos los efectos CSS.
 *  - balanced: WebGL a 1× reducido al 75 %, sin filtros costosos ni animaciones SVG decorativas.
 *  - static:   modelos 3D sustituidos por renders 2D y planos CSS sin transformaciones 3D.
 */
export const GRAPHICS_LEVEL_ORDER = ['full', 'balanced', 'static']

export const GRAPHICS_LEVELS = {
  full: { models3d: true, maxDpr: 2, coarseMaxDpr: 1.5, resolutionScale: 1 },
  balanced: { models3d: true, maxDpr: 1, coarseMaxDpr: 1, resolutionScale: 0.75 },
  static: { models3d: false, maxDpr: 1, coarseMaxDpr: 1, resolutionScale: 1 },
}

export function isGraphicsLevel(value) {
  return GRAPHICS_LEVEL_ORDER.includes(value)
}

/** Devuelve el peor (más degradado) de dos niveles. */
export function worseGraphicsLevel(a, b) {
  return GRAPHICS_LEVEL_ORDER.indexOf(a) >= GRAPHICS_LEVEL_ORDER.indexOf(b) ? a : b
}

export function nextGraphicsLevel(level) {
  const index = GRAPHICS_LEVEL_ORDER.indexOf(level)
  return GRAPHICS_LEVEL_ORDER[Math.min(index + 1, GRAPHICS_LEVEL_ORDER.length - 1)]
}

const DEFAULT_QUALITY = {
  level: 'full',
  settings: GRAPHICS_LEVELS.full,
  reportFailure: () => {},
}

export const GraphicsQualityContext = createContext(DEFAULT_QUALITY)
export const SceneActivityContext = createContext({ isActive: true })

/** Nivel de calidad vigente, sus parámetros y el callback para notificar fallos gráficos. */
export function useGraphicsQuality() {
  return useContext(GraphicsQualityContext)
}

/** Indica si la escena está activa o ya en su transición de salida (para pausar su renderizado). */
export function useSceneActivity() {
  return useContext(SceneActivityContext)
}
