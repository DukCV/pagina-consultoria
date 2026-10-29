import { useCallback, useEffect, useRef, useState } from 'react'
import { HERO_SLIDER_CONFIG } from '../constants/heroServicesData'

/**
 * Gestiona el estado del slider de servicios, transiciones direccionales,
 * reproducción automática pausable y actualización fluida del indicador de progreso
 * sin provocar re-renders por fotograma.
 */
export function useHeroSlider({
  totalSlides,
  isReady = true,
  prefersReducedMotion = false,
}) {
  const [slideState, setSlideState] = useState({
    activeIndex: 0,
    prevIndex: null,
    direction: 1, // 1: avance, -1: retroceso
    transitionId: 0,
  })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isManuallyPaused, setIsManuallyPaused] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [announcePolite, setAnnouncePolite] = useState(false)

  const progressBarRef = useRef(null)
  const transitionTimerRef = useRef(0)
  const accumulatedMsRef = useRef(0)

  const setProgressScale = useCallback((ratio) => {
    if (progressBarRef.current) {
      const clamped = Math.max(0, Math.min(1, ratio))
      progressBarRef.current.style.transform = `scaleX(${clamped.toFixed(4)})`
    }
  }, [])

  const commitSlideChange = useCallback(
    (nextIndex, forcedDirection, fromUser = true) => {
      setSlideState((prev) => {
        const normalized = ((nextIndex % totalSlides) + totalSlides) % totalSlides
        if (normalized === prev.activeIndex) return prev

        let dir = forcedDirection
        if (!dir) {
          dir = normalized > prev.activeIndex ? 1 : -1
        }

        accumulatedMsRef.current = 0
        setProgressScale(0)
        setAnnouncePolite(fromUser)
        setIsTransitioning(true)

        window.clearTimeout(transitionTimerRef.current)
        transitionTimerRef.current = window.setTimeout(() => {
          setIsTransitioning(false)
        }, HERO_SLIDER_CONFIG.transitionDurationMs)

        return {
          activeIndex: normalized,
          prevIndex: prev.activeIndex,
          direction: dir,
          transitionId: prev.transitionId + 1,
        }
      })
    },
    [totalSlides, setProgressScale],
  )

  const goToSlide = useCallback(
    (index) => commitSlideChange(index, undefined, true),
    [commitSlideChange],
  )

  const goNext = useCallback(
    () => commitSlideChange(slideState.activeIndex + 1, 1, true),
    [commitSlideChange, slideState.activeIndex],
  )

  const goPrev = useCallback(
    () => commitSlideChange(slideState.activeIndex - 1, -1, true),
    [commitSlideChange, slideState.activeIndex],
  )

  const toggleManualPause = useCallback(() => {
    setIsManuallyPaused((paused) => !paused)
  }, [])

  useEffect(() => {
    return () => window.clearTimeout(transitionTimerRef.current)
  }, [])

  const isAutoplayActive =
    isReady && !prefersReducedMotion && !isManuallyPaused && !isInteracting

  // Reloj de reproducción automática con conservación de progreso al pausar por lectura
  useEffect(() => {
    if (!isAutoplayActive) {
      if (prefersReducedMotion || isManuallyPaused) {
        setProgressScale(1)
      }
      return undefined
    }

    let rafId = 0
    let lastTimestamp = null

    const tick = (now) => {
      if (document.hidden) {
        lastTimestamp = null
        rafId = window.requestAnimationFrame(tick)
        return
      }

      if (lastTimestamp === null) {
        lastTimestamp = now
      } else {
        const delta = Math.min(64, Math.max(0, now - lastTimestamp))
        lastTimestamp = now
        accumulatedMsRef.current += delta
      }

      const ratio =
        accumulatedMsRef.current / HERO_SLIDER_CONFIG.autoplayIntervalMs
      setProgressScale(ratio)

      if (accumulatedMsRef.current >= HERO_SLIDER_CONFIG.autoplayIntervalMs) {
        accumulatedMsRef.current = 0
        commitSlideChange(slideState.activeIndex + 1, 1, false)
        return
      }

      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(rafId)
  }, [
    isAutoplayActive,
    prefersReducedMotion,
    isManuallyPaused,
    slideState.activeIndex,
    commitSlideChange,
    setProgressScale,
  ])

  return {
    activeIndex: slideState.activeIndex,
    prevIndex: isTransitioning ? slideState.prevIndex : null,
    direction: slideState.direction,
    transitionId: slideState.transitionId,
    isTransitioning,
    isManuallyPaused,
    isAutoplayActive,
    announcePolite,
    progressBarRef,
    goToSlide,
    goNext,
    goPrev,
    toggleManualPause,
    setIsInteracting,
  }
}
