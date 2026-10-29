import { useCallback, useEffect, useState } from 'react'
import { LOCKUP_VIEWBOX_BOUNDS, STAGE_VIEWBOX } from '../assets/overlayerGeometry'
import { TRANSITION_TIMINGS } from '../constants/brandTheme'

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const lerp = (a, b, t) => a + (b - a) * t
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/**
 * Evaluador exacto de curvas cubic-bezier(x1, y1, x2, y2) mediante Newton-Raphson
 * para trayectorias cinematográficas C∞ continuas.
 */
function createCubicBezier(x1, y1, x2, y2) {
  const sampleCurveX = (t) =>
    ((1 - 3 * x2 + 3 * x1) * t * t + (3 * x2 - 6 * x1) * t + 3 * x1) * t
  const sampleCurveY = (t) =>
    ((1 - 3 * y2 + 3 * y1) * t * t + (3 * y2 - 6 * y1) * t + 3 * y1) * t
  const sampleDerivativeX = (t) =>
    (3 * (1 - 3 * x2 + 3 * x1) * t + 2 * (3 * x2 - 6 * x1)) * t + 3 * x1

  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 6; i++) {
      const dx = sampleCurveX(t) - x
      if (Math.abs(dx) < 1e-6) break
      const d = sampleDerivativeX(t)
      if (Math.abs(d) < 1e-6) break
      t -= dx / d
    }
    return sampleCurveY(clamp01(t))
  }
}

// Curvas ligeramente desfasadas entre X e Y para describir un arco natural y orgánico
const easeFlightX = createCubicBezier(0.64, 0.0, 0.14, 1.0)
const easeFlightY = createCubicBezier(0.48, 0.0, 0.12, 1.0)
const easeFlightScale = createCubicBezier(0.58, 0.0, 0.14, 1.0)

const TRANSFORM_ORIGIN = `${((LOCKUP_VIEWBOX_BOUNDS.x / STAGE_VIEWBOX.width) * 100).toFixed(4)}% ${((LOCKUP_VIEWBOX_BOUNDS.y / STAGE_VIEWBOX.height) * 100).toFixed(4)}%`

const INITIAL_EXIT_STATE = {
  isActive: false,
  backdropOpacity: 1,
  secondaryOpacity: 1,
  parallaxDamping: 1,
  logoTransform: 'translate3d(0px, 0px, 0) scale(1)',
  logoTransformOrigin: TRANSFORM_ORIGIN,
  flightSheen: -1,
  splashLogoOpacity: 1,
}

/**
 * Coordina el ciclo de vida completo entre la pantalla de bienvenida y el header principal:
 * Fase 1 (welcome) -> Espera de lectura y verificación de fuentes/DOM ->
 * Fases 2 y 3 (transitioning: fade-out + vuelo FLIP compartido del logotipo) ->
 * Fase 4 (complete: revelado escalonado e interactividad completa del header).
 */
