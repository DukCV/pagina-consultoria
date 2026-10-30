import { useEffect, useRef, useState } from 'react'
import { GRAPHICS_LEVELS, useGraphicsQuality } from '../../../context/graphicsQuality'
import { createWebGLPbrStage } from '../../../engine3d/webglPbrStage'
import { frameLayerStyle } from '../frameSequence.js'
import { loadHelixScene } from './buildHelixScene.js'
import { createSceneRuntime } from './sceneRuntime.js'

// El compilador de shaders no debería tardar tanto; si lo hace, el dispositivo no es apto
const SHADER_COMPILE_TIMEOUT_MS = 12000
// Por encima de este DPR el suavizado MSAA no se aprecia y solo consume GPU
const MSAA_MAX_DPR = 1.75
// Presupuesto de píxeles de la escena: una pantalla grande a DPR 2 multiplicaría el coste del shader PBR
const MAX_RENDER_PIXELS = 2_200_000
// Movimiento ambiental (flotación, órbitas, poses) en reposo: solo en calidad completa y a baja frecuencia
const IDLE_FRAME_INTERVAL_MS = 42

const isCoarsePointer = () => window.matchMedia?.('(pointer: coarse)').matches ?? false

function computeDpr(settings, width, height) {
  const cap = isCoarsePointer() ? settings.coarseMaxDpr : settings.maxDpr
  const wanted = Math.min(window.devicePixelRatio || 1, cap) * settings.resolutionScale
  const budget = Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, width * height))
  return Math.max(0.6, Math.min(wanted, budget))
}

/** Posición horizontal del eje de la hélice (0‥1): la define el CSS con `--ov-axis-x`. */
function readAxis(element) {
  const value = Number.parseFloat(window.getComputedStyle(element).getPropertyValue('--ov-axis-x'))
  return Number.isFinite(value) ? value / 100 : 0.5
}

/** Renderizador de respaldo: mueve las capas de fotogramas pre-renderizados según el progreso. */
function createFramesRenderer(layerRefs) {
  return {
    update(progress) {
      layerRefs.current.forEach((layer, step) => {
        if (!layer) return
        const { opacity, translateYPercent, scale } = frameLayerStyle(step, progress)
        layer.style.opacity = opacity.toFixed(3)
        layer.style.transform = `translate3d(0, ${translateYPercent.toFixed(2)}%, 0) scale(${scale.toFixed(4)})`
      })
    },
  }
}

/**
 * Ciclo de vida de la escena 3D de la hélice, con el mismo contrato que `useWebglModelStage` del hero:
 *  - `loading-3d`: se descargan los modelos y se compilan los shaders; mientras tanto se ven los
 *                  fotogramas pre-renderizados de la misma escena.
 *  - `ready-3d`:   el canvas WebGL se funde sobre los fotogramas; solo renderiza en pantalla y con la
 *                  pestaña visible.
 *  - `fallback-2d`: nivel `static`, fallo gráfico o pérdida de contexto: quedan los fotogramas.
 *
 * El 3D solo existe mientras `isEnabled` (la sección cerca de la pantalla): al alejarse se libera el contexto
 * WebGL y los buffers, y vuelve a crearse al regresar.
 *
 * Deja en `rendererRef.current` el objeto que el controlador de scroll llama en cada fotograma
 * (`update(progress, pointer)`): el stage 3D cuando está listo y, si no, el renderizador de fotogramas.
 */
