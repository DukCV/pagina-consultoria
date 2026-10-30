# Sistema de diseño

Fuentes de verdad: `src/constants/brandTheme.js` (`OVERLAYER_PALETTE`), variables `--ov-*` en `src/index.css`, `scenes/maintenance/sceneColors.js` (tonos derivados).

## Color
| Token | Hex | Uso |
|---|---|---|
| `--ov-charcoal` | `#484041` | superficies oscuras, texto principal, alto contraste |
| `--ov-emerald` | `#419D78` | acentos elegantes, innovación, interacción, conexiones |
| `--ov-indigo` | `#434371` | profundidad, degradados, variaciones tecnológicas |
| `--ov-lime` | `#B5F44A` | acentos estratégicos e indicadores puntuales (activo, foco, CTA principal) |
| `--ov-light-gray` | `#DADDD8` | fondo claro (`body`, header) y texto sobre carbón |

Derivados ya en uso: carbón profundo `#352F31` (fondo del hero), `#292425/#322C2F/#1B1718` (volúmenes y sombras), caras de cubos `indigoLeft/Right`, `emeraldLeft/Right`, `limeLeft/Right`, `charcoalLeft/Right` (`sceneColors.js`). Los colores se escriben como hex en clases Tailwind (`bg-[#419D78]`) o `var(--ov-*)` en CSS. Selección de texto: fondo lima, texto carbón.

## Tipografía
Outfit 300/400/500/600 (Google Fonts, `display=swap`) en todo el sitio, con fallback `system-ui`. Titulares del hero en mayúsculas, tracking negativo, `leading` ajustado; cuerpo en gris claro sobre carbón. Mantén líneas < 80 caracteres.

## Layout
Contenedor del header `max-w-[1440px]`, paddings `px-5 / sm:px-8 / lg:px-12 / xl:px-16`. Header = barra (72/78/82 px) + dos filetes de 2 px → 76/82/86 px. El hero ocupa `100svh` menos esa altura. Breakpoints Tailwind por defecto (`sm 640`, `md 768`, `lg 1024`, `xl 1280`).

## Componentes de interfaz
- **CTA** (`ov-cta`): `--primary` lima con halo (`ov-cta-halo`, color por `--ov-cta-glow`) y destello (`ov-cta__sheen`); `--ghost` cristal índigo con borde degradado y rombo (`ov-cta__diamond`). Flecha `ov-cta__arrow`. Easing `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Header**: logotipo + 3 enlaces + CTA «Contáctanos»; indicador activo con filete esmeralda→lima; menú móvil con foco gestionado.
- **Selector de especialidades**: botones con `aria-current`, barra de progreso del autoplay.

## Profundidad y movimiento
Planos del hero (`ov-plane-horizon|back|mid-base|mid|front-mid|front`, z = −85, −34, 10, 28, 54, 78 px) bajo `ov-hero-perspective` (perspective 1320 px) y `ov-scene-gimbal`; paralaje por `--ov-rx/--ov-ry`. Animaciones: `ov-anim-float(-alt)`, `ov-anim-flow(-fast)`, `ov-anim-pulse`, engranajes `ov-anim-gear-*`, ciclo de la IA `ov-ai-cycle-*`, entrada/salida de escena `ov-scene-enter|exit-next|prev`.

## Niveles de calidad (`data-ov-quality` en `.ov-hero`)
| Nivel | Efectos | 3D |
|---|---|---|
| `full` | todo: `backdrop-blur`, `drop-shadow`, animaciones SVG, capas 3D | WebGL a DPR ≤ 2 (1,5 táctil) |
| `balanced` | sin `backdrop-blur`/`drop-shadow`/filtro del CTA ghost y sin animaciones SVG (`ov-anim-flow`, `pulse`, `gear`) | WebGL DPR 1 al 75 % |
| `static` | además sin `preserve-3d`, perspectiva ni transformaciones de planos; fundidos simples entre escenas | renders 2D |
| `data-ov-quality-reason='reduced-motion'` | `animation: none` en todo el hero | — |

## Reglas de uso
Paleta con criterio (no todo en esmeralda/lima); lima solo para lo que está activo o es prioritario; profundidad con sombras y escalas coherentes; todo efecto nuevo declara su variante `balanced`/`static`; contenido nuevo reutiliza `ov-cta` y los tonos derivados antes de inventar otros.
