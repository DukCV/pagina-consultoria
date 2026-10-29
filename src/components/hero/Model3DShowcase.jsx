import { useRef, useState } from 'react'
import { useGraphicsQuality, useSceneActivity } from '../../context/graphicsQuality'
import { hasRecentGlbFailure } from '../../engine3d/glbLoader'
import { useWebglModelStage } from '../../hooks/useWebglModelStage'
import ModelPoster from './ModelPoster'

// Duración del fundido del canvas sobre el render 2D (ms); coincide con `duration-300`
const REVEAL_MS = 300

/**
 * Visor de un modelo 3D con degradación progresiva a su render 2D.
 *
 * Estados (`data-render-mode`):
 *  - loading-3d:  el render 2D ocupa el espacio mientras se descarga y compila el modelo.
 *  - ready-3d:    el canvas WebGL se funde sobre el render 2D y este se oculta al terminar.
 *  - fallback-2d: nivel de calidad «static», modelo no disponible o fallo gráfico; solo se ve el render 2D.
 *
 * El espacio está reservado por las dimensiones de `className`, por lo que ninguna transición
 * desplaza el diseño. Si el 3D falla, el render 2D reaparece al instante (sin fundido).
 */
export default function Model3DShowcase({ model, className = '' }) {
  const hostRef = useRef(null)
  const { settings, reportFailure } = useGraphicsQuality()
  const { isActive } = useSceneActivity()
  // Un modelo que acaba de fallar no se vuelve a pedir durante un rato
  const [recentlyFailed] = useState(() => hasRecentGlbFailure(model.glbUrl))
  const isEnabled = settings.models3d && !recentlyFailed

  const status = useWebglModelStage({
    hostRef,
    glbUrl: model.glbUrl,
    preset: model.preset,
    enabled: isEnabled,
    isPaused: !isActive,
    settings,
    onFailure: reportFailure,
  })

  let renderMode = 'loading-3d'
  if (!isEnabled || status === 'failed') renderMode = 'fallback-2d'
  else if (status === 'ready') renderMode = 'ready-3d'

  const isLive = renderMode === 'ready-3d'
  const isFinalFallback = renderMode === 'fallback-2d'

  return (
    <div
      data-render-mode={renderMode}
      className={`relative flex items-center justify-center ${className}`}
    >
      {/* Sombra ambiental de contacto sin filtros CSS costosos por fotograma sobre el canvas WebGL */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[12%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(18,15,17,0.68)_0%,rgba(18,15,17,0.28)_48%,transparent_74%)]"
      />

      {/* Render 2D: estado de carga y alternativa final. Se oculta una vez el canvas es totalmente opaco. */}
      <div
        className="absolute inset-0 transition-opacity duration-0"
        style={{
          opacity: isLive ? 0 : 1,
          transitionDelay: isLive ? `${REVEAL_MS}ms` : '0ms',
        }}
      >
        <ModelPoster
          poster={model.poster}
          // Solo flota como alternativa definitiva; mientras carga permanece quieto para enlazar con el 3D
          className={isFinalFallback ? 'ov-anim-float' : ''}
        />
      </div>

      {/* El canvas se crea dentro de este contenedor; aparece con un fundido y desaparece sin él */}
      <div
        ref={hostRef}
        className={`pointer-events-none absolute inset-0 ${
          isLive ? 'opacity-100 transition-opacity duration-300' : 'opacity-0'
        }`}
      />
    </div>
  )
}
