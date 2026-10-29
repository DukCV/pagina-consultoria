import { SCENE_COLORS as C } from './sceneColors'

// Peldaños ascendentes: cada versión supera a la anterior
const STEPS = [
  { x: 3, height: 14, color: C.indigo },
  { x: 23, height: 24, color: C.indigo },
  { x: 43, height: 34, color: C.emerald },
  { x: 63, height: 46, color: C.lime },
]
const BASELINE = 60
const STEP_WIDTH = 14

/** Tarjeta flotante con la línea de evolución de versiones. */
export default function EvolutionCard() {
  const nodes = STEPS.map(({ x, height }) => [x + STEP_WIDTH / 2, BASELINE - height])
  const trend = nodes.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const [peakX, peakY] = nodes[nodes.length - 1]

  return (
    <div className="ov-anim-float-alt absolute bottom-[3%] left-[5%] flex items-end gap-3 rounded-2xl border border-[#419D78]/45 bg-[#383234]/94 p-2.5 shadow-[0_24px_44px_rgba(18,15,16,0.86)] backdrop-blur-xl sm:bottom-[10%] sm:left-[6%] sm:p-3.5">
      <svg viewBox="0 0 84 62" className="h-9 w-12 shrink-0 overflow-visible sm:h-14 sm:w-20">
        {STEPS.map(({ x, height, color }) => (
          <rect
            key={x}
            x={x}
            y={BASELINE - height}
            width={STEP_WIDTH}
            height={height}
            rx="2.5"
            fill={color}
          />
        ))}
        <path
          d={trend}
          fill="none"
          stroke={C.lightGray}
          strokeOpacity="0.7"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {nodes.map(([x, y], index) => (
          <circle
            key={x}
            cx={x}
            cy={y}
            r={index === nodes.length - 1 ? 3.4 : 2.4}
            fill={index === nodes.length - 1 ? C.lime : C.lightGray}
          />
        ))}
        <path
          d={`M ${peakX - 6} ${peakY - 6} L ${peakX} ${peakY - 12} L ${peakX + 6} ${peakY - 6}`}
          fill="none"
          stroke={C.lime}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="hidden space-y-2 pr-1 pb-0.5 sm:block">
        <div className="h-2 w-14 rounded-full bg-[#DADDD8]/85" />
        <div className="h-1.5 w-10 rounded-full bg-[#419D78]" />
      </div>
    </div>
  )
}
