/**
 * Auditoría medida de una página (skill `web-audit`): rendimiento, SEO técnico y accesibilidad.
 *
 *   node e2e/audit.mjs [--url http://localhost:4199] [--quality static] [--mobile] [--settle 2500]
 *
 * Requiere un build servido (`npm run build && npm run preview -- --port 4199`) y el Chrome del sistema.
 * Solo lee: no modifica el proyecto. Los números con WebGL por software (SwiftShader) sirven para
 * comparar niveles entre sí, no como valores absolutos de una GPU real.
 */
import AxeBuilder from '@axe-core/playwright'
import { chromium } from '@playwright/test'

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? process.argv[index + 1] : fallback
}
const url = arg('url', 'http://localhost:4199')
const quality = arg('quality', 'static')
const settleMs = Number(arg('settle', 2500))
const isMobile = process.argv.includes('--mobile')

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext(
  isMobile
    ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }
    : { viewport: { width: 1440, height: 900 } },
)
const page = await context.newPage()

await page.addInitScript(() => {
  window.__audit = { lcp: 0, cls: 0, longTasks: [] }
  const observe = (type, handler) =>
    new PerformanceObserver((list) => list.getEntries().forEach(handler)).observe({ type, buffered: true })
  observe('largest-contentful-paint', (e) => (window.__audit.lcp = e.startTime))
  observe('layout-shift', (e) => !e.hadRecentInput && (window.__audit.cls += e.value))
  observe('longtask', (e) => window.__audit.longTasks.push(Math.round(e.duration)))
})

const bytes = { script: 0, stylesheet: 0, image: 0, font: 0, fetch_model: 0, document: 0, other: 0 }
let requests = 0
const failed = []
const consoleErrors = []
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && consoleErrors.push(`${m.type()}: ${m.text()}`))
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`))
page.on('requestfailed', (r) => failed.push(`${r.url()} (${r.failure()?.errorText})`))
page.on('requestfinished', async (request) => {
  requests += 1
  try {
    const sizes = await request.sizes()
    const size = sizes.responseBodySize + sizes.responseHeadersSize
    const isModel = /\.(glb|gltf)(\?|$)/.test(request.url())
    const type = isModel ? 'fetch_model' : request.resourceType()
    bytes[type in bytes ? type : 'other'] += size
  } catch {
    // Recursos servidos desde caché u opacos: no se contabilizan
  }
})

const started = Date.now()
await page.goto(`${url}?ov-quality=${quality}`, { waitUntil: 'load' })
await page.waitForFunction(() => !document.querySelector('main')?.hasAttribute('inert'), null, {
  timeout: 40_000,
})
const interactiveMs = Date.now() - started
await page.waitForTimeout(settleMs)

const perf = await page.evaluate(() => ({
  ...window.__audit,
  nav: performance.getEntriesByType('navigation')[0]?.toJSON?.() ?? {},
}))

const seo = await page.evaluate(() => {
  const meta = (selector) => document.querySelector(selector)?.getAttribute('content') ?? null
  return {
    title: document.title || null,
    description: meta('meta[name="description"]'),
    lang: document.documentElement.lang || null,
    canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
    viewport: meta('meta[name="viewport"]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogImage: meta('meta[property="og:image"]'),
    twitterCard: meta('meta[name="twitter:card"]'),
    jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    h1: document.querySelectorAll('h1').length,
    headings: [...document.querySelectorAll('h1,h2,h3')].map((h) => `${h.tagName} ${h.textContent.trim().slice(0, 40)}`),
    imagesWithoutAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    linksWithoutName: [...document.querySelectorAll('a')].filter((a) => !(a.textContent.trim() || a.getAttribute('aria-label'))).length,
  }
})
const fileExists = async (file) => {
  const response = await page.request.get(new URL(file, url).href)
  return response.ok() && !(await response.text()).trimStart().startsWith('<')
}
seo.robotsTxt = await fileExists('/robots.txt')
seo.sitemapXml = await fileExists('/sitemap.xml')

const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
const kb = (n) => `${(n / 1024).toFixed(1)} kB`

console.log(`\n== Auditoría ${url} (${isMobile ? 'móvil 390×844' : 'escritorio 1440×900'}, calidad ${quality}) ==`)
console.log(`Tiempo hasta que <main> deja de ser inert (fin de la bienvenida): ${interactiveMs} ms`)
console.log(`LCP: ${Math.round(perf.lcp)} ms · CLS: ${perf.cls.toFixed(4)} · tareas largas (>50 ms): ${perf.longTasks.length}${perf.longTasks.length ? ` [${perf.longTasks.slice(0, 8).join(', ')} ms]` : ''}`)
console.log(`DOMContentLoaded: ${Math.round(perf.nav.domContentLoadedEventEnd ?? 0)} ms · load: ${Math.round(perf.nav.loadEventEnd ?? 0)} ms · peticiones: ${requests}`)
console.log(`Peso transferido: JS ${kb(bytes.script)} · CSS ${kb(bytes.stylesheet)} · imágenes ${kb(bytes.image)} · fuentes ${kb(bytes.font)} · modelos ${kb(bytes.fetch_model)} · documento ${kb(bytes.document)} · otros ${kb(bytes.other)}`)
console.log(`Errores/avisos de consola: ${consoleErrors.length}${consoleErrors.length ? '\n  - ' + consoleErrors.slice(0, 6).join('\n  - ') : ''}`)
console.log(`Peticiones fallidas: ${failed.length}${failed.length ? '\n  - ' + failed.slice(0, 6).join('\n  - ') : ''}`)
console.log('\nSEO técnico:\n' + JSON.stringify(seo, null, 2))
console.log(`\nAccesibilidad (axe, WCAG 2.x A/AA): ${axe.violations.length} reglas con violaciones, ${axe.passes.length} superadas`)
for (const v of axe.violations) console.log(`  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodos) p.ej. ${v.nodes[0]?.target?.join(' ')}`)

await browser.close()
