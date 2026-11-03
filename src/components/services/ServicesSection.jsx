import { lazy, Suspense } from 'react'
import { SERVICES_SECTION_ID } from '../../constants/sectionIds'
import { SERVICES } from '../../constants/servicesContent'
import { useGraphicsQuality } from '../../context/graphicsQuality'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import ServicesIntro, { SERVICES_TITLE_ID } from './ServicesIntro'
import './services.css'

// La escena (stage WebGL, objetos, fotogramas y su lógica) viaja en su propio fragmento
const ServicesHelix = lazy(() => import('./ServicesHelix'))

// Con menos altura no cabe una pantalla fijada con escena y texto legibles: se pasa al modo manual
const SHORT_VIEWPORT_QUERY = '(max-height: 599px)'

/** Marcador de posición con las mismas dimensiones que la sección real: no hay saltos al cargarla. */
function ServicesSkeleton() {
  return (
    <div className="ov-svc-track">
      <div className="ov-svc-pin">
        <div aria-hidden="true" className="ov-svc-stage">
          <span className="ov-svc-skeleton__glow" />
        </div>
        <div className="ov-svc-ui">
          <div className="ov-svc-ui__inner">
            <ServicesIntro />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Sección de Servicios, justo bajo el hero. Hasta que la pantalla de bienvenida termina solo pinta
 * su encabezado; después carga la escena en segundo plano.
 */
export default function ServicesSection({ isReady, prefersReducedMotion }) {
  const graphics = useGraphicsQuality()
  const isShortViewport = useMediaQuery(SHORT_VIEWPORT_QUERY)
  const mode = prefersReducedMotion || isShortViewport ? 'manual' : 'scroll'

  return (
    <section
      id={SERVICES_SECTION_ID}
      aria-labelledby={SERVICES_TITLE_ID}
      data-mode={mode}
      data-ov-quality={graphics.level}
      data-ov-quality-reason={graphics.reason}
      style={{ '--ov-steps': SERVICES.length, '--ov-seam-from': '#3b3537', '--ov-seam-size': '42px' }}
      className="ov-services ov-seam"
    >
      {isReady ? (
        <Suspense fallback={<ServicesSkeleton />}>
          <ServicesHelix mode={mode} prefersReducedMotion={prefersReducedMotion} />
        </Suspense>
      ) : (
        <ServicesSkeleton />
      )}
    </section>
  )
}
