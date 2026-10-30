import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { openSite } from './helpers.js'

const SERVICES = [
  { title: 'Sistemas a la medida', cta: 'Hablemos de tu sistema' },
  { title: 'Infraestructura y servicios en la nube', cta: 'Evaluemos tu infraestructura' },
  { title: 'Diseño y desarrollo web', cta: 'Planeemos tu sitio web' },
  { title: 'Mantenimiento y actualización de sistemas', cta: 'Revisemos tus sistemas' },
  { title: 'Realidad virtual y aumentada', cta: 'Imaginemos tu experiencia' },
  { title: 'Automatización con inteligencia artificial', cta: 'Automaticemos tu operación' },
]
// Servicio al que lleva «Saber más» desde cada diapositiva del hero (orden de las diapositivas)
const HERO_SLIDE_TO_SERVICE = [0, 4, 5, 1, 2, 3]

async function openServices(page, options) {
  const errors = await openSite(page, options)
  await page.locator('.ov-svc-stage').waitFor({ state: 'attached', timeout: 30_000 })
  return errors
}

/** Lleva el scroll al punto del recorrido `progress` (0…5) y espera a que la escena se asiente. */
async function scrollToProgress(page, progress, settleMs = 900) {
  await page.evaluate((value) => {
    const track = document.querySelector('.ov-svc-track')
    const pin = document.querySelector('.ov-svc-pin')
    const top = track.getBoundingClientRect().top + window.scrollY
    const stickyTop = Number.parseFloat(getComputedStyle(pin).top) || 0
    window.scrollTo({ top: top - stickyTop + (value / 5) * (track.offsetHeight - pin.offsetHeight), behavior: 'instant' })
  }, progress)
  await page.waitForTimeout(settleMs)
}

const activeDot = (page) => page.locator('.ov-svc-dotbtn[aria-current="step"]')
const expectActive = (page, index) => expect(activeDot(page)).toHaveAttribute('data-index', String(index), { timeout: 12_000 })

test.describe('servicios: estructura y recorrido', () => {
  test('la sección está justo bajo el hero y recorre los seis servicios', async ({ page }) => {
    const errors = await openServices(page)

    const geometry = await page.evaluate(() => {
      const hero = document.querySelector('.ov-hero')
      const section = document.getElementById('servicios')
      return {
        heroBottom: Math.round(hero.getBoundingClientRect().bottom + window.scrollY),
        sectionTop: Math.round(section.getBoundingClientRect().top + window.scrollY),
        isAfter: Boolean(hero.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING),
        headings: [...section.querySelectorAll('h2')].map((heading) => heading.textContent),
      }
    })
    expect(geometry.isAfter).toBe(true)
    expect(Math.abs(geometry.sectionTop - geometry.heroBottom)).toBeLessThanOrEqual(2)
    expect(geometry.headings).toEqual(['Nuestros servicios'])
    await expect(page.locator('.ov-svc-dotbtn')).toHaveCount(6)

    for (const [index, service] of SERVICES.entries()) {
      await scrollToProgress(page, index)
      await expectActive(page, index)
      await expect(page.getByRole('heading', { level: 3, name: service.title })).toBeVisible()
      const cta = page.getByRole('link', { name: `${service.cta}: ${service.title}` })
      await expect(cta).toBeVisible()
      await expect(cta).toHaveAttribute('href', '#contactanos')
      await expect(page.locator('.ov-svc-desc')).toHaveText(/\S{3,}/)
    }
    expect(errors).toEqual([])
  })

  test('la descripción y el título de cada servicio caben en la pantalla fijada', async ({ page }) => {
    await openServices(page)
    for (const index of [0, 3, 5]) {
      await scrollToProgress(page, index)
      const fits = await page.evaluate(() => {
        const pin = document.querySelector('.ov-svc-pin').getBoundingClientRect()
        return ['.ov-svc-title', '.ov-svc-desc', '.ov-svc-card a', '.ov-svc-nav'].map((selector) => {
          const rect = document.querySelector(selector).getBoundingClientRect()
          return rect.top >= pin.top - 1 && rect.bottom <= pin.bottom + 1 && rect.left >= -1 && rect.right <= window.innerWidth + 1
        })
      })
      expect(fits, `servicio ${index + 1}`).toEqual([true, true, true, true])
    }
  })
})