export function useHelixRenderer({ stageRef, rendererRef, labelRefs, layerRefs, isEnabled, onRendererChange }) {
  const { level, reportFailure, markSceneChange } = useGraphicsQuality()
  // Sin 3D en el nivel estático y mientras la sección está lejos de la pantalla (los recursos se liberan)
  const is3d = isEnabled && level !== 'static'
  const [status, setStatus] = useState('loading')
  const renderMode = !is3d || status === 'failed' ? 'fallback-2d' : status === 'ready' ? 'ready-3d' : 'loading-3d'
  const runtimeRef = useRef({ level, reportFailure, markSceneChange, onRendererChange })

  useEffect(() => {
    runtimeRef.current = { level, reportFailure, markSceneChange, onRendererChange }
  })

  useEffect(() => {
    const host = stageRef.current
    if (!host) return undefined

    const framesRenderer = createFramesRenderer(layerRefs)
    rendererRef.current = framesRenderer
    runtimeRef.current.onRendererChange?.()
    if (!is3d) {
      return () => {
        rendererRef.current = null
      }
    }

    let cancelled = false
    let stage = null
    let canvas = null
    let runtime = null
    let idleFrameId = 0
    let compileFrameId = 0
    let resizeObserver = null
    let intersectionObserver = null
    const view = {
      width: host.clientWidth,
      height: host.clientHeight,
      axisX: readAxis(host),
      visible: true,
      startedAt: 0,
      lastDraw: 0,
      dpr: 1,
      dprKey: '',
    }

    // El DPR solo cambia al redimensionar o al bajar de nivel: se recalcula entonces, no en cada fotograma
    const currentDpr = () => {
      const { level: currentLevel } = runtimeRef.current
      const key = `${currentLevel}|${view.width}|${view.height}`
      if (key !== view.dprKey) {
        view.dprKey = key
        view.dpr = computeDpr(GRAPHICS_LEVELS[currentLevel] ?? GRAPHICS_LEVELS.balanced, view.width, view.height)
      }
      return view.dpr
    }
    const last = { progress: 0, pointer: { x: 0, y: 0 } }

    const draw = (now = performance.now()) => {
      if (!stage || !runtime || view.width < 2 || view.height < 2) return
      runtime.update({
        progress: last.progress,
        pointer: last.pointer,
        timeSec: (now - view.startedAt) * 0.001,
        width: view.width,
        height: view.height,
        dpr: currentDpr(),
        fog: true,
        axisScreenX: view.axisX,
      })
      view.lastDraw = now
    }

    const stageRenderer = {
      update(progress, pointer) {
        last.progress = progress
        last.pointer = pointer
        draw()
      },
      resize: () => draw(),
    }

    // Movimiento ambiental: solo en calidad completa, en pantalla y con la pestaña visible. El bucle se
    // detiene (no despierta el hilo principal) cuando no hace falta y se reanuda al volver a la vista.
    const canIdle = () => runtimeRef.current.level === 'full' && view.visible && !document.hidden
    const idleLoop = (now) => {
      idleFrameId = 0
      if (cancelled || !canIdle()) return
      if (now - view.lastDraw >= IDLE_FRAME_INTERVAL_MS) draw(now)
      idleFrameId = window.requestAnimationFrame(idleLoop)
    }
    const startIdle = () => {
      if (!idleFrameId && !cancelled && stage && canIdle()) idleFrameId = window.requestAnimationFrame(idleLoop)
    }
    function handleVisibility() {
      startIdle()
    }

    function handleContextLost(event) {
      event.preventDefault()
      fail('context-lost')
    }

    function release() {
      if (idleFrameId) window.cancelAnimationFrame(idleFrameId)
      if (compileFrameId) window.cancelAnimationFrame(compileFrameId)
      idleFrameId = 0
      compileFrameId = 0
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
      canvas?.removeEventListener('webglcontextlost', handleContextLost)
      stage?.dispose()
      stage = null
      runtime = null
      canvas?.remove()
      canvas = null
    }

    function fail(kind, error) {
      if (cancelled) return
      cancelled = true
      release()
      if (kind !== 'context-lost') console.warn(`[servicios] Escena 3D no disponible (${kind}):`, error?.message ?? error)
      rendererRef.current = framesRenderer
      setStatus('failed')
      runtimeRef.current.onRendererChange?.()
      runtimeRef.current.reportFailure(kind)
    }

    const waitForShaders = (since) => {
      compileFrameId = 0
      if (cancelled) return
      try {
        if (stage.pollReady()) {
          view.startedAt = performance.now()
          draw(view.startedAt) // primer fotograma antes de revelar el canvas: nunca se muestra vacío
          rendererRef.current = stageRenderer
          setStatus('ready')
          runtimeRef.current.markSceneChange()
          runtimeRef.current.onRendererChange?.()
          startIdle()
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
      compileFrameId = window.requestAnimationFrame(() => waitForShaders(since))
    }

    loadHelixScene({ detail: runtimeRef.current.level === 'full' ? 1 : 0 })
      .then((scene) => {
        if (cancelled) return
        canvas = document.createElement('canvas')
        canvas.className = 'ov-svc-canvas'
        canvas.setAttribute('aria-hidden', 'true')
        host.appendChild(canvas)
        canvas.addEventListener('webglcontextlost', handleContextLost)

        try {
          const dpr = computeDpr(GRAPHICS_LEVELS[runtimeRef.current.level], view.width, view.height)
          stage = createWebGLPbrStage(canvas, scene.asset, {
            preset: 'scene',
            poses: ['quest3', 'ai-character'],
            antialias: dpr < MSAA_MAX_DPR,
          })
          runtime = createSceneRuntime({ stage, scene, labelRefs })
        } catch (error) {
          fail('init', error)
          return
        }

        resizeObserver = new ResizeObserver(([entry]) => {
          view.width = entry.contentRect.width
          view.height = entry.contentRect.height
          view.axisX = readAxis(host) // el CSS cambia el eje al pasar de horizontal a vertical
        })
        resizeObserver.observe(host)
        intersectionObserver = new IntersectionObserver(([entry]) => {
          view.visible = entry.isIntersecting
          startIdle()
        })
        intersectionObserver.observe(host)
        document.addEventListener('visibilitychange', handleVisibility)

        waitForShaders(performance.now())
      })
      .catch((error) => fail('load', error))

    return () => {
      cancelled = true
      release()
      if (rendererRef.current === stageRenderer || rendererRef.current === framesRenderer) rendererRef.current = null
      setStatus('loading')
    }
  }, [stageRef, rendererRef, labelRefs, layerRefs, is3d])

  return { renderMode }
}
