import { useEffect, useRef, useState } from 'react'
import { loadGlbAsset } from '../engine3d/glbLoader'
import { createWebGLPbrStage } from '../engine3d/webglPbrStage'

// Los monitores de 120/144 Hz no aportan nada visible en un modelo con movimiento tan suave
const MIN_FRAME_INTERVAL_MS = 14.5
// El compilador de shaders no debería tardar tanto; si lo hace, el dispositivo no es apto
const SHADER_COMPILE_TIMEOUT_MS = 12000
// Por encima de este DPR el suavizado MSAA no se aprecia y solo consume GPU
const MSAA_MAX_DPR = 1.75

const isCoarsePointer = () => window.matchMedia?.('(pointer: coarse)').matches ?? false

function computeDpr(settings) {
  const cap = isCoarsePointer() ? settings.coarseMaxDpr : settings.maxDpr
  return Math.min(window.devicePixelRatio || 1, cap) * settings.resolutionScale
}

/**
 * Ciclo de vida de un modelo glTF renderizado con WebGL2 dentro de `hostRef`.
 *
 * El canvas se crea y se destruye aquí (no lo gestiona React): un contexto perdido no puede
 * reutilizarse, así que cada inicialización necesita un canvas nuevo.
 *
 * Estados: 'loading' → 'ready' | 'failed'. Ante un fallo se avisa con `onFailure(kind)`, donde
 * kind es 'load' (descarga/decodificación), 'init' (WebGL/shaders) o 'context-lost'.
 */
export function useWebglModelStage({ hostRef, glbUrl, preset, enabled, isPaused, settings, onFailure }) {
  const [status, setStatus] = useState('loading')
  const runtimeRef = useRef({ isPaused, settings, onFailure })
  const controlsRef = useRef(null)

  useEffect(() => {
    runtimeRef.current = { isPaused, settings, onFailure }
    controlsRef.current?.sync()
  })

  useEffect(() => {
    const host = hostRef.current
    if (!enabled || !host) return undefined

    let cancelled = false
    let stage = null
    let canvas = null
    let rafId = 0
    let resizeObserver = null
    let intersectionObserver = null
    const view = { visible: true, width: host.clientWidth, height: host.clientHeight, lastRender: 0, startedAt: 0 }
    const stageHost = host.closest('[data-ov-hero-stage]')

    setStatus('loading')

    const shouldRun = () => !runtimeRef.current.isPaused && view.visible && !document.hidden
    const stopLoop = () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      rafId = 0
    }

    const renderNow = (now) => {
      let rx = 0
      let ry = 0
      if (stageHost) {
        const style = stageHost.style
        rx = parseFloat(style.getPropertyValue('--ov-rx')) || 0
        ry = parseFloat(style.getPropertyValue('--ov-ry')) || 0
      }
      stage.renderFrame({
        timeSec: (now - view.startedAt) * 0.001,
        rx,
        ry,
        dpr: computeDpr(runtimeRef.current.settings),
        cssWidth: view.width,
        cssHeight: view.height,
      })
      view.lastRender = now
    }

    const frame = (now) => {
      rafId = 0
      if (cancelled || !stage || !shouldRun()) return
      if (now - view.lastRender >= MIN_FRAME_INTERVAL_MS) renderNow(now)
      rafId = window.requestAnimationFrame(frame)
    }

    const startLoop = () => {
      if (!rafId && stage && shouldRun()) rafId = window.requestAnimationFrame(frame)
    }

    controlsRef.current = {
      sync: () => (shouldRun() ? startLoop() : stopLoop()),
    }

    const releaseRuntime = () => {
      stopLoop()
      document.removeEventListener('visibilitychange', handleVisibility)
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      canvas?.removeEventListener('webglcontextlost', handleContextLost)
      stage?.dispose()
      stage = null
      canvas?.remove()
      canvas = null
      controlsRef.current = null
    }

    const fail = (kind, error) => {
      if (cancelled) return
      cancelled = true
      releaseRuntime()
      if (kind !== 'context-lost') console.warn(`[hero] Modelo 3D no disponible (${kind}):`, error?.message ?? error)
      setStatus('failed')
      runtimeRef.current.onFailure?.(kind)
    }

    function handleVisibility() {
      controlsRef.current?.sync()
    }

    function handleContextLost(event) {
      event.preventDefault()
      fail('context-lost')
    }

    const waitForShaders = (since) => {
      rafId = 0
      if (cancelled) return
      try {
        if (stage.pollReady()) {
          view.startedAt = performance.now()
          // Primer fotograma antes de revelar el canvas: evita mostrar un lienzo vacío
          renderNow(view.startedAt)
          setStatus('ready')
          startLoop()
          return
        }
      } catch (error) {
        fail('init', error)
        return
      }
      if (performance.now() - since > SHADER_COMPILE_TIMEOUT_MS) {
        fail('init', new Error('Tiempo de compilación de shaders excedido'))
        return
      }
      rafId = window.requestAnimationFrame(() => waitForShaders(since))
    }

    loadGlbAsset(glbUrl, { priority: 'high' })
      .then((asset) => {
        if (cancelled) return

        canvas = document.createElement('canvas')
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
        host.appendChild(canvas)
        canvas.addEventListener('webglcontextlost', handleContextLost)

        try {
          stage = createWebGLPbrStage(canvas, asset, {
            preset,
            // Se decide con la resolución efectiva de render (no con la de la pantalla): un móvil
            // de DPR 3 que renderiza a 1,5× sí necesita suavizado de bordes
            antialias: computeDpr(runtimeRef.current.settings) < MSAA_MAX_DPR,
          })
        } catch (error) {
          fail('init', error)
          return
        }

        resizeObserver = new ResizeObserver(([entry]) => {
          view.width = entry.contentRect.width
          view.height = entry.contentRect.height
        })
        resizeObserver.observe(host)

        // Sin renderizar mientras el modelo está fuera de pantalla
        intersectionObserver = new IntersectionObserver(([entry]) => {
          view.visible = entry.isIntersecting
          controlsRef.current?.sync()
        })
        intersectionObserver.observe(host)
        document.addEventListener('visibilitychange', handleVisibility)

        waitForShaders(performance.now())
      })
      .catch((error) => fail('load', error))

    return () => {
      cancelled = true
      releaseRuntime()
    }
  }, [hostRef, glbUrl, preset, enabled])

  return status
}
