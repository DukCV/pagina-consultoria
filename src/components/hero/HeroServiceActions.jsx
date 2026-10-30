import { HERO_ACTIONS } from '../../constants/heroServicesData'
import { followSectionLink } from '../../utils/followSectionLink'
import { requestServiceFocus } from '../../utils/serviceFocus'
import { GhostCta, PrimaryCta } from '../ui/CtaButtons'

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

  return (
    <div
      onPointerEnter={() => onInteractionChange?.(true)}
      onPointerLeave={() => onInteractionChange?.(false)}
      style={{ '--ov-cta-glow': service.stageGlow }}
      className="mt-5 flex flex-wrap items-center gap-3 sm:mt-7 sm:gap-4"
    >
      <GhostCta
        href={learnMoreHref}
        label={HERO_ACTIONS.learnMore.label}
        ariaLabel={`${HERO_ACTIONS.learnMore.label} sobre ${service.title}`}
        onClick={(event) => {
          followSectionLink(event, learnMoreHref)
          // La sección de Servicios lleva la hélice hasta el servicio que se estaba viendo en el hero;
          // si ya está montada, ella misma hace el desplazamiento y se evita el salto de ancla
          const isPlainClick = event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          if (isPlainClick && service.servicesFocusId && requestServiceFocus(service.servicesFocusId)) {
            event.preventDefault()
            window.history.replaceState(null, '', learnMoreHref)
          }
        }}
      />
      <PrimaryCta
        href={contactHref}
        label={HERO_ACTIONS.contact.label}
        ariaLabel={`${HERO_ACTIONS.contact.label}: ${service.title}`}
        onClick={(event) => followSectionLink(event, contactHref)}
        transitionId={transitionId}
      />
    </div>
  )
}
