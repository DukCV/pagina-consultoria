import { OVERLAYER_PALETTE } from '../../../../constants/brandTheme'

/**
 * Colores de la escena «Mantenimiento y mejoras»: paleta oficial de Overlayer
 * más los tonos derivados de carbón y de cada acento que ya usan las demás escenas del hero.
 */
export const SCENE_COLORS = {
  ...OVERLAYER_PALETTE,

  // Sombras y volúmenes derivados del carbón cálido
  charcoalDeep: '#292425',
  charcoalSlab: '#322C2F',
  charcoalShadow: '#1B1718',

  // Caras en sombra de los cubos (cara izquierda / cara derecha)
  indigoLeft: '#393654',
  indigoRight: '#2A2840',
  emeraldLeft: '#357F62',
  emeraldRight: '#296D53',
  limeLeft: '#8DC03A',
  limeRight: '#6C962C',
  charcoalLeft: '#3C3639',
  charcoalRight: '#2D282A',
}

/** Estados de un módulo de software dentro de la plataforma. */
export const MODULE_TONES = {
  legacy: {
    top: SCENE_COLORS.charcoal,
    left: SCENE_COLORS.charcoalLeft,
    right: SCENE_COLORS.charcoalRight,
    stroke: SCENE_COLORS.lightGray,
  },
  stable: {
    top: SCENE_COLORS.indigo,
    left: SCENE_COLORS.indigoLeft,
    right: SCENE_COLORS.indigoRight,
    stroke: SCENE_COLORS.lightGray,
  },
  upgraded: {
    top: SCENE_COLORS.emerald,
    left: SCENE_COLORS.emeraldLeft,
    right: SCENE_COLORS.emeraldRight,
    stroke: SCENE_COLORS.lime,
  },
  incoming: {
    top: SCENE_COLORS.lime,
    left: SCENE_COLORS.limeLeft,
    right: SCENE_COLORS.limeRight,
    stroke: SCENE_COLORS.lightGray,
  },
}
