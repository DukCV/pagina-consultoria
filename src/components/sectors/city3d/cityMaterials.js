import { screen, solid } from '../../scene3d/sceneKit.js'

/**
 * Vocabulario de «capas» de la ciudad: cada capa es un material, y todas las piezas de una capa se fusionan
 * en una sola malla (ver `scene3d/brush.js`). Los pintores de edificios solo nombran capas; el aspecto se
 * decide aquí para que toda la ciudad comparta paleta:
 *
 *   wall        fachada gris claro, mate            concrete   hormigón gris medio
 *   trim        carbón: cubiertas, marcos, cornisas  dark       carbón profundo: vanos, huecos, asfalto
 *   glass       cristal índigo claro con brillo      glassDark  cristal oscuro reflectante (torres)
 *   accent      esmeralda luminoso: detalles tech    deep       índigo: toldos, cubiertas, sombras cromáticas
 *   lamp        luz cálida emisiva (ventanas, farolas)  leaf    follaje esmeralda oscuro    leafLight  follaje claro
 *   paving      pavimento claro (plazas, aceras)     panel      paneles solares / instalaciones
 *   lime        SOLO monumento y hitos (nunca en edificios)
 */
export function createCityMaterials(textures = {}) {
  const materials = {
    wall: solid('city-wall', 'lightGray', { metallic: 0.05, roughness: 0.68 }),
    concrete: solid('city-concrete', '#8E8D8C', { metallic: 0.05, roughness: 0.75 }),
    trim: solid('city-trim', 'charcoal', { metallic: 0.3, roughness: 0.45 }),
    dark: solid('city-dark', 'charcoalDeep', { metallic: 0.3, roughness: 0.4 }),
    glass: solid('city-glass', 'indigoSoft', { metallic: 0.55, roughness: 0.14, glow: 0.35 }),
    glassDark: solid('city-glass-dark', 'indigoDeep', { metallic: 0.65, roughness: 0.12, glow: 0.18 }),
    accent: solid('city-accent', 'emerald', { metallic: 0.2, roughness: 0.35, glow: 0.45 }),
    deep: solid('city-deep', 'indigo', { metallic: 0.2, roughness: 0.45, glow: 0.12 }),
    lamp: solid('city-lamp', '#F2EBC9', { metallic: 0, roughness: 0.5, glow: 1 }),
    leaf: solid('city-leaf', '#2F7A5C', { metallic: 0, roughness: 0.85, glow: 0.04 }),
    leafLight: solid('city-leaf-light', '#4FB58B', { metallic: 0, roughness: 0.85, glow: 0.06 }),
    paving: solid('city-paving', '#6A6368', { metallic: 0.05, roughness: 0.8 }),
    panel: solid('city-panel', '#2C3A63', { metallic: 0.7, roughness: 0.2, glow: 0.1 }),
    lime: solid('city-lime', 'lime', { metallic: 0.1, roughness: 0.4, glow: 0.4 }),
  }
  if (textures.facadeOffice) materials.facadeOffice = screen('city-facade-office', textures.facadeOffice, 0.55)
  return materials
}

/** Nombres de las capas disponibles para los pintores. */
export const LAYER_NAMES = [
  'wall',
  'concrete',
  'trim',
  'dark',
  'glass',
  'glassDark',
  'accent',
  'deep',
  'lamp',
  'leaf',
  'leafLight',
  'paving',
  'panel',
  'lime',
  'facadeOffice',
]
