# Overlayer — visión general

## Qué es
Sitio web de una sola página de **Overlayer**, consultora de tecnología. Servicios que comunica: sistemas a la medida, realidad virtual/aumentada, automatización con IA, infraestructura, sistemas y páginas web, mantenimiento y mejoras. No hay backend ni llamadas a APIs propias.

## Stack (de `package.json`)
React 19 · Vite 8 (`@vitejs/plugin-react`, `assetsInclude` para `.glb/.gltf/.hdr`) · Tailwind CSS v4 (`@tailwindcss/vite`, `@import "tailwindcss"` en `src/index.css`) · oxlint (plugins `react`, `oxc`) · `node --test`. Sin TypeScript. Sin three.js: motor WebGL2 propio.

## Scripts
`dev`, `build`, `preview`, `lint`, `test` (unitarias `src/**/*.test.js`). Tras la configuración de IA: `test:e2e` (Playwright) y `check:ai`.

## Estructura
```
index.html              fuente Outfit, lang="es", theme-color #DADDD8
src/main.jsx            StrictMode + <App/>
src/App.jsx             bienvenida → header → <main> con el hero
src/components/         header, logotipo, bienvenida y hero/ (escenas)
src/engine3d/           WebGL2 PBR, cargador GLB, capacidades, monitor de fps
src/hooks/              slider, parallax, gobernador de calidad, bienvenida→header
src/context/            niveles de calidad gráfica
src/constants/          marca, contenido del hero, activos 3D
src/utils/              followSectionLink
src/assets/             geometría vectorial del logotipo
tools/                  optimize-models.mjs, render-posters.mjs (dependencias solo --no-save)
models-source/          GLB originales (no se publican)
public/models/          GLB optimizados y renders 2D (sí se publican)
```

## Flujo de ejecución
1. `OverlayerSplash` anima el logotipo; `useWelcomeToHeaderTransition` coordina el vuelo del logotipo al header (`phase` → `complete`). Mientras tanto el scroll del `body` está bloqueado y `<main>` es `inert`.
2. `HeroBanner` muestra una de 6 especialidades (slider con autoplay, teclado, gestos, parallax). Cada una tiene escena propia; dos usan modelos 3D reales con alternativa 2D.
3. El nivel de calidad (`full` / `balanced` / `static`) se decide por capacidades reales + rendimiento medido y gobierna 3D y efectos CSS.

## Estado
Implementado: bienvenida, header, hero completo con CTAs («Saber más», «Contáctanos»), degradación 3D→2D, pruebas unitarias del motor. Los destinos `#servicios`, `#sectores`, `#nosotros`, `#contactanos` del header **aún no existen** como secciones (`followSectionLink` actualiza el hash sin saltos). Pendientes en `DECISIONS.md`.
