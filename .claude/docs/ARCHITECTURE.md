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

## Motor 3D ampliado para escenas compuestas
`createWebGLPbrStage(canvas, asset, {preset, poses, ...})` admite además `preset: 'scene'` (sin giro por puntero, cámara explícita) y `poses: ['quest3','ai-character']` para animar nodos por nombre en un asset fusionado. Opciones **opcionales** (el hero no las usa y sus renders no cambian: comprobado con hashes de 4 renders):
- `renderFrame({camera:{eye,target,fovDeg}, fog:{color,near,far}})`, `setNodeTransform(s)`, `project(punto)`, emisivo plano, pasada de mezcla (`alphaMode:'BLEND'`, `extras.additive`) ordenada de atrás hacia delante.
- Mezcla alfa, doble cara y emisivo plano siguen la semántica glTF en todos los presets. Los 7 materiales de los GLB del hero no los usan (comprobado en el navegador) y sus renders son idénticos por hash; un GLB nuevo que sí los use se verá con esa semántica.
- `primitives.js` (caja, esfera, cilindro, toro, tubo, engranaje, plano, `mergeGeometries`) y `sceneAsset.js` (`buildSceneAsset`, `mergeAssets`, `overrideMaterials`) crean y combinan assets sin tocar el GLB cacheado.

## Sección de Servicios (`components/services/`)
Pantalla fijada (sticky) bajo el hero con una doble hélice 3D real que gira con el scroll.
- `ServicesSection` (carcasa + `Suspense` + esqueleto de igual altura; `data-mode`, `data-ov-quality`) → `ServicesHelix` (lazy: texto, navegación, etiquetas).
- `helix3d/helixRig.js` (puro): hilos, un cuarto de vuelta por servicio, cámara, mesetas (`displayProgress`), scroll↔progreso. `helix3d/useHelixController.js`: **único** oyente de scroll, progreso suavizado en rAF solo mientras algo se mueve.
- `helix3d/useHelixRenderer.js` (envuelve `scene3d/useSceneRenderer.js`): ciclo de vida del stage (`loading-3d` → `ready-3d` | `fallback-2d`), pausa fuera de vista, DPR por nivel con presupuesto de píxeles, `webglcontextlost` → 2D. El 3D solo existe con la sección cerca (`useNearViewport`): se libera a los 6 s de alejarse.
- `helix3d/buildHelixScene.js` + `objects/*` (estructura, 6 objetos, anillos lima; utilidades y texturas en `scene3d/`) + `sceneRuntime.js` (transformaciones por fotograma, cámara, etiquetas DOM). Quest 3 e IA son los GLB del hero, fusionados.
- Alternativa 2D: `HelixFrames` + `frameSequence.js` (fotogramas de la misma escena, `tools/render-helix-frames.mjs`); también sirve de vista previa mientras el 3D carga. La posición del eje 3D la fija el CSS (`--ov-axis-x`).
- Modo manual (`data-mode="manual"`): movimiento reducido o altura < 600 px; sin sticky ni scroll vinculado.

## Sección de Sectores (`components/sectors/`)
Slider de cinco diapositivas arriba y, debajo, una ciudad 3D que la cámara recorre en órbita al cambiar de diapositiva.
- `SectorsSlider` guarda el destino pedido (mueve cámara e indicadores al instante) y el texto visible, que sale al empezar el viaje y entra al 55 % (`SWAP_FRACTION`); sus temporizadores usan la misma `durationFor` que la cámara, así que el texto va sincronizado aunque el 3D no haya cargado. `CityStage` es lazy.
- `city3d/cityCamera.js` + `cityMotion.js` (puros): ángulo lineal (72° por paso, siempre el mismo sentido), encuadre por parada interpolado con «vuelo» a mitad de tramo; el viaje es una Hermite con tangente final nula que arranca con la velocidad actual (pulsar de nuevo no da saltos). `useCityController`: único rAF, solo corre mientras hay movimiento.
- `city3d/cityRig.js`: disco de radio 13, plaza con el logotipo, avenida circular, 5 distritos de 72° con 5 lotes (hileras A y B). `district/*.js` pintan cada tipo de lote con `scene3d/brush.js` (fusión por capa de `cityMaterials.js`: la ciudad entera son ≈ 15 mallas) y `logoMonument.js` gira hacia la cámara para que el isotipo se lea desde cada parada.
- Calidad por capacidades reales: `full` (vehículos, anillos animados, paralaje, reposo a 24 fps), `balanced` (`detail 0`, sin vehículos ni paralaje), `static`/fallo/movimiento reducido → fotogramas WebP de las cinco paradas (`tools/render-city-frames.mjs`, juegos `wide` 1,9:1 y `square` 1:1 según `--ov-sec-aspect`).

## Estado compartido
`GraphicsQualityProvider` (en `App`) da el mismo nivel de calidad al header, al hero y a la sección; el header es `sticky` (translúcido al hacer scroll) y `--ov-header-h` (76/82/86 px) fija la altura que respetan anclas y pantalla fijada. «Saber más» del hero enfoca el servicio vía `utils/serviceFocus.js`.

## Límites conocidos
- Las secciones `#sectores`, `#nosotros` y `#contactanos` aún no existen (`followSectionLink`).
- El render por software (SwiftShader) hace el 3D inviable en pruebas automáticas salvo con `?ov-quality=full` y esperas largas.
