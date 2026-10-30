---
name: webgl-3d
description: Trabaja con el motor WebGL2 propio de Overlayer (sin three.js): añadir o cambiar un modelo GLB y su render 2D, ajustar presets de cámara, degradación 3D→2D, pausa y liberación de recursos. Úsala para modelos 3D, escenas con modelo, rendimiento WebGL o fallos de carga.
---

# Motor 3D de Overlayer

**Lee primero** `.claude/docs/ARCHITECTURE.md` (secciones «Motor 3D» y «Gobernador de calidad»). El motor solo entiende **glTF 2.0 plano** (sin Draco/Meshopt/cuantización).

## Añadir o sustituir un modelo
1. Original en `models-source/`. Optimiza: `node tools/optimize-models.mjs <in.glb> <out.glb> --tex 512 [--plan '{...}']` (sus dependencias: `npm i --no-save @gltf-transform/core @gltf-transform/functions meshoptimizer sharp`; no se guardan en el proyecto).
2. Copia el resultado a `public/models/overlayer-optimized/`.
3. Registra en `src/constants/modelAssets.js`: `id`, `preset`, `glbUrl` (con `?v=${MODELS_ASSET_VERSION}`), `poster` (`createPoster(nombre, sizes)`). Sube `MODELS_ASSET_VERSION` si regeneras archivos existentes.
4. Render 2D: con `npm run dev` activo, `node tools/render-posters.mjs` (requiere `npm i --no-save playwright-core sharp` y Chrome). Debe tener el **mismo aspecto** que el canvas de la escena; los nombres y anchos coinciden con `modelAssets.js`.
5. En la escena: `<Model3DShowcase model={MODEL_ASSETS.x} className="..."/>` con dimensiones reservadas por `className`. Añade el modelo a `models` de su entrada en `components/hero/sceneRegistry.js` para que el precargador lo anticipe.
6. Si necesita encuadre propio: nuevo `preset` en `engine3d/webglPbrStage.js` (hoy `quest3` y `ai-character`: cámara, luces y respuesta al puntero).

## Reglas del motor
- Solo la escena activa renderiza: respeta `isPaused`, `visibilitychange` e `IntersectionObserver` de `useWebglModelStage`; libera contexto y memoria al desmontar.
- DPR y resolución salen de `GRAPHICS_LEVELS`; nunca fuerces calidad por tu cuenta. Ante fallo: `reportFailure` → 2D, nunca pantalla vacía.
- Nada de WebGL en renders de React por fotograma; estado discreto en React, continuo en rAF/refs.
- Funciones puras (matemática, monitores) con prueba en `src/engine3d/*.test.js`.

## Verificación
`npm test` (motor), `?ov-quality=static` para el 2D (render y alternativa), `?ov-quality=full` para confirmar que el canvas monta y se libera (lento con SwiftShader), y que cambiar de escena no deja canvas huérfanos (`document.querySelectorAll('canvas')`).
