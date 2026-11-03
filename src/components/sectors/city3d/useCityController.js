import { useCallback, useEffect, useRef } from 'react'
import { createMotion } from './cityMotion.js'

const POINTER_SMOOTHING_MS = 220
const POINTER_EPSILON = 0.002

/**
 * Controlador de la ciudad. Lleva el progreso de la cámara (0‥4) hasta la diapositiva elegida con un
 * viaje suave (`cityMotion`) y suaviza el paralaje del cursor, todo en un único bucle rAF que solo corre
 * mientras hay algo que mover. En cada fotograma llama a `rendererRef.current.update(progreso, puntero)`
 * (WebGL o fotogramas 2D). React solo participa cuando cambia la diapositiva elegida.
 *
 * Pulsar de nuevo a mitad de un viaje redirige la cámara desde donde está y con la velocidad que lleva:
 * nunca se bloquea ni da saltos. Con movimiento reducido la cámara salta directamente al destino.
 *
 * `rendererRef.current` puede ser `null` (aún cargando) o `{ update(progreso, puntero), resize?() }`.
 */
export function useCityController({ stageRef, rendererRef, targetIndex, hasPointer, prefersReducedMotion }) {
  const motionRef = useRef(createMotion(targetIndex))
  const pointerRef = useRef({ current: { x: 0, y: 0 }, target: { x: 0, y: 0 } })
  const controlsRef = useRef({ travel: () => {}, repaint: () => {} })

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined

    const motion = motionRef.current
    const pointer = pointerRef.current
    let isInView = true
    let frameId = 0
    let lastTime = 0
    let needsRender = true

    const frame = (now) => {
      frameId = 0
      const elapsed = Math.min(64, now - lastTime || 16)
      lastTime = now

      const { value, isMoving: isTraveling } = motion.sample(now)
      let isMoving = isTraveling

      const ease = 1 - Math.exp(-elapsed / POINTER_SMOOTHING_MS)
      for (const axis of ['x', 'y']) {
        const gap = pointer.target[axis] - pointer.current[axis]
        if (Math.abs(gap) > POINTER_EPSILON) {
          pointer.current[axis] += gap * ease
          isMoving = true
        } else if (gap !== 0) {
          pointer.current[axis] = pointer.target[axis]
          needsRender = true
        }
      }

      // Sin viaje en curso también se dibuja: es el fotograma de llegada, con el progreso ya en el destino
      if (isInView && (isMoving || needsRender || !isTraveling)) {
        rendererRef.current?.update(value, pointer.current)
        needsRender = false
      }
      if (isMoving) frameId = window.requestAnimationFrame(frame)
    }

    const wake = () => {
      if (frameId) return
      lastTime = performance.now()
      frameId = window.requestAnimationFrame(frame)
    }

    const travel = (index, { immediate = false } = {}) => {
      motion.retarget(index, performance.now(), { immediate })
      needsRender = true
      wake()
    }

    const handlePointerMove = (event) => {
      if (event.pointerType !== 'mouse') return
      const rect = stage.getBoundingClientRect()
      pointer.target.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.target.y = ((event.clientY - rect.top) / rect.height) * 2 - 1
      wake()
    }
    const handlePointerLeave = () => {
      pointer.target.x = 0
      pointer.target.y = 0
      wake()
    }

    const resizeObserver = new ResizeObserver(() => {
      rendererRef.current?.resize?.()
      needsRender = true
      wake()
    })
    resizeObserver.observe(stage)

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
    viewObserver.observe(stage)

    if (hasPointer) {
      stage.addEventListener('pointermove', handlePointerMove, { passive: true })
      stage.addEventListener('pointerleave', handlePointerLeave)
    }

    const repaint = () => {
      needsRender = true
      wake()
    }
    controlsRef.current = { travel, repaint }
    needsRender = true
    wake()

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      viewObserver.disconnect()
      stage.removeEventListener('pointermove', handlePointerMove)
      stage.removeEventListener('pointerleave', handlePointerLeave)
      pointer.target.x = 0
      pointer.target.y = 0
      pointer.current.x = 0
      pointer.current.y = 0
    }
  }, [stageRef, rendererRef, hasPointer])

  // Cambio de diapositiva: con movimiento reducido la cámara salta, sin recorrido intermedio
  useEffect(() => {
    controlsRef.current.travel(targetIndex, { immediate: prefersReducedMotion })
  }, [targetIndex, prefersReducedMotion])

  /** Fuerza un fotograma con el estado actual (p. ej. cuando el renderizador pasa a estar listo). */
  const repaint = useCallback(() => controlsRef.current.repaint(), [])
  return { repaint }
}
