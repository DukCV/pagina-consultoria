/**
 * Contenido comercial de la sección «Sectores que atendemos». Las cinco diapositivas se corresponden, en
 * este orden, con los cinco distritos de la ciudad 3D (ver `components/sectors/city3d/cityRig.js`): al
 * cambiar de diapositiva la cámara viaja al distrito indicado en `district`.
 *
 * Los textos describen el valor que recibe cada negocio sin prometer resultados ni cifras que el
 * proyecto no respalde.
 */

export const SECTORS_INTRO = {
  title: 'Sectores que atendemos',
  subtitle: 'Tecnología a la medida de tu negocio, sin importar su giro.',
  intro:
    'En Overlayer ayudamos a pequeñas y medianas empresas y organizaciones a optimizar sus procesos, aprovechar mejor su información y crecer mediante soluciones tecnológicas adaptadas a sus necesidades.',
  note: 'Cada negocio enfrenta retos diferentes, pero muchos comparten las mismas oportunidades de mejora. Descubre cómo podemos ayudarte.',
}

/** `district`: distrito de la ciudad que enmarca la cámara (índice en `DISTRICTS` de cityRig.js). */
export const SLIDES = [
  {
    id: 'herramientas',
    title: 'Cuando tu negocio crece más rápido que tus herramientas',
    description:
      'Si todavía dependes de hojas de cálculo, papel o procesos manuales, desarrollamos sistemas a tu medida para organizar tu información, optimizar operaciones y facilitar el trabajo de tu equipo.',
    district: 0,
  },
  {
    id: 'clientes',
    title: 'Cuando quieres que más clientes te encuentren',
    description:
      'Creamos páginas web que presentan lo mejor de tu negocio, fortalecen tu presencia digital y facilitan que nuevos clientes conozcan tus productos y servicios.',
    district: 1,
  },
  {
    id: 'tiempo',
    title: 'Cuando el tiempo no alcanza',
    description:
      'Automatizamos tareas repetitivas mediante soluciones inteligentes e inteligencia artificial para reducir trabajo manual, agilizar procesos y liberar tiempo para lo realmente importante.',
    district: 2,
  },
  {
    id: 'destacar',
    title: 'Cuando quieres destacar frente a la competencia',
    description:
      'Creamos experiencias de realidad virtual y aumentada que permiten presentar productos, capacitar personas y sorprender a tus clientes con nuevas formas de interactuar con tu marca.',
    district: 3,
  },
  {
    id: 'cuidado',
    title: 'Cuando tu tecnología necesita cuidado',
    description:
      'Modernizamos y mantenemos tus sistemas y páginas web. Corregimos errores, optimizamos su rendimiento y desarrollamos nuevas funcionalidades para que tu tecnología siga evolucionando.',
    district: 4,
  },
]

export const SECTORS_CLOSING = {
  message: 'Cada negocio es distinto. Su tecnología también debería serlo.',
  detail:
    'Cuéntanos qué necesitas. Analizamos tus objetivos y te proponemos una solución adaptada a tu operación, presupuesto y posibilidades de crecimiento.',
  cta: 'Platícanos tu proyecto',
}
