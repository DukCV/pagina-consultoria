---
name: add-section
description: Guía para añadir una sección o pantalla nueva a Overlayer (servicios, sectores, nosotros, contacto) siguiendo los patrones del repo: datos en constants, carga diferida con esqueleto, anclas del header, niveles de calidad, accesibilidad y pruebas. Úsala al construir una sección nueva.
---

# Añadir una sección

1. **Alcance y reutilización:** lee `.claude/docs/COMPONENTS.md` y `DEVELOPMENT_GUIDELINES.md`. Busca antes de crear (CTAs `ov-cta`, `useReducedMotion`, `useGraphicsQuality`, `MODEL_ASSETS`).
2. **Contenido en datos:** `src/constants/<seccion>.js` (textos, listas, orden, ids). El JSX solo pinta. Textos breves, sin promesas ni cifras no respaldadas.
3. **Estructura:** carpeta `src/components/<seccion>/` con un contenedor, piezas pequeñas y, si hay lógica de estado/scroll, un hook propio. `<section id="…" aria-labelledby>` con el `id` que ya enlaza el header (`NAVIGATION_ITEMS`: `servicios`, `sectores`, `nosotros`, `contactanos`) y `h2` (el `h1` es del hero).
4. **Montaje:** se añade en `App.jsx` dentro de `<main>` tras `HeroBanner`. Si es pesada: `lazy` + `Suspense` con un esqueleto de **las mismas dimensiones** (sin saltos de layout) y carga cuando la bienvenida termina (`isHeaderRevealed`).
5. **Header y anclas:** las anclas deben dejar el título por debajo del header (`scroll-padding-top`/`--ov-header-h` si existen; el header mide 76/82/86 px). `followSectionLink` ya cubre secciones que aún no existen.
6. **Calidad y movimiento:** efectos costosos con variante `balanced`/`static` (`data-ov-quality` en la sección; selectores en el bloque de calidad de `index.css`); `prefers-reduced-motion` respetado; animar solo `transform`/`opacity`.
7. **Si hay scroll vinculado o sticky:** un único oyente de scroll pasivo por sección, rAF solo mientras algo se mueve, pausa fuera de vista; ofrece alternativa manual (botones/teclado) para movimiento reducido y alturas bajas.
8. **Accesibilidad:** encabezados, foco visible, `aria-live` breve para cambios, controles compuestos con flechas/Inicio/Fin, contenido oculto `inert`/`aria-hidden`.
9. **Pruebas:** unitarias para la lógica pura (`*.test.js`) y un spec en `e2e/` con responsive, teclado y axe (skill `e2e-playwright`).
10. **Cierre:** `npm run lint`, pruebas, `npm run build`; actualiza `COMPONENTS.md` y, si hubo una decisión no obvia, `DECISIONS.md`.

Delegación sugerida: diseño → `ui-ux-designer`; implementación → `frontend-developer`; 3D → `motion-3d-engineer`; pruebas → `qa-engineer`; revisión final → `code-reviewer`. Un solo escritor por archivo.
