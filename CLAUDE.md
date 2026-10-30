# Overlayer — sitio de consultoría tecnológica

Sitio de una sola página (React 19 + Vite 8 + Tailwind v4, sin backend). Flujo actual: pantalla de bienvenida → header → hero con 6 especialidades (escenas CSS/SVG y dos modelos 3D reales). Motor WebGL2 propio en `src/engine3d` (**sin three.js**). Idioma del proyecto y de los comentarios: español.

## Comandos
- `npm run dev` · `npm run build` · `npm run preview` · `npm run lint` (oxlint)
- `npm test` → `node --test "src/**/*.test.js"` (solo lógica pura, sin DOM)
- `npm run test:e2e` → Playwright (`e2e/`, usa el Chrome del sistema)
- `npm run check:ai` → valida y mide esta configuración (`.claude/`)

## Mapa
- `src/App.jsx` secuencia bienvenida→header→`main` · `src/components/hero/` hero (escenas lazy en `scenes/`)
- `src/engine3d/` WebGL2 PBR, GLB, capacidades y monitor de fps · `src/hooks/` lógica reutilizable
- `src/context/graphicsQuality.js` niveles `full | balanced | static` · `src/constants/` contenido y datos
- `src/index.css` tokens y clases `ov-*` · `tools/` scripts de modelos · `public/models/` GLB y renders 2D

## Convenciones (resumen; detalle en `.claude/rules/`)
- Contenido, textos y parámetros en `src/constants/`, no dentro del JSX. Lógica en hooks/funciones puras.
- Componentes función con `export default`; estado que cambia por fotograma → refs/CSS vars, no `useState`.
- Colores de marca por `OVERLAYER_PALETTE` (`src/constants/brandTheme.js`) o variables `--ov-*`; clases propias `ov-*` en `index.css`.
- Los módulos que se prueban con `node --test` importan con extensión `.js` y no usan `import.meta.env` sin `?.`.
- Respetar `prefers-reduced-motion` y los niveles de calidad (`data-ov-quality`) en toda animación o efecto costoso.

## Identidad visual
Tecnológica, premium, con profundidad y sin apariencia de plantilla. Paleta: `#484041` carbón · `#419D78` esmeralda · `#434371` índigo · `#B5F44A` lima (solo acentos e indicadores puntuales) · `#DADDD8` gris claro. Usarla con criterio, no en todo. Referencia: `.claude/docs/DESIGN_SYSTEM.md`.

## Reglas de trabajo
- Haz solo lo pedido: sin refactors, renombrados ni dependencias nuevas sin justificarlas.
- Reutiliza antes de crear: consulta `.claude/docs/COMPONENTS.md` y busca con Grep/Glob.
- Un único escritor por archivo a la vez; en paralelo solo tareas de lectura o con archivos disjuntos.
- Lee fragmentos (`offset`/`limit`, Grep con contexto), no archivos completos; no repitas exploraciones ya hechas en la sesión.
- Antes de un cambio no trivial: alcance → archivos implicados → plan breve. Verifica con la prueba más pequeña que sirva.
- No leas `dist/`, `node_modules/`, `models-source/`, `public/models/` ni `package-lock.json` (denegado en `settings.json`).

## Ruteo (usa solo lo necesario; las tareas simples se resuelven directamente)
| Tarea | Recurso | Lee antes |
|---|---|---|
| Diseñar o criticar una interfaz, sistema de diseño | agente `ui-ux-designer`, skills `frontend-design`, `ui-review` | `DESIGN_SYSTEM.md` |
| Implementar componentes, páginas, hooks | agente `frontend-developer`, skill `add-section` | `COMPONENTS.md`, `DEVELOPMENT_GUIDELINES.md` |
| 3D, WebGL, modelos, animación, transiciones | agente `motion-3d-engineer`, skill `webgl-3d` | `ARCHITECTURE.md` |
| Rendimiento, carga, recursos | agente `performance-engineer`, skill `web-audit` | `ARCHITECTURE.md` |
| Pruebas, regresiones, accesibilidad | agente `qa-engineer`, skill `e2e-playwright` | `.claude/rules/testing.md` |
| Revisar cambios (calidad, seguridad) | agente `code-reviewer`, `/code-review`, `/security-review` | — |
| Metadatos, semántica, SEO técnico | agente `seo-specialist`, skill `web-audit` | `index.html` |
| Tarea grande con varias áreas | agente `project-coordinator` (opcional: `claude --agent project-coordinator`) | `DECISIONS.md` |

## Sesiones largas
Al terminar un bloque grande o antes de compactar, ejecuta `/handoff`: deja decisiones y pendientes en `.claude/docs/DECISIONS.md`. Tras compactar, lee ese archivo en vez de re-explorar.

## Documentación (se lee bajo demanda, no se importa)
`.claude/docs/`: `PROJECT_OVERVIEW.md` · `ARCHITECTURE.md` · `DESIGN_SYSTEM.md` · `COMPONENTS.md` · `DEVELOPMENT_GUIDELINES.md` · `DECISIONS.md`. Uso y mantenimiento de agentes y skills: `.claude/README.md`.
