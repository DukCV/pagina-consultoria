---
paths:
  - "src/**/*.{jsx,css}"
  - "index.html"
---

# UI/UX e identidad visual

- Paleta oficial (`src/constants/brandTheme.js`): carbón `#484041` superficies y texto principal · esmeralda `#419D78` acentos e interacción · índigo `#434371` profundidad · lima `#B5F44A` solo acentos puntuales e indicadores activos · gris claro `#DADDD8` fondos claros y texto sobre carbón. No la apliques en bloque a todo componente.
- Tonos intermedios (sombras, caras de cubos, vidrio) derivan de la paleta; los ya usados están en `scenes/maintenance/sceneColors.js`. No inventes colores ajenos.
- Tipografía: Outfit (300–600, ya cargada en `index.html`). Jerarquía clara por tamaño y peso; líneas de texto < 80 caracteres.
- Botones: reutiliza `ov-cta`, `ov-cta--primary` y `ov-cta--ghost` (`index.css`); el halo toma `--ov-cta-glow`.
- Profundidad: capas con sombra y escala; evita planos genéricos o tarjetas idénticas repetidas. Cada pieza nueva debe parecer de este sitio, no de una plantilla.
- Responsive real: diseña móvil, tableta y escritorio por separado; el header ocupa 76/82/86 px (móvil/sm/lg, barra + filetes) y el hero resta esa altura (`min-h-[calc(100svh-76px)]`…).
- Un texto = un trabajo: copy breve, verbos claros en las llamadas a la acción, sin promesas ni cifras no respaldadas.
- Cambios de diseño: describe primero la intención (jerarquía, ritmo, contraste) y valida con capturas (`ui-review`).
