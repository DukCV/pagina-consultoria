import { defineConfig } from '@playwright/test'

// Servidor propio en un puerto distinto del 4199 que usan las revisiones manuales
const PORT = 4173
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

/**
 * Pruebas E2E de Overlayer. Usan el Chrome instalado en el sistema (`channel: 'chrome'`), así que no
 * se descargan navegadores. WebGL va por software (SwiftShader): lento pero suficiente para comprobar
 * que el 3D monta; las pruebas normales fuerzan `?ov-quality=static` (ver e2e/helpers.js).
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    channel: 'chrome',
    launchOptions: {
      args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
    },
  ],
  // Si PLAYWRIGHT_BASE_URL apunta a un servidor ya levantado, no se arranca ninguno
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
