/**
 * Texto de la diapositiva visible. `phase` (`idle` | `leaving` | `entering`) lo gobierna el slider para
 * sincronizarlo con el viaje de la cámara: sale al empezar el viaje y entra cuando la cámara casi ha
 * llegado. Solo se animan `opacity`, `transform` y un desenfoque ligero; el texto vive en el DOM, no en la
 * escena 3D, para que sea nítido, seleccionable y accesible.
 */
export default function SlideContent({ slide, phase }) {
  return (
    <div className="ov-slide" data-phase={phase}>
      <h3 className="ov-slide__title">{slide.title}</h3>
      <p className="ov-slide__desc">{slide.description}</p>
    </div>
  )
}
