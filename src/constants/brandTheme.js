/**
 * Paleta oficial del sistema de diseño de Overlayer y configuración de navegación.
 */

export const OVERLAYER_PALETTE = {
  charcoal: '#484041', // Gris carbón cálido: superficies oscuras, tipografía principal y alto contraste
  emerald: '#419D78',  // Verde esmeralda: acentos elegantes, innovación e interacción
  indigo: '#434371',   // Azul índigo: profundidad visual y variaciones tecnológicas
  lime: '#B5F44A',     // Verde lima brillante: acentos estratégicos e indicadores puntuales
  lightGray: '#DADDD8', // Gris claro: fondo arquitectónico claro y contraste tipográfico sobre carbón
}

/**
 * Opciones oficiales de navegación del header principal (orden y nombres exactos).
 */
export const NAVIGATION_ITEMS = [
  { id: 'servicios', label: 'Servicios', href: '#servicios', variant: 'link' },
  { id: 'sectores', label: 'Sectores', href: '#sectores', variant: 'link' },
  { id: 'nosotros', label: 'Nosotros', href: '#nosotros', variant: 'link' },
  { id: 'contactanos', label: 'Contáctanos', href: '#contactanos', variant: 'cta' },
]

/**
 * Tiempos maestros de coordinación entre la pantalla de bienvenida y el header.
 */
export const TRANSITION_TIMINGS = {
  holdAfterSettledMs: 1800,     // Pausa contemplativa tras finalizar la animación de bienvenida
  flightDurationMs: 1280,       // Duración del vuelo FLIP del logotipo hacia el header
  headerRevealOffsetMs: 760,    // Inicio progresivo del header mientras el logotipo aterriza
  totalTransitionMs: 1620,      // Cierre total de la transición y desmontaje del overlay
  navStaggerMs: 75,             // Diferencia escalonada entre las 4 opciones de navegación
  reducedHoldMs: 600,           // Espera breve en modo prefers-reduced-motion
  reducedFadeMs: 380,           // Disolución discreta en modo prefers-reduced-motion
}
