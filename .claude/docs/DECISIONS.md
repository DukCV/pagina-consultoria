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
| Sección de Servicios con 3D real en el stage propio ampliado (no CSS 3D ni tarjetas proyectadas) | `preserve-3d` produce recortes por BSP en Chrome; el motor ya tenía PBR, GLB y niveles. Se amplió con opciones **opcionales** y se verificó con hashes de renders del hero (idénticos) |
| Alternativa 2D = fotogramas pre-renderizados de la misma escena (`tools/render-helix-frames.mjs`) | conserva composición y profundidad; también es la vista previa mientras el 3D compila |
| El 3D solo existe con la sección cerca de pantalla y se libera a los 6 s | libera GPU/contexto y no compite con los modelos del hero (`useNearViewport`) |
| Un único oyente de scroll por sección (`useHelixController`); `--ov-axis-x` en CSS fija el eje 3D | evita dos sistemas de scroll y deja el diseño responsive en el CSS |
| `scroll-behavior: smooth` global (solo sin `prefers-reduced-motion`) + `scroll-padding-top: var(--ov-header-h)` | los anclajes y `goToStep` se desplazan suavemente y quedan bajo el header sticky; afecta a todo el sitio, es intencional |
| Header sticky nativo + `useIsScrolled`; sin Headroom | Headroom oculta el header al bajar y duplicaría el oyente de scroll |
| Hélice: un cuarto de vuelta por servicio, cámara que baja un paso | el activo queda siempre al frente y los vecinos a ±90°: cada paso es la misma imagen desplazada |

## Decisiones del entorno de IA (2026-10-30)
- `CLAUDE.md` en la raíz como índice (<80 líneas); detalle en reglas con `paths` (cargan solo al tocar esos archivos) y docs leídos bajo demanda (sin `@import`: los imports se cargan siempre).
- `AGENTS.md` no se crea: no hay otra herramienta de agentes; Claude solo lo lee si no hay `CLAUDE.md`.
- `.claudeignore` no tiene efecto en Claude Code → `Read` deny en `.claude/settings.json`.
- 8 agentes en lugar de 9: *Design System* se fusiona con `ui-ux-designer` (mismo contexto y archivos).
- Skills propias del proyecto; no se copia código de terceros. Descartadas con motivo: `Design` (8 conectores MCP), `Axe Accessibility` (suscripción de pago), plugin `playwright` MCP (duplica `@playwright/test`), `code-review`/`feature-dev` (ya existen `/code-review`, `/simplify`, `/security-review`), `ui-ux-pro-max` (698 archivos/20 MB, scripts Python, impone paletas), `threejs-skills` (el proyecto no usa three.js), `vercel-labs/agent-skills` (sin licencia declarada), `web-quality-skills` y `design-critique` (válidas y con licencia libre, pero se prefirió contenido propio y más breve). Headroom (oculta el header al bajar: contradice un header siempre accesible) y OmniRoute (gateway de proveedores de IA; el proyecto no hace llamadas de IA) no aplican.

## Pendientes
- Secciones destino `#sectores`, `#nosotros`, `#contactanos` sin construir.
- `public/models/` publica ~17 MB de modelos fuente (`oculus-quest-3/`, `Mannequin Character/`) que el runtime no usa (lo dice su README): moverlos a `models-source/`.
- `README.md` raíz mínimo (solo comandos).
- Sin GPU real en el entorno de pruebas: el rendimiento del 3D se validó solo comparando niveles (SwiftShader) y comprobando la degradación automática `full → balanced → static`. Conviene medir en un equipo real de gama media y baja.
- **Hallazgos de la primera auditoría (`node e2e/audit.mjs`, build, escritorio, calidad `static`, 2026-10-30; sin corregir por estar fuera de alcance):** sin `meta description`, `canonical`, Open Graph/Twitter, JSON-LD, `robots.txt` ni `sitemap.xml`; axe: 1 regla seria `label-content-name-mismatch` en 6 botones del selector de especialidades (el `aria-label` «01. Título» no contiene el texto visible); LCP ≈ 8,9 s con la bienvenida terminando a ≈ 7,8 s; 39 tareas largas (>50 ms) durante carga y animaciones (WebGL por software, solo comparativo); CLS 0,0002; JS 113 kB, CSS 13 kB transferidos.

## Registro de cambios
- 2026-10-30: sección de Servicios (hélice 3D, header sticky, calidad compartida, `serviceFocus`, motor ampliado, fotogramas 2D, pruebas `e2e/services.spec.js`). Verificado: lint, 77 pruebas unitarias, build, E2E escritorio/móvil, axe 0 violaciones en la sección, hero idéntico.
- 2026-10-30: creada la configuración de IA (`CLAUDE.md`, `.claude/{rules,docs,skills,agents}`, Playwright, `check:ai`). Sin cambios en `src/`.
