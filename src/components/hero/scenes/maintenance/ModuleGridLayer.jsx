import IsoCube from './IsoCube'
import { slabPointToScreen, slabSurfaceTransform } from './isoGeometry'
import { SCENE_COLORS as C } from './sceneColors'

const GRID_STEPS = [24, 50, 76]
const CUBE_SIDE = 19
const INCOMING_LIFT = 26

// Distribución de módulos por fila/columna; «incoming» es el hueco donde entra la nueva versión.
// Se sitúa en la fila frontal para que la losa superior no oculte el módulo que desciende.
const MODULE_LAYOUT = [
  ['stable', 'upgraded', 'stable'],
  ['upgraded', 'stable', 'upgraded'],
  ['stable', 'incoming', 'upgraded'],
]

const MODULE_HEIGHT = { stable: 12, upgraded: 18, incoming: 18 }

const GRID_FIRST = GRID_STEPS[0]
const GRID_LAST = GRID_STEPS[GRID_STEPS.length - 1]
const GRID_CENTER = GRID_STEPS[1]
const SLOT_ROW = GRID_LAST
const SLOT_HALF = CUBE_SIDE / 2 + 1.5

const MODULES = MODULE_LAYOUT.flatMap((row, rowIndex) =>
  row.map((tone, colIndex) => ({
    tone,
    localX: GRID_STEPS[colIndex],
    localY: GRID_STEPS[rowIndex],
  })),
)

// Orden de pintado de atrás hacia adelante para que los cubos cercanos tapen a los lejanos
const BUILT_MODULES = MODULES.filter(({ tone }) => tone !== 'incoming').sort(
  (a, b) => a.localX + a.localY - (b.localX + b.localY),
)

/**
 * Capa de módulos: cubos de software interconectados sobre la losa intermedia.
 * Un módulo nuevo desciende sobre su hueco para sustituir a la versión anterior.
 */
export default function ModuleGridLayer({ slab }) {
  const half = slab.scale * CUBE_SIDE
  const [slotX, slotY] = slabPointToScreen(slab, GRID_CENTER, SLOT_ROW)
  const incomingY = slotY - INCOMING_LIFT

  return (
    <g>
      {/* Conexiones sobre la superficie y hueco de destino */}
      <g transform={slabSurfaceTransform(slab)} fill="none" strokeLinecap="round">
        <g stroke={C.emerald} strokeOpacity="0.42" strokeWidth="1.6">
          {GRID_STEPS.map((step) => (
            <path
              key={step}
              d={`M ${GRID_FIRST} ${step} L ${GRID_LAST} ${step} M ${step} ${GRID_FIRST} L ${step} ${GRID_LAST}`}
            />
          ))}
        </g>
        <g stroke={C.lime} strokeWidth="1.8">
          <path
            d={`M ${GRID_FIRST} ${SLOT_ROW} L ${GRID_CENTER} ${SLOT_ROW}`}
            className="ov-anim-flow-fast"
          />
          <path
            d={`M ${GRID_CENTER} ${GRID_CENTER} L ${GRID_CENTER} ${SLOT_ROW}`}
            className="ov-anim-flow"
          />
        </g>
        <rect
          x={GRID_CENTER - SLOT_HALF}
          y={SLOT_ROW - SLOT_HALF}
          width={SLOT_HALF * 2}
          height={SLOT_HALF * 2}
          rx="3"
          fill={C.lime}
          fillOpacity="0.14"
          stroke={C.lime}
          strokeWidth="1.4"
          strokeDasharray="3 2.4"
          className="ov-anim-pulse"
        />
      </g>

      {BUILT_MODULES.map(({ tone, localX, localY }) => {
        const [x, y] = slabPointToScreen(slab, localX, localY)
        return (
          <IsoCube
            key={`${localX}-${localY}`}
            x={x}
            y={y}
            half={half}
            height={MODULE_HEIGHT[tone]}
            tone={tone}
          />
        )
      })}

      {/* Guías verticales por las que desciende la nueva versión */}
      <g stroke={C.lime} strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="3 3">
        <line x1={slotX - half} y1={incomingY} x2={slotX - half} y2={slotY} />
        <line x1={slotX + half} y1={incomingY} x2={slotX + half} y2={slotY} />
      </g>
      <g className="ov-anim-float">
        <IsoCube
          x={slotX}
          y={incomingY}
          half={half}
          height={MODULE_HEIGHT.incoming}
          tone="incoming"
        />
      </g>
    </g>
  )
}
