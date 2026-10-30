---
name: e2e-playwright
description: Escribe y ejecuta pruebas de interfaz de Overlayer con Playwright (Chrome del sistema): interacciones, responsive, teclado, movimiento reducido, niveles de calidad 3D/2D y axe. Úsala para "prueba esta interacción", regresiones visuales o validar un cambio de UI.
---

# Pruebas E2E con Playwright

**Estado:** `@playwright/test` y `@axe-core/playwright` son devDependencies; `playwright.config.js` usa `channel: 'chrome'` (sin descargar navegadores) y levanta `vite preview` si no hay servidor. Proyectos: `desktop` (1440×900) y `mobile` (390×844, táctil).

## Comandos
- Todo: `npm run test:e2e` · un archivo: `npx playwright test e2e/smoke.spec.js` · un caso: `-g "texto"` · un proyecto: `--project=mobile`
- Informe tras fallos: `npx playwright show-report` (carpeta `playwright-report/`, ignorada por git)

## Escribir una prueba
```js
import { test, expect } from '@playwright/test'
import { openSite } from './helpers.js'

test('descripción del comportamiento', async ({ page }) => {
  const errors = await openSite(page, { quality: 'static' }) // espera a que termine la bienvenida
  await page.getByRole('link', { name: 'Servicios' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(errors).toEqual([]) // errores de consola recogidos por el helper
})
```
- `openSite` navega a `/?ov-quality=<nivel>`, espera a que `main` deje de ser `inert` y devuelve la lista (viva) de errores de consola/página.
- Selectores por rol, texto o `aria-label`; no uses clases Tailwind. Los textos están en español.
- Esperas por estado (`expect(...).toBeVisible()`, `waitForFunction`), no `waitForTimeout` salvo para suavizados medidos.

## Casos habituales
- **Responsive:** `page.setViewportSize({ width, height })` en 360, 390, 768, 1024, 1440; comprueba `document.documentElement.scrollWidth <= innerWidth`.
- **Teclado:** `page.keyboard.press('Tab' | 'ArrowRight')` y `toBeFocused()`.
- **Movimiento reducido:** `test.use({ reducedMotion: 'reduce' })`; el hero fuerza `data-ov-quality="static"` con `data-ov-quality-reason="reduced-motion"`.
- **Niveles:** `?ov-quality=full|balanced|static` fija el nivel. `full` con WebGL por software (SwiftShader) es muy lento: úsalo solo para ver que el 3D monta/libera, con tiempos de espera holgados.
- **Accesibilidad:** `new AxeBuilder({ page }).include('header').analyze()`; reporta violaciones, no “arregles” el diseño para pasar.

## Reglas
Si una prueba falla por algo ya existente, repórtalo y pregunta; no cambies componentes ni estilos para que pase. Para pruebas puntuales y capturas rápidas usa `node e2e/shoot.mjs` (ver skill `ui-review`).
