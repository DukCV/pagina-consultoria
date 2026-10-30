import { SERVICES_SECTION_ID } from '../../constants/sectionIds'
import { SERVICES_INTRO } from '../../constants/servicesIntro'

export const SERVICES_TITLE_ID = `${SERVICES_SECTION_ID}-titulo`

/** Encabezado de la sección: se pinta de inmediato, sin esperar a la escena 3D. */
export default function ServicesIntro() {
  return (
    <div className="ov-svc-intro">
      <h2 id={SERVICES_TITLE_ID} className="ov-svc-heading">
        {SERVICES_INTRO.title}
      </h2>
      <p className="ov-svc-lede">{SERVICES_INTRO.subtitle}</p>
    </div>
  )
}