export function useWelcomeToHeaderTransition({
  splashLogoAnchorRef,
  headerLogoRef,
  prefersReducedMotion,
}) {
  const [phase, setPhase] = useState('welcome') // 'welcome' | 'transitioning' | 'complete'
  const [welcomeSettled, setWelcomeSettled] = useState(false)
  const [exitState, setExitState] = useState(INITIAL_EXIT_STATE)
  const [isHeaderLogoVisible, setIsHeaderLogoVisible] = useState(false)
  const [isHeaderRevealed, setIsHeaderRevealed] = useState(false)

  const handleWelcomeSettled = useCallback(() => {
    setWelcomeSettled(true)
  }, [])

  // Fase 1 -> Fase 2: Espera deliberada + validación de disponibilidad visual y tipográfica
  useEffect(() => {
    if (!welcomeSettled || phase !== 'welcome') return undefined

    let cancelled = false
    let holdTimerId = 0
    let readinessRafId = 0

    const holdMs = prefersReducedMotion
      ? TRANSITION_TIMINGS.reducedHoldMs
      : TRANSITION_TIMINGS.holdAfterSettledMs

    const fontsReadyPromise =
      typeof document !== 'undefined' && document.fonts?.ready
        ? Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 600)),
          ])
        : Promise.resolve()

    const waitHoldPromise = new Promise((resolve) => {
      holdTimerId = window.setTimeout(resolve, holdMs)
    })

    Promise.all([waitHoldPromise, fontsReadyPromise]).then(() => {
      if (cancelled) return

      const verifyTargetsReady = () => {
        if (cancelled) return
        const srcRect = splashLogoAnchorRef.current?.getBoundingClientRect()
        const dstRect = headerLogoRef.current?.getBoundingClientRect()

        if (
          srcRect &&
          dstRect &&
          srcRect.width > 0 &&
          dstRect.width > 0
        ) {
          setPhase('transitioning')
        } else {
          readinessRafId = requestAnimationFrame(verifyTargetsReady)
        }
      }

      verifyTargetsReady()
    })

    return () => {
      cancelled = true
      window.clearTimeout(holdTimerId)
      cancelAnimationFrame(readinessRafId)
    }
  }, [welcomeSettled, phase, prefersReducedMotion, splashLogoAnchorRef, headerLogoRef])

  // Fases 2, 3 y 4: Ejecución sincronizada de salida, transformación del logo y aparición del header
  useEffect(() => {
    if (phase !== 'transitioning') return undefined

    let rafId = 0
    let startTime = null

    if (prefersReducedMotion) {
      // Secuencia breve, accesible y sin desplazamientos espaciales bruscos
      let headerShown = false

      const tickReduced = (now) => {
        if (startTime === null) startTime = now
        const elapsed = Math.max(0, now - startTime)
        const p = clamp01(elapsed / TRANSITION_TIMINGS.reducedFadeMs)
        const fade = 1 - easeOutCubic(p)

        if (!headerShown) {
          headerShown = true
          setIsHeaderLogoVisible(true)
          setIsHeaderRevealed(true)
        }

        setExitState({
          isActive: true,
          backdropOpacity: fade,
          secondaryOpacity: fade,
          parallaxDamping: 0,
          logoTransform: 'translate3d(0px, 0px, 0) scale(1)',
          logoTransformOrigin: TRANSFORM_ORIGIN,
          flightSheen: -1,
          splashLogoOpacity: fade,
        })

        if (p < 1) {
          rafId = requestAnimationFrame(tickReduced)
        } else {
          setPhase('complete')
        }
      }

      rafId = requestAnimationFrame(tickReduced)
      return () => cancelAnimationFrame(rafId)
    }

    let dockedCommitted = false
    let headerRevealCommitted = false

    const tickCinematic = (now) => {
      if (startTime === null) startTime = now
      const elapsedMs = Math.max(0, now - startTime)
      const flightP = clamp01(elapsedMs / TRANSITION_TIMINGS.flightDurationMs)
      const totalP = clamp01(elapsedMs / TRANSITION_TIMINGS.totalTransitionMs)

      // Elementos secundarios desaparecen primero para otorgar protagonismo absoluto al logo
      const secondaryOpacity = 1 - easeOutCubic(clamp01(elapsedMs / 440))
      // El fondo de bienvenida se disuelve progresivamente revelando el lienzo principal
      const backdropOpacity = 1 - easeInOutCubic(clamp01((elapsedMs - 90) / 860))
      // Amortiguación suave de cualquier inclinación 3D residual del cursor
      const parallaxDamping = 1 - easeOutCubic(clamp01(elapsedMs / 280))

      // Cálculo FLIP sub-píxel en vivo entre el lockup de bienvenida y el slot del header
      let logoTransform = 'translate3d(0px, 0px, 0) scale(1)'
      const srcSvgRect = splashLogoAnchorRef.current?.getBoundingClientRect()
      const dstLogoRect = headerLogoRef.current?.getBoundingClientRect()

      if (srcSvgRect && dstLogoRect && srcSvgRect.width > 0) {
        const srcLockupLeft =
          srcSvgRect.left +
          (LOCKUP_VIEWBOX_BOUNDS.x / STAGE_VIEWBOX.width) * srcSvgRect.width
        const srcLockupTop =
          srcSvgRect.top +
          (LOCKUP_VIEWBOX_BOUNDS.y / STAGE_VIEWBOX.height) * srcSvgRect.height
        const srcLockupWidth =
          (LOCKUP_VIEWBOX_BOUNDS.width / STAGE_VIEWBOX.width) * srcSvgRect.width

        const targetScale = dstLogoRect.width / srcLockupWidth
        const deltaX = dstLogoRect.left - srcLockupLeft
        const deltaY = dstLogoRect.top - srcLockupTop

        const curX = deltaX * easeFlightX(flightP)
        const curY = deltaY * easeFlightY(flightP)
        const curScale = lerp(1, targetScale, easeFlightScale(flightP))

        logoTransform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0) scale(${curScale.toFixed(5)})`
      }

      // Destello sutil de seda que recorre el logotipo durante su desplazamiento
      let flightSheen = -1
      if (flightP >= 0.16 && flightP <= 0.84) {
        flightSheen = easeInOutCubic((flightP - 0.16) / 0.68)
      }

      // Fase 4: Revelado progresivo del header a medida que el logotipo se aproxima a su destino
      if (!headerRevealCommitted && elapsedMs >= TRANSITION_TIMINGS.headerRevealOffsetMs) {
        headerRevealCommitted = true
        setIsHeaderRevealed(true)
      }

      // Relevo exacto sin duplicación ni parpadeo cuando el logotipo alcanza el 100% de su destino
      const hasDocked = flightP >= 0.999
      if (hasDocked && !dockedCommitted) {
        dockedCommitted = true
        setIsHeaderLogoVisible(true)
      }

      setExitState({
        isActive: true,
        backdropOpacity,
        secondaryOpacity,
        parallaxDamping,
        logoTransform,
        logoTransformOrigin: TRANSFORM_ORIGIN,
        flightSheen,
        splashLogoOpacity: hasDocked ? 0 : 1,
      })

      if (totalP < 1) {
        rafId = requestAnimationFrame(tickCinematic)
      } else {
        setIsHeaderLogoVisible(true)
        setIsHeaderRevealed(true)
        setPhase('complete')
      }
    }

    rafId = requestAnimationFrame(tickCinematic)
    return () => cancelAnimationFrame(rafId)
  }, [phase, prefersReducedMotion, splashLogoAnchorRef, headerLogoRef])

  return {
    phase,
    exitState,
    isHeaderLogoVisible: phase === 'complete' || isHeaderLogoVisible,
    isHeaderRevealed: phase === 'complete' || isHeaderRevealed,
    isHeaderInteractive: phase === 'complete' || isHeaderRevealed,
    handleWelcomeSettled,
  }
}
