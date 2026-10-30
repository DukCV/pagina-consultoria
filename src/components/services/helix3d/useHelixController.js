import { useCallback, useEffect, useRef } from 'react'
import { SERVICE_COUNT, displayProgress, progressFromScroll, scrollForStep } from './helixRig.js'

// Constante de tiempo del suavizado del progreso (ms): la hélice «alcanza» al scroll sin retraso apreciable
const PROGRESS_SMOOTHING_MS = 120
const POINTER_SMOOTHING_MS = 180
const SETTLED_EPSILON = 0.0006

/**
 * Controlador de la sección. Es el **único** oyente de scroll de la hélice:
 *
 *  1. Convierte la posición de la pista fijada (sticky) en progreso 0…N-1 y lo asienta junto a cada
 *     servicio (`displayProgress`).
 *  2. Suaviza el progreso en un bucle rAF que solo corre mientras hay algo que mover (con la escena
 *     quieta no se renderiza ni un fotograma).
 *  3. En cada fotograma llama a `renderer.update(progress, pointer)` (WebGL o fotogramas 2D) y escribe
 *     `--ov-progress` en la pantalla fijada; React solo se entera cuando cambia el servicio activo.
 *
 * `mode = 'scroll'`: el progreso sale del scroll. `mode = 'manual'`: sale de `goToStep` (movimiento
 * reducido o ventanas demasiado bajas para fijar la sección).
 *
 * `rendererRef.current` puede ser `null` (aún cargando) o `{ update(progress, pointer), resize?() }`.
 */
export function useHelixController({
  mode,
  hasPointer,
  prefersReducedMotion,
  trackRef,
  pinRef,
  rendererRef,
  onIndexChange,
}) {
  const stateRef = useRef({ current: 0, target: 0, pointer: { x: 0, y: 0 }, pointerTarget: { x: 0, y: 0 } })
  const controlsRef = useRef({ goToStep: () => {}, repaint: () => {} })
  const onIndexChangeRef = useRef(onIndexChange)

  useEffect(() => {
    onIndexChangeRef.current = onIndexChange
  }, [onIndexChange])

  useEffect(() => {
    const track = trackRef.current
    const pin = pinRef.current
    if (!track || !pin) return undefined

    const state = stateRef.current
    const isScrollMode = mode === 'scroll'
    const steps = SERVICE_COUNT

    let geometry = { trackHeight: 0, pinHeight: 0, stickyTop: 0 }
    let isInView = true
    let frameId = 0
    let lastTime = 0
    let lastIndex = -1
    let needsRender = true

    const measure = () => {
      geometry = {
        trackHeight: track.offsetHeight,
        pinHeight: pin.offsetHeight,
        stickyTop: Number.parseFloat(window.getComputedStyle(pin).top) || 0,
      }
    }
    const trackTop = () => track.getBoundingClientRect().top + window.scrollY
    const scrollTarget = () =>
      displayProgress(progressFromScroll({ scrollY: window.scrollY, trackTop: trackTop(), steps, ...geometry }))

    const frame = (now) => {
      frameId = 0
      const elapsed = Math.min(64, now - lastTime || 16)
      lastTime = now
      let isMoving = false

      const gap = state.target - state.current
      if (Math.abs(gap) > SETTLED_EPSILON) {
        state.current += gap * (1 - Math.exp(-elapsed / PROGRESS_SMOOTHING_MS))
        isMoving = true
      } else if (gap !== 0) {
        state.current = state.target
        needsRender = true
      }

      const pointerEase = 1 - Math.exp(-elapsed / POINTER_SMOOTHING_MS)
      for (const axis of ['x', 'y']) {
        const pointerGap = state.pointerTarget[axis] - state.pointer[axis]
        if (Math.abs(pointerGap) > 0.002) {
          state.pointer[axis] += pointerGap * pointerEase
          isMoving = true
        } else if (pointerGap !== 0) {
          state.pointer[axis] = state.pointerTarget[axis]
          needsRender = true
        }
      }

      if (isInView && (isMoving || needsRender)) {
        rendererRef.current?.update(state.current, state.pointer)
        pin.style.setProperty('--ov-progress', (state.current / (steps - 1)).toFixed(4))
        needsRender = false
      }

      const index = Math.min(steps - 1, Math.max(0, Math.round(state.current)))
      if (index !== lastIndex) {
        lastIndex = index
        onIndexChangeRef.current?.(index)
      }
      if (isMoving) frameId = window.requestAnimationFrame(frame)
    }

    const wake = () => {
      if (frameId) return
      lastTime = performance.now()
      frameId = window.requestAnimationFrame(frame)
    }

    const setTarget = (value, { immediate = false } = {}) => {
      state.target = value
      if (immediate) state.current = value
      needsRender = true
      wake()
    }

    const handleScroll = () => setTarget(scrollTarget())

    const handlePointerMove = (event) => {
      if (event.pointerType !== 'mouse') return
      const rect = pin.getBoundingClientRect()
      state.pointerTarget.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      state.pointerTarget.y = ((event.clientY - rect.top) / rect.height) * 2 - 1
      wake()
    }
    const handlePointerLeave = () => {
      state.pointerTarget.x = 0
      state.pointerTarget.y = 0
      wake()
    }

    const handleResize = () => {
      measure()
      rendererRef.current?.resize?.()
      needsRender = true
      if (isScrollMode) setTarget(scrollTarget(), { immediate: true })
      else wake()
    }

    const goToStep = (index) => {
      const step = Math.min(steps - 1, Math.max(0, index))
      if (!isScrollMode) {
        setTarget(step, { immediate: prefersReducedMotion })
        return
      }
      const top = scrollForStep({ index: step, trackTop: trackTop(), steps, ...geometry })
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    }

    measure()
    controlsRef.current = { goToStep, repaint: () => setTarget(state.target) }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(track)
    resizeObserver.observe(pin)

    const viewObserver = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting
        if (isInView) {
          needsRender = true
          wake()
        }
      },
      { rootMargin: '120px 0px' },
    )
    viewObserver.observe(track)

    if (isScrollMode) window.addEventListener('scroll', handleScroll, { passive: true })
    if (hasPointer) {
      pin.addEventListener('pointermove', handlePointerMove, { passive: true })
      pin.addEventListener('pointerleave', handlePointerLeave)
    }

    // Primer fotograma en la posición actual (también al recargar a mitad de la sección)
    setTarget(isScrollMode ? scrollTarget() : state.target, { immediate: true })

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      viewObserver.disconnect()
      window.removeEventListener('scroll', handleScroll)
      pin.removeEventListener('pointermove', handlePointerMove)
      pin.removeEventListener('pointerleave', handlePointerLeave)
      state.pointerTarget.x = 0
      state.pointerTarget.y = 0
      state.pointer.x = 0
      state.pointer.y = 0
    }
  }, [mode, hasPointer, prefersReducedMotion, trackRef, pinRef, rendererRef])

  const goToStep = useCallback((index) => controlsRef.current.goToStep(index), [])
  /** Fuerza un fotograma con el estado actual (p. ej. cuando el renderizador pasa a estar listo). */
  const repaint = useCallback(() => controlsRef.current.repaint(), [])
  return { goToStep, repaint }
}