test.describe('servicios: header sticky', () => {
  test('el header permanece anclado y la pantalla fijada queda justo debajo sin tapar el título', async ({ page, isMobile }) => {
    await openServices(page)
    const readHeader = () =>
      page.evaluate(() => {
        const header = document.querySelector('header')
        const box = header.getBoundingClientRect()
        return { top: Math.round(box.top), bottom: Math.round(box.bottom), scrolled: header.dataset.scrolled, position: getComputedStyle(header).position }
      })

    expect((await readHeader()).position).toBe('sticky')
    expect((await readHeader()).scrolled).toBe('false')
    for (const progress of [0, 2.5, 5]) {
      await scrollToProgress(page, progress, 400)
      const header = await readHeader()
      expect(header.top).toBe(0)
      expect(header.scrolled).toBe('true')
      const { pinTop, titleTop } = await page.evaluate(() => ({
        pinTop: Math.round(document.querySelector('.ov-svc-pin').getBoundingClientRect().top),
        titleTop: Math.round(document.querySelector('.ov-svc-heading').getBoundingClientRect().top),
      }))
      expect(Math.abs(pinTop - header.bottom)).toBeLessThanOrEqual(1)
      expect(titleTop).toBeGreaterThanOrEqual(header.bottom)
    }
    // Sigue operativo dentro de la sección: la navegación de escritorio visible, o el botón del menú en móvil
    const navigation = isMobile ? page.getByRole('button', { name: /menú/i }) : page.getByRole('link', { name: 'Servicios' }).first()
    await expect(navigation).toBeVisible()
  })
})

test.describe('servicios: navegación', () => {
  test('anterior, siguiente, indicadores y teclado', async ({ page }) => {
    await openServices(page)
    await scrollToProgress(page, 0)

    await page.getByRole('button', { name: 'Servicio siguiente' }).click()
    await expectActive(page, 1)
    await page.getByRole('button', { name: 'Servicio anterior' }).click()
    await expectActive(page, 0)

    await page.locator('.ov-svc-dotbtn[data-index="4"]').click()
    await expectActive(page, 4)
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(2000)

    await activeDot(page).focus()
    await page.keyboard.press('ArrowRight')
    await expectActive(page, 5)
    await expect(page.locator('.ov-svc-dotbtn[data-index="5"]')).toBeFocused()
    await page.keyboard.press('Home')
    await expectActive(page, 0)
    await page.keyboard.press('End')
    await expectActive(page, 5)

    // Un único indicador tabulable y anuncio accesible del servicio activo
    expect(await page.locator('.ov-svc-dotbtn[tabindex="0"]').count()).toBe(1)
    await expect(page.locator('.ov-svc-pin [role="status"]')).toContainText(`Servicio 06 de 6: ${SERVICES[5].title}`, { timeout: 8000 })
  })

  test('el botón «Saber más» del hero lleva la hélice al servicio correspondiente', async ({ page }) => {
    await openServices(page)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    const tabs = page.getByRole('group', { name: 'Seleccionar especialidad tecnológica' }).getByRole('button')

    for (const slide of [2, 4]) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await tabs.nth(slide).click()
      await page.waitForTimeout(1200)
      await page.getByRole('link', { name: /^Saber más sobre/ }).click()
      await expectActive(page, HERO_SLIDE_TO_SERVICE[slide])
      expect(await page.evaluate(() => window.location.hash)).toBe('#servicios')
    }
  })
})

