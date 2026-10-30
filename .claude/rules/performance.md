---
paths:
  - "src/engine3d/**"
  - "src/hooks/**"
  - "src/components/**"
  - "src/index.css"
---

# Rendimiento

- Anima solo `transform` y `opacity`; evita animar `width/height/top/left` y filtros caros sobre canvas WebGL.
- Todo efecto costoso debe degradarse por nivel: `full` (todo) → `balanced` (sin `backdrop-blur`, sombras proyectadas ni animaciones SVG) → `static` (renders 2D, sin capas 3D). Los selectores viven en el bloque «NIVELES DE CALIDAD» de `index.css` (`data-ov-quality`).
- WebGL: solo la escena activa renderiza; pausa con pestaña oculta (`visibilitychange`), fuera de vista (`IntersectionObserver`) y al salir de escena (`useSceneActivity`). Limita DPR con `GRAPHICS_LEVELS` y libera contextos y GLB (`clearGlbCache`) al desmontar.
- Un fallo gráfico baja a 2D con `reportFailure`; nunca bloquees la página esperando WebGL.
- Los modelos nuevos pasan por `tools/optimize-models.mjs` y tienen render 2D (`tools/render-posters.mjs`) del mismo aspecto; sube `MODELS_ASSET_VERSION` al regenerarlos.
- Imágenes: WebP responsive con `srcset`/`sizes` y PNG de respaldo, dimensiones reservadas (sin saltos de layout).
- Código no crítico en chunks diferidos; no añadas dependencias que dupliquen lo que ya hay.
- Mide antes de optimizar: CLS/LCP con `PerformanceObserver`, fotogramas con rAF en Playwright (skill `web-audit`). SwiftShader (render por software) no representa a una GPU real: compara niveles, no valores absolutos.
