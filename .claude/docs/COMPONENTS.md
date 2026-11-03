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

## Sección de Servicios (`components/services/`)
| Ruta | Función |
|---|---|
| `ServicesSection.jsx` | Carcasa de la sección (`id="servicios"`), carga diferida, esqueleto, modo `scroll`/`manual` |
| `ServicesHelix.jsx` | Une controlador, renderizador, texto, navegación y etiquetas; gestiona swipe y «Saber más» |
| `ServiceCard.jsx`, `ServicesIntro.jsx`, `HelixNav.jsx`, `HelixLabels.jsx`, `HelixFrames.jsx` | Presentación (DOM) |
| `frameSequence.js` | Nombres y encadenado de los fotogramas 2D |
| `helix3d/helixRig.js` | Geometría y movimiento de la hélice (puro, con pruebas) |
| `helix3d/useHelixController.js` / `useHelixRenderer.js` | Scroll→progreso→fotograma / ciclo de vida WebGL |
| `helix3d/buildHelixScene.js`, `sceneRuntime.js`, `objects/*` | Escena 3D: assets, animación por fotograma y los seis objetos |
| `ui/CtaButtons.jsx` | `GhostCta`, `PrimaryCta`, `ArrowIcon` (compartidos con el hero) |

## Utilidades 3D compartidas (`components/scene3d/`)
| Ruta | Función |
|---|---|
| `sceneKit.js` | Colores de la paleta, materiales con nombre (`solid`, `light`, `glass`, `screen`, `sprite`), cuaterniones, `meshNode`/`groupNode`, `curve` |
| `panelTextures.js` | Texturas de canvas (paneles, racks, brillos, sombras); `makeCanvas` |
| `brush.js` | Pincel que fusiona volúmenes por capa (material) y dibuja en marcos girados (`frame`) |
| `useSceneRenderer.js` | Ciclo de vida genérico de una escena de sección (3D por cercanía, liberación, fallo→2D, reposo a baja frecuencia); lo envuelven `useHelixRenderer` y `useCityRenderer` |

## Sección de Sectores (`components/sectors/`)
| Ruta | Función |
|---|---|
| `SectorsSection.jsx` | Carcasa (`id="sectores"`, `data-ov-quality`): slider + ciudad + cierre |
| `SectorsSlider.jsx` | Estado (destino pedido y texto visible), sincronía texto↔cámara con `durationFor`/`SWAP_FRACTION`, escenario lazy |
| `SectorsIntro.jsx`, `SlidePanel.jsx`, `SlideContent.jsx`, `SliderNav.jsx`, `SectorsClosing.jsx` | Presentación (DOM); teclado del slider en `SlidePanel` |
| `CityStage.jsx` / `CityFrames.jsx` / `frameSequence.js` | Escenario (lazy), alternativa 2D (dos juegos: `wide`/`square`) y su lógica |
| `city3d/cityRig.js` | Plano de la ciudad: distritos, lotes, calles, vehículos (puro, con pruebas) |
| `city3d/cityCamera.js` / `cityMotion.js` | Cámara orbital por paradas y viaje Hermite con retarget (puros, con pruebas) |
| `city3d/useCityController.js` / `useCityRenderer.js` | Viaje de la cámara en rAF / ciclo de vida WebGL |
| `city3d/buildCityScene.js`, `buildCityGeometry.js`, `cityMaterials.js`, `textures.js`, `logoMonument.js`, `cityRuntime.js` | Ensamblado, capas, plano del suelo, monumento del logotipo, animación por fotograma |
| `city3d/district/*.js`, `props.js`, `vehicles.js`, `buildingKit.js` | Pintores de lotes por distrito, mobiliario urbano y coches |

## Hooks (`hooks/`)
`useHeroSlider` (estado del slider) · `useSpatialParallax` (parallax/swipe/giroscopio por CSS vars) · `useGraphicsGovernor` (nivel de calidad) · `useWebglModelStage` (ciclo de vida del canvas WebGL) · `useReducedMotion` · `useWelcomeToHeaderTransition` (secuencia bienvenida→header) · `useIsScrolled` · `useActiveSection` · `useMediaQuery` · `useSettledValue` · `useNearViewport` (cerca de pantalla con liberación diferida). Junto a hero: `components/hero/useScenePreloader.js`.

## Contexto, datos y utilidades
- `context/graphicsQuality.js`: `GRAPHICS_LEVELS`, `GRAPHICS_LEVEL_ORDER`, `GraphicsQualityContext`, `SceneActivityContext`, `useGraphicsQuality()`, `useSceneActivity()`, `isGraphicsLevel`, `worseGraphicsLevel`, `nextGraphicsLevel`.
- `constants/brandTheme.js`: `OVERLAYER_PALETTE`, `NAVIGATION_ITEMS` (`#servicios`, `#sectores`, `#nosotros`, `#contactanos`), `TRANSITION_TIMINGS`.
- `constants/heroServicesData.js`: `HERO_SERVICES` (id, `indexLabel`, título, `sceneKey`, `stageGlow`), `HERO_ACTIONS`, `HERO_SLIDER_CONFIG`, `HERO_PROTAGONIST_STATEMENT`.
- `constants/modelAssets.js`: `MODEL_ASSETS` (`quest3`, `aiCharacter`: `glbUrl`, `preset`, `poster`); sube `MODELS_ASSET_VERSION` al regenerar archivos.
- `constants/servicesContent.js` (6 servicios: título, descripción, CTA, visual), `servicesIntro.js`, `sectionIds.js` (`SERVICES_SECTION_ID`, `SECTORS_SECTION_ID`), `sectorsContent.js` (intro, 5 diapositivas con su distrito, cierre).
- `engine3d/`: `createWebGLPbrStage`, `loadGlbAsset/prefetchGlbAsset/isGlbAssetReady/hasRecentGlbFailure/clearGlbCache`, `createFramePerformanceMonitor`, `detectGraphicsCapabilities/evaluateCapabilities`, `math3d` (mat4/quat/vec3), `primitives` (geometrías procedurales), `sceneAsset` (`buildSceneAsset`, `mergeAssets`, `overrideMaterials`).
- `context/GraphicsQualityProvider.jsx`: nivel de calidad único para toda la página.
- `utils/followSectionLink.js`: gestiona enlaces internos aunque la sección no exista aún. `utils/serviceFocus.js`: «Saber más» del hero → servicio de la hélice.
- `index.css`: tokens `--ov-*`, `ov-cta*`, `ov-anim-*`, `ov-plane-*`, `ov-scene-*`, bloque de niveles de calidad.

## Antes de crear algo nuevo
1. Busca con Grep el nombre del patrón (`useReducedMotion`, `ov-cta`, `MODEL_ASSETS`…). 2. Amplía el dato o el hook existente si encaja. 3. Si creas un módulo reutilizable, añádelo aquí.
