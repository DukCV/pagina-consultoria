import { SECTORS_SECTION_ID } from '../../constants/sectionIds'
import { useGraphicsQuality } from '../../context/graphicsQuality'
import SectorsClosing from './SectorsClosing'
import { SECTORS_TITLE_ID } from './SectorsIntro'
import SectorsSlider from './SectorsSlider'
import './sectors.css'

/**
 * Sección «Sectores que atendemos», tras la de Servicios: un slider de cinco diapositivas arriba y una
 * ciudad 3D a pantalla completa que la cámara recorre en órbita al cambiar de diapositiva (todo en una sola
 * altura de ventana, como Servicios), más el cierre con la llamada a la acción. Hasta que la bienvenida
 * termina solo pinta el contenido; después carga la ciudad.
 */
export default function SectorsSection({ isReady, prefersReducedMotion }) {
  const graphics = useGraphicsQuality()

  return (
    <section
      id={SECTORS_SECTION_ID}
      aria-labelledby={SECTORS_TITLE_ID}
      data-ov-quality={graphics.level}
      data-ov-quality-reason={graphics.reason}
      className="ov-sectors"
    >
      <SectorsSlider isReady={isReady} prefersReducedMotion={prefersReducedMotion} />
      <div className="ov-sec-wrap">
        <SectorsClosing />
      </div>
    </section>
  )
}
