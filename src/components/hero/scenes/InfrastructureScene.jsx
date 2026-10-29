/**
 * Rack empresarial 3D con bisel metálico anodizado, puerta de cristal ahumado,
 * bahías horizontales de servidores e iluminación controlada esmeralda/lima.
 */
function EnterpriseServerRack({
  x,
  y,
  scale = 1,
  isPrimary = false,
}) {
  const bayOffsets = [-82, -52, -22, 8, 38, 68]

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Zócalo estructural iluminado sobre la plataforma */}
      <polygon
        points="0,124 72,94 0,68 -72,94"
        fill="#292425"
        stroke={isPrimary ? '#419D78' : '#434371'}
        strokeWidth="1.8"
      />

      {/* Techo biselado 3D del gabinete */}
      <polygon
        points="0,-138 64,-114 0,-90 -64,-114"
        fill={isPrimary ? '#484041' : '#3C363C'}
        stroke="#DADDD8"
        strokeOpacity={isPrimary ? '0.5' : '0.3'}
        strokeWidth="1.3"
      />
      <polygon
        points="0,-131 48,-114 0,-97 -48,-114"
        fill="#419D78"
        fillOpacity={isPrimary ? '0.28' : '0.14'}
      />

      {/* Pared frontal-izquierda (puerta de bahías de servidores y almacenamiento) */}
      <polygon
        points="-64,-114 0,-90 0,116 -64,90"
        fill="#353035"
        stroke="#DADDD8"
        strokeOpacity="0.26"
        strokeWidth="1.2"
      />

      {/* Pared lateral-derecha (chasis metálico cepillado en sombra cromática índigo/carbón) */}
      <polygon
        points="64,-114 0,-90 0,116 64,90"
        fill="#2A252C"
        stroke="#434371"
        strokeOpacity="0.7"
        strokeWidth="1.2"
      />

      {/* Rejillas de ventilación laterales controladas */}
      {[-70, -35, 0, 35].map((vy) => (
        <line
          key={vy}
          x1="16"
          y1={vy + 6}
          x2="50"
          y2={vy - 7}
          stroke="#434371"
          strokeOpacity="0.55"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ))}

      {/* Bahías 1U/2U de servidores dentro de la cara frontal */}
      {bayOffsets.map((by, idx) => {
        const isHighlightBay = isPrimary && (idx === 1 || idx === 3)
        return (
          <g key={by} transform={`translate(0, ${by})`}>
            <polygon
              points="-54,-11 -8,6 -8,21 -54,4"
              fill={isHighlightBay ? '#344146' : '#282325'}
              stroke={isHighlightBay ? '#419D78' : '#434371'}
              strokeOpacity={isHighlightBay ? '0.78' : '0.48'}
              strokeWidth="1"
            />
            {/* Barra de telemetría esmeralda */}
            <line
              x1="-48"
              y1="-2"
              x2={isHighlightBay ? '-20' : '-28'}
              y2={isHighlightBay ? '8.5' : '5.5'}
              stroke={isHighlightBay ? '#419D78' : '#DADDD8'}
              strokeOpacity={isHighlightBay ? '0.95' : '0.35'}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* LED puntual de estado */}
            <circle
              cx="-14"
              cy="11"
              r="2.3"
              fill={idx % 2 === 0 ? '#B5F44A' : '#419D78'}
            />
          </g>
        )
      })}

      {/* Columna vertical de iluminación tecnológica esmeralda en arista central */}
      <line
        x1="0"
        y1="-88"
        x2="0"
        y2="112"
        stroke={isPrimary ? '#419D78' : '#DADDD8'}
        strokeOpacity={isPrimary ? '0.85' : '0.3'}
        strokeWidth="2"
      />

      {/* Reflejo diagonal controlado de puerta de cristal templado */}
      <polygon
        points="-58,-108 -26,-96 -42,94 -58,88"
        fill="#DADDD8"
        fillOpacity="0.06"
      />
    </g>
  )
}

/**
 * Diapositiva 04 — Infraestructura.
 * Arquitectura 3D sólida y organizada: formación en V de racks de servidores empresariales,
 * módulos de almacenamiento de alta densidad y conmutadores de red con iluminación de estudio.
 */
