import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { openSite } from './helpers.js'

const SLIDES = [
  'Cuando tu negocio crece más rápido que tus herramientas',
  'Cuando quieres que más clientes te encuentren',
  'Cuando el tiempo no alcanza',
  'Cuando quieres destacar frente a la competencia',
  'Cuando tu tecnología necesita cuidado',
]
// La diapositiva nueva entra a ~55 % de un viaje de 1,35 s; con saltos largos, algo más
const SWAP_WAIT_MS = 3_500

async function openSectors(page, options) {
  const errors = await openSite(page, options)
  await page.locator('.ov-city-stage').first().waitFor({ state: 'attached', timeout: 30_000 })
  return errors
}

const slideTitle = (page) => page.locator('.ov-slide__title')
const activeDot = (page) => page.locator('.ov-slider-dot[aria-current="step"]')
const expectSlide = async (page, index) => {
  await expect(activeDot(page)).toHaveAttribute('data-index', String(index))
  await expect(slideTitle(page)).toHaveText(SLIDES[index], { timeout: SWAP_WAIT_MS })
}

test.describe('sectores: estructura y contenido', () => {
  test('la sección sigue a Servicios, muestra el texto del brief y no da errores de consola', async ({ page }) => {
    const errors = await openSectors(page)
    const geometry = await page.evaluate(() => {
      const services = document.getElementById('servicios')
      const section = document.getElementById('sectores')
      return {
        isAfter: Boolean(services.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING),
        headings: [...section.querySelectorAll('h2')].map((heading) => heading.textContent),
        labelledBy: section.getAttribute('aria-labelledby'),
      }
    })
    expect(geometry.isAfter).toBe(true)
    expect(geometry.headings).toEqual(['Sectores que atendemos'])
    expect(geometry.labelledBy).toBe('sectores-titulo')

    const section = page.locator('#sectores')
    await expect(section.getByText('Tecnología a la medida de tu negocio, sin importar su giro.')).toBeVisible()
    await expect(section.getByText(/ayudamos a pequeñas y medianas empresas y organizaciones/)).toBeVisible()
    await expect(slideTitle(page)).toHaveText(SLIDES[0])
    await expect(section.getByText('Cada negocio es distinto. Su tecnología también debería serlo.')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('el botón de cierre usa el destino de contacto existente', async ({ page }) => {
    await openSectors(page)
    const cta = page.locator('#sectores').getByRole('link', { name: 'Platícanos tu proyecto' })
    await expect(cta).toHaveAttribute('href', '#contactanos')
    await cta.click()
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('#contactanos')
  })

  test('el header ancla «Sectores» sin tapar el encabezado de la sección', async ({ page, isMobile }) => {
    await openSectors(page)
    if (isMobile) await page.getByRole('button', { name: /menú/i }).click()
    await page.getByRole('link', { name: 'Sectores' }).first().click()
    await page.waitForTimeout(1200)
    const { headerBottom, headingTop } = await page.evaluate(() => ({
      headerBottom: document.querySelector('header').getBoundingClientRect().bottom,
      headingTop: document.getElementById('sectores-titulo').getBoundingClientRect().top,
    }))
    expect(headingTop).toBeGreaterThanOrEqual(headerBottom - 1)
  })
})

test.describe('sectores: slider', () => {
  test('los botones recorren las cinco diapositivas en ambos sentidos', async ({ page }) => {
    await openSectors(page)
    const next = page.getByRole('button', { name: 'Sector siguiente' })
    const previous = page.getByRole('button', { name: 'Sector anterior' })
    for (let index = 1; index < SLIDES.length; index += 1) {
      await next.click()
      await expectSlide(page, index)
    }
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    for (let index = SLIDES.length - 2; index >= 0; index -= 1) {
      await previous.click()
      await expectSlide(page, index)
    }
    await expect(previous).toHaveAttribute('aria-disabled', 'true')
  })

  test('los indicadores saltan a cualquier diapositiva y el teclado los recorre con flechas, Inicio y Fin', async ({ page }) => {
    await openSectors(page)
    await page.locator('.ov-slider-dot[data-index="3"]').click()
    await expectSlide(page, 3)

    await page.locator('.ov-slider-dot[data-index="3"]').focus()
    await page.keyboard.press('ArrowRight')
    await expectSlide(page, 4)
    await expect(page.locator('.ov-slider-dot[data-index="4"]')).toBeFocused()
    await page.keyboard.press('Home')
    await expectSlide(page, 0)
    await page.keyboard.press('End')
    await expectSlide(page, 4)
    await page.keyboard.press('ArrowLeft')
    await expectSlide(page, 3)
    // Un único punto de tabulación entre los indicadores
    const tabbable = await page.locator('.ov-slider-dot[tabindex="0"]').count()
    expect(tabbable).toBe(1)
  })

  test('pulsaciones rápidas nunca bloquean: acaban en la última diapositiva pedida', async ({ page }) => {
    await openSectors(page)
    const next = page.getByRole('button', { name: 'Sector siguiente' })
    for (let press = 0; press < 4; press += 1) await next.click({ delay: 30 })
    await expectSlide(page, 4)
    await page.getByRole('button', { name: 'Sector anterior' }).click()
    await page.getByRole('button', { name: 'Sector anterior' }).click({ delay: 20 })
    await expectSlide(page, 2)
  })

  test('el texto sale al empezar el viaje y el nuevo entra después, sin cortes bruscos', async ({ page }) => {
    await openSectors(page)
    // Se registran las fases desde dentro de la página: un sondeo desde fuera puede perderse una fase breve
    await page.evaluate(() => {
      const slide = document.querySelector('.ov-slide')
      window.__phases = []
      new MutationObserver(() => {
        const last = window.__phases.at(-1)
        if (last !== slide.dataset.phase) window.__phases.push(slide.dataset.phase)
      }).observe(slide, { attributes: true, attributeFilter: ['data-phase'] })
    })
    await page.getByRole('button', { name: 'Sector siguiente' }).click()
    await expect(slideTitle(page)).toHaveText(SLIDES[1], { timeout: SWAP_WAIT_MS })
    await expect.poll(() => page.evaluate(() => window.__phases), { timeout: 4_000 }).toEqual(['leaving', 'entering', 'idle'])
  })

  test('con movimiento reducido el cambio es inmediato', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openSectors(page)
    await page.getByRole('button', { name: 'Sector siguiente' }).click()
    await expect(slideTitle(page)).toHaveText(SLIDES[1], { timeout: 400 })
    await expect(page.locator('.ov-slide')).toHaveAttribute('data-phase', 'idle')
  })

  test('el alto del texto no cambia entre diapositivas (sin saltos de maquetación)', async ({ page }) => {
    await openSectors(page)
    const heights = []
    for (let index = 0; index < SLIDES.length; index += 1) {
      await page.locator(`.ov-slider-dot[data-index="${index}"]`).click()
      await expectSlide(page, index)
      await page.waitForTimeout(700)
      heights.push(await page.locator('.ov-slide-panel').evaluate((element) => Math.round(element.getBoundingClientRect().height)))
    }
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(2)
  })

  test('la región en vivo anuncia la diapositiva con retraso y solo tras interactuar', async ({ page }) => {
    await openSectors(page)
    const live = page.locator('#sectores [role="status"]')
    await expect(live).toHaveText('')
    await page.getByRole('button', { name: 'Sector siguiente' }).click()
    await expect(live).toContainText(`Sector 2 de 5: ${SLIDES[1]}`, { timeout: 5_000 })
  })
})

test.describe('sectores: táctil', () => {
  test('el deslizamiento horizontal sobre la ciudad cambia de diapositiva', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Solo en el proyecto táctil')
    await openSectors(page)
    await page.locator('.ov-city-stage').scrollIntoViewIfNeeded()
    await page.waitForTimeout(900) // el desplazamiento suave debe terminar antes de medir
    const box = await page.locator('.ov-city-stage').boundingBox()
    const cdp = await page.context().newCDPSession(page)
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
    const swipe = async (fromX, toX) => {
      const y = box.y + box.height / 2
      await touch('touchStart', fromX, y)
      for (let step = 1; step <= 8; step += 1) await touch('touchMove', fromX + ((toX - fromX) * step) / 8, y)
      await touch('touchEnd', toX, y)
    }
    await swipe(box.x + box.width * 0.8, box.x + box.width * 0.2)
    await expectSlide(page, 1)
    await swipe(box.x + box.width * 0.2, box.x + box.width * 0.8)
    await expectSlide(page, 0)
  })
})

test.describe('sectores: responsive y accesibilidad', () => {
  const SIZES = [
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
  ]
  for (const [width, height] of SIZES) {
    test(`${width}×${height}: todo el contenido cabe en pantalla, sin cortes ni desbordes`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'mobile', 'Los tamaños se fijan aquí; el proyecto desktop basta')
      await page.setViewportSize({ width, height })
      const errors = await openSectors(page)
      await page.locator('.ov-sec-viewport').scrollIntoViewIfNeeded()
      await page.evaluate(() => {
        const header = document.querySelector('header').getBoundingClientRect().height
        const top = document.querySelector('.ov-sec-viewport').getBoundingClientRect().top + window.scrollY
        window.scrollTo({ top: top - header, behavior: 'instant' })
      })
      await page.waitForTimeout(300)
      for (let index = 0; index < SLIDES.length; index += 1) {
        await page.locator(`.ov-slider-dot[data-index="${index}"]`).click()
        await expectSlide(page, index)
        await page.waitForTimeout(600)
        const metrics = await page.evaluate(() => {
          const viewport = document.querySelector('.ov-sec-viewport').getBoundingClientRect()
          const header = document.querySelector('header').getBoundingClientRect()
          const inside = (selector) => {
            const rect = document.querySelector(selector).getBoundingClientRect()
            return rect.left >= viewport.left - 1 && rect.right <= viewport.right + 1 && rect.top >= header.bottom - 1 && rect.bottom <= window.innerHeight + 1
          }
          return {
            overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            heading: inside('#sectores-titulo'),
            panel: inside('.ov-slide-panel'),
            nav: inside('.ov-slider-nav'),
            textFits: (() => {
              const panel = document.querySelector('.ov-slide-panel')
              return panel.scrollHeight <= panel.clientHeight + 1
            })(),
          }
        })
        expect(metrics.overflowX, `desbordamiento horizontal (diapositiva ${index + 1})`).toBeLessThanOrEqual(0)
        expect(metrics.heading, `título visible (diapositiva ${index + 1})`).toBe(true)
        expect(metrics.panel, `panel visible entero (diapositiva ${index + 1})`).toBe(true)
        expect(metrics.nav, `controles visibles (diapositiva ${index + 1})`).toBe(true)
        expect(metrics.textFits).toBe(true)
      }
      expect(errors).toEqual([])
    })
  }

  test('axe: sin violaciones graves ni críticas en la sección', async ({ page }, testInfo) => {
    await openSectors(page)
    await page.getByRole('button', { name: 'Sector siguiente' }).click()
    await expectSlide(page, 1)
    const results = await new AxeBuilder({ page }).include('#sectores').analyze()
    await testInfo.attach('axe-sectores', {
      body: JSON.stringify(results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })), null, 2),
      contentType: 'application/json',
    })
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact))
    expect(serious.map((violation) => violation.id)).toEqual([])
  })
})

