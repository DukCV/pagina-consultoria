import { OVERLAYER_PALETTE } from '../../../constants/brandTheme.js'
import { makeCanvas } from '../../scene3d/panelTextures.js'
import { CITY, DISTRICT_COUNT, DISTRICT_STEP, createLots, districtAngle, districtToWorld, lotCorners } from './cityRig.js'

/**
 * Texturas de canvas de la ciudad: el plano del suelo (calles, aceras, plaza, parcelas) y la fachada de las
 * torres de oficinas. Sin texto, para no depender de que la fuente haya cargado.
 */

const { emerald, indigo, lightGray } = OVERLAYER_PALETTE
const COLORS = {
  block: '#3a343c',
  asphalt: '#232027',
  sidewalk: '#4d474c',
  plot: '#463f45',
  plaza: '#5b5459',
  belt: '#27403a',
}

/** Píxeles por unidad de mundo; la tapa de un cilindro mapea (x, z) a (u, v) = (½ + x/2R, ½ + z/2R). */
const pixelsPerUnit = (size) => size / (2 * CITY.radius)

function mapper(size) {
  const k = pixelsPerUnit(size)
  return ([x, z]) => [size / 2 + x * k, size / 2 + z * k]
}

function polygon(ctx, points, fill) {
  ctx.beginPath()
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function circle(ctx, to, radius, fill, k) {
  const [cx, cy] = to([0, 0])
  ctx.beginPath()
  ctx.arc(cx, cy, radius * k, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

function ring(ctx, to, inner, outer, fill, k) {
  const [cx, cy] = to([0, 0])
  ctx.beginPath()
  ctx.arc(cx, cy, outer * k, 0, Math.PI * 2)
  ctx.arc(cx, cy, inner * k, 0, Math.PI * 2, true)
  ctx.fillStyle = fill
  ctx.fill('evenodd')
}

/**
 * Línea central de las calles: continua y ancha (≥ 0,12 u) y de poco contraste. Los trazos finos o
 * discontinuos se submuestrean al alejar la cámara y «brillan» (parpadean) cuando orbita.
 */
function centerLine(ctx, to, from, end, k) {
  const [x1, y1] = to(from)
  const [x2, y2] = to(end)
  ctx.save()
  ctx.strokeStyle = 'rgba(218,221,216,0.22)'
  ctx.lineWidth = 0.13 * k
  ctx.lineCap = 'butt'
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

const SHADOW = { offset: [-0.3, 0.22], grow: 1.12, blur: 0.5, color: 'rgba(8,6,10,0.7)' } // la luz viene de arriba a la derecha
const FAR_AWAY = 10000 // el truco de `shadowOffsetX`: se dibuja la forma fuera del lienzo y solo se ve su sombra

/**
 * Sombras de contacto de los lotes, horneadas en el suelo: una sola textura, sin mallas translúcidas cuyo orden
 * de dibujado cambie al orbitar la cámara (eso parpadeaba) y sin coste de dibujado extra.
 */
function paintLotShadows(ctx, to, k, lots) {
  ctx.save()
  ctx.shadowColor = SHADOW.color
  ctx.shadowBlur = SHADOW.blur * k
  ctx.shadowOffsetX = FAR_AWAY
  ctx.fillStyle = '#000'
  for (const lot of lots) {
    const [cx, cz] = [lot.center[0], lot.center[2]]
    const corners = lotCorners(lot).map(([x, z]) => to([cx + (x - cx) * SHADOW.grow + SHADOW.offset[0], cz + (z - cz) * SHADOW.grow + SHADOW.offset[1]]))
    ctx.beginPath()
    corners.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x - FAR_AWAY, y) : ctx.lineTo(x - FAR_AWAY, y)))
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

/**
 * Plano del suelo: parcelas y aceras sobre la manzana, calles de asfalto con su línea central, avenida
 * circular, plaza con anillos concéntricos, cinturón verde y aro del borde.
 */
export function groundTexture(size = 2048) {
  const [canvas, ctx] = makeCanvas(size, size)
  const to = mapper(size)
  const k = pixelsPerUnit(size)
  const half = size / 2

  ctx.fillStyle = COLORS.block
  ctx.fillRect(0, 0, size, size)

  // Cinturón verde exterior
  ring(ctx, to, CITY.radius - 0.95, CITY.radius * 1.2, COLORS.belt, k)

  // Aceras y parcelas: cada lote descansa sobre una losa algo mayor
  const lots = createLots()
  for (const lot of lots) {
    const [cx, , cz] = lot.center
    const margin = 0.28
    const sin = Math.sin(lot.yaw)
    const cos = Math.cos(lot.yaw)
    const w = lot.size[0] / 2 + margin
    const d = lot.size[1] / 2 + margin
    const pad = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([sx, sz]) => to([cx + sx * w * cos + sz * d * sin, cz - sx * w * sin + sz * d * cos]))
    polygon(ctx, pad, COLORS.plot)
  }

  // Calles rectas entre hileras (en el sistema de cada distrito)
  const [s0, s1] = CITY.middleStreet
  for (let district = 0; district < DISTRICT_COUNT; district += 1) {
    const reach = Math.tan(DISTRICT_STEP / 2)
    const strip = [
      [-s0 * reach - 0.5, s0],
      [s0 * reach + 0.5, s0],
      [s1 * reach + 0.5, s1],
      [-s1 * reach - 0.5, s1],
    ].map(([t, s]) => to(districtToWorld(district, t, s)))
    // aceras a ambos lados de la calle
    const walk = 0.22
    const wide = [
      [-(s0 - walk) * reach - 0.5, s0 - walk],
      [(s0 - walk) * reach + 0.5, s0 - walk],
      [(s1 + walk) * reach + 0.5, s1 + walk],
      [-(s1 + walk) * reach - 0.5, s1 + walk],
    ].map(([t, s]) => to(districtToWorld(district, t, s)))
    polygon(ctx, wide, COLORS.sidewalk)
    polygon(ctx, strip, COLORS.asphalt)
    const mid = (s0 + s1) / 2
    centerLine(ctx, to, districtToWorld(district, -mid * reach, mid), districtToWorld(district, mid * reach, mid), k)
  }

  // Calles radiales por los límites entre distritos
  const roadHalf = CITY.radialRoadWidth / 2
  for (let district = 0; district < DISTRICT_COUNT; district += 1) {
    const angle = districtAngle(district) + DISTRICT_STEP / 2
    const dir = [Math.sin(angle), Math.cos(angle)]
    const side = [Math.cos(angle), -Math.sin(angle)]
    const inner = CITY.ringRoad[1] - 0.2
    const outer = CITY.radius - 0.5
    const corners = (extra) =>
      [
        [inner, -(roadHalf + extra)],
        [outer, -(roadHalf + extra)],
        [outer, roadHalf + extra],
        [inner, roadHalf + extra],
      ].map(([along, across]) => to([dir[0] * along + side[0] * across, dir[1] * along + side[1] * across]))
    polygon(ctx, corners(0.2), COLORS.sidewalk)
    polygon(ctx, corners(0), COLORS.asphalt)
    centerLine(ctx, to, [dir[0] * inner, dir[1] * inner], [dir[0] * outer, dir[1] * outer], k)
  }

  // Avenida circular y plaza
  ring(ctx, to, CITY.ringRoad[0] - 0.2, CITY.ringRoad[1] + 0.2, COLORS.sidewalk, k)
  ring(ctx, to, CITY.ringRoad[0], CITY.ringRoad[1], COLORS.asphalt, k)
  const [cx, cy] = to([0, 0])
  ctx.save()
  ctx.strokeStyle = 'rgba(218,221,216,0.22)'
  ctx.lineWidth = 0.13 * k
  ctx.beginPath()
  ctx.arc(cx, cy, ((CITY.ringRoad[0] + CITY.ringRoad[1]) / 2) * k, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
  circle(ctx, to, CITY.plazaRadius, COLORS.plaza, k)
  ctx.strokeStyle = 'rgba(65,157,120,0.55)'
  ctx.lineWidth = 0.14 * k
  ctx.beginPath()
  ctx.arc(cx, cy, (CITY.plazaRadius - 0.1) * k, 0, Math.PI * 2)
  ctx.stroke()

  paintLotShadows(ctx, to, k, lots)

  // Aro del borde de la maqueta
  ctx.lineWidth = 0.12 * k
  ctx.strokeStyle = 'rgba(65,157,120,0.6)'
  ctx.beginPath()
  ctx.arc(half, half, (CITY.radius - 0.2) * k, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 0.14 * k
  ctx.strokeStyle = 'rgba(67,67,113,0.95)'
  ctx.beginPath()
  ctx.arc(half, half, (CITY.radius - 0.5) * k, 0, Math.PI * 2)
  ctx.stroke()

  return canvas
}

/**
 * Fachada de torre de oficinas (proporción 1:2): ventanas grandes y de poco contraste. Las retículas finas se
 * submuestrean al alejar la cámara y parpadean; con bloques grandes los mipmaps las funden sin moiré.
 */
export function facadeOfficeTexture() {
  const [canvas, ctx] = makeCanvas(128, 256)
  ctx.fillStyle = '#2d2d52'
  ctx.fillRect(0, 0, 128, 256)
  const lit = [0.15, 0.4, 0.62, 0.3, 0.8, 0.5, 0.22, 0.7]
  const rows = 8
  const cols = 3
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const isLit = lit[(row * 3 + col * 5) % lit.length] > 0.5
      ctx.fillStyle = isLit ? lightGray : indigo
      ctx.globalAlpha = isLit ? 0.62 : 0.85
      ctx.fillRect(8 + col * 38, 8 + row * 30.5, 30, 22)
    }
  }
  ctx.globalAlpha = 0.3
  ctx.strokeStyle = emerald
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, 124, 252)
  return canvas
}
