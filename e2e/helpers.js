// Errores de consola que no dependen del sitio: las fuentes de Google fallan sin red
const IGNORED_CONSOLE_URLS = /fonts\.(googleapis|gstatic)\.com/

/**
 * Abre el sitio con un nivel de calidad fijo y espera a que termine la pantalla de bienvenida
 * (`<main>` deja de ser `inert` y el scroll vuelve a estar disponible). Devuelve la lista viva de errores de consola y de página.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ quality?: 'static' | 'balanced' | 'full' | 'adaptive', path?: string }} [options]
 */
export async function openSite(page, { quality = 'static', path = '/' } = {}) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (IGNORED_CONSOLE_URLS.test(message.location().url ?? '')) return
    errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))

  await page.goto(`${path}?ov-quality=${quality}`)
  // Termina la secuencia de bienvenida: `main` deja de ser inert y el `body` recupera el scroll
  await page.waitForFunction(
    () => {
      const main = document.querySelector('main')
      return Boolean(main) && !main.hasAttribute('inert') && getComputedStyle(document.body).overflow !== 'hidden'
    },
    null,
    { timeout: 30_000 },
  )
  return errors
}
