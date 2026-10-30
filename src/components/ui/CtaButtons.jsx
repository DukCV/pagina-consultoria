/** Flecha que apunta a la derecha; en el botón principal rota a ↗ al pasar el cursor. */
export function ArrowIcon({ className = '' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`ov-cta__arrow h-[18px] w-[18px] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10h11.5M10.5 5l5 5-5 5" />
    </svg>
  )
}

/**
 * Botón secundario de cristal índigo con borde degradado. Es un enlace si recibe `href`
 * y un botón en caso contrario. Estilos en index.css (`ov-cta`).
 */
export function GhostCta({ href, label, ariaLabel, onClick }) {
  const content = (
    <>
      <span aria-hidden="true" className="ov-cta__diamond" />
      <span>{label}</span>
      <ArrowIcon />
    </>
  )
  const className = 'ov-cta ov-cta--ghost'

  return href ? (
    <a href={href} onClick={onClick} aria-label={ariaLabel} className={className}>
      {content}
    </a>
  ) : (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={className}>
      {content}
    </button>
  )
}

/**
 * Botón principal en verde lima con halo del color de la escena (`--ov-cta-glow` del contenedor).
 * `transitionId` reinicia los elementos decorativos —halo y destello— sin remontar el enlace,
 * de modo que el foco del teclado no se pierde; el destello automático solo acompaña a los cambios.
 */
export function PrimaryCta({ href, label, ariaLabel, onClick, transitionId = 0 }) {
  return (
    <span className="ov-cta-wrap">
      <span key={`halo-${transitionId}`} aria-hidden="true" className="ov-cta-halo">
        <span className="ov-cta-halo__glow ov-anim-pulse" />
      </span>
      <a href={href} onClick={onClick} aria-label={ariaLabel} className="ov-cta ov-cta--primary">
        <span>{label}</span>
        <span aria-hidden="true" className="ov-cta__icon">
          <ArrowIcon />
        </span>
        <span
          key={`sheen-${transitionId}`}
          aria-hidden="true"
          className={`ov-cta__sheen ${transitionId > 0 ? 'ov-cta__sheen--auto' : ''}`}
        />
      </a>
    </span>
  )
}
