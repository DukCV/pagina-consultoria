---
paths:
  - "src/**/*.{jsx,css}"
  - "index.html"
---

# Accesibilidad (WCAG 2.2 AA)

- Estructura semántica: un `h1`, jerarquía de encabezados sin saltos, `section` con `aria-labelledby`, `nav` con etiqueta; `lang="es"` ya está en `index.html`.
- Foco visible en todo interactivo (`focus-visible`, contorno lima/índigo como en `ov-cta`); orden de tabulación lógico; sin trampas de teclado.
- Controles compuestos: el selector del hero usa `role="group"`, botones con `aria-current` y flechas en el contenedor (`handleSliderKeyDown`). En controles nuevos con varios elementos usa un único punto de tabulación (roving tabindex) con flechas, Inicio y Fin.
- Contenido no visible o decorativo: `aria-hidden="true"` (escenas, canvas, ornamentos) o `inert` (zonas no interactivas); nunca dejes enlaces enfocables ocultos.
- Cambios dinámicos importantes: región `aria-live="polite"` con texto breve y con retraso, no en cada fotograma.
- Movimiento: respeta `prefers-reduced-motion` (`useReducedMotion` y la regla `data-ov-quality-reason='reduced-motion'`); ninguna información solo por animación.
- Contraste ≥ 4,5:1 (texto normal) y 3:1 (grande/UI); no uses solo el color para indicar estado. Objetivos táctiles ≥ 44 px cuando sea posible.
- Imágenes informativas con `alt`; renders 2D de modelos son decorativos (`alt=""`).
- Verifica con axe (`@axe-core/playwright`) y teclado real; documenta lo que no se pueda automatizar.
