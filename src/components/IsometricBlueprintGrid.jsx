import { BRAND_COLORS } from '../assets/overlayerGeometry'

const ISO_OFFSETS = [-320, -160, -64, 0, 64, 160, 320]
const DIAMOND_RADII = [
  { w: 150, h: 93.75 },
  { w: 290, h: 181.25 },
  { w: 460, h: 287.5 },
]

/**
 * Recurso visual vectorial: Retícula arquitectónica isométrica a 32.005° (proporción 8:5 exacta de Overlayer).
 */
export default function IsometricBlueprintGrid({
  drawProgress = 1,
  opacity = 1,
  mode = 'dark',
}) {
  const isDark = mode === 'dark'
  const primaryStroke = isDark ? 'rgba(136, 145, 224, 0.16)' : 'rgba(72, 61, 59, 0.065)'
  const accentStroke = isDark ? 'rgba(73, 199, 150, 0.18)' : 'rgba(53, 151, 113, 0.08)'
  const limeTick = isDark ? BRAND_COLORS.lime : BRAND_COLORS.indigo

  const dashOffset = Math.max(0, 1 - drawProgress) * 1000

  return (
    <svg
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full select-none"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Ejes centrales ortogonales sutiles */}
      <line
        x1="960"
        y1="0"
        x2="960"
        y2="1080"
        stroke={primaryStroke}
        strokeWidth="1"
        strokeDasharray="4 8"
      />
      <line
        x1="0"
        y1="540"
        x2="1920"
        y2="540"
        stroke={primaryStroke}
        strokeWidth="1"
        strokeDasharray="4 8"
      />

      {/* Líneas de construcción isométricas exactas (±32.005°, pendiente ±5/8) */}
      {ISO_OFFSETS.map((off, idx) => {
        const isMain = Math.abs(off) <= 64
        const stroke = idx % 2 === 0 ? primaryStroke : accentStroke
        return (
          <g key={off}>
            <line
              x1="0"
              y1={540 + off - 600}
              x2="1920"
              y2={540 + off + 600}
              pathLength="1000"
              stroke={stroke}
              strokeWidth={isMain ? '1.1' : '0.75'}
              strokeDasharray="1000"
              strokeDashoffset={dashOffset}
            />
            <line
              x1="0"
              y1={540 + off + 600}
              x2="1920"
              y2={540 + off - 600}
              pathLength="1000"
              stroke={stroke}
              strokeWidth={isMain ? '1.1' : '0.75'}
              strokeDasharray="1000"
              strokeDashoffset={dashOffset}
            />
          </g>
        )
      })}

      {/* Rombos concéntricos de calibración isométrica */}
      {DIAMOND_RADII.map(({ w, h }, idx) => {
        const delayedProgress = Math.max(0, Math.min(1, (drawProgress - idx * 0.12) / 0.85))
        return (
          <polygon
            key={w}
            points={`960,${540 - h} ${960 + w},540 960,${540 + h} ${960 - w},540`}
            fill="none"
            pathLength="1000"
            stroke={idx === 1 ? accentStroke : primaryStroke}
            strokeWidth={idx === 0 ? '1.15' : '0.8'}
            strokeDasharray="1000"
            strokeDashoffset={(1 - delayedProgress) * 1000}
          />
        )
      })}

      {/* Marcas de registro en nodos de intersección clave */}
      {[
        [960 - 290, 540],
        [960 + 290, 540],
        [960, 540 - 181.25],
        [960, 540 + 181.25],
      ].map(([cx, cy], i) => (
        <g
          key={i}
          transform={`translate(${cx}, ${cy})`}
          opacity={Math.min(1, drawProgress * 1.4)}
        >
          <line x1="-6" y1="0" x2="6" y2="0" stroke={limeTick} strokeWidth="1" opacity="0.45" />
          <line x1="0" y1="-6" x2="0" y2="6" stroke={limeTick} strokeWidth="1" opacity="0.45" />
          <circle r="2" fill={limeTick} opacity="0.5" />
        </g>
      ))}
    </svg>
  )
}
