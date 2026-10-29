import { SCENE_COLORS } from './sceneColors'

export const SLAB_SHEEN_ID = 'mnt6-slab-sheen'

// Posiciones relativas (0–1) de los LED de estado sobre la cara derecha de la losa
const LIGHT_POSITIONS = [0.3, 0.5, 0.7]

/**
 * Losa de cristal 3D: caras laterales en sombra, cara superior con brillo,
 * arista frontal iluminada y LED de estado. Los hijos se dibujan sobre la cara superior.
 */
export default function GlassSlab({
  slab,
  topColor,
  leftColor,
  rightColor,
  edgeColor,
  lightColors = [],
  children,
}) {
  const { corners, thickness } = slab
  const { left, front, right } = corners
  const frontEdge = `${left.join(',')} ${front.join(',')} ${right.join(',')}`

  return (
    <g strokeLinejoin="round">
      <polygon points={slab.leftFace} fill={leftColor} />
      <polygon points={slab.rightFace} fill={rightColor} />
      <polygon
        points={slab.top}
        fill={topColor}
        fillOpacity="0.96"
        stroke={SCENE_COLORS.lightGray}
        strokeOpacity="0.34"
        strokeWidth="1.2"
      />
      <polygon points={slab.top} fill={`url(#${SLAB_SHEEN_ID})`} />

      {/* Arista frontal iluminada con halo suave */}
      <polyline
        points={frontEdge}
        fill="none"
        stroke={edgeColor}
        strokeOpacity="0.25"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <polyline
        points={frontEdge}
        fill="none"
        stroke={edgeColor}
        strokeOpacity="0.95"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {children}

      {lightColors.map((color, index) => {
        const t = LIGHT_POSITIONS[index]
        return (
          <circle
            key={`${color}-${t}`}
            cx={front[0] + t * (right[0] - front[0])}
            cy={front[1] + t * (right[1] - front[1]) + thickness / 2}
            r="1.9"
            fill={color}
          />
        )
      })}
    </g>
  )
}
