import { slabSurfaceTransform } from './isoGeometry'
import { SCENE_COLORS as C } from './sceneColors'

export const UI_CHART_FILL_ID = 'mnt6-ui-chart-fill'

const SIDEBAR_ROWS = [28, 36, 44, 52]

/**
 * Capa de interfaz: un panel proyectado sobre la losa superior que muestra la transición
 * entre el diseño anterior (trazo discontinuo) y la versión modernizada (relleno y acento).
 */
export default function InterfaceLayer({ slab }) {
  return (
    <g transform={slabSurfaceTransform(slab)}>
      <rect
        x="7"
        y="7"
        width="86"
        height="86"
        rx="5"
        fill={C.charcoalDeep}
        fillOpacity="0.62"
        stroke={C.lightGray}
        strokeOpacity="0.22"
        strokeWidth="0.9"
      />

      {/* Barra superior */}
      <rect x="11" y="11" width="78" height="9" rx="3" fill={C.lightGray} fillOpacity="0.12" />
      <circle cx="16" cy="15.5" r="1.7" fill={C.lime} />
      <circle cx="21" cy="15.5" r="1.7" fill={C.emerald} />
      <circle cx="26" cy="15.5" r="1.7" fill={C.lightGray} fillOpacity="0.4" />
      <rect x="66" y="13.2" width="19" height="4.6" rx="2.3" fill={C.emerald} />

      {/* Navegación lateral */}
      <rect x="11" y="24" width="19" height="62" rx="3" fill={C.charcoal} fillOpacity="0.55" />
      {SIDEBAR_ROWS.map((y, index) => (
        <rect
          key={y}
          x="14"
          y={y}
          width="13"
          height="4"
          rx="2"
          fill={index === 0 ? C.emerald : C.lightGray}
          fillOpacity={index === 0 ? 1 : 0.28}
        />
      ))}

      {/* Tarjetas: anterior (discontinua) → actualizada → versión nueva */}
      <rect
        x="34"
        y="24"
        width="17"
        height="14"
        rx="3"
        fill="none"
        stroke={C.lightGray}
        strokeOpacity="0.4"
        strokeWidth="1"
        strokeDasharray="2.6 2"
      />
      <rect x="54" y="24" width="17" height="14" rx="3" fill={C.emerald} />
      <rect x="74" y="24" width="15" height="14" rx="3" fill={C.lime} />
      <rect x="57" y="28" width="9" height="2.6" rx="1.3" fill={C.lightGray} fillOpacity="0.85" />
      <path
        d="M 78 34 L 81.5 29.5 L 85 34"
        fill="none"
        stroke={C.charcoalDeep}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Rendimiento: curva anterior vs. curva optimizada */}
      <rect
        x="34"
        y="42"
        width="55"
        height="44"
        rx="3"
        fill={C.charcoalDeep}
        fillOpacity="0.8"
        stroke={C.lightGray}
        strokeOpacity="0.12"
        strokeWidth="0.8"
      />
      <path
        d="M 38 82 C 46 74, 52 78, 60 66 S 76 60, 86 50 L 86 82 Z"
        fill={`url(#${UI_CHART_FILL_ID})`}
      />
      <path
        d="M 38 78 L 48 77 L 58 78 L 68 73 L 78 72 L 86 70"
        fill="none"
        stroke={C.lightGray}
        strokeOpacity="0.4"
        strokeWidth="1.2"
        strokeDasharray="2.6 2"
        strokeLinecap="round"
      />
      <path
        d="M 38 82 C 46 74, 52 78, 60 66 S 76 60, 86 50"
        fill="none"
        stroke={C.emerald}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="86" cy="50" r="2.8" fill={C.lime} />
    </g>
  )
}
