import { HERO_ACTIONS } from '../../constants/heroServicesData'
import { OVERLAYER_PALETTE } from '../../constants/brandTheme'
import { followSectionLink } from '../../utils/followSectionLink'
import { PrimaryCta } from '../ui/CtaButtons'

/**
 * Presentación comercial del servicio protagonista: título, descripción y llamada a la acción. El
 * texto vive en el DOM (no en la escena 3D) para que sea nítido, seleccionable y accesible. La `key`
 * por servicio reinicia la animación de entrada solo en el bloque de texto: el enlace CTA no se remonta,
 * así que el foco del teclado no se pierde al cambiar de servicio.
 */
export default function ServiceCard({ service }) {
  const contactHref = HERO_ACTIONS.contact.href

  return (
    <div className="ov-svc-card" style={{ '--ov-cta-glow': OVERLAYER_PALETTE.emerald }}>
      <div key={service.id} className="ov-svc-card__text">
        <h3 className="ov-svc-title">{service.title}</h3>
        <p className="ov-svc-desc">{service.description}</p>
      </div>
      <PrimaryCta
        href={contactHref}
        label={service.cta}
        ariaLabel={`${service.cta}: ${service.title}`}
        onClick={(event) => followSectionLink(event, contactHref)}
      />
    </div>
  )
}
