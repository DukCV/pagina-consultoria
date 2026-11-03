import { SECTORS_SECTION_ID } from '../../constants/sectionIds'
import { SECTORS_INTRO } from '../../constants/sectorsContent'

export const SECTORS_TITLE_ID = `${SECTORS_SECTION_ID}-titulo`

/** Los dos párrafos de presentación: en pantallas amplias van junto al título; en las demás, bajo la pantalla. */
export function SectorsLead() {
  return (
    <>
      <p className="ov-sec-text">{SECTORS_INTRO.intro}</p>
      <p className="ov-sec-text ov-sec-text--note">{SECTORS_INTRO.note}</p>
    </>
  )
}

/** Encabezado de la sección: se pinta de inmediato, sin esperar a la escena 3D. */
export default function SectorsIntro({ showLead }) {
  return (
    <div className="ov-sec-intro">
      <h2 id={SECTORS_TITLE_ID} className="ov-sec-heading">
        {SECTORS_INTRO.title}
      </h2>
      <p className="ov-sec-lede">{SECTORS_INTRO.subtitle}</p>
      {showLead && <SectorsLead />}
    </div>
  )
}
