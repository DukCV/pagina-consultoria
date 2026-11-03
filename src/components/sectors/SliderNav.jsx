function Chevron({ direction }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-[18px] w-[18px] ${direction === 'left' ? '' : 'rotate-180'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.5 5l-5 5 5 5" />
    </svg>
  )
}

const pad = (value) => String(value).padStart(2, '0')

/**
 * Navegación del slider: anterior / siguiente, un indicador por diapositiva (el activo en lima), contador
 * y barra de progreso (`--ov-slide-progress`). Los indicadores forman un único punto de tabulación; las
 * flechas, Inicio y Fin los gobierna el contenedor (`SlidePanel`).
 */
export default function SliderNav({ slides, activeIndex, onSelect, onStep }) {
  const lastIndex = slides.length - 1
  return (
    <nav aria-label="Recorrido por los sectores" className="ov-slider-nav">
      <div className="ov-slider-nav__controls">
        <button
          type="button"
          className="ov-slider-step"
          onClick={() => onStep(-1)}
          aria-disabled={activeIndex === 0 ? 'true' : undefined}
          aria-label="Sector anterior"
        >
          <Chevron direction="left" />
        </button>

        <ol className="ov-slider-dots">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex
            return (
              <li key={slide.id}>
                <button
                  type="button"
                  data-index={index}
                  data-active={isActive ? 'true' : undefined}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Sector ${index + 1} de ${slides.length}: ${slide.title}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onSelect(index)}
                  className="ov-slider-dot"
                >
                  <span aria-hidden="true" className="ov-slider-dot__mark" />
                </button>
              </li>
            )
          })}
        </ol>

        <button
          type="button"
          className="ov-slider-step"
          onClick={() => onStep(1)}
          aria-disabled={activeIndex === lastIndex ? 'true' : undefined}
          aria-label="Sector siguiente"
        >
          <Chevron direction="right" />
        </button>
      </div>

      <p aria-hidden="true" className="ov-slider-counter">
        <strong>{pad(activeIndex + 1)}</strong> / {pad(slides.length)}
      </p>
    </nav>
  )
}
