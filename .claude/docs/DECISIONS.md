# Decisiones, pendientes y registro

Archivo vivo: lo actualiza `/handoff`. Mantenlo breve; si una entrada deja de ser cierta, corrígela o bórrala.

## Decisiones técnicas del proyecto
| Decisión | Motivo / evidencia |
|---|---|
| Motor WebGL2 PBR propio, sin three.js | control y peso: solo se renderizan dos modelos; `src/engine3d` |
| Degradación progresiva 3D → 2D en tres niveles (`full`/`balanced`/`static`) | primero se reduce resolución y efectos; los modelos pasan a 2D solo si no basta (`context/graphicsQuality.js`) |
| El nivel inicial sale de capacidades reales, no del tipo de dispositivo | render por software, límites de textura, memoria/red (`graphicsCapabilities.js`) |
| Renders 2D generados con el propio motor, mismo aspecto que el canvas | el cambio 2D↔3D no produce saltos (`tools/render-posters.mjs`) |
| GLB optimizados sin Draco/Meshopt | el motor solo entiende glTF 2.0 plano (`tools/optimize-models.mjs`) |
| Escenas del hero en chunks diferidos con un reintento | solo `custom-systems` en el bundle principal (`sceneRegistry.js`) |
| `?ov-quality=full|balanced|static|adaptive` | permite pruebas y soporte deterministas |

## Decisiones del entorno de IA (2026-10-30)
- `CLAUDE.md` en la raíz como índice (<80 líneas); detalle en reglas con `paths` (cargan solo al tocar esos archivos) y docs leídos bajo demanda (sin `@import`: los imports se cargan siempre).
- `AGENTS.md` no se crea: no hay otra herramienta de agentes; Claude solo lo lee si no hay `CLAUDE.md`.
- `.claudeignore` no tiene efecto en Claude Code → `Read` deny en `.claude/settings.json`.
- 8 agentes en lugar de 9: *Design System* se fusiona con `ui-ux-designer` (mismo contexto y archivos).
- Skills propias del proyecto; no se copia código de terceros. Descartadas con motivo: `Design` (8 conectores MCP), `Axe Accessibility` (suscripción de pago), plugin `playwright` MCP (duplica `@playwright/test`), `code-review`/`feature-dev` (ya existen `/code-review`, `/simplify`, `/security-review`), `ui-ux-pro-max` (698 archivos/20 MB, scripts Python, impone paletas), `threejs-skills` (el proyecto no usa three.js), `vercel-labs/agent-skills` (sin licencia declarada), `web-quality-skills` y `design-critique` (válidas y con licencia libre, pero se prefirió contenido propio y más breve). Headroom (oculta el header al bajar: contradice un header siempre accesible) y OmniRoute (gateway de proveedores de IA; el proyecto no hace llamadas de IA) no aplican.

## Pendientes
- **Sección «Servicios»** bajo el hero (brief: doble hélice 3D con scroll fijado, header sticky, seis servicios con descripción, beneficio y CTA). Se implementó en una sesión anterior y se revirtió; no hay código en el repo. Diseño validado entonces: proyección en JS + canvas 2D (sin `preserve-3d`), modelos reales solo en el protagonista, modo manual con movimiento reducido o alturas < 600 px, panel de texto en móvil.
- Header no sticky y proveedor de calidad local a `HeroBanner` (ver `ARCHITECTURE.md`).
- Secciones destino `#sectores`, `#nosotros`, `#contactanos` sin construir.
- `public/models/` publica ~17 MB de modelos fuente (`oculus-quest-3/`, `Mannequin Character/`) que el runtime no usa (lo dice su README): moverlos a `models-source/`.
- Residuos vacíos y sin seguimiento de git de una sesión anterior: `src/components/services/`, `src/components/ui/`, `src/components/hero/scenes/infrastructure/` (se pueden borrar).
- `README.md` raíz mínimo (solo comandos).
- **Hallazgos de la primera auditoría (`node e2e/audit.mjs`, build, escritorio, calidad `static`, 2026-10-30; sin corregir por estar fuera de alcance):** sin `meta description`, `canonical`, Open Graph/Twitter, JSON-LD, `robots.txt` ni `sitemap.xml`; axe: 1 regla seria `label-content-name-mismatch` en 6 botones del selector de especialidades (el `aria-label` «01. Título» no contiene el texto visible); LCP ≈ 8,9 s con la bienvenida terminando a ≈ 7,8 s; 39 tareas largas (>50 ms) durante carga y animaciones (WebGL por software, solo comparativo); CLS 0,0002; JS 113 kB, CSS 13 kB transferidos.

## Registro de cambios
- 2026-10-30: creada la configuración de IA (`CLAUDE.md`, `.claude/{rules,docs,skills,agents}`, Playwright, `check:ai`). Sin cambios en `src/`.
