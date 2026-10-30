---
name: ui-review
description: Revisa visualmente una pantalla o componente de Overlayer con capturas reales en móvil, tableta y escritorio y lo contrasta con el sistema de diseño. Úsala para "revisa esta interfaz", QA visual, jerarquía, contraste, espaciado o antes de entregar cambios visuales.
---

# Revisión visual con capturas

1. **Contexto mínimo:** lee solo `.claude/docs/DESIGN_SYSTEM.md` (y `.claude/rules/ui-ux.md` se carga sola al tocar JSX/CSS).
2. **Servidor:** si no hay uno, `npm run build` y `npm run preview -- --port 4199` en segundo plano (o `npm run dev`). No lo reinicies si ya responde.
3. **Capturas:** `node e2e/shoot.mjs --url http://localhost:4199 --widths 390,820,1440 --name <tema> [--scroll <selector|px>] [--quality static|balanced|full]`. Guarda en `test-results/screens/`. Usa `static` salvo que revises 3D (WebGL por software es lento).
4. **Mira las imágenes** con Read (una por ancho). No pidas más capturas de las necesarias.
5. **Critica** con este orden y sé específico (qué, dónde, por qué, arreglo):
   - Primera impresión: qué atrae la vista y si es lo correcto.
   - Jerarquía y lectura: tamaños, pesos, espacios, longitud de línea.
   - Coherencia con la marca: paleta por rol (lima solo para activo/prioritario), `ov-cta`, profundidad, nada de aspecto de plantilla.
   - Responsive: desbordes, saltos de layout, objetivos táctiles, texto recortado.
   - Accesibilidad visible: contraste, foco, estados hover/activo/desactivado.
   - Calidad y movimiento: variante `balanced`/`static`, `prefers-reduced-motion`.
6. **Entrega:** tabla `Hallazgo | Severidad (crítico/medio/menor) | Arreglo concreto`, más lo que ya funciona bien (breve). No edites archivos salvo que se pida; si se pide, delega la implementación en `frontend-developer` con la lista priorizada.

Para decisiones de diseño nuevas usa también la skill `frontend-design` (plugin) y acota la propuesta a la identidad de Overlayer.
