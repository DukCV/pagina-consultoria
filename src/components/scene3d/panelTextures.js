import { OVERLAYER_PALETTE } from '../../constants/brandTheme.js'

/**
 * Texturas de interfaz de los objetos 3D, dibujadas con canvas 2D: paneles de control, ventanas web,
 * racks, cuadrículas y sprites de brillo. Todas usan la paleta de Overlayer (el lima solo aparece como
 * punto de actividad) y no contienen texto, de modo que no dependen de que la fuente haya cargado.
 * Cada función devuelve un `HTMLCanvasElement` listo para usarse como imagen de un material.
 */

const { emerald, indigo, lime, lightGray } = OVERLAYER_PALETTE
const CHARCOAL_DEEP = '#2b2830'
const CHARCOAL_SLAB = '#35303a'
const CHARCOAL_LIGHT = '#4a4347'

export function makeCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return [canvas, canvas.getContext('2d')]
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}

function fillRounded(ctx, x, y, width, height, radius, fill, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = fill
  roundedRect(ctx, x, y, width, height, radius)
  ctx.fill()
  ctx.restore()
}

function panelBackground(ctx, width, height, radius = 36) {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, CHARCOAL_LIGHT)
  gradient.addColorStop(0.55, CHARCOAL_SLAB)
  gradient.addColorStop(1, CHARCOAL_DEEP)
  fillRounded(ctx, 0, 0, width, height, radius, gradient)
  ctx.save()
  ctx.strokeStyle = lightGray
  ctx.globalAlpha = 0.22
  ctx.lineWidth = 3
  roundedRect(ctx, 2, 2, width - 4, height - 4, radius)
  ctx.stroke()
  ctx.restore()
}

function chartLine(ctx, x, y, width, height, color, points) {
  ctx.save()
  const fill = ctx.createLinearGradient(0, y, 0, y + height)
  fill.addColorStop(0, `${color}88`)
  fill.addColorStop(1, `${color}00`)
  const toX = (i) => x + (i / (points.length - 1)) * width
  const toY = (v) => y + height - v * height
  ctx.beginPath()
  ctx.moveTo(toX(0), y + height)
  points.forEach((v, i) => ctx.lineTo(toX(i), toY(v)))
  ctx.lineTo(toX(points.length - 1), y + height)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.beginPath()
  points.forEach((v, i) => (i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v))))
  ctx.strokeStyle = color
  ctx.lineWidth = 6
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()
}

