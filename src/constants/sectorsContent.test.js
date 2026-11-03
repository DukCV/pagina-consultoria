import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NAVIGATION_ITEMS } from './brandTheme.js'
import { SECTORS_SECTION_ID } from './sectionIds.js'
import { SECTORS_CLOSING, SECTORS_INTRO, SLIDES } from './sectorsContent.js'

const words = (text) => text.trim().split(/\s+/).length

test('Hay cinco diapositivas con identificadores únicos y los títulos del brief', () => {
  assert.equal(SLIDES.length, 5)
  assert.equal(new Set(SLIDES.map((slide) => slide.id)).size, 5)
  assert.deepEqual(
    SLIDES.map((slide) => slide.title),
    [
      'Cuando tu negocio crece más rápido que tus herramientas',
      'Cuando quieres que más clientes te encuentren',
      'Cuando el tiempo no alcanza',
      'Cuando quieres destacar frente a la competencia',
      'Cuando tu tecnología necesita cuidado',
    ],
  )
})

test('Cada diapositiva apunta a un distrito distinto, en orden', () => {
  assert.deepEqual(
    SLIDES.map((slide) => slide.district),
    [0, 1, 2, 3, 4],
  )
})

test('Las descripciones son breves y de extensión equilibrada', () => {
  const counts = SLIDES.map((slide) => words(slide.description))
  for (const [index, count] of counts.entries()) assert.ok(count >= 20 && count <= 40, `${SLIDES[index].id}: ${count} palabras`)
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 14, `desequilibrio: ${counts.join(', ')}`)
})

test('Los textos no prometen resultados ni cifras que el proyecto no respalde', () => {
  const text = [
    ...SLIDES.flatMap((slide) => [slide.title, slide.description]),
    SECTORS_INTRO.intro,
    SECTORS_INTRO.note,
    SECTORS_CLOSING.message,
    SECTORS_CLOSING.detail,
  ]
    .join(' ')
    .toLowerCase()
  for (const claim of ['garantiz', '100%', 'número 1', 'el mejor', 'certificad']) {
    assert.ok(!text.includes(claim), `afirmación no respaldada: «${claim}»`)
  }
})

test('Textos de cabecera y cierre según el brief', () => {
  assert.equal(SECTORS_INTRO.title, 'Sectores que atendemos')
  assert.equal(SECTORS_INTRO.subtitle, 'Tecnología a la medida de tu negocio, sin importar su giro.')
  assert.equal(SECTORS_CLOSING.message, 'Cada negocio es distinto. Su tecnología también debería serlo.')
  assert.match(SECTORS_CLOSING.detail, /^Cuéntanos qué necesitas\./)
  assert.equal(SECTORS_CLOSING.cta, 'Platícanos tu proyecto')
})

test('El destino de «Sectores» en el header coincide con el id de la sección', () => {
  const item = NAVIGATION_ITEMS.find((entry) => entry.id === 'sectores')
  assert.equal(item.href, `#${SECTORS_SECTION_ID}`)
  assert.equal(item.id, SECTORS_SECTION_ID)
})
