import { useRef } from 'react'

function Chevron({ direction }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-[18px] w-[18px] ${direction === 'up' ? '' : 'rotate-180'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l5-5 5 5" />
    </svg>
  )
}

const KEY_STEPS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/**
 * Navegación del recorrido: anterior / siguiente, un indicador por servicio (el activo en lima), un
 * contador y una barra de progreso (`--ov-progress`, que escribe el controlador sin renders).
 * Los indicadores forman un único punto de tabulación con flechas, Inicio y Fin.
 */
export default function HelixNav({ services, activeIndex, onSelect, onStep }) {
  const dotsRef = useRef(null)
  const lastIndex = services.length - 1

  const focusDot = (index) => dotsRef.current?.querySelector(`[data-index="${index}"]`)?.focus()

  // Las flechas piden «el siguiente» respecto al último destino pedido (no al activo, que va con retraso)
  const handleKeyDown = (event) => {
    if (event.key === 'Home') focusDot(onSelect(0))
    else if (event.key === 'End') focusDot(onSelect(lastIndex))
    else if (event.key in KEY_STEPS) focusDot(onStep(KEY_STEPS[event.key]))
    else return
    event.preventDefault()
  }

  return (
    <nav aria-label="Recorrido por los servicios" className="ov-svc-nav">
      <div className="ov-svc-nav__controls">
        <button
          type="button"
          className="ov-svc-step"
          onClick={() => onStep(-1)}
          aria-disabled={activeIndex === 0 ? 'true' : undefined}
          aria-label="Servicio anterior"
        >
          <Chevron direction="up" />
        </button>

        <ol ref={dotsRef} className="ov-svc-dots" onKeyDown={handleKeyDown}>
          {services.map((service, index) => {
            const isActive = index === activeIndex
            return (
              <li key={service.id}>
                <button
                  type="button"
                  data-index={index}
                  data-label={service.shortTitle}
                  data-active={isActive ? 'true' : undefined}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Servicio ${service.index} de ${services.length}: ${service.title}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onSelect(index)}
                  className="ov-svc-dotbtn"
                >
                  <span aria-hidden="true" className="ov-svc-dotbtn__mark" />
                </button>
              </li>
            )
          })}
        </ol>

        <button
          type="button"
          className="ov-svc-step"
          onClick={() => onStep(1)}
          aria-disabled={activeIndex === lastIndex ? 'true' : undefined}
          aria-label="Servicio siguiente"
        >
          <Chevron direction="down" />
        </button>

        <p aria-hidden="true" className="ov-svc-counter">
          <strong>{services[activeIndex].index}</strong> / {String(services.length).padStart(2, '0')}
        </p>
      </div>

      <span aria-hidden="true" className="ov-svc-progress">
        <span className="ov-svc-progress__fill" />
      </span>
    </nav>
  )
}
