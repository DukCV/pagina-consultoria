# Arquitectura

## Capas
`constants/` (datos) → `engine3d/` (lógica pura y WebGL) → `hooks/` (estado y efectos) → `components/` (presentación). Los estilos de marca y de calidad viven en `src/index.css`.

## Arranque (`App.jsx`)
`useWelcomeToHeaderTransition({splashLogoAnchorRef, headerLogoRef, prefersReducedMotion})` devuelve `phase`, `exitState`, `isHeaderLogoVisible`, `isHeaderRevealed`, `isHeaderInteractive`, `handleWelcomeSettled`. `OverlayerSplash` se desmonta cuando `phase === 'complete'`. Tiempos en `TRANSITION_TIMINGS` (`brandTheme.js`). Con movimiento reducido la secuencia se acorta.

## Hero (`components/hero/`)
- `HeroBanner`: crea el contexto de calidad (`useGraphicsGovernor` → `GraphicsQualityContext.Provider`), marca su `<section class="ov-hero">` con `data-ov-quality` y `data-ov-quality-reason`, gestiona el teclado, el selector de especialidades (`role="group"`) y monta los CTAs (`HeroServiceActions`).
- `useHeroSlider`: índice activo, dirección de la transición, autoplay pausable y barra de progreso sin renders por fotograma.
- `useSpatialParallax`: escribe `--ov-rx/--ov-ry/--ov-spot-x/--ov-spot-y` en el contenedor (puntero, swipe, giroscopio opcional).
- `HeroSceneViewport`: `SCENE_REGISTRY[sceneKey]` con `SceneErrorBoundary` + `Suspense`, animaciones de entrada/salida (`ov-scene-enter-*`/`exit-*`) y `SceneActivityContext` (`isActive`) para pausar la escena que sale.
- `sceneRegistry.js`: 6 escenas por `sceneKey`; solo `custom-systems` va en el bundle principal; el resto con `lazy` + un reintento (`RETRY_DELAY_MS`). `models` lista los GLB de cada escena.
- `useScenePreloader`: tras una espera, anticipa en reposo (`requestIdleCallback`) las escenas y modelos siguientes si `settings.models3d` y la red es rápida.
- Escenas (`scenes/*Scene.jsx`): composiciones CSS/SVG por planos (`ov-plane-*`); `ImmersiveXrScene` y `AiAutomationScene` montan `Model3DShowcase`. `scenes/maintenance/` contiene las piezas isométricas de la escena 06 (`IsoCube`, `ExplodedPlatform`, `GlassSlab`…, colores en `sceneColors.js`).

## Motor 3D (`engine3d/` + `useWebglModelStage`)
- `glbLoader`: descarga y decodifica glTF 2.0 plano (sin Draco/Meshopt), caché en memoria, prioridad `high|low`, memoriza fallos 45 s (`hasRecentGlbFailure`), `clearGlbCache`.
- `webglPbrStage.createWebGLPbrStage`: shaders PBR, skinning (hasta 32 articulaciones), render bajo demanda. `math3d`: matrices y cuaterniones.
- `useWebglModelStage`: ciclo de vida del canvas; limita a ≈69 fps, DPR según `settings` del nivel, pausa por `isPaused`, `visibilitychange` y `IntersectionObserver`; ante fallo llama `onFailure` (→ 2D).
- `Model3DShowcase`: estados `data-render-mode` `loading-3d` → `ready-3d` | `fallback-2d`; `ModelPoster` pinta el render 2D (WebP responsive + PNG) con el mismo aspecto, así no hay saltos.

## Gobernador de calidad
1. `detectGraphicsCapabilities()` (una vez): WebGL2 sin «major performance caveat», renderizador por software (`swiftshader|llvmpipe|…`), límites de textura, memoria/núcleos/red → nivel inicial.
2. `createFramePerformanceMonitor`: ventanas de tiempo; varias lentas seguidas bajan un nivel. Un fallo de motor baja directo a `static`. `prefers-reduced-motion` fuerza `static` (`reason: 'reduced-motion'`).
3. La degradación se recuerda en `sessionStorage['ov-graphics-level']`.
4. Override de QA: `?ov-quality=full|balanced|static` (fija nivel) o `adaptive` (arranca en `full` y mantiene la adaptación).
5. `GRAPHICS_LEVELS` define `models3d`, `maxDpr`, `coarseMaxDpr`, `resolutionScale`; el CSS reacciona a `data-ov-quality`.

## Límites conocidos del estado actual
- El header es `relative z-40` (no sticky) y su altura es 76/82/86 px; las secciones destino aún no existen.
- El proveedor de calidad cuelga de `HeroBanner`; el header y futuras secciones no lo comparten (si hace falta, súbelo a `App`).
