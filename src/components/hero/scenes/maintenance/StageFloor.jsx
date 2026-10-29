import { SCENE_COLORS as C } from './sceneColors'

const GLOW_ID = 'mnt6-stage-glow'
const SHADOW_ID = 'mnt6-floor-shadow'

/**
 * Plano horizonte: iluminación ambiental, sombra de contacto y suelo técnico
 * con anillos concéntricos sobre los que se apoya la plataforma.
 */
export default function StageFloor() {
  return (
    <svg viewBox="0 0 660 500" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id={GLOW_ID} cx="50%" cy="46%" r="52%">
          <stop offset="0%" stopColor={C.emerald} stopOpacity="0.3" />
          <stop offset="52%" stopColor={C.indigo} stopOpacity="0.4" />
          <stop offset="100%" stopColor={C.indigo} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={SHADOW_ID} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.charcoalShadow} stopOpacity="0.88" />
          <stop offset="100%" stopColor={C.charcoalShadow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="330" cy="236" rx="285" ry="205" fill={`url(#${GLOW_ID})`} />
      <ellipse cx="330" cy="448" rx="215" ry="28" fill={`url(#${SHADOW_ID})`} />

      {/* Suelo técnico en perspectiva isométrica */}
      <polygon
        points="330,269 556,382 330,495 104,382"
        fill="#2E292B"
        fillOpacity="0.88"
        stroke={C.indigo}
        strokeOpacity="0.7"
        strokeWidth="1.5"
      />
      <polygon
        points="330,294 506,382 330,470 154,382"
        fill="none"
        stroke={C.emerald}
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      <g stroke={C.emerald} strokeOpacity="0.16" strokeWidth="1">
        <line x1="217" y1="326" x2="443" y2="438" />
        <line x1="443" y1="326" x2="217" y2="438" />
      </g>
    </svg>
  )
}
