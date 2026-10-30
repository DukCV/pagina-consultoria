import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NAVIGATION_ITEMS } from './brandTheme.js'
import { HERO_SERVICES } from './heroServicesData.js'
import { SERVICES_SECTION_ID } from './sectionIds.js'
import { SERVICES } from './servicesContent.js'
import { SERVICES_INTRO } from './servicesIntro.js'

const VISUALS = new Set(['systems', 'infrastructure', 'web', 'maintenance', 'xr', 'ai'])
const words = (text) => text.trim().split(/\s+/).length

test('Hay seis servicios con identificadores, numeración y composición únicos', () => {
  assert.equal(SERVICES.length, 6)
  assert.equal(new Set(SERVICES.map((s) => s.id)).size, 6)
  assert.deepEqual(
    SERVICES.map((s) => s.index),
    ['01', '02', '03', '04', '05', '06'],
  )
  assert.equal(new Set(SERVICES.map((s) => s.visual)).size, 6)
  for (const service of SERVICES) assert.ok(VISUALS.has(service.visual), service.id)
})

test('Cada servicio tiene título, título corto, descripción y llamada a la acción', () => {
  for (const service of SERVICES) {
    assert.ok(service.title.length > 8, service.id)
    assert.ok(service.shortTitle.length <= 30, `título corto demasiado largo: ${service.shortTitle}`)
    assert.ok(service.cta.length > 8 && service.cta.length <= 32, `llamada a la acción de ${service.id}`)
  }
  assert.equal(new Set(SERVICES.map((s) => s.cta)).size, SERVICES.length)
})

test('Las descripciones son breves y de extensión equilibrada entre los seis servicios', () => {
  const counts = SERVICES.map((s) => words(s.description))
  for (const [index, count] of counts.entries()) {
    assert.ok(count >= 20 && count <= 52, `${SERVICES[index].id}: ${count} palabras`)
  }
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 14, `desequilibrio: ${counts.join(', ')}`)
})

test('Los textos no prometen certificaciones, garantías ni cifras que el proyecto no respalda', () => {
  const text = SERVICES.flatMap((s) => [s.description, s.cta]).join(' ').toLowerCase()
  for (const claim of ['certificad', 'garantiz', '100%', 'número 1', 'líder mundial', 'sin errores', 'el mejor']) {
    assert.ok(!text.includes(claim), `afirmación no respaldada: «${claim}»`)
  }
})

test('Cada diapositiva del hero apunta a un servicio existente y todos son alcanzables', () => {
  const ids = new Set(SERVICES.map((s) => s.id))
  for (const heroService of HERO_SERVICES) {
    assert.ok(ids.has(heroService.servicesFocusId), `${heroService.id} → ${heroService.servicesFocusId}`)
  }
  assert.equal(new Set(HERO_SERVICES.map((s) => s.servicesFocusId)).size, SERVICES.length)
})

test('El destino de «Servicios» en el header coincide con el id de la sección', () => {
  const item = NAVIGATION_ITEMS.find((entry) => entry.id === 'servicios')
  assert.equal(item.href, `#${SERVICES_SECTION_ID}`)
  assert.equal(item.id, SERVICES_SECTION_ID)
})

test('La introducción es breve', () => {
  assert.equal(SERVICES_INTRO.title, 'Nuestros servicios')
  assert.ok(words(SERVICES_INTRO.subtitle) <= 12)
})