/** Panel de control de sistemas a la medida: menú lateral, indicadores y gráfica. */
export function dashboardTexture() {
  const [canvas, ctx] = makeCanvas(1024, 640)
  panelBackground(ctx, 1024, 640)
  // Barra superior
  ;[emerald, indigo, lightGray].forEach((color, i) => {
    ctx.fillStyle = color
    ctx.globalAlpha = i === 2 ? 0.4 : 1
    ctx.beginPath()
    ctx.arc(54 + i * 30, 50, 8, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 1
  fillRounded(ctx, 640, 38, 300, 24, 12, lightGray, 0.14)
  ctx.fillStyle = lime
  ctx.beginPath()
  ctx.arc(970, 50, 9, 0, Math.PI * 2)
  ctx.fill()
  // Menú lateral
  fillRounded(ctx, 36, 96, 190, 508, 22, CHARCOAL_DEEP, 0.9)
  fillRounded(ctx, 56, 124, 150, 34, 17, emerald, 0.55)
  for (let i = 0; i < 5; i += 1) fillRounded(ctx, 60, 184 + i * 46, 100 + (i % 3) * 22, 14, 7, lightGray, 0.3)
  fillRounded(ctx, 56, 534, 150, 40, 20, indigo)
  fillRounded(ctx, 56, 534, 88, 40, 20, emerald)
  // Indicadores
  const kpis = [emerald, indigo, lightGray]
  kpis.forEach((color, i) => {
    const x = 252 + i * 250
    fillRounded(ctx, x, 96, 230, 118, 22, CHARCOAL_DEEP, 0.92)
    fillRounded(ctx, x + 24, 122, 86, 12, 6, lightGray, 0.42)
    fillRounded(ctx, x + 24, 152, 140 + i * 14, 30, 15, color, i === 2 ? 0.78 : 1)
  })
  // Gráfica principal
  fillRounded(ctx, 252, 238, 724, 366, 26, CHARCOAL_DEEP, 0.92)
  fillRounded(ctx, 284, 268, 200, 14, 7, lightGray, 0.4)
  chartLine(ctx, 284, 318, 660, 240, emerald, [0.12, 0.22, 0.18, 0.4, 0.34, 0.58, 0.52, 0.78, 0.9])
  chartLine(ctx, 284, 338, 660, 220, indigo, [0.08, 0.14, 0.2, 0.18, 0.3, 0.36, 0.34, 0.5, 0.6])
  ctx.fillStyle = lime
  ctx.beginPath()
  ctx.arc(944, 318 + 240 * 0.1, 11, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}

/** Panel secundario con barras: se usa como ventana flotante de datos. */
export function barsTexture() {
  const [canvas, ctx] = makeCanvas(640, 400)
  panelBackground(ctx, 640, 400, 30)
  fillRounded(ctx, 36, 36, 160, 14, 7, lightGray, 0.42)
  const heights = [0.35, 0.58, 0.44, 0.82, 0.66, 0.95, 0.74]
  heights.forEach((value, i) => {
    const barHeight = value * 250
    fillRounded(ctx, 44 + i * 82, 360 - barHeight, 54, barHeight, 12, i === 5 ? emerald : indigo, i === 5 ? 1 : 0.9)
  })
  return canvas
}

/** Frontal de un rack de servidores: bahías con indicadores. */
export function rackTexture() {
  const [canvas, ctx] = makeCanvas(256, 512)
  const gradient = ctx.createLinearGradient(0, 0, 256, 0)
  gradient.addColorStop(0, '#2d2831')
  gradient.addColorStop(1, '#3a343d')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 512)
  for (let i = 0; i < 9; i += 1) {
    const y = 18 + i * 54
    fillRounded(ctx, 16, y, 224, 44, 8, '#221f26')
    ctx.strokeStyle = i % 3 === 0 ? emerald : indigo
    ctx.globalAlpha = 0.7
    ctx.lineWidth = 2
    roundedRect(ctx, 16, y, 224, 44, 8)
    ctx.stroke()
    ctx.globalAlpha = 1
    for (let slot = 0; slot < 4; slot += 1) fillRounded(ctx, 30 + slot * 22, y + 12, 16, 20, 4, lightGray, 0.14)
    ctx.fillStyle = i % 3 === 1 ? lightGray : emerald
    ctx.beginPath()
    ctx.arc(206, y + 22, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvas
}

/** Ventana de navegador con una página web de ejemplo. */
export function browserTexture() {
  const [canvas, ctx] = makeCanvas(1024, 640)
  panelBackground(ctx, 1024, 640)
  ;[emerald, indigo, lightGray].forEach((color, i) => {
    ctx.fillStyle = color
    ctx.globalAlpha = i === 2 ? 0.4 : 1
    ctx.beginPath()
    ctx.arc(50 + i * 28, 48, 8, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 1
  fillRounded(ctx, 190, 30, 640, 36, 18, CHARCOAL_DEEP)
  fillRounded(ctx, 214, 42, 230, 12, 6, lightGray, 0.32)
  // Portada de la página
  const hero = ctx.createLinearGradient(40, 100, 984, 330)
  hero.addColorStop(0, emerald)
  hero.addColorStop(1, indigo)
  fillRounded(ctx, 40, 96, 944, 250, 28, hero, 0.9)
  fillRounded(ctx, 84, 146, 420, 30, 15, lightGray)
  fillRounded(ctx, 84, 196, 300, 18, 9, lightGray, 0.7)
  fillRounded(ctx, 84, 262, 148, 44, 22, lime)
  // Tarjetas
  for (let i = 0; i < 3; i += 1) {
    const x = 40 + i * 322
    fillRounded(ctx, x, 378, 300, 214, 22, CHARCOAL_DEEP, 0.92)
    fillRounded(ctx, x + 26, 404, 92, 14, 7, emerald)
    fillRounded(ctx, x + 26, 440, 220 - i * 30, 12, 6, lightGray, 0.4)
    fillRounded(ctx, x + 26, 466, 180, 12, 6, lightGray, 0.26)
  }
  return canvas
}

/** Pantalla de móvil con una versión adaptada de la página. */
export function phoneTexture() {
  const [canvas, ctx] = makeCanvas(360, 720)
  const background = ctx.createLinearGradient(0, 0, 0, 720)
  background.addColorStop(0, CHARCOAL_LIGHT)
  background.addColorStop(1, CHARCOAL_DEEP)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, 360, 720)
  const hero = ctx.createLinearGradient(0, 70, 360, 330)
  hero.addColorStop(0, emerald)
  hero.addColorStop(1, indigo)
  fillRounded(ctx, 24, 70, 312, 250, 28, hero, 0.92)
  fillRounded(ctx, 52, 112, 170, 22, 11, lightGray)
  fillRounded(ctx, 52, 148, 120, 14, 7, lightGray, 0.7)
  fillRounded(ctx, 52, 250, 110, 38, 19, lime)
  for (let i = 0; i < 3; i += 1) {
    fillRounded(ctx, 24, 350 + i * 84, 312, 68, 20, CHARCOAL_DEEP, 0.95)
    fillRounded(ctx, 44, 372 + i * 84, 30, 24, 8, i === 1 ? emerald : indigo)
    fillRounded(ctx, 90, 376 + i * 84, 160, 12, 6, lightGray, 0.42)
  }
  fillRounded(ctx, 130, 690, 100, 8, 4, lightGray, 0.32)
  return canvas
}

/** Cuadrícula esmeralda sobre fondo transparente: suelo de realidad aumentada / plataforma. */
export function gridTexture() {
  const [canvas, ctx] = makeCanvas(512, 512)
  ctx.strokeStyle = emerald
  ctx.lineWidth = 3
  ctx.globalAlpha = 0.9
  for (let i = 0; i <= 8; i += 1) {
    const p = (i / 8) * 504 + 4
    ctx.beginPath()
    ctx.moveTo(p, 4)
    ctx.lineTo(p, 508)
    ctx.moveTo(4, p)
    ctx.lineTo(508, p)
    ctx.stroke()
  }
  return canvas
}

/** Mosaico de módulos con su estado: losa de mantenimiento y actualización. */
export function modulesTexture() {
  const [canvas, ctx] = makeCanvas(512, 512)
  fillRounded(ctx, 0, 0, 512, 512, 34, CHARCOAL_SLAB)
  const tones = [indigo, indigo, emerald, indigo, emerald, lightGray, indigo, emerald, emerald]
  tones.forEach((color, i) => {
    const x = 36 + (i % 3) * 154
    const y = 36 + Math.floor(i / 3) * 154
    fillRounded(ctx, x, y, 134, 134, 22, color, color === lightGray ? 0.55 : 0.9)
    fillRounded(ctx, x + 22, y + 24, 60, 10, 5, lightGray, 0.5)
  })
  ctx.fillStyle = lime
  ctx.beginPath()
  ctx.arc(36 + 2 * 154 + 114, 36 + 154 + 20, 9, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}

/** Sprite de brillo: núcleo blanco que se desvanece (se tiñe con el color base del material). */
export function glowTexture() {
  const [canvas, ctx] = makeCanvas(256, 256)
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.38)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  return canvas
}

/** Sombra de contacto: mancha oscura que se desvanece hacia los bordes. */
export function shadowTexture() {
  const [canvas, ctx] = makeCanvas(256, 256)
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(12,10,14,0.85)')
  gradient.addColorStop(0.55, 'rgba(12,10,14,0.4)')
  gradient.addColorStop(1, 'rgba(12,10,14,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  return canvas
}
