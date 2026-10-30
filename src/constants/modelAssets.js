/**
 * Registro único de los activos 3D del hero y de sus alternativas 2D.
 * Las escenas y el precargador consumen estas definiciones en lugar de duplicar rutas.
 *
 * Los renders 2D se generan con el propio motor WebGL a partir de cada GLB (pose de reposo y
 * misma relación de aspecto que el canvas), de modo que el cambio entre 2D y 3D no produce saltos.
 * Cuando se regeneren los GLB o los renders, incrementa MODELS_ASSET_VERSION para invalidar la caché HTTP.
 */

const MODELS_ASSET_VERSION = '2'
// `import.meta.env` no existe fuera de Vite (p. ej. en las pruebas de Node): se usa la raíz por defecto
const MODELS_BASE_URL = `${import.meta.env?.BASE_URL ?? '/'}models`
const POSTER_WIDTHS = [360, 720, 1080]

function createPoster(name, sizes) {
  const file = (suffix) => `${MODELS_BASE_URL}/renders-2d/${name}-${suffix}`
  return {
    webpSrcSet: POSTER_WIDTHS.map((w) => `${file(`${w}.webp`)} ${w}w`).join(', '),
    fallbackSrc: file('720.png'),
    sizes,
  }
}

export const MODEL_ASSETS = {
  quest3: {
    id: 'quest3',
    preset: 'quest3',
    glbUrl: `${MODELS_BASE_URL}/overlayer-optimized/meta-quest-3.glb?v=${MODELS_ASSET_VERSION}`,
    // Anchos del contenedor en cada breakpoint (ver ImmersiveXrScene)
    poster: createPoster(
      'meta-quest-3-studio',
      '(min-width: 1280px) 525px, (min-width: 1024px) 485px, (min-width: 640px) 405px, 305px',
    ),
  },
  aiCharacter: {
    id: 'aiCharacter',
    preset: 'ai-character',
    glbUrl: `${MODELS_BASE_URL}/overlayer-optimized/ai-character-overlayer.glb?v=${MODELS_ASSET_VERSION}`,
    // Anchos del contenedor en cada breakpoint (ver AiAutomationScene)
    poster: createPoster(
      'ai-character-overlayer-studio',
      '(min-width: 1280px) 495px, (min-width: 1024px) 455px, (min-width: 640px) 385px, 290px',
    ),
  },
}
