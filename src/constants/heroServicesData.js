import { NAVIGATION_ITEMS, OVERLAYER_PALETTE } from './brandTheme'

/**
 * Contenido minimalista de alto impacto y parámetros centralizados de animación
 * para el Hero Section 3D interactivo de Overlayer.
 */

export const HERO_PROTAGONIST_STATEMENT = {
  leadLine: 'SOMOS',
  emphasisLine: 'LÍDERES EN:',
  fullText: 'SOMOS LÍDERES EN:',
}

export const HERO_SERVICES = [
  {
    id: 'sistemas-medida',
    indexLabel: '01',
    title: 'Sistemas a la medida',
    sceneKey: 'custom-systems',
    stageGlow: OVERLAYER_PALETTE.emerald,
  },
  {
    id: 'realidad-inmersiva',
    indexLabel: '02',
    title: 'Realidad virtual y aumentada',
    sceneKey: 'immersive-xr',
    stageGlow: OVERLAYER_PALETTE.lime,
  },
  {
    id: 'automatizacion-ia',
    indexLabel: '03',
    title: 'Automatizaciones con IA',
    sceneKey: 'ai-automation',
    stageGlow: OVERLAYER_PALETTE.emerald,
  },
  {
    id: 'infraestructura',
    indexLabel: '04',
    title: 'Infraestructura',
    sceneKey: 'infrastructure',
    stageGlow: OVERLAYER_PALETTE.indigo,
  },
  {
    id: 'sistemas-web',
    indexLabel: '05',
    title: 'Sistemas y páginas web para negocios',
    sceneKey: 'business-web',
    stageGlow: OVERLAYER_PALETTE.emerald,
  },
  {
    id: 'mantenimiento-mejoras',
    indexLabel: '06',
    title: 'Mantenimiento y mejoras',
    sceneKey: 'maintenance-upgrades',
    stageGlow: OVERLAYER_PALETTE.indigo,
  },
]

// Total de especialidades con el mismo formato de dos dígitos de `indexLabel` (p. ej. "06")
export const HERO_SERVICES_TOTAL_LABEL = String(HERO_SERVICES.length).padStart(2, '0')

const navigationItem = (id) => NAVIGATION_ITEMS.find((item) => item.id === id)

/**
 * Botones de acción que acompañan a cada especialidad. Apuntan por defecto a las secciones
 * oficiales de la navegación del header (misma fuente de verdad). Para dirigir un servicio a
 * un destino propio basta con añadir `learnMoreHref` y/o `contactHref` a su entrada de HERO_SERVICES.
 */
export const HERO_ACTIONS = {
  learnMore: { label: 'Saber más', href: navigationItem('servicios')?.href ?? '#servicios' },
  contact: {
    label: navigationItem('contactanos')?.label ?? 'Contáctanos',
    href: navigationItem('contactanos')?.href ?? '#contactanos',
  },
}

export const HERO_SLIDER_CONFIG = {
  autoplayIntervalMs: 6800,
  transitionDurationMs: 760,
  swipeThresholdPx: 42,
  parallaxSmoothing: 0.08,
  restingTiltXDeg: 4.5,
  restingTiltYDeg: -8.5,
  maxTiltXDeg: 8.5,
  maxTiltYDeg: 11.5,
}
