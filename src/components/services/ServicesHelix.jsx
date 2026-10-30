import { useCallback, useEffect, useRef, useState } from 'react'
import { SERVICES } from '../../constants/servicesContent'
import { SERVICES_INTRO } from '../../constants/servicesIntro'
import { useGraphicsQuality } from '../../context/graphicsQuality'
import { prefetchGlbAsset } from '../../engine3d/glbLoader'
import { MODEL_ASSETS } from '../../constants/modelAssets'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useNearViewport } from '../../hooks/useNearViewport'
import { useSettledValue } from '../../hooks/useSettledValue'
import { subscribeToServiceFocus, takePendingServiceFocus } from '../../utils/serviceFocus'
import { framesToMount } from './frameSequence.js'
import HelixFrames from './HelixFrames'
import HelixLabels from './HelixLabels'
import HelixNav from './HelixNav'
import ServiceCard from './ServiceCard'
import ServicesIntro from './ServicesIntro'
import { useHelixController } from './helix3d/useHelixController'
import { useHelixRenderer } from './helix3d/useHelixRenderer'

const ANNOUNCE_DELAY_MS = 600
const SWIPE_MIN_DISTANCE = 48
// Un destino pedido se considera vigente mientras dura el desplazamiento suave hasta él
const PENDING_STEP_MS = 1400

/**
 * Recorrido por los seis servicios sobre una doble hélice 3D. Este componente solo une las piezas:
 *  - useHelixController: scroll → progreso suavizado → `rendererRef.current.update()` en cada fotograma.
 *  - useHelixRenderer:   escena WebGL (o fotogramas 2D de respaldo) y su ciclo de vida.
 *  - ServiceCard / HelixNav / HelixLabels: texto, navegación y etiquetas en el DOM, accesibles y nítidos.
 * React solo conoce el servicio activo; todo lo continuo ocurre fuera del ciclo de render.
 */
export default function ServicesHelix({ mode, prefersReducedMotion }) {
  const { level, settings, capabilities } = useGraphicsQuality()
  const hasFinePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const isTouch = useMediaQuery('(pointer: coarse)')

  const trackRef = useRef(null)
  const pinRef = useRef(null)
  const stageRef = useRef(null)
  const rendererRef = useRef(null)
  const labelRefs = useRef([])
  const layerRefs = useRef([])
  const swipeStartRef = useRef(null)

  const [activeIndex, setActiveIndex] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)
  const announcedIndex = useSettledValue(activeIndex, ANNOUNCE_DELAY_MS)

  const handleIndexChange = useCallback((index) => {
    setActiveIndex(index)
    if (index !== 0) setHasMoved(true)
  }, [])

  const hasPointer = hasFinePointer && level === 'full' && !prefersReducedMotion
  const { goToStep: scrollToStep, repaint } = useHelixController({
    mode,
    hasPointer,
    prefersReducedMotion,
    trackRef,
    pinRef,
    rendererRef,
    onIndexChange: handleIndexChange,
  })

  // Destino pedido más reciente: dos pulsaciones seguidas de «siguiente» avanzan dos servicios aunque el
  // activo (que cambia al pasar la mitad del recorrido) aún no se haya actualizado. Devuelve el destino.
  const requestedRef = useRef({ index: 0, at: 0 })
  const activeIndexRef = useRef(0)
  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])
  const goToStep = useCallback(
    (index) => {
      const target = Math.min(SERVICES.length - 1, Math.max(0, index))
      requestedRef.current = { index: target, at: performance.now() }
      scrollToStep(target)
      return target
    },
    [scrollToStep],
  )
  const stepBy = useCallback(
    (delta) => {
      const isPending = performance.now() - requestedRef.current.at < PENDING_STEP_MS
      return goToStep((isPending ? requestedRef.current.index : activeIndexRef.current) + delta)
    },
    [goToStep],
  )

  // La escena 3D existe solo con la sección cerca de la pantalla: al alejarse se libera la GPU
  const isNear = useNearViewport(trackRef)
  const { renderMode } = useHelixRenderer({
    stageRef,
    rendererRef,
    labelRefs,
    layerRefs,
    isEnabled: isNear,
    onRendererChange: repaint,
  })

  // En reposo se anticipa la descarga de los dos modelos (comparten caché con el hero) para que el 3D
  // esté listo en cuanto el usuario baje
  const canPrefetch = settings.models3d && capabilities?.network?.tier === 'fast'
  useEffect(() => {
    if (!canPrefetch) return undefined
    const run = () => [MODEL_ASSETS.quest3, MODEL_ASSETS.aiCharacter].forEach((model) => prefetchGlbAsset(model.glbUrl))
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(run, 1500)
    return () => window.clearTimeout(id)
  }, [canPrefetch])

  // «Saber más» del hero: lleva la hélice al servicio pedido (también si se pidió antes de montarse)
  useEffect(() => {
    const focusService = (serviceId) => {
      const index = SERVICES.findIndex((service) => service.id === serviceId)
      if (index < 0) return false
      // En modo manual la sección no se fija: hay que traerla a la vista además de seleccionar el servicio
      if (mode === 'manual') {
        trackRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
      }
      goToStep(index)
      return true
    }

    const pendingId = takePendingServiceFocus()
    if (pendingId) focusService(pendingId)
    return subscribeToServiceFocus(focusService)
  }, [goToStep, mode, prefersReducedMotion])

  // Gesto táctil horizontal: pasa al servicio siguiente o anterior (el vertical sigue siendo scroll)
  const handleSwipeStart = (event) => {
    swipeStartRef.current = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY }
  }
  const handleSwipeEnd = (event) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return
    stepBy(dx < 0 ? 1 : -1)
  }

  const announced = SERVICES[announcedIndex]
  const announcement = hasMoved ? `Servicio ${announced.index} de ${SERVICES.length}: ${announced.title}.` : ''
  // Con el 3D listo se conserva solo el fotograma activo (oculto): sirve de base al fundido y de respaldo inmediato
  const mountedSteps = renderMode === 'ready-3d' ? [activeIndex] : framesToMount(activeIndex)

  return (
    <div ref={trackRef} className="ov-svc-track">
      <div ref={pinRef} className="ov-svc-pin">
        <div
          ref={stageRef}
          data-render-mode={renderMode}
          className="ov-svc-stage"
          onPointerDown={handleSwipeStart}
          onPointerUp={handleSwipeEnd}
          onPointerCancel={() => (swipeStartRef.current = null)}
        >
          <HelixFrames mountedSteps={mountedSteps} layerRefs={layerRefs} isVisible={renderMode !== 'ready-3d'} />
        </div>
        <div aria-hidden="true" className="ov-svc-scrim" />

        <div className="ov-svc-ui">
          <div className="ov-svc-ui__inner">
            <ServicesIntro />
            <ServiceCard service={SERVICES[activeIndex]} />
            <div className="ov-svc-controls">
              <p className="ov-svc-hint" data-hidden={mode !== 'scroll' || hasMoved ? 'true' : 'false'}>
                <span aria-hidden="true" className="ov-svc-hint__rail" />
                {isTouch ? SERVICES_INTRO.hintTouch : SERVICES_INTRO.hint}
              </p>
              <HelixNav services={SERVICES} activeIndex={activeIndex} onSelect={goToStep} onStep={stepBy} />
            </div>
          </div>
          <HelixLabels services={SERVICES} activeIndex={activeIndex} labelRefs={labelRefs} onSelect={goToStep} />
        </div>

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </div>
    </div>
  )
}
