import GearMechanism from './GearMechanism'
import GlassSlab, { SLAB_SHEEN_ID } from './GlassSlab'
import InterfaceLayer, { UI_CHART_FILL_ID } from './InterfaceLayer'
import ModuleGridLayer from './ModuleGridLayer'
import { createSlab } from './isoGeometry'
import { SCENE_COLORS as C } from './sceneColors'

const SLAB_HALF = 128
const SLAB_THICKNESS = 12
const CENTER_X = 330
const FOOTPRINT_CENTER_Y = 382
const WALL_GRADIENT_ID = 'mnt6-glass-wall'

// Vista explosionada de la plataforma, de arriba abajo: interfaz → módulos → motor
const interfaceSlab = createSlab({ cx: CENTER_X, cy: 100, half: SLAB_HALF, thickness: SLAB_THICKNESS })
const moduleSlab = createSlab({ cx: CENTER_X, cy: 218, half: SLAB_HALF, thickness: SLAB_THICKNESS })
const engineSlab = createSlab({ cx: CENTER_X, cy: 336, half: SLAB_HALF, thickness: SLAB_THICKNESS })
const footprint = createSlab({
  cx: CENTER_X,
  cy: FOOTPRINT_CENTER_Y,
  half: SLAB_HALF,
  thickness: 0,
})

const PILLAR_CORNERS = ['left', 'right', 'front']

/** Pilares verticales que unen el borde inferior de la losa superior con la cara de la inferior. */
function buildPillars(upper, lower) {
  return PILLAR_CORNERS.map((corner) => {
    const [x, upperY] = upper.corners[corner]
    const lowerY = lower.corners[corner][1]
    return `M ${x} ${lowerY} L ${x} ${upperY + upper.thickness}`
  })
}

const PILLARS_INTERFACE_MODULES = buildPillars(interfaceSlab, moduleSlab)
const PILLARS_MODULES_ENGINE = buildPillars(moduleSlab, engineSlab)
const PILLARS_ENGINE_FLOOR = buildPillars(engineSlab, footprint)

function EnergyPillars({ paths, flowClass }) {
  return (
    <g fill="none" strokeLinecap="round">
      {paths.map((d) => (
        <path key={d} d={d} stroke={C.lightGray} strokeOpacity="0.2" strokeWidth="2.6" />
      ))}
      {paths.map((d) => (
        <path key={`flow-${d}`} d={d} stroke={C.emerald} strokeWidth="2.2" className={flowClass} />
      ))}
    </g>
  )
}

const toPoint = ([x, y]) => `${x},${y}`

/** Paredes de cristal translúcido entre dos losas: dan volumen a la torre explosionada. */
function GlassWalls({ upper, lower }) {
  const { left, front, right } = upper.corners
  const lowered = ([x, y]) => toPoint([x, y + upper.thickness])
  const fill = `url(#${WALL_GRADIENT_ID})`

  return (
    <g>
      <polygon
        points={`${lowered(left)} ${lowered(front)} ${toPoint(lower.corners.front)} ${toPoint(lower.corners.left)}`}
        fill={fill}
      />
      <polygon
        points={`${lowered(right)} ${lowered(front)} ${toPoint(lower.corners.front)} ${toPoint(lower.corners.right)}`}
        fill={fill}
        fillOpacity="0.6"
      />
    </g>
  )
}

/**
 * Plataforma de tres capas flotando sobre una huella luminosa: representa un sistema
 * existente (interfaz, módulos y motor) que se mantiene y evoluciona por capas.
 */
export default function ExplodedPlatform() {
  return (
    <svg viewBox="0 0 660 500" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id={SLAB_SHEEN_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.lightGray} stopOpacity="0.22" />
          <stop offset="100%" stopColor={C.lightGray} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={UI_CHART_FILL_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.emerald} stopOpacity="0.5" />
          <stop offset="100%" stopColor={C.emerald} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={WALL_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.emerald} stopOpacity="0.2" />
          <stop offset="100%" stopColor={C.indigo} stopOpacity="0.06" />
        </linearGradient>
      </defs>

      {/* Huella luminosa sobre el suelo: ciclo de mejora continua */}
      <polygon
        points={footprint.top}
        fill={C.emerald}
        fillOpacity="0.16"
        stroke={C.emerald}
        strokeOpacity="0.85"
        strokeWidth="1.6"
        className="ov-anim-flow"
      />
      <EnergyPillars paths={PILLARS_ENGINE_FLOOR} flowClass="ov-anim-flow-fast" />

      {/* Capa 3 — motor */}
      <GlassSlab
        slab={engineSlab}
        topColor={C.charcoalSlab}
        leftColor={C.charcoalLeft}
        rightColor={C.charcoalRight}
        edgeColor={C.emerald}
        lightColors={[C.emerald, C.indigo, C.lightGray]}
      >
        <GearMechanism slab={engineSlab} />
      </GlassSlab>
      <GlassWalls upper={moduleSlab} lower={engineSlab} />
      <EnergyPillars paths={PILLARS_MODULES_ENGINE} flowClass="ov-anim-flow" />

      {/* Capa 2 — módulos */}
      <GlassSlab
        slab={moduleSlab}
        topColor={C.charcoal}
        leftColor={C.charcoalLeft}
        rightColor={C.charcoalRight}
        edgeColor={C.emerald}
        lightColors={[C.lightGray, C.emerald, C.lime]}
      >
        <ModuleGridLayer slab={moduleSlab} />
      </GlassSlab>
      <GlassWalls upper={interfaceSlab} lower={moduleSlab} />
      <EnergyPillars paths={PILLARS_INTERFACE_MODULES} flowClass="ov-anim-flow-fast" />

      {/* Capa 1 — interfaz */}
      <GlassSlab
        slab={interfaceSlab}
        topColor={C.indigo}
        leftColor={C.indigoLeft}
        rightColor={C.indigoRight}
        edgeColor={C.lime}
        lightColors={[C.lime, C.emerald, C.lightGray]}
      >
        <InterfaceLayer slab={interfaceSlab} />
      </GlassSlab>
    </svg>
  )
}
