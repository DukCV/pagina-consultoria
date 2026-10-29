import { HERO_ACTIONS } from '../../constants/heroServicesData'
import { followSectionLink } from '../../utils/followSectionLink'

/** Flecha que apunta a la derecha; en el botón principal rota a ↗ al pasar el cursor. */
function ArrowIcon({ className = '' }) {
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
 * Botones «Saber más» y «Contáctanos» de la especialidad activa.
 *
 * Los enlaces permanecen montados al cambiar de diapositiva (solo se actualizan su destino y su
 * nombre accesible) para no perder el foco del teclado. Cada cambio de servicio reinicia los
 * elementos decorativos —destello y halo— identificados con `transitionId`.
 */
export default function HeroServiceActions({
  service,
  transitionId,
  onInteractionChange,
}) {
  const learnMoreHref = service.learnMoreHref ?? HERO_ACTIONS.learnMore.href
  const contactHref = service.contactHref ?? HERO_ACTIONS.contact.href
  // El destello automático acompaña a los cambios de diapositiva, no a la primera carga
  const sheenClass = transitionId > 0 ? 'ov-cta__sheen--auto' : ''

  return (
    <div
      onPointerEnter={() => onInteractionChange?.(true)}
      onPointerLeave={() => onInteractionChange?.(false)}
      style={{ '--ov-cta-glow': service.stageGlow }}
      className="mt-5 flex flex-wrap items-center gap-3 sm:mt-7 sm:gap-4"
    >
      {/* Secundario: cristal índigo con borde degradado */}
      <a
        href={learnMoreHref}
        onClick={(event) => followSectionLink(event, learnMoreHref)}
        aria-label={`${HERO_ACTIONS.learnMore.label} sobre ${service.title}`}
        className="ov-cta ov-cta--ghost"
      >
        <span aria-hidden="true" className="ov-cta__diamond" />
        <span>{HERO_ACTIONS.learnMore.label}</span>
        <ArrowIcon />
      </a>

      {/* Principal: verde lima con halo del color de cada escena */}
      <span className="ov-cta-wrap">
        <span
          key={`halo-${transitionId}`}
          aria-hidden="true"
          className="ov-cta-halo"
        >
          <span className="ov-cta-halo__glow ov-anim-pulse" />
        </span>
        <a
          href={contactHref}
          onClick={(event) => followSectionLink(event, contactHref)}
          aria-label={`${HERO_ACTIONS.contact.label}: ${service.title}`}
          className="ov-cta ov-cta--primary"
        >
          <span>{HERO_ACTIONS.contact.label}</span>
          <span aria-hidden="true" className="ov-cta__icon">
            <ArrowIcon />
          </span>
          <span
            key={`sheen-${transitionId}`}
            aria-hidden="true"
            className={`ov-cta__sheen ${sheenClass}`}
          />
        </a>
      </span>
    </div>
  )
}
