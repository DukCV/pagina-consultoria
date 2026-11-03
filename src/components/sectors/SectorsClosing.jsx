import { OVERLAYER_PALETTE } from '../../constants/brandTheme'
import { HERO_ACTIONS } from '../../constants/heroServicesData'
import { SECTORS_CLOSING } from '../../constants/sectorsContent'
import { followSectionLink } from '../../utils/followSectionLink'
import { PrimaryCta } from '../ui/CtaButtons'

/** Cierre de la sección: mensaje y llamada a la acción hacia el mismo destino de contacto que usa el hero. */
export default function SectorsClosing() {
  const contactHref = HERO_ACTIONS.contact.href

  return (
    <div className="ov-sec-closing" style={{ '--ov-cta-glow': OVERLAYER_PALETTE.emerald }}>
      <div className="ov-sec-closing__copy">
        <p className="ov-sec-closing__message">{SECTORS_CLOSING.message}</p>
        <p className="ov-sec-closing__detail">{SECTORS_CLOSING.detail}</p>
      </div>
      <PrimaryCta href={contactHref} label={SECTORS_CLOSING.cta} onClick={(event) => followSectionLink(event, contactHref)} />
    </div>
  )
}