test.describe('sectores: ciudad 3D real', () => {
  test.slow()

  test('el WebGL monta, cambia de imagen entre diapositivas y se libera al alejarse', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'La escena 3D por software es lenta: se prueba en escritorio')
    test.setTimeout(420_000)
    const errors = await openSectors(page, { quality: 'full' })
    const stage = page.locator('.ov-city-stage')

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect(stage).toHaveAttribute('data-render-mode', 'fallback-2d')
    await stage.scrollIntoViewIfNeeded()
    await expect(stage).toHaveAttribute('data-render-mode', 'ready-3d', { timeout: 150_000 })
    await expect(stage.locator('canvas.ov-city-canvas')).toHaveCount(1)

    const shoot = () => stage.screenshot({ animations: 'disabled' })
    const first = await shoot()
    await page.getByRole('button', { name: 'Sector siguiente' }).click()
    await page.getByRole('button', { name: 'Sector siguiente' }).click()
    await expectSlide(page, 2)
    await page.waitForTimeout(2500)
    const third = await shoot()
    expect(Buffer.compare(first, third)).not.toBe(0)

    // Alejarse libera el contexto WebGL; al volver se recrea
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect(stage).toHaveAttribute('data-render-mode', 'fallback-2d', { timeout: 15_000 })
    await expect(page.locator('.ov-city-canvas')).toHaveCount(0)
    await stage.scrollIntoViewIfNeeded()
    await expect(stage).toHaveAttribute('data-render-mode', 'ready-3d', { timeout: 150_000 })

    expect(errors.filter((message) => !/GPU stall/.test(message))).toEqual([])
  })
})
