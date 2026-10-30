# Guía de desarrollo

## Flujo de una tarea
1. **Alcance:** qué se pide y qué no. Identifica los archivos implicados con Grep/Glob y `COMPONENTS.md`; no explores el repositorio entero.
2. **Plan breve** si el cambio toca más de un módulo; divide tareas grandes en subtareas con archivos disjuntos.
3. **Implementa** con cambios mínimos, reutilizando componentes, hooks, constantes y clases `ov-*`.
4. **Verifica** con la prueba más pequeña posible: `npm run lint`; test unitario del módulo; `npm run build` si tocaste imports/CSS; Playwright (`e2e-playwright`) si cambia la interfaz.
5. **Entrega:** archivos modificados, qué se verificó y qué queda pendiente. Sin documentación extensa que nadie leerá.

## Convenciones de código (observadas en el repo)
- Español en comentarios y textos; los comentarios explican el porqué (intención, límites, valores elegidos), no el qué.
- Constantes con nombre y unidad (`RETRY_DELAY_MS`, `MIN_FRAME_INTERVAL_MS`); JSDoc `/** */` al inicio de módulos y componentes no triviales.
- Funciones puras sin DOM para lo que se pueda probar (`framePerformanceMonitor`, `evaluateCapabilities`); el DOM entra por parámetros o en hooks.
- Efectos con limpieza; `requestAnimationFrame` solo mientras hay algo que mover; sin renders de React por fotograma.
- Tailwind v4 con valores arbitrarios de la paleta (`bg-[#419D78]`); CSS propio solo para lo que Tailwind no expresa (planos 3D, keyframes, niveles de calidad).
- Accesibilidad y movimiento reducido desde el primer commit de una pieza, no después.

## Dependencias y herramientas
- Producción: solo React, React DOM, Tailwind y su plugin de Vite. Añadir una dependencia exige justificarla (qué resuelve que el código actual no).
- Herramientas de modelos (`tools/`): sus dependencias se instalan **sin guardar** (`npm i --no-save …`) y no forman parte del proyecto.
- Pruebas de interfaz: `@playwright/test` y `@axe-core/playwright` como devDependencies; el navegador es el Chrome del sistema.

## Activos 3D
Original en `models-source/` → `node tools/optimize-models.mjs` (GLB plano glTF 2.0) → `public/models/overlayer-optimized/` → render 2D con `node tools/render-posters.mjs` (requiere `npm run dev`) → registrar en `constants/modelAssets.js` y en la escena (`sceneRegistry` lista los `models` para precarga) → subir `MODELS_ASSET_VERSION`.

## Fotogramas 2D de la hélice
Si cambia la escena 3D de Servicios, regenera los fotogramas: `npm run dev` y `node tools/render-helix-frames.mjs --url http://localhost:5173` (sin dependencias nuevas; usa el Chrome del sistema). Los nombres y anchos deben coincidir con `components/services/frameSequence.js`.

## Git
El repositorio tiene un único commit inicial. **No hagas commits ni pushes salvo que el usuario lo pida.** `dist/` y `node_modules/` están ignorados; `CLAUDE.local.md` y los informes de Playwright también.

## Definición de hecho
Lint limpio · prueba pertinente pasa · sin errores de consola en el flujo afectado · responsive revisado (móvil/tableta/escritorio) · niveles `balanced`/`static` y movimiento reducido contemplados · sin duplicar código existente · documentación mínima actualizada (`COMPONENTS.md` o `DECISIONS.md` si procede).
