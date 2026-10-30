---
name: web-audit
description: Audita rendimiento (LCP, CLS, tareas largas, peso por tipo), accesibilidad (axe) y SEO técnico (title, meta, h1, lang, Open Graph, alt) de Overlayer con mediciones reales. Úsala para "audita el sitio", "mejora el SEO/rendimiento/accesibilidad" o antes de publicar.
---

# Auditoría medida del sitio

Separa siempre **lo medido** de **las hipótesis** del código. No des puntuaciones sin evidencia.

1. **Build y servidor:** `npm run build` y `npm run preview -- --port 4199` (si no responde ya). Los números de desarrollo (`npm run dev`) no valen.
2. **Medición:** `node e2e/audit.mjs --url http://localhost:4199 [--quality static|balanced|full] [--mobile]` imprime:
   - LCP, CLS, tareas largas (>50 ms) y bytes por tipo (JS, CSS, imágenes, fuentes, modelos) y número de peticiones.
   - Errores/avisos de consola y peticiones fallidas.
   - SEO: `title`, `meta description`, `lang`, `h1` (cantidad), `canonical`, Open Graph/Twitter, imágenes sin `alt`, enlaces sin texto, `robots.txt`/`sitemap.xml` (si faltan, se dice).
   - Accesibilidad: resumen de violaciones de axe (reglas WCAG 2.x A/AA) con nodos afectados.
3. **Interpreta** con las reglas del repo (`.claude/rules/performance.md`, `accessibility.md`) y la arquitectura (`.claude/docs/ARCHITECTURE.md` solo si hace falta entender niveles 3D→2D).
4. **Limitaciones a declarar:** SwiftShader/software GL no representa una GPU real; compara niveles entre sí, no contra umbrales absolutos. La bienvenida dura varios segundos y el LCP se mide después de ella: interpreta LCP junto con el tiempo hasta que `<main>` deja de ser `inert`, que el script imprime aparte.
5. **Prioriza** por impacto de usuario y confianza: tabla `Hallazgo | Evidencia (valor medido) | Impacto | Arreglo`. Aplica solo arreglos acotados si se piden; los cambios de diseño se proponen, no se hacen.
6. **Re-mide** tras cada arreglo con el mismo comando y reporta el antes/después.

Sin Lighthouse global: si hace falta, `npx lighthouse` bajo demanda y sin instalarlo; no es requisito.
