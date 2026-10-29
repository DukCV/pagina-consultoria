/**
 * Geometría CAD vectorial exacta y tokens de identidad visual de Overlayer.
 * Reconstruido matemáticamente a sub-píxel sobre un lienzo maestro 1024 × 572.
 */

export const BRAND_COLORS = {
  stoneCanvas: '#DADBD5',
  stoneLight: '#E5E6E0',
  stoneShadow: '#C7C9C0',
  obsidianVoid: '#10121E',
  obsidianDeep: '#090A12',
  indigo: '#3B3E69',
  indigoLight: '#5E63A8',
  emerald: '#359771',
  emeraldLight: '#49C796',
  lime: '#BFF559',
  limeGlow: '#E0FF9E',
  espresso: '#483D3B',
}

/**
 * Genera el trazado SVG exacto de un rombo isométrico con chaflán circular tangente R.
 * @param {number} W Semiancho agudo (sin redondear)
 * @param {number} H Semialto agudo (sin redondear)
 * @param {number} R Radio del arco circular tangente en los 4 vértices
 * @param {boolean} clockwise Sentido horario (true para contorno exterior, false para hueco interior)
 */
export function buildRoundedRhombusPath(W, H, R, clockwise = true) {
  const f = (n) => Number(n.toFixed(3))
  const S = Math.hypot(W, H)
  const ux = W / S
  const uy = H / S

  // Distancias desde los vértices agudos hasta los puntos exactos de tangencia
  const dTB = R * (H / W)
  const dLR = R * (W / H)

  const p1 = [dTB * ux, -H + dTB * uy]     // Superior-derecho junto al ápice norte
  const p2 = [W - dLR * ux, -dLR * uy]     // Superior-izquierdo junto al ápice este
  const p3 = [W - dLR * ux, dLR * uy]      // Inferior-izquierdo junto al ápice este
  const p4 = [dTB * ux, H - dTB * uy]      // Superior-derecho junto al ápice sur
  const p5 = [-dTB * ux, H - dTB * uy]     // Superior-izquierdo junto al ápice sur
  const p6 = [-W + dLR * ux, dLR * uy]     // Inferior-derecho junto al ápice oeste
  const p7 = [-W + dLR * ux, -dLR * uy]    // Superior-derecho junto al ápice oeste
  const p8 = [-dTB * ux, -H + dTB * uy]    // Superior-izquierdo junto al ápice norte

  if (clockwise) {
    return [
      `M ${f(p1[0])} ${f(p1[1])}`,
      `L ${f(p2[0])} ${f(p2[1])}`,
      `A ${f(R)} ${f(R)} 0 0 1 ${f(p3[0])} ${f(p3[1])}`,
      `L ${f(p4[0])} ${f(p4[1])}`,
      `A ${f(R)} ${f(R)} 0 0 1 ${f(p5[0])} ${f(p5[1])}`,
      `L ${f(p6[0])} ${f(p6[1])}`,
      `A ${f(R)} ${f(R)} 0 0 1 ${f(p7[0])} ${f(p7[1])}`,
      `L ${f(p8[0])} ${f(p8[1])}`,
      `A ${f(R)} ${f(R)} 0 0 1 ${f(p1[0])} ${f(p1[1])}`,
      'Z',
    ].join(' ')
  }

  // Sentido antihorario para recorte interior limpio (compatible tanto con nonzero como evenodd)
  return [
    `M ${f(p1[0])} ${f(p1[1])}`,
    `A ${f(R)} ${f(R)} 0 0 0 ${f(p8[0])} ${f(p8[1])}`,
    `L ${f(p7[0])} ${f(p7[1])}`,
    `A ${f(R)} ${f(R)} 0 0 0 ${f(p6[0])} ${f(p6[1])}`,
    `L ${f(p5[0])} ${f(p5[1])}`,
    `A ${f(R)} ${f(R)} 0 0 0 ${f(p4[0])} ${f(p4[1])}`,
    `L ${f(p3[0])} ${f(p3[1])}`,
    `A ${f(R)} ${f(R)} 0 0 0 ${f(p2[0])} ${f(p2[1])}`,
    `L ${f(p1[0])} ${f(p1[1])}`,
    'Z',
  ].join(' ')
}

// Parámetros exactos del anillo isométrico Overlayer (pendiente exacta 5:8, θ = 32.005°)
export const RING_METRICS = {
  outerSharpW: 105.2,
  outerSharpH: 65.75,
  outerRadius: 12.2,
  innerSharpW: 47.6,
  innerSharpH: 29.75,
  innerRadius: 1.4,
  upperRestY: -23.25,
  lowerRestY: 23.25,
  // Centro del isotipo en el lienzo maestro 1024×572:
  lockupSymbolX: 275,
  centerStageSymbolX: 512,
  symbolCenterY: 286,
  // Centroide exacto del prisma lima (#BFF559) respecto al centro del isotipo (0,0):
  limeCentroidOffset: { x: 39.2, y: 0 },
}

export const RING_OUTER_PATH = buildRoundedRhombusPath(
  RING_METRICS.outerSharpW,
  RING_METRICS.outerSharpH,
  RING_METRICS.outerRadius,
  true,
)

export const RING_INNER_CCW_PATH = buildRoundedRhombusPath(
  RING_METRICS.innerSharpW,
  RING_METRICS.innerSharpH,
  RING_METRICS.innerRadius,
  false,
)

export const RING_INNER_CW_PATH = buildRoundedRhombusPath(
  RING_METRICS.innerSharpW,
  RING_METRICS.innerSharpH,
  RING_METRICS.innerRadius,
  true,
)

// Trazado compuesto de un anillo completo centrado en (0, 0)
export const RING_COMPOUND_PATH = `${RING_OUTER_PATH} ${RING_INNER_CCW_PATH}`

