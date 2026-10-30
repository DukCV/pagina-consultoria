import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GRAPHICS_LEVELS,
  isGraphicsLevel,
  nextGraphicsLevel,
  worseGraphicsLevel,
} from '../context/graphicsQuality'
import { clearGlbCache } from '../engine3d/glbLoader'
import { createFramePerformanceMonitor } from '../engine3d/framePerformanceMonitor'
import { detectGraphicsCapabilities } from '../engine3d/graphicsCapabilities'

const STORAGE_KEY = 'ov-graphics-level'
const OVERRIDE_PARAM = 'ov-quality'
const WARMUP_AFTER_TRANSITION_MS = 1400
const WARMUP_AFTER_LEVEL_CHANGE_MS = 2200

/**
 * Parámetro de QA y soporte `?ov-quality=`:
 *  - full | balanced | static: fija el nivel y desactiva la adaptación automática.
 *  - adaptive: arranca en `full` ignorando el veredicto de capacidades, pero mantiene la degradación
 *    automática (permite verificar el monitor de rendimiento en equipos que de otro modo usarían 2D).
 * Sin parámetro, el nivel inicial lo decide la detección de capacidades.
 */
function readQualityOverride() {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get(OVERRIDE_PARAM)
  if (value === 'adaptive') return { level: 'full', isLocked: false }
  return isGraphicsLevel(value) ? { level: value, isLocked: true } : null
}

// La degradación se recuerda durante la sesión para no repetir el ciclo de pruebas en cada recarga
function readStoredLevel() {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY)
    return isGraphicsLevel(stored) ? stored : null
  } catch {
    return null
  }
}

function storeLevel(level) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, level)
  } catch {
    // Almacenamiento no disponible: la degradación sigue vigente mientras la página esté abierta
  }
}

function resolveInitialState(capabilities, override) {
  if (override) return { level: override.level, reason: 'override' }

  const stored = readStoredLevel()
  if (stored && stored !== capabilities.startLevel) {
    const level = worseGraphicsLevel(stored, capabilities.startLevel)
    if (level === stored) return { level, reason: 'session-memory' }
  }
  return { level: capabilities.startLevel, reason: capabilities.reason }
}

/**
 * Decide el nivel de calidad gráfica del hero:
 *  1. Parte de las capacidades reales del dispositivo (WebGL2, render por software, límites de GPU, red).
 *  2. Mide el rendimiento sostenido y baja un nivel cada vez que es insuficiente.
 *  3. Pasa directamente a 2D ante un fallo de inicialización del motor gráfico.
 * Con prefers-reduced-motion siempre se usa el nivel `static`.
 */
export function useGraphicsGovernor({ prefersReducedMotion, isReady }) {
  const [capabilities] = useState(detectGraphicsCapabilities)
  const [override] = useState(readQualityOverride)
  const [state, setState] = useState(() => resolveInitialState(capabilities, override))
  const monitorRef = useRef(null)
  const isLocked = override?.isLocked ?? false

  const lowerQuality = useCallback(
    (reason, { toStatic = false } = {}) => {
      if (isLocked) return
      setState((current) => {
        const level = toStatic ? 'static' : nextGraphicsLevel(current.level)
        if (level === current.level) return current
        storeLevel(level)
        return { level, reason }
      })
    },
    [isLocked],
  )

  // Notificación de fallos desde los componentes que renderizan 3D
  const reportFailure = useCallback(
    (kind) => {
      if (kind === 'init') lowerQuality('webgl-init-error', { toStatic: true })
      else if (kind === 'context-lost') lowerQuality('context-lost')
    },
    [lowerQuality],
  )

  const level = prefersReducedMotion ? 'static' : state.level
  const reason = prefersReducedMotion ? 'reduced-motion' : state.reason

  // Monitor de rendimiento sostenido: solo mientras exista algo que degradar
  useEffect(() => {
    if (isLocked || !isReady || level === 'static') return undefined

    const monitor = createFramePerformanceMonitor()
    monitor.reset(performance.now(), WARMUP_AFTER_LEVEL_CHANGE_MS)
    monitorRef.current = monitor

    let rafId = 0
    const tick = (now) => {
      if (monitor.sample(now) === 'downgrade') {
        lowerQuality('sustained-low-fps')
        return
      }
      rafId = window.requestAnimationFrame(tick)
    }
    // Una pestaña oculta pausa el renderizado: no es lentitud y no debe contar
    const handleVisibility = () => {
      if (document.hidden) monitor.suspend()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    rafId = window.requestAnimationFrame(tick)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.cancelAnimationFrame(rafId)
      monitorRef.current = null
    }
  }, [isLocked, isReady, level, lowerQuality])

  // Montar una escena pesada (cambio de diapositiva, aparición de una sección) provoca un tirón puntual
  // que no debe contar como lentitud sostenida: se descarta antes de volver a medir
  const markSceneChange = useCallback(() => {
    monitorRef.current?.reset(performance.now(), WARMUP_AFTER_TRANSITION_MS)
  }, [])

  // Al pasar a 2D los modelos decodificados dejan de ser necesarios
  useEffect(() => {
    if (level === 'static') clearGlbCache()
  }, [level])

  return useMemo(
    () => ({
      level,
      reason,
      settings: GRAPHICS_LEVELS[level],
      capabilities,
      reportFailure,
      markSceneChange,
    }),
    [level, reason, capabilities, reportFailure, markSceneChange],
  )
}
