import { createCube } from './isoGeometry'
import { MODULE_TONES } from './sceneColors'

/**
 * Módulo de software representado como cubo isométrico.
 * El tono comunica su estado: legacy, estable, actualizado o nuevo.
 */
export default function IsoCube({
  x,
  y,
  half,
  height,
  tone = 'stable',
  isDashed = false,
}) {
  const { top, leftFace, rightFace } = createCube({ x, y, half, height })
  const colors = MODULE_TONES[tone]

  return (
    <g strokeLinejoin="round">
      <polygon
        points={leftFace}
        fill={colors.left}
        stroke={colors.stroke}
        strokeOpacity="0.14"
        strokeWidth="1"
      />
      <polygon
        points={rightFace}
        fill={colors.right}
        stroke={colors.stroke}
        strokeOpacity="0.14"
        strokeWidth="1"
      />
      <polygon
        points={top}
        fill={colors.top}
        stroke={colors.stroke}
        strokeOpacity={isDashed ? '0.5' : '0.62'}
        strokeWidth="1.3"
        strokeDasharray={isDashed ? '4 3' : undefined}
      />
    </g>
  )
}
