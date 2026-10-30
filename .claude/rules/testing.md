---
paths:
  - "src/**/*.test.js"
  - "e2e/**"
  - "playwright.config.js"
  - "tools/**"
---

# Pruebas

**Unitarias (`npm test`, `node --test`):** solo lógica pura sin DOM ni React (ver `engine3d/*.test.js`). Importa con extensión `.js`, usa `node:assert/strict`, nombra los casos en español describiendo el comportamiento. Guarda `import.meta.env` con `?.` en módulos que se prueban.

**E2E (`npm run test:e2e`, Playwright):**
- Archivos `e2e/*.spec.js`; Chrome del sistema (`channel: 'chrome'`), sin descargar navegadores.
- Abre siempre con `?ov-quality=static` (determinista, sin WebGL por software lento). Usa `balanced`/`full` solo para probar esos niveles.
- La bienvenida dura varios segundos y `main` es `inert` hasta que el header es interactivo: espera a que desaparezca `inert` antes de interactuar.
- Cubre lo que importa: carga sin errores de consola, interacciones, responsive (360, 390, 768, 1024, 1440), teclado, `prefers-reduced-motion` y axe.
- Selectores por rol, texto accesible o `aria-label`; evita clases de Tailwind.
- Si un test falla por algo ya existente en el sitio, **repórtalo**: no cambies diseño ni componentes para que pase.

**Verificación mínima por tarea:** `npm run lint` + la prueba más pequeña que cubra el cambio; `npm run build` si tocaste imports/CSS. No ejecutes toda la batería salvo antes de entregar un bloque grande.
