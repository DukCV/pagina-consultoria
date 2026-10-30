/**
 * Capturas rápidas de la interfaz a varios anchos, para revisión visual (skill `ui-review`).
 *
 *   node e2e/shoot.mjs [--url http://localhost:4199] [--widths 390,820,1440] [--name hero]
 *                      [--scroll "#servicios" | 1200] [--quality static] [--full] [--out test-results/screens]
 *
 * Requiere un servidor ya levantado (`npm run preview -- --port 4199`) y el Chrome del sistema.
 * Imprime la ruta de cada captura y los errores de consola; no modifica el proyecto.
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? process.argv[index + 1] : fallback
}
const url = arg('url', 'http://localhost:4199')
const widths = arg('widths', '390,820,1440').split(',').map(Number)
const name = arg('name', 'pagina')
const scroll = arg('scroll', null)
const quality = arg('quality', 'static')
const outDir = arg('out', 'test-results/screens')
const fullPage = process.argv.includes('--full')

const heightFor = (width) => (width < 600 ? 844 : width < 1000 ? 1024 : 900)

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: heightFor(width) },
    hasTouch: width < 1000,
    isMobile: width < 600,
  })
  const page = await context.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g/.test(m.location().url ?? '') && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto(`${url}?ov-quality=${quality}`)
  await page.waitForFunction(() => !document.querySelector('main')?.hasAttribute('inert'), null, {
    timeout: 30_000,
  })
  if (scroll) {
    if (/^\d+$/.test(scroll)) await page.evaluate((y) => window.scrollTo(0, y), Number(scroll))
    else await page.locator(scroll).first().scrollIntoViewIfNeeded()
  }
  await page.waitForTimeout(900)

  const file = path.join(outDir, `${name}-${width}.png`)
  await page.screenshot({ path: file, fullPage })
  console.log(`captura ${width}px → ${file}${errors.length ? `  (errores de consola: ${errors.length})` : ''}`)
  for (const error of errors.slice(0, 5)) console.log(`  ! ${error}`)
  await context.close()
}
await browser.close()
