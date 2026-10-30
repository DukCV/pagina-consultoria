# Catálogo de componentes, hooks y módulos (reutiliza antes de crear)

Rutas relativas a `src/`. Si añades o renombras algo reutilizable, actualiza esta tabla.

## Componentes
| Ruta | Función | Notas |
|---|---|---|
| `App.jsx` | Orquesta bienvenida → header → `<main>` | bloquea scroll mientras `phase !== 'complete'`; `main` es `inert` hasta `isHeaderInteractive` |
| `components/MainHeader.jsx` | Header con logotipo, nav y menú móvil | `forwardRef` al logotipo; props `isLogoVisible, isRevealed, isInteractive, prefersReducedMotion`; datos de `NAVIGATION_ITEMS` |
| `components/OverlayerBrandLogo.jsx` / `OverlayerLogoRig.jsx` | Logotipo vectorial y su rig animable | geometría en `assets/overlayerGeometry.js` |
| `components/OverlayerSplash.jsx` | Pantalla de bienvenida | usa `SplashAtmosphereCanvas`, `IsometricBlueprintGrid` |
| `components/hero/HeroBanner.jsx` | Hero: slider de 6 especialidades | contexto de calidad, teclado, parallax, CTAs |
| `components/hero/HeroSceneViewport.jsx` | Monta la escena activa (lazy + error boundary) | `SceneActivityContext` |
| `components/hero/HeroServiceActions.jsx` | CTAs «Saber más» y «Contáctanos» | props `service, transitionId, onInteractionChange`; usa `followSectionLink` |
| `components/hero/Model3DShowcase.jsx` | Visor 3D con degradación a 2D | props `model` (de `MODEL_ASSETS`), `className`; reserva espacio por `className` |
| `components/hero/ModelPoster.jsx` | Render 2D responsive (`picture` WebP + PNG) | props `poster`, `className` |
| `components/hero/SceneErrorBoundary.jsx` | Captura fallos de una escena | `fallback` |
| `components/hero/scenes/*Scene.jsx` | 6 escenas (CustomSystems, ImmersiveXr, AiAutomation, Infrastructure, BusinessWeb, Maintenance) | sin props; `aria-hidden`; planos `ov-plane-*` |
| `components/hero/scenes/maintenance/` | Piezas isométricas de la escena 06 | `IsoCube {x,y,half,height,tone,isDashed}` con tonos `legacy|stable|upgraded|incoming`; `ExplodedPlatform` (sin props); `GlassSlab`, `GearMechanism`, `InterfaceLayer`, `ModuleGridLayer`, `SatelliteModules`, `StageFloor`, `UpdateStatusCard`, `EvolutionCard`; geometría en `isoGeometry.js`; colores `sceneColors.js` |

## Hooks (`hooks/`)
`useHeroSlider` (estado del slider) · `useSpatialParallax` (parallax/swipe/giroscopio por CSS vars) · `useGraphicsGovernor` (nivel de calidad) · `useWebglModelStage` (ciclo de vida del canvas WebGL) · `useReducedMotion` · `useWelcomeToHeaderTransition` (secuencia bienvenida→header). Junto a hero: `components/hero/useScenePreloader.js`.

## Contexto, datos y utilidades
- `context/graphicsQuality.js`: `GRAPHICS_LEVELS`, `GRAPHICS_LEVEL_ORDER`, `GraphicsQualityContext`, `SceneActivityContext`, `useGraphicsQuality()`, `useSceneActivity()`, `isGraphicsLevel`, `worseGraphicsLevel`, `nextGraphicsLevel`.
- `constants/brandTheme.js`: `OVERLAYER_PALETTE`, `NAVIGATION_ITEMS` (`#servicios`, `#sectores`, `#nosotros`, `#contactanos`), `TRANSITION_TIMINGS`.
- `constants/heroServicesData.js`: `HERO_SERVICES` (id, `indexLabel`, título, `sceneKey`, `stageGlow`), `HERO_ACTIONS`, `HERO_SLIDER_CONFIG`, `HERO_PROTAGONIST_STATEMENT`.
- `constants/modelAssets.js`: `MODEL_ASSETS` (`quest3`, `aiCharacter`: `glbUrl`, `preset`, `poster`); sube `MODELS_ASSET_VERSION` al regenerar archivos.
- `engine3d/`: `createWebGLPbrStage`, `loadGlbAsset/prefetchGlbAsset/isGlbAssetReady/hasRecentGlbFailure/clearGlbCache`, `createFramePerformanceMonitor`, `detectGraphicsCapabilities/evaluateCapabilities`, `math3d` (mat4/quat).
- `utils/followSectionLink.js`: gestiona enlaces internos aunque la sección no exista aún.
- `index.css`: tokens `--ov-*`, `ov-cta*`, `ov-anim-*`, `ov-plane-*`, `ov-scene-*`, bloque de niveles de calidad.

## Antes de crear algo nuevo
1. Busca con Grep el nombre del patrón (`useReducedMotion`, `ov-cta`, `MODEL_ASSETS`…). 2. Amplía el dato o el hook existente si encaja. 3. Si creas un módulo reutilizable, añádelo aquí.
