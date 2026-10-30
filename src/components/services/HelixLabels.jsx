/**
 * Etiquetas DOM de los servicios, ancladas a sus objetos 3D. El renderizador escribe su posición y
 * opacidad en cada fotograma (`labelRefs`); aquí solo está el marcado, que además permite saltar a
 * un servicio pulsando su nombre. Ocultas por defecto hasta que la escena las coloca.
 */
export default function HelixLabels({ services, activeIndex, labelRefs, onSelect }) {
  return (
    <div className="ov-svc-labels">
      {services.map((service, index) => (
        <button
          key={service.id}
          ref={(element) => {
            labelRefs.current[index] = element
          }}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          data-active={index === activeIndex ? 'true' : undefined}
          onClick={() => onSelect(index)}
          className="ov-svc-label"
        >
          <span aria-hidden="true" className="ov-svc-label__dot" />
          {service.shortTitle}
        </button>
      ))}
    </div>
  )
}
