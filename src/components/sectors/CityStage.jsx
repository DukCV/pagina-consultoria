import { useRef } from 'react'
import { useGraphicsQuality } from '../../context/graphicsQuality'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useNearViewport } from '../../hooks/useNearViewport'
import { useCityController } from './city3d/useCityController'
import { useCityRenderer } from './city3d/useCityRenderer'
import CityFrames from './CityFrames'
import { WIDE_QUERY, framesToMount } from './frameSequence.js'

const SWIPE_MIN_DISTANCE = 48

/**
 * Escenario de la ciudad. Este componente solo une las piezas:
 *  - useCityController: diapositiva elegida → viaje suave de la cámara → `rendererRef.current.update()`.
 *  - useCityRenderer:   escena WebGL (o fotogramas 2D de respaldo) y su ciclo de vida.
 *  - CityFrames:        alternativa 2D de las cinco paradas.
 * El 3D existe solo con el escenario cerca de la pantalla; al alejarse se libera la GPU. Un gesto táctil
 * horizontal sobre la ciudad pasa a la diapositiva anterior o siguiente (`onStep`).
 */
export default function CityStage({ targetIndex, onStep, prefersReducedMotion }) {
  const { level } = useGraphicsQuality()
  const hasFinePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const isWide = useMediaQuery(WIDE_QUERY)

  const stageRef = useRef(null)
  const rendererRef = useRef(null)
  const layerRefs = useRef([])
  const swipeStartRef = useRef(null)

  const hasPointer = hasFinePointer && level === 'full' && !prefersReducedMotion
  const { repaint } = useCityController({ stageRef, rendererRef, targetIndex, hasPointer, prefersReducedMotion })
  const isNear = useNearViewport(stageRef)
  const { renderMode } = useCityRenderer({ stageRef, rendererRef, layerRefs, isEnabled: isNear, onRendererChange: repaint })

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
    onStep(dx < 0 ? 1 : -1)
  }

  // Con el 3D listo se conserva solo el fotograma de la parada (oculto): sirve de base al fundido y de respaldo inmediato
  const mountedSteps = renderMode === 'ready-3d' ? [targetIndex] : framesToMount(targetIndex)

  return (
    <div
      ref={stageRef}
      data-render-mode={renderMode}
      className="ov-city-stage"
      onPointerDown={handleSwipeStart}
      onPointerUp={handleSwipeEnd}
      onPointerCancel={() => (swipeStartRef.current = null)}
    >
      <CityFrames
        variant={isWide ? 'wide' : 'square'}
        mountedSteps={mountedSteps}
        layerRefs={layerRefs}
        isVisible={renderMode !== 'ready-3d'}
      />
    </div>
  )
}
