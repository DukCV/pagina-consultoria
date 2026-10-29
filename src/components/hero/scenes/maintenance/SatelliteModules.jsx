import IsoCube from './IsoCube'
import { SCENE_COLORS as C } from './sceneColors'

// Módulos periféricos y su enlace hacia un vértice de la plataforma
const SATELLITES = [
  {
    id: 'legacy',
    cube: { x: 92, y: 176, half: 28, height: 30, tone: 'legacy', isDashed: true },
    link: 'M 118 166 C 156 160, 164 108, 200 100',
    flowClass: 'ov-anim-flow',
  },
  {
    id: 'modernized',
    cube: { x: 104, y: 318, half: 30, height: 42, tone: 'upgraded' },
    link: 'M 132 302 C 168 296, 172 226, 200 218',
    flowClass: 'ov-anim-flow-fast',
  },
  {
    id: 'stable',
    cube: { x: 568, y: 164, half: 28, height: 34, tone: 'stable' },
    link: 'M 542 154 C 504 150, 494 108, 460 100',
    flowClass: 'ov-anim-flow-fast',
  },
  {
    id: 'optimized',
    cube: { x: 560, y: 312, half: 30, height: 40, tone: 'upgraded' },
    link: 'M 530 298 C 494 292, 486 226, 460 218',
    flowClass: 'ov-anim-flow',
  },
]

// Ruta de migración desde el módulo anterior hacia su versión modernizada
const MIGRATION_PATH = 'M 84 206 C 44 238, 44 270, 82 296'

/**
 * Plano posterior: módulos satélite conectados a la plataforma.
 * El módulo anterior (discontinuo) migra hacia su versión modernizada (esmeralda).
 */
export default function SatelliteModules() {
  return (
    <svg viewBox="0 0 660 500" className="h-full w-full overflow-visible">
      <g fill="none" strokeLinecap="round" strokeWidth="2">
        {SATELLITES.map(({ id, link, flowClass }) => (
          <g key={id}>
            <path d={link} stroke={C.indigo} strokeOpacity="0.85" />
            <path d={link} stroke={C.emerald} className={flowClass} />
          </g>
        ))}
        <path d={MIGRATION_PATH} stroke={C.emerald} strokeOpacity="0.5" />
        <path d={MIGRATION_PATH} stroke={C.lime} strokeWidth="2.4" className="ov-anim-flow-fast" />
      </g>

      <g className="ov-anim-float-alt">
        {SATELLITES.map(({ id, cube }) => (
          <IsoCube key={id} {...cube} />
        ))}
      </g>
    </svg>
  )
}
