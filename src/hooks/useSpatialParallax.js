import { useCallback, useEffect, useRef, useState } from 'react'
import { HERO_SLIDER_CONFIG } from '../constants/heroServicesData'

const clamp = (val, min, max) => Math.max(min, Math.min(max, val))

/**
 * Motor físico 3D sin re-renders para paralaje multicapa en todo el Hero Section,
 * reflejos especulares, gestos táctiles (swipe + exploración) y giroscopio opcional.
 */
export function useSpatialParallax({
  containerRef,
  disabled = false,
  onSwipeNext,
  onSwipePrev,
}) {
  const [motionSensorState, setMotionSensorState] = useState(() => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      return 'unsupported'
    }
    const isCoarsePointer =
      window.matchMedia?.('(pointer: coarse)').matches ?? false
    if (!isCoarsePointer) {
      return 'unsupported'
    }
    if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
      return 'prompt'
    }
    return 'available'
  })

  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const rafIdRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const gyroBaselineRef = useRef(null)
  const touchStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    swiped: false,
  })

  const callbacksRef = useRef({ onSwipeNext, onSwipePrev })
  useEffect(() => {
    callbacksRef.current = { onSwipeNext, onSwipePrev }
  }, [onSwipeNext, onSwipePrev])

  const writeCssVars = useCallback(
    (rx, ry) => {
      const el = containerRef.current
      if (!el) return
      const spotX = 52 + rx * 32
      const spotY = 44 + ry * 28
      el.style.setProperty('--ov-rx', rx.toFixed(4))
      el.style.setProperty('--ov-ry', ry.toFixed(4))
      el.style.setProperty('--ov-spot-x', `${spotX.toFixed(1)}%`)
      el.style.setProperty('--ov-spot-y', `${spotY.toFixed(1)}%`)
    },
    [containerRef],
  )

  const wakePhysicsLoop = useCallback(() => {
    if (disabled || isAnimatingRef.current) return
    isAnimatingRef.current = true

    const smoothing = HERO_SLIDER_CONFIG.parallaxSmoothing

    const step = () => {
      const cur = currentRef.current
      const tgt = targetRef.current

      cur.x += (tgt.x - cur.x) * smoothing
      cur.y += (tgt.y - cur.y) * smoothing

      writeCssVars(cur.x, cur.y)

      const settled =
        Math.abs(tgt.x - cur.x) < 0.0007 && Math.abs(tgt.y - cur.y) < 0.0007

      if (settled) {
        if (tgt.x === 0 && tgt.y === 0) {
          cur.x = 0
          cur.y = 0
          writeCssVars(0, 0)
        }
        isAnimatingRef.current = false
        rafIdRef.current = 0
        return
      }

      rafIdRef.current = window.requestAnimationFrame(step)
    }

    rafIdRef.current = window.requestAnimationFrame(step)
  }, [disabled, writeCssVars])

  useEffect(() => {
    if (disabled) {
      if (rafIdRef.current) window.cancelAnimationFrame(rafIdRef.current)
      isAnimatingRef.current = false
      targetRef.current = { x: 0, y: 0 }
      currentRef.current = { x: 0, y: 0 }
      writeCssVars(0, 0)
    }
    return () => {
      if (rafIdRef.current) window.cancelAnimationFrame(rafIdRef.current)
      isAnimatingRef.current = false
    }
  }, [disabled, writeCssVars])

  // Seguimiento suave del cursor sobre todo el Hero Section en escritorio
  const handlePointerMove = useCallback(
    (event) => {
      if (disabled || event.pointerType === 'touch') return
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1

      targetRef.current.x = clamp(nx, -1, 1)
      targetRef.current.y = clamp(ny, -1, 1)
      wakePhysicsLoop()
    },
    [disabled, containerRef, wakePhysicsLoop],
  )

  const handlePointerLeave = useCallback(() => {
    targetRef.current.x = 0
    targetRef.current.y = 0
    wakePhysicsLoop()
  }, [wakePhysicsLoop])

  // Gestos táctiles horizontales (cambio de diapositiva) y exploración suave en móviles
  const handleTouchStart = useCallback((event) => {
    const touch = event.touches[0]
    if (!touch) return
    touchStateRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      swiped: false,
    }
  }, [])

  const handleTouchMove = useCallback(
    (event) => {
      const state = touchStateRef.current
      const touch = event.touches[0]
      if (!state.active || !touch) return

      const dx = touch.clientX - state.startX
      const dy = touch.clientY - state.startY

      if (
        !state.swiped &&
        Math.abs(dx) >= HERO_SLIDER_CONFIG.swipeThresholdPx &&
        Math.abs(dx) > Math.abs(dy) * 1.35
      ) {
        state.swiped = true
        if (dx < 0) {
          callbacksRef.current.onSwipeNext?.()
        } else {
          callbacksRef.current.onSwipePrev?.()
        }
      }

      if (!disabled) {
        const w = containerRef.current?.clientWidth || 360
        const h = containerRef.current?.clientHeight || 360
        targetRef.current.x = clamp((dx / (w * 0.45)) * 0.55, -0.55, 0.55)
        targetRef.current.y = clamp((dy / (h * 0.45)) * 0.4, -0.42, 0.42)
        wakePhysicsLoop()
      }
    },
    [disabled, containerRef, wakePhysicsLoop],
  )

  const handleTouchEnd = useCallback(() => {
    touchStateRef.current.active = false
    if (!disabled && motionSensorState !== 'active') {
      targetRef.current.x = 0
      targetRef.current.y = 0
      wakePhysicsLoop()
    }
  }, [disabled, motionSensorState, wakePhysicsLoop])

  // Orientación móvil controlada y respetuosa con batería y permisos
  useEffect(() => {
    if (
      disabled ||
      (motionSensorState !== 'available' && motionSensorState !== 'active')
    ) {
      return undefined
    }

    const isCoarsePointer =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(pointer: coarse)').matches
    if (!isCoarsePointer && motionSensorState === 'available') {
      return undefined
    }

    const handleOrientation = (event) => {
      if (document.hidden || touchStateRef.current.active) return
      const { gamma, beta } = event
      if (gamma === null || beta === null) return

      if (!gyroBaselineRef.current) {
        gyroBaselineRef.current = { gamma, beta }
        if (motionSensorState === 'available') {
          setMotionSensorState('active')
        }
      }

      const dGamma = gamma - gyroBaselineRef.current.gamma
      const dBeta = beta - gyroBaselineRef.current.beta

      targetRef.current.x = clamp(dGamma / 25, -0.46, 0.46)
      targetRef.current.y = clamp(dBeta / 25, -0.4, 0.4)
      wakePhysicsLoop()
    }

    const handleVisibility = () => {
      if (document.hidden) {
        gyroBaselineRef.current = null
        targetRef.current = { x: 0, y: 0 }
        wakePhysicsLoop()
      }
    }

    window.addEventListener('deviceorientation', handleOrientation, {
      passive: true,
    })
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [disabled, motionSensorState, wakePhysicsLoop])

  const requestMotionSensor = useCallback(async () => {
    if (disabled || typeof window === 'undefined') return
    const DOE = window.DeviceOrientationEvent
    if (!DOE) return

    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission()
        if (result === 'granted') {
          gyroBaselineRef.current = null
          setMotionSensorState('active')
        } else {
          setMotionSensorState('denied')
        }
      } catch {
        setMotionSensorState('denied')
      }
    } else {
      gyroBaselineRef.current = null
      setMotionSensorState('active')
    }
  }, [disabled])

  return {
    motionSensorState,
    requestMotionSensor,
    pointerHandlers: {
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
    },
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  }
}
