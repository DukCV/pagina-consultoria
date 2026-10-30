import { SERVICE_COUNT } from './helix3d/helixRig.js'
import { frameSrc, frameSrcSet } from './frameSequence.js'

/**
 * Capa de fotogramas pre-renderizados de la hélice. Hace de alternativa 2D (nivel `static`, fallo del
 * 3D, movimiento reducido) y de «render previo» mientras la escena 3D compila, con el mismo patrón que
 * `Model3DShowcase`. Solo se montan las imágenes de `mountedSteps`; el controlador escribe opacidad y
 * transformación de cada capa (`layerRefs`) en cada fotograma.
 */
export default function HelixFrames({ mountedSteps, layerRefs, isVisible }) {
  return (
    <div aria-hidden="true" className="ov-svc-frames" data-visible={isVisible ? 'true' : 'false'}>
      {Array.from({ length: SERVICE_COUNT }, (_, step) => (
        <div
          key={step}
          ref={(element) => {
            layerRefs.current[step] = element
          }}
          className="ov-svc-frames__layer"
        >
          {mountedSteps.includes(step) && (
            <img
              src={frameSrc(step, 1100)}
              srcSet={frameSrcSet(step)}
              sizes="(min-width: 1024px) 70vw, 100vw"
              alt=""
              decoding="async"
              fetchPriority={isVisible ? 'auto' : 'low'}
              draggable={false}
              className="ov-svc-frames__image"
            />
          )}
        </div>
      ))}
    </div>
  )
}
