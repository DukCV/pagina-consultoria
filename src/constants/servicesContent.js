/**
 * Contenido comercial de la sección de Servicios. El orden es el del recorrido por la hélice.
 *
 *  - description: propuesta de valor breve, de extensión similar en los seis servicios.
 *  - cta: llamada a la acción propia del servicio; todas llevan a la sección de contacto del header.
 *  - visual: composición 3D que lo representa (ver `components/services/helix3d/objects`).
 *
 * Los textos describen solo el alcance real de cada servicio: sin certificaciones, cifras ni
 * resultados que el proyecto no respalde.
 */
export const SERVICES = [
  {
    id: 'sistemas-medida',
    index: '01',
    title: 'Sistemas a la medida',
    shortTitle: 'Sistemas a la medida',
    description:
      'Transformamos las necesidades de tu negocio en soluciones de software diseñadas para ti. Digitalizamos procesos, centralizamos información y desarrollamos herramientas que optimizan tus operaciones y mejoran la productividad de tu equipo.',
    cta: 'Hablemos de tu sistema',
    visual: 'systems',
  },
  {
    id: 'infraestructura-nube',
    index: '02',
    title: 'Infraestructura y servicios en la nube',
    shortTitle: 'Infraestructura y nube',
    description:
      'Construimos y modernizamos infraestructuras tecnológicas seguras, eficientes y escalables. Implementamos soluciones que facilitan el acceso a tus aplicaciones y datos, optimizan tus recursos y mantienen tu negocio conectado.',
    cta: 'Evaluemos tu infraestructura',
    visual: 'infrastructure',
  },
  {
    id: 'paginas-web',
    index: '03',
    title: 'Diseño y desarrollo web',
    shortTitle: 'Diseño y desarrollo web',
    description:
      'Creamos sitios web modernos que fortalecen tu marca y convierten visitas en oportunidades. Combinamos diseño atractivo, navegación intuitiva y tecnología adaptable para ofrecer experiencias digitales que destacan tu negocio.',
    cta: 'Planeemos tu sitio web',
    visual: 'web',
  },
  {
    id: 'mantenimiento-sistemas',
    index: '04',
    title: 'Mantenimiento y actualización de sistemas',
    shortTitle: 'Mantenimiento de sistemas',
    description:
      'Mantenemos tu tecnología al día. Corregimos errores, optimizamos el rendimiento, incorporamos nuevas funcionalidades y modernizamos sistemas existentes para que evolucionen junto con tu negocio.',
    cta: 'Revisemos tus sistemas',
    visual: 'maintenance',
  },
  {
    id: 'realidad-virtual-aumentada',
    index: '05',
    title: 'Realidad virtual y aumentada',
    shortTitle: 'Realidad virtual y aumentada',
    description:
      'Creamos experiencias inmersivas que conectan el mundo físico y digital. Desarrollamos aplicaciones de realidad aumentada y experiencias de realidad virtual para presentar productos, capacitar equipos y transformar la manera de interactuar con tu proyecto.',
    cta: 'Imaginemos tu experiencia',
    visual: 'xr',
  },
  {
    id: 'automatizaciones-ia',
    index: '06',
    title: 'Automatización con inteligencia artificial',
    shortTitle: 'Automatización con IA',
    description:
      'Automatizamos tareas y conectamos tus herramientas mediante inteligencia artificial. Desarrollamos asistentes y flujos inteligentes que procesan información, agilizan procesos y liberan tiempo para que tu equipo se concentre en lo importante.',
    cta: 'Automaticemos tu operación',
    visual: 'ai',
  },
]
