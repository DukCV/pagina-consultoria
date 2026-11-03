import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { SLIDES } from '../../constants/sectorsContent'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useSettledValue } from '../../hooks/useSettledValue'
import { SWAP_FRACTION, durationFor } from './city3d/cityMotion.js'
import SectorsIntro, { SectorsLead } from './SectorsIntro'
import SlidePanel from './SlidePanel'

// El escenario (stage WebGL, ciudad, fotogramas y su lógica) viaja en su propio fragmento
const CityStage = lazy(() => import('./CityStage'))

// Con ventana amplia y alta caben los párrafos de presentación junto al título; si no, van bajo la pantalla
const LEAD_FITS_QUERY = '(min-width: 1024px) and (min-height: 800px)'
const ANNOUNCE_DELAY_MS = 700
// Duración de la entrada del texto nuevo antes de volver a reposo
const ENTER_MS = 520

/** Marcador de posición con las mismas dimensiones que el escenario: no hay saltos al cargarlo. */
function StageSkeleton() {
  return (
    <div aria-hidden="true" className="ov-city-stage">
      <span className="ov-city-skeleton__glow" />
    </div>
  )
}

/**
 * Slider de sectores: contenido arriba y ciudad 3D debajo. El estado de React es solo el destino pedido
 * (`targetIndex`, que mueve la cámara y los indicadores al instante) y el texto visible (`shownIndex`), que
 * sale al empezar el viaje y entra al `SWAP_FRACTION` del recorrido, cuando la cámara casi ha llegado.
 * Los temporizadores usan la misma duración que el viaje de la cámara (`durationFor`), así que el texto
 * y la ciudad van sincronizados aunque el escenario 3D aún no haya cargado. Pulsar de nuevo a mitad de
 * camino redirige ambos sin esperar.
 */
export default function SectorsSlider({ isReady, prefersReducedMotion }) {
  const [targetIndex, setTargetIndex] = useState(0)
  const [shownIndex, setShownIndex] = useState(0)
  const [phase, setPhase] = useState('idle')
  const [hasMoved, setHasMoved] = useState(false)
  const leadFits = useMediaQuery(LEAD_FITS_QUERY)
  const announcedIndex = useSettledValue(shownIndex, ANNOUNCE_DELAY_MS)

  const requestedRef = useRef(0)
  const timersRef = useRef({ swap: 0, settle: 0 })

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      window.clearTimeout(timers.swap)
      window.clearTimeout(timers.settle)
    }
  }, [])

  const goTo = useCallback(
    (index) => {
      const next = Math.min(SLIDES.length - 1, Math.max(0, index))
      if (next === requestedRef.current) return next
      const steps = Math.abs(next - requestedRef.current)
      requestedRef.current = next
      setTargetIndex(next)
      setHasMoved(true)

      const timers = timersRef.current
      window.clearTimeout(timers.swap)
      window.clearTimeout(timers.settle)
      if (prefersReducedMotion) {
        setShownIndex(next)
        setPhase('idle')
        return next
      }
      setPhase('leaving')
      timers.swap = window.setTimeout(() => {
        setShownIndex(next)
        setPhase('entering')
        timers.settle = window.setTimeout(() => setPhase('idle'), ENTER_MS)
      }, durationFor(steps) * SWAP_FRACTION)
      return next
    },
    [prefersReducedMotion],
  )
  const stepBy = useCallback((delta) => goTo(requestedRef.current + delta), [goTo])

  const announced = SLIDES[announcedIndex]
  const announcement = hasMoved ? `Sector ${announcedIndex + 1} de ${SLIDES.length}: ${announced.title}. ${announced.description}` : ''

  return (
    <div className="ov-sec-explorer">
      {/* Pantalla completa bajo el header: la ciudad a sangre y, encima, el título y el panel de la diapositiva */}
      <div className="ov-sec-viewport">
        <div className="ov-city">
          {isReady ? (
            <Suspense fallback={<StageSkeleton />}>
              <CityStage targetIndex={targetIndex} onStep={stepBy} prefersReducedMotion={prefersReducedMotion} />
            </Suspense>
          ) : (
            <StageSkeleton />
          )}
        </div>
        <div aria-hidden="true" className="ov-sec-scrim" />
        <div className="ov-sec-ui">
          <SectorsIntro showLead={leadFits} />
          <SlidePanel
            slides={SLIDES}
            targetIndex={targetIndex}
            shownIndex={shownIndex}
            phase={phase}
            onSelect={goTo}
            onStep={stepBy}
          />
        </div>
      </div>

      {!leadFits && (
        <div className="ov-sec-wrap ov-sec-lead">
          <SectorsLead />
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  )
}
