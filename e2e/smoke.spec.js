import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { openSite } from './helpers.js'

test.describe('humo: carga y estructura', () => {
  test('el sitio carga sin errores y muestra header y hero', async ({ page }) => {
    const errors = await openSite(page)

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('SOMOS')
    await expect(
      page.getByRole('region', { name: 'Especialidades tecnológicas líderes de Overlayer' }),
    ).toBeVisible()
    await expect(
      page.getByRole('group', { name: 'Seleccionar especialidad tecnológica' }).getByRole('button'),
    ).toHaveCount(6)
    expect(errors).toEqual([])
  })

  test('no hay desborde horizontal', async ({ page }) => {
    await openSite(page)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('axe: sin violaciones críticas en header y hero', async ({ page }, testInfo) => {
    await openSite(page)
    const results = await new AxeBuilder({ page }).include('header').include('main').analyze()

    // Se adjunta el resumen completo al informe; solo las críticas hacen fallar la prueba
    const summary = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      help: v.help,
    }))
    await testInfo.attach('axe-resumen', {
      body: JSON.stringify(summary, null, 2),
      contentType: 'application/json',
    })
    expect(results.violations.filter((v) => v.impact === 'critical')).toEqual([])
  })
})

test.describe('humo: movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' })

  test('el hero pasa a 2D estático por prefers-reduced-motion', async ({ page }) => {
    await openSite(page, { quality: 'adaptive' })
    const hero = page.locator('section.ov-hero')
    await expect(hero).toHaveAttribute('data-ov-quality', 'static')
    await expect(hero).toHaveAttribute('data-ov-quality-reason', 'reduced-motion')
  })
})