// Rombo estático exacto de la intersección derecha (útil para destellos perimetrales y SVGs estáticos)
export const LIME_PRISM_PATH = 'M 39.2 -18 L 68 0 L 39.2 18 L 10.4 0 Z'

/**
 * Desplaza en X cualquier path absoluto compuesto por comandos M, L, C, Z.
 */
function shiftPathX(d, dx) {
  return d.replace(/([MLC])([^MLCZ]+)/g, (_, cmd, args) => {
    const nums = args
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    const shifted = nums.map((val, idx) =>
      idx % 2 === 0 ? Number((val + dx).toFixed(2)) : val,
    )
    if (cmd === 'C') {
      const chunks = []
      for (let i = 0; i < shifted.length; i += 6) {
        chunks.push(
          `${shifted[i]} ${shifted[i + 1]}, ${shifted[i + 2]} ${shifted[i + 3]}, ${shifted[i + 4]} ${shifted[i + 5]}`,
        )
      }
      return `C ${chunks.join(' C ')}`
    }
    return `${cmd} ${shifted[0]} ${shifted[1]}`
  })
}

// Glifos maestros de tipografía geométrica a medida (origen del bloque tipográfico: X=390, Y=220 en 1024×572)
const GLYPH_O = [
  'M 45.55 27.25',
  'A 35.2 35.12 0 1 1 45.55 97.49',
  'A 35.2 35.12 0 1 1 45.55 27.25',
  'Z',
  'M 45.45 37.30',
  'A 24.1 25.02 0 1 0 45.45 87.34',
  'A 24.1 25.02 0 1 0 45.45 37.30',
  'Z',
].join(' ')

const GLYPH_V =
  'M 86.1 47.5 L 96.9 47.5 L 110.95 82.1 L 125.0 47.5 L 135.7 47.5 L 115.45 96.05 L 106.35 96.05 Z'

const GLYPH_E =
  'M 188.9 74.8 L 149.7 74.8 C 150.4 83.2, 156.9 88.2, 165.1 88.2 C 171.2 88.2, 175.8 85.8, 179.0 82.0 L 186.6 85.6 C 182.2 93.1, 174.5 97.5, 164.6 97.5 C 149.2 97.5, 138.4 86.7, 138.4 71.9 C 138.4 57.1, 149.1 46.3, 164.0 46.3 C 178.9 46.3, 189.1 56.9, 189.1 71.4 C 189.1 72.7, 189.0 73.8, 188.9 74.8 Z M 149.9 66.8 L 177.6 66.8 C 176.6 59.5, 171.2 55.2, 163.9 55.2 C 156.5 55.2, 151.1 59.6, 149.9 66.8 Z'

const GLYPH_R =
  'M 198.3 47.4 L 208.5 47.4 L 208.5 53.8 C 211.4 48.8, 216.6 46.3, 223.2 46.3 C 224.2 46.3, 225.0 46.4, 225.8 46.6 L 225.8 56.6 C 224.6 56.4, 223.4 56.3, 222.0 56.3 C 213.6 56.3, 208.7 61.4, 208.7 71.5 L 208.7 96.05 L 198.3 96.05 Z'

const GLYPH_L = 'M 233.9 27.8 L 244.2 27.8 L 244.2 96.05 L 233.9 96.05 Z'

const GLYPH_A =
  'M 294.8 47.4 L 305.3 47.4 L 305.3 96.05 L 294.8 96.05 L 294.8 90.4 C 291.1 95.0, 285.1 97.5, 277.8 97.5 C 263.8 97.5, 253.4 86.7, 253.4 71.9 C 253.4 57.1, 263.8 46.3, 277.8 46.3 C 285.1 46.3, 291.1 48.8, 294.8 53.4 Z M 279.5 87.8 C 288.4 87.8, 294.9 81.1, 294.9 71.9 C 294.9 62.7, 288.4 56.0, 279.5 56.0 C 270.6 56.0, 264.2 62.7, 264.2 71.9 C 264.2 81.1, 270.6 87.8, 279.5 87.8 Z'

const GLYPH_Y =
  'M 312.8 47.5 L 323.65 47.5 L 337.7 83.1 L 351.6 47.5 L 362.4 47.5 L 335.9 115.0 L 325.3 115.0 L 332.65 96.1 Z'

export const WORDMARK_ORIGIN = { x: 390, y: 220 }

export const WORDMARK_GLYPHS = [
  { id: 'O-0', char: 'O', d: GLYPH_O, centerX: 45.5 },
  { id: 'v-1', char: 'v', d: GLYPH_V, centerX: 110.9 },
  { id: 'e-2', char: 'e', d: GLYPH_E, centerX: 163.8 },
  { id: 'r-3', char: 'r', d: GLYPH_R, centerX: 212.0 },
  { id: 'l-4', char: 'l', d: GLYPH_L, centerX: 239.0 },
  { id: 'a-5', char: 'a', d: GLYPH_A, centerX: 279.4 },
  { id: 'y-6', char: 'y', d: GLYPH_Y, centerX: 337.6 },
  { id: 'e-7', char: 'e', d: shiftPathX(GLYPH_E, 227.0), centerX: 390.8 },
  { id: 'r-8', char: 'r', d: shiftPathX(GLYPH_R, 226.5), centerX: 438.5 },
]

/**
 * Dimensiones maestras del lienzo de bienvenida y caja envolvente exacta del lockup
 * ensamblado, garantizando correspondencia 1:1 sub-píxel durante la transición al header.
 */
export const STAGE_VIEWBOX = { width: 1024, height: 572 }

export const LOCKUP_VIEWBOX_BOUNDS = {
  x: 180.4,
  y: 199.15,
  width: 661.9,
  height: 173.7,
}

