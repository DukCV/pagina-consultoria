import { Suspense } from 'react'
import { SceneActivityContext, useGraphicsQuality } from '../../context/graphicsQuality'
import { detectGraphicsCapabilities } from '../../engine3d/graphicsCapabilities'
import SceneErrorBoundary from './SceneErrorBoundary'
import { SCENE_REGISTRY } from './sceneRegistry'
import { useScenePreloader } from './useScenePreloader'

// Estados de actividad estables (misma referencia) para no provocar renders innecesarios
const ACTIVE_SCENE = { isActive: true }
const EXITING_SCENE = { isActive: false }

/**
 * Marcador ligero para la carga diferida de una escena o si esta no puede cargarse.
 */
function SceneFallback() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center"
    >
      <div className="relative flex h-44 w-44 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#419D78]/18 blur-2xl" />
        <div className="h-20 w-20 rotate-45 rounded-2xl border border-[#419D78]/45 bg-[#383236]/75 backdrop-blur-md" />
      </div>
    </div>
  )
}

function renderServiceScene(sceneKey) {
  const { Component } = SCENE_REGISTRY[sceneKey] || SCENE_REGISTRY['custom-systems']
  return (
    <SceneErrorBoundary fallback={<SceneFallback />}>
      <Suspense fallback={<SceneFallback />}>
        <Component />
      </Suspense>
    </SceneErrorBoundary>
  )
}

/**
 * Escenario espacial 3D de gran formato para las especialidades de Overlayer.
 * Cada escena conserva su instancia durante la transición (clave estable por servicio): la
 * saliente no se vuelve a montar —lo que obligaría a recrear el contexto WebGL y los buffers
 * solo para animar su salida— y se pausa congelando su último fotograma.
 */
export default function HeroSceneViewport({
  services,
  activeIndex,
  prevIndex,
  direction,
  transitionId,
  isReady = true,
  prefersReducedMotion = false,
  touchHandlers,
  onInteractionChange,
}) {
  const { settings } = useGraphicsQuality()
  const { network } = detectGraphicsCapabilities()

  // El nivel de calidad ya refleja la capacidad del dispositivo: en `static` no hay modelos que anticipar
  useScenePreloader({
    services,
    activeIndex,
    isReady,
    canPrefetchModels: settings.models3d && network.tier === 'fast',
  })

  const activeService = services[activeIndex]
  const outgoingService =
    !prefersReducedMotion && prevIndex !== null ? services[prevIndex] : null

  const enterAnimClass =
    transitionId === 0 || prefersReducedMotion
      ? ''
      : direction >= 0
        ? 'ov-scene-enter-next'
        : 'ov-scene-enter-prev'

  const exitAnimClass =
    direction >= 0 ? 'ov-scene-exit-next' : 'ov-scene-exit-prev'

  // La saliente va primero para quedar detrás de la entrante
  const layers = [
    outgoingService && {
      service: outgoingService,
      activity: EXITING_SCENE,
      className: `pointer-events-none ${exitAnimClass}`,
    },
    { service: activeService, activity: ACTIVE_SCENE, className: enterAnimClass },
  ].filter(Boolean)

  return (
    <div
      onTouchStart={(e) => {
        onInteractionChange?.(true)
        touchHandlers?.onTouchStart(e)
      }}
      onTouchMove={touchHandlers?.onTouchMove}
      onTouchEnd={() => {
        touchHandlers?.onTouchEnd()
        onInteractionChange?.(false)
      }}
      onTouchCancel={() => {
        touchHandlers?.onTouchCancel()
        onInteractionChange?.(false)
      }}
      className="ov-hero-perspective relative flex h-[288px] w-full touch-pan-y items-center justify-center sm:h-[380px] lg:h-[460px] xl:h-[515px]"
    >
      {/* Gimbal maestro 3D con inclinación controlada y respuesta de paralaje multicapa */}
      <div className="ov-scene-gimbal relative h-full w-full">
        {layers.map(({ service, activity, className }) => (
          <SceneActivityContext.Provider key={service.id} value={activity}>
            <div className={`ov-preserve-3d absolute inset-0 ${className}`}>
              {renderServiceScene(service.sceneKey)}
            </div>
          </SceneActivityContext.Provider>
        ))}
      </div>
    </div>
  )
}
