import { DISTRICT_COUNT } from './city3d/cityRig.js'
import { FRAME_VARIANTS, frameSrc, frameSrcSet } from './frameSequence.js'

/**
 * Capa de fotogramas pre-renderizados de la ciudad. Hace de alternativa 2D (nivel `static`, fallo del 3D,
 * movimiento reducido) y de «render previo» mientras la escena 3D compila. Solo se montan las imágenes de
 * `mountedSteps`; el renderizador escribe opacidad y transformación de cada capa (`layerRefs`).
 * `variant`: juego de fotogramas según la proporción de la escena (`wide` o `square`).
 */
export default function CityFrames({ variant, mountedSteps, layerRefs, isVisible }) {
  const { widths } = FRAME_VARIANTS[variant]
  return (
    <div aria-hidden="true" className="ov-city-frames" data-visible={isVisible ? 'true' : 'false'}>
      {Array.from({ length: DISTRICT_COUNT }, (_, step) => (
        <div
          key={step}
          ref={(element) => {
            layerRefs.current[step] = element
          }}
          className="ov-city-frames__layer"
        >
          {mountedSteps.includes(step) && (
            <img
              src={frameSrc(variant, step, widths.at(-1))}
              srcSet={frameSrcSet(variant, step)}
              sizes="100vw"
              alt=""
              decoding="async"
              fetchPriority={isVisible ? 'auto' : 'low'}
              draggable={false}
              className="ov-city-frames__image"
            />
          )}
        </div>
      ))}
    </div>
  )
}