test.describe('servicios: niveles de calidad y accesibilidad', () => {
  test('en nivel estático se muestran los fotogramas 2D (misma escena) sin canvas WebGL', async ({ page }) => {
    const errors = await openServices(page, { quality: 'static' })
    await expect(page.locator('.ov-svc-stage')).toHaveAttribute('data-render-mode', 'fallback-2d')
    await expect(page.locator('.ov-svc-canvas')).toHaveCount(0)

    for (const index of [0, 2, 5]) {
      await scrollToProgress(page, index, 1200)
      const loaded = await page.evaluate(() =>
        [...document.querySelectorAll('.ov-svc-frames__image')].filter((image) => image.complete && image.naturalWidth > 0).length,
      )
      expect(loaded, `fotogramas cargados en el servicio ${index + 1}`).toBeGreaterThanOrEqual(1)
    }
    expect(errors).toEqual([])
  })

  test('con movimiento reducido la sección pasa a modo manual sin scroll vinculado ni animaciones', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = await openServices(page, { quality: 'adaptive' })

    const info = await page.evaluate(() => {
      const section = document.getElementById('servicios')
      return {
        mode: section.dataset.mode,
        quality: section.dataset.ovQuality,
        position: getComputedStyle(section.querySelector('.ov-svc-pin')).position,
        height: section.querySelector('.ov-svc-track').offsetHeight,
        animated: [...section.querySelectorAll('*')].filter((element) => getComputedStyle(element).animationName !== 'none').length,
      }
    })
    expect(info.mode).toBe('manual')
    expect(info.quality).toBe('static')
    expect(info.position).toBe('relative')
    expect(info.height).toBeLessThan(1500)
    expect(info.animated).toBe(0)

    await page.getByRole('button', { name: 'Servicio siguiente' }).click()
    await page.getByRole('button', { name: 'Servicio siguiente' }).click()
    await expectActive(page, 2)
    await expect(page.getByRole('heading', { level: 3, name: SERVICES[2].title })).toBeVisible()
    expect(errors).toEqual([])
    await context.close()
  })

  test('axe: sin violaciones graves ni críticas en la sección', async ({ page }, testInfo) => {
    await openServices(page)
    await scrollToProgress(page, 2)
    const results = await new AxeBuilder({ page }).include('#servicios').analyze()
    await testInfo.attach('axe-servicios', {
      body: JSON.stringify(results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })), null, 2),
      contentType: 'application/json',
    })
    expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact))).toEqual([])
  })

  test('el recorrido completo no produce saltos de diseño (CLS)', async ({ page }) => {
    await page.addInitScript(() => {
      window.__cls = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await openServices(page, { quality: 'static' })
    for (let progress = 0; progress <= 5; progress += 0.5) await scrollToProgress(page, progress, 250)
    expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.1)
  })
})

test.describe('servicios: escena 3D real', () => {
  test.slow()

  test('el WebGL monta, cambia de imagen entre servicios y se libera al alejarse', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'La escena 3D por software es lenta: se prueba en escritorio')
    test.setTimeout(300_000)
    const errors = await openServices(page, { quality: 'full' })
    const stage = page.locator('.ov-svc-stage')

    // El 3D solo se crea al acercarse a la sección: hasta entonces se ven los fotogramas 2D
    await expect(stage).toHaveAttribute('data-render-mode', 'fallback-2d')
    await scrollToProgress(page, 0, 300)
    await expect(stage).toHaveAttribute('data-render-mode', 'ready-3d', { timeout: 120_000 })
    const canvas = stage.locator('canvas.ov-svc-canvas')
    await expect(canvas).toHaveCount(1)
    expect(await canvas.evaluate((element) => element.width * element.height)).toBeGreaterThan(100_000)

    // Imágenes distintas en servicios distintos (la escena cambia de verdad) y etiquetas de los vecinos
    await scrollToProgress(page, 1, 2500)
    const first = await stage.screenshot()
    await scrollToProgress(page, 4, 2500)
    const second = await stage.screenshot()
    expect(Buffer.compare(first, second)).not.toBe(0)
    expect(await page.locator('.ov-svc-label:visible').count()).toBeGreaterThanOrEqual(1)

    // Al alejarse se libera la GPU (canvas fuera) y los fotogramas 2D toman el relevo; al volver se recrea
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect(stage).toHaveAttribute('data-render-mode', 'fallback-2d', { timeout: 30_000 })
    await expect(page.locator('.ov-svc-canvas')).toHaveCount(0)
    await scrollToProgress(page, 2, 500)
    await expect(stage).toHaveAttribute('data-render-mode', 'ready-3d', { timeout: 120_000 })

    expect(errors).toEqual([])
  })
})