export default function InfrastructureScene() {
  return (
    <div
      aria-hidden="true"
      className="ov-preserve-3d relative flex h-full w-full items-center justify-center select-none"
    >
      {/* PLANO HORIZONTE (Z: -85px) — Plataforma de centro de datos e iluminación controlada */}
      <div className="ov-plane-horizon pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 660 500" className="h-full w-full overflow-visible">
          <defs>
            <radialGradient id="inf4-glow" cx="50%" cy="46%" r="52%">
              <stop offset="0%" stopColor="#419D78" stopOpacity="0.28" />
              <stop offset="50%" stopColor="#434371" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#434371" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="inf4-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1B1718" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#1B1718" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="330" cy="235" rx="280" ry="200" fill="url(#inf4-glow)" />
          <ellipse cx="330" cy="430" rx="255" ry="34" fill="url(#inf4-shadow)" />

          {/* Suelo técnico elevado en perspectiva isométrica */}
          <polygon
            points="330,275 590,372 330,468 70,372"
            fill="#2E292B"
            fillOpacity="0.88"
            stroke="#434371"
            strokeOpacity="0.7"
            strokeWidth="1.5"
          />
          <g stroke="#419D78" strokeOpacity="0.16" strokeWidth="1">
            <line x1="200" y1="323" x2="460" y2="420" />
            <line x1="460" y1="323" x2="200" y2="420" />
            <polygon points="330,304 516,372 330,440 144,372" fill="none" />
          </g>
        </svg>
      </div>

      {/* PLANO POSTERIOR (Z: -34px) — Puentes estructurados de red de alta velocidad */}
      <div className="ov-plane-back pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 660 500" className="h-full w-full overflow-visible">
          {/* Bandejas superiores e inferiores de interconexión de fibra */}
          <g fill="none" strokeLinecap="round">
            <path
              d="M 190 128 L 330 82 L 470 128"
              stroke="#434371"
              strokeWidth="4"
            />
            <path
              d="M 190 128 L 330 82 L 470 128"
              stroke="#B5F44A"
              strokeWidth="2"
              className="ov-anim-flow"
            />

            <path
              d="M 135 378 L 330 434 L 525 378"
              stroke="#419D78"
              strokeOpacity="0.4"
              strokeWidth="3"
            />
            <path
              d="M 135 378 L 330 434 L 525 378"
              stroke="#419D78"
              strokeWidth="2.4"
              className="ov-anim-flow-fast"
            />
          </g>
        </svg>
      </div>

      {/* PLANO PRINCIPAL (Z: +28px) — Trío Monumental de Racks de Servidores 3D */}
      <div className="ov-plane-mid pointer-events-none relative flex h-full w-full items-center justify-center">
        <svg
          viewBox="0 0 660 500"
          className="h-full w-full overflow-visible drop-shadow-[0_30px_42px_rgba(5,6,14,0.88)]"
        >
          {/* Rack lateral izquierdo */}
          <EnterpriseServerRack x={202} y={248} scale={0.9} />

          {/* Rack lateral derecho */}
          <EnterpriseServerRack x={458} y={248} scale={0.9} />

          {/* Rack maestro central en primer término del clúster */}
          <EnterpriseServerRack x={330} y={228} scale={1.06} isPrimary />
        </svg>
      </div>

      {/* PLANO MEDIO-FRONTAL (Z: +54px) — Módulo 3D Apilado de Almacenamiento Empresarial */}
      <div className="ov-plane-front-mid pointer-events-none absolute inset-0">
        <div className="ov-anim-float-alt absolute bottom-[10%] left-[5%] sm:left-[8%]">
          <svg
            viewBox="0 0 180 140"
            className="h-28 w-36 overflow-visible drop-shadow-[0_22px_32px_rgba(5,6,14,0.88)] sm:h-32 sm:w-42"
          >
            {[44, 22, 0].map((dy, idx) => (
              <g key={dy} transform={`translate(90, ${44 + dy})`}>
                <polygon
                  points="0,-20 68,4 0,28 -68,4"
                  fill={idx === 2 ? '#434371' : '#383236'}
                  stroke={idx === 2 ? '#419D78' : '#DADDD8'}
                  strokeOpacity={idx === 2 ? '0.8' : '0.28'}
                  strokeWidth="1.2"
                />
                <polygon points="-68,4 0,28 0,42 -68,18" fill="#322C2F" />
                <polygon points="68,4 0,28 0,42 68,18" fill="#272225" />
                <line
                  x1="-46"
                  y1="14"
                  x2="-14"
                  y2="25"
                  stroke={idx === 2 ? '#B5F44A' : '#419D78'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="24" cy="24" r="2.5" fill="#B5F44A" />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* PRIMER PLANO (Z: +78px) — Nodo de Conmutación de Red y Escudo de Resiliencia 3D */}
      <div className="ov-plane-front pointer-events-none absolute inset-0">
        <div className="ov-anim-float absolute bottom-[12%] right-[5%] flex items-center gap-3.5 rounded-2xl border border-[#419D78]/45 bg-[#383234]/95 p-3.5 shadow-[0_26px_46px_rgba(18,15,16,0.9)] backdrop-blur-xl sm:right-[8%] sm:p-4">
          {/* Escudo geométrico 3D de seguridad e integridad */}
          <svg viewBox="0 0 48 52" className="h-11 w-10 shrink-0">
            <path
              d="M 24 4 L 42 12 L 42 26 C 42 37, 34 45, 24 49 C 14 45, 6 37, 6 26 L 6 12 Z"
              fill="#434371"
              stroke="#419D78"
              strokeWidth="2"
            />
            <path
              d="M 24 10 L 36 15.5 L 36 25.5 C 36 33, 30.5 39, 24 42 C 17.5 39, 12 33, 12 25.5 L 12 15.5 Z"
              fill="#419D78"
              fillOpacity="0.28"
            />
            <polygon points="24,17 31,25 24,33 17,25" fill="#B5F44A" />
          </svg>

          {/* Matriz limpia de puertos ópticos activos (sin texto decorativo) */}
          <div className="space-y-2 pr-1">
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((port) => (
                <span
                  key={port}
                  className={`h-2.5 w-3.5 rounded-xs ${
                    port === 3 || port === 7
                      ? 'bg-[#B5F44A]'
                      : port % 2 === 0
                        ? 'bg-[#419D78]'
                        : 'bg-[#434371]'
                  }`}
                />
              ))}
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#242021]">
              <div className="h-full w-11/12 rounded-full bg-linear-to-r from-[#419D78] to-[#B5F44A]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
