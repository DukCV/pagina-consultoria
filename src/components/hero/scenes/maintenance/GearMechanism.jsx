import { createGearPath, slabSurfaceTransform } from './isoGeometry'
import { SCENE_COLORS as C } from './sceneColors'

// Ruedas de 16 y 10 dientes con paso común: la distancia entre centros es la suma de radios primitivos
const LARGE_GEAR = {
  teeth: 16,
  tipRadius: 28.1,
  rootRadius: 22.3,
  phaseDeg: 0,
  center: [32, 56],
  spinClass: 'ov-anim-gear-cw',
}
const SMALL_GEAR = {
  teeth: 10,
  tipRadius: 18.6,
  rootRadius: 12.8,
  phaseDeg: 18, // hueco orientado hacia el diente de la rueda grande
  center: [72.9, 56],
  spinClass: 'ov-anim-gear-ccw',
}

// Capas de extrusión (desplazamiento local, color) de la más profunda a la más cercana
const GEAR_DEPTH_LAYERS = [
  [4.2, '#211D1F'],
  [3.2, '#2A2527'],
  [2.1, '#322C2F'],
  [1.0, '#3C3639'],
]

const BOLT_ANGLES = [0, 60, 120, 180, 240, 300]

function TechGear({ gear, ringColor, hubColor, hasBolts = false, progressArc }) {
  const { teeth, tipRadius, rootRadius, phaseDeg, center, spinClass } = gear
  const outline = createGearPath({ teeth, tipRadius, rootRadius, phaseDeg })
  const ringRadius = rootRadius * 0.74
  const circumference = 2 * Math.PI * ringRadius

  return (
    <g>
      {/* Sombra proyectada sobre la losa */}
      <circle
        cx={center[0] + 2.4}
        cy={center[1] + 2.4}
        r={tipRadius + 1}
        fill={C.charcoalShadow}
        fillOpacity="0.5"
      />

      {GEAR_DEPTH_LAYERS.map(([depth, color]) => (
        <g key={depth} transform={`translate(${center[0] + depth} ${center[1] + depth})`}>
          <path d={outline} fill={color} className={spinClass} />
        </g>
      ))}

      <g transform={`translate(${center[0]} ${center[1]})`}>
        <g className={spinClass}>
          <path
            d={outline}
            fill={C.charcoal}
            stroke={C.lightGray}
            strokeOpacity="0.45"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          <circle r={ringRadius} fill="none" stroke={C.indigo} strokeWidth="2.6" />
          <circle
            r={ringRadius}
            fill="none"
            stroke={ringColor}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeDasharray={`${circumference * progressArc} ${circumference}`}
          />
          {hasBolts &&
            BOLT_ANGLES.map((angle) => (
              <circle
                key={angle}
                cx={Math.cos((angle * Math.PI) / 180) * (ringRadius * 0.55)}
                cy={Math.sin((angle * Math.PI) / 180) * (ringRadius * 0.55)}
                r="1"
                fill={C.lightGray}
                fillOpacity="0.55"
              />
            ))}
          <circle r="4.4" fill={C.charcoalDeep} stroke={C.emerald} strokeWidth="1.3" />
          <circle r="1.7" fill={hubColor} />
        </g>
      </g>
    </g>
  )
}

/**
 * Capa motor: dos engranajes de diseño técnico engranados sobre la losa inferior.
 * Los anillos segmentados remiten a ciclos de revisión continua en lugar de un engranaje genérico.
 */
export default function GearMechanism({ slab }) {
  return (
    <g transform={slabSurfaceTransform(slab)}>
      <TechGear
        gear={LARGE_GEAR}
        ringColor={C.lime}
        hubColor={C.lime}
        hasBolts
        progressArc={0.34}
      />
      <TechGear
        gear={SMALL_GEAR}
        ringColor={C.emerald}
        hubColor={C.emerald}
        progressArc={0.6}
      />
    </g>
  )
}
