# Entorno de IA de Overlayer — guía de uso y mantenimiento

Objetivo: que Claude trabaje con el contexto justo. `CLAUDE.md` (raíz) es el índice; esta carpeta guarda lo demás.

## Estructura
```
CLAUDE.md                índice siempre cargado (<80 líneas) + tabla de ruteo
CLAUDE.local.md          entorno local, gitignorado
.claude/settings.json    plugin frontend-design habilitado + `Read` deny de dist, node_modules, modelos y lockfile
.claude/rules/           6 reglas con `paths`: solo cargan al leer/editar archivos coincidentes
.claude/skills/          6 procedimientos bajo demanda (+ plugin frontend-design)
.claude/agents/          8 agentes con herramientas acotadas
.claude/docs/            referencia leída bajo demanda (no se importa)
e2e/ · playwright.config.js   pruebas de interfaz y utilidades (shoot.mjs, audit.mjs)
tools/check-claude-config.mjs validador (npm run check:ai)
```

## Cómo se invoca cada recurso
| Recurso | Cómo | Para qué |
|---|---|---|
| `ui-ux-designer` | «usa el agente ui-ux-designer para…» o `@agent-ui-ux-designer` | especificar/criticar diseño; mantiene `DESIGN_SYSTEM.md` |
| `frontend-developer` | ídem | implementar código de `src/` |
| `motion-3d-engineer` | ídem | motor WebGL, modelos, escenas, animación |
| `performance-engineer` | ídem | medir y optimizar con `e2e/audit.mjs` |
| `qa-engineer` | ídem | pruebas E2E/unitarias, regresiones, axe |
| `code-reviewer` | ídem (solo lectura) | revisión de calidad y seguridad del diff |
| `seo-specialist` | ídem | `index.html`, metadatos, semántica |
| `project-coordinator` | `claude --agent project-coordinator` (opcional) | tareas multiárea; por defecto el ruteo lo hace `CLAUDE.md` |
| `/ui-review` | skill; también se activa por descripción | capturas a 3 anchos + crítica con el sistema de diseño |
| `/web-audit` | ídem | LCP/CLS/peso, SEO técnico y axe medidos |
| `/e2e-playwright` | ídem | escribir y ejecutar pruebas Playwright |
| `/webgl-3d` | ídem | modelos GLB, posters, presets, degradación 3D→2D |
| `/add-section` | ídem | patrón para secciones nuevas |
| `/handoff` | solo manual | resumen de continuidad en `DECISIONS.md` |
| `frontend-design` | plugin ya instalado | propuestas de diseño diferenciadas |
| `/code-review`, `/simplify`, `/security-review` | integradas en Claude Code | revisión, simplificación y seguridad |

Comandos de Claude Code para comprobar lo cargado (ejecútalos tú): `/agents`, `/context`, `/memory`, `/status`.

## Cargar los recursos nuevos
Claude Code detecta en caliente los cambios dentro de `agents/` y `skills/`, **pero no las carpetas de primer nivel creadas durante una sesión abierta**: tras clonar el repo o crear estas carpetas, ejecuta `/reload-skills` (skills) y reinicia la sesión o recarga la ventana de VS Code (agentes). Luego comprueba con `/agents` y `/context`. Las reglas con `paths` y `CLAUDE.md` se cargan sin reiniciar (comprobado: al leer `src/utils/followSectionLink.js` se inyectaron `frontend.md` y `code-quality.md`).

## Esencial u opcional
- **Esencial:** `CLAUDE.md`, reglas, `docs/`, agentes `frontend-developer`, `code-reviewer`, `qa-engineer`, skills `ui-review`, `web-audit`, `e2e-playwright`.
- **Opcional:** `project-coordinator` (solo con `--agent`), `seo-specialist`, `performance-engineer`, `motion-3d-engineer` (cuando haya trabajo de esa área), `add-section`, `webgl-3d`, `handoff`, `CLAUDE.local.md`.

## Cómo se ahorra contexto (medible con `npm run check:ai`)
Contexto fijo = `CLAUDE.md` + `CLAUDE.local.md` + descripciones de skills y agentes. Todo lo demás carga solo al usarse: reglas por `paths`, cuerpos de skills y agentes, `docs/`. El comando imprime ambos totales (estimación caracteres/4). No hay cifras de ahorro frente a «antes»: lo medible es el tamaño del contexto fijo y que las lecturas inútiles (`dist/`, `node_modules/`, modelos, `package-lock.json`) se denieguen en `settings.json`.

## Mantenimiento
1. **Regla nueva:** archivo en `rules/` con `paths` lo más estrecho posible; sin `paths` solo si debe aplicar siempre.
2. **Skill/agente nuevo:** descripción corta con disparadores explícitos y distintos de los existentes; cuerpo < 500 líneas; herramientas mínimas. No dupliques funciones.
3. **Tras cambiar estructura o módulos:** actualiza `docs/COMPONENTS.md`; decisiones y pendientes en `DECISIONS.md` (`/handoff`).
4. **Siempre:** `npm run check:ai` (frontmatter, `paths`, rutas citadas, duplicados, tamaños). Corrige errores; revisa avisos.
5. **Terceros:** no se copió código de terceros. Antes de instalar una skill externa, lee su `SKILL.md` completo (`allowed-tools`, comandos `!` y scripts) y fija su commit. Descartadas y motivos: `docs/DECISIONS.md`.
6. Revisa de vez en cuando que `CLAUDE.md`, reglas y docs no se contradigan; ante contradicción Claude puede elegir una al azar.
