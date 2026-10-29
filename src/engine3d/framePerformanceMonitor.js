/**
 * Monitor de rendimiento de fotogramas, puro y sin dependencias de React ni del DOM.
 *
 * Evalúa por ventanas de tiempo (no por número de fotogramas) para detectar también el caso
 * más grave: un render tan lento que apenas produce un fotograma por segundo. Una degradación
 * exige varias ventanas lentas consecutivas, de modo que un tirón puntual (p. ej. al montar
 * una escena) no baja la calidad.
 */

const DEFAULTS = {
  windowMs: 2400, // duración de cada ventana de evaluación
  slowFrameMs: 40, // tiempo medio por fotograma a partir del cual la ventana es «lenta» (<25 fps)
  slowWindowsToDowngrade: 2, // ventanas lentas consecutivas necesarias
  maxFrameMs: 1000, // un único fotograma nunca aporta más que esto (evita que una pausa distorsione la media)
}

export function createFramePerformanceMonitor(options = {}) {
  const config = { ...DEFAULTS, ...options }

  let lastTimestamp = null
  let windowStart = null
  let windowFrames = 0
  let windowBusyMs = 0
  let consecutiveSlowWindows = 0
  let warmupUntil = 0

  function clearWindow() {
    windowStart = null
    windowFrames = 0
    windowBusyMs = 0
  }

  return {
    /** Descarta lo medido y espera `warmupMs` antes de volver a evaluar (cambio de escena, de nivel...). */
    reset(now, warmupMs = 0) {
      lastTimestamp = null
      consecutiveSlowWindows = 0
      warmupUntil = now + warmupMs
      clearWindow()
    },

    /** Debe llamarse al ocultarse la pestaña: la pausa no es lentitud del renderizado. */
    suspend() {
      lastTimestamp = null
      clearWindow()
    },

    /**
     * Registra un fotograma. Devuelve 'downgrade' cuando el rendimiento sostenido es insuficiente
     * y `null` en cualquier otro caso.
     */
    sample(now) {
      const previous = lastTimestamp
      lastTimestamp = now

      if (now < warmupUntil || previous === null) return null

      const delta = Math.min(now - previous, config.maxFrameMs)
      if (windowStart === null) windowStart = now

      windowFrames += 1
      windowBusyMs += delta

      const elapsed = now - windowStart
      if (elapsed < config.windowMs) return null

      const meanFrameMs = windowBusyMs / windowFrames
      clearWindow()

      if (meanFrameMs > config.slowFrameMs) {
        consecutiveSlowWindows += 1
        if (consecutiveSlowWindows >= config.slowWindowsToDowngrade) {
          consecutiveSlowWindows = 0
          return 'downgrade'
        }
      } else {
        consecutiveSlowWindows = 0
      }
      return null
    },
  }
}