test.describe('servicios: responsive', () => {
  const SIZES = [
    [360, 640],
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1280, 720],
    [1920, 1080],
  ]

  for (const [width, height] of SIZES) {
    test(`${width}×${height}: sin desbordes, con texto legible y controles dentro de la pantalla`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'mobile', 'Los tamaños se fijan aquí; el proyecto desktop basta')
      await page.setViewportSize({ width, height })
      const errors = await openServices(page, { quality: 'static' })

      for (const progress of [0, 3, 5]) {
        await scrollToProgress(page, progress, 700)
        const metrics = await page.evaluate(() => {
          const pin = document.querySelector('.ov-svc-pin').getBoundingClientRect()
          const inside = (selector) => {
            const rect = document.querySelector(selector).getBoundingClientRect()
            return rect.top >= pin.top - 1 && rect.bottom <= pin.bottom + 1 && rect.left >= -1 && rect.right <= window.innerWidth + 1
          }
          return {
            overflow: document.documentElement.scrollWidth - window.innerWidth,
            descFont: Number.parseFloat(getComputedStyle(document.querySelector('.ov-svc-desc')).fontSize),
            inside: ['.ov-svc-title', '.ov-svc-desc', '.ov-svc-card a', '.ov-svc-nav'].map(inside),
            mode: document.getElementById('servicios').dataset.mode,
            // En pantallas verticales el texto va debajo de la escena, no encima del objeto 3D
            // (se tolera la franja difuminada del borde inferior de la escena: el último 20 %)
            textBelowScene: (() => {
              const stage = document.querySelector('.ov-svc-stage').getBoundingClientRect()
              return document.querySelector('.ov-svc-title').getBoundingClientRect().top >= stage.bottom - stage.height * 0.2 - 8
            })(),
          }
        })
        if (width < height) expect(metrics.textBelowScene, 'texto debajo de la escena').toBe(true)
        expect(metrics.overflow, `desborde en progreso ${progress}`).toBeLessThanOrEqual(0)
        expect(metrics.descFont).toBeGreaterThanOrEqual(14)
        if (metrics.mode === 'scroll') expect(metrics.inside, `contenido dentro del pin en progreso ${progress}`).toEqual([true, true, true, true])
      }
      expect(errors).toEqual([])
    })
  }
})

test.describe('servicios: táctil', () => {
  test('los arrastres táctiles recorren los servicios y el deslizamiento horizontal cambia de servicio', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Solo en el proyecto táctil')
    test.setTimeout(180_000) // decenas de arrastres reales con pausas de asentamiento
    await openServices(page, { quality: 'static' })
    const cdp = await page.context().newCDPSession(page)
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })

    // Arrastre vertical real (eventos táctiles): `distance` px hacia arriba, en tramos que caben en la pantalla
    const dragScroll = async (distance) => {
      for (let remaining = distance; remaining > 0; remaining -= 520) {
        const chunk = Math.min(remaining, 520)
        await touch('touchStart', 195, 700)
        for (let i = 1; i <= 16; i += 1) {
          await touch('touchMove', 195, 700 - (chunk * i) / 16)
          await page.waitForTimeout(16)
        }
        await touch('touchEnd')
        await page.waitForTimeout(450)
      }
      await page.waitForTimeout(900)
    }
    const index = async () => Number(await activeDot(page).getAttribute('data-index'))

    const geometry = await page.evaluate(() => {
      const track = document.querySelector('.ov-svc-track')
      const pin = document.querySelector('.ov-svc-pin')
      return {
        toSection: Math.round(track.getBoundingClientRect().top + window.scrollY - (Number.parseFloat(getComputedStyle(pin).top) || 0)),
        perStep: Math.round((track.offsetHeight - pin.offsetHeight) / 5),
      }
    })

    await dragScroll(geometry.toSection)
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(geometry.toSection * 0.8)
    const seen = [await index()]
    for (let drag = 0; drag < 9 && seen.at(-1) < 5; drag += 1) {
      await dragScroll(Math.round(geometry.perStep * 0.9))
      seen.push(await index())
    }
    // El índice nunca retrocede, no se salta más de un servicio por arrastre y se llega al último
    expect(seen.at(-1)).toBe(5)
    seen.slice(1).forEach((value, i) => {
      expect(value).toBeGreaterThanOrEqual(seen[i])
      expect(value - seen[i]).toBeLessThanOrEqual(2)
    })
    expect(new Set(seen).size).toBeGreaterThanOrEqual(5)

    // Deslizar hacia la derecha sobre la escena vuelve al servicio anterior
    const box = await page.locator('.ov-svc-stage').boundingBox()
    const y = box.y + box.height / 2
    const before = await index()
    await touch('touchStart', box.x + 40, y)
    for (let i = 1; i <= 8; i += 1) await touch('touchMove', box.x + 40 + ((box.width - 80) * i) / 8, y)
    await touch('touchEnd')
    await expectActive(page, before - 1)
  })
})
