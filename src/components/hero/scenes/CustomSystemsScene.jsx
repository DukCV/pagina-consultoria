/**
 * Diapositiva 01 — Sistemas a la medida.
 * Escultura arquitectónica 3D sin texto innecesario: interfaz modular principal con
 * bisel extruido, paneles secundarios conectados y cubos de software ensamblables en primer plano.
 */
export default function CustomSystemsScene() {
  return (
    <div
      aria-hidden="true"
      className="ov-preserve-3d relative flex h-full w-full items-center justify-center select-none"
    >
      {/* PLANO HORIZONTE (Z: -85px) — Iluminación volumétrica y sombra proyectada en suelo */}
      <div className="ov-plane-horizon pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 640 500" className="h-full w-full overflow-visible">
          <defs>
            <radialGradient id="s1-glow" cx="52%" cy="48%" r="50%">
              <stop offset="0%" stopColor="#419D78" stopOpacity="0.32" />
              <stop offset="52%" stopColor="#434371" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#434371" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="s1-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1D191A" stopOpacity="0.76" />
              <stop offset="100%" stopColor="#1D191A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="330" cy="240" rx="270" ry="200" fill="url(#s1-glow)" />
          <ellipse cx="325" cy="428" rx="210" ry="30" fill="url(#s1-shadow)" />
        </svg>
      </div>

      {/* PLANO POSTERIOR (Z: -34px) — Paneles modulares satélite y conexiones luminosas */}
      <div className="ov-plane-back pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 640 500" className="h-full w-full overflow-visible">
          {/* Arcos de integración entre módulos */}
          <g fill="none" strokeWidth="2" strokeLinecap="round">
            <path
              d="M 118 138 C 175 138, 190 185, 235 195"
              stroke="#419D78"
              strokeOpacity="0.45"
            />
            <path
              d="M 118 138 C 175 138, 190 185, 235 195"
              stroke="#B5F44A"
              className="ov-anim-flow-fast"
            />

            <path
              d="M 526 355 C 470 355, 452 305, 412 295"
              stroke="#419D78"
              strokeOpacity="0.45"
            />
            <path
              d="M 526 355 C 470 355, 452 305, 412 295"
              stroke="#419D78"
              className="ov-anim-flow"
            />

            <path
              d="M 498 124 C 446 124, 430 175, 395 190"
              stroke="#434371"
              strokeOpacity="0.8"
            />
            <path
              d="M 498 124 C 446 124, 430 175, 395 190"
              stroke="#B5F44A"
              className="ov-anim-flow"
            />
          </g>

          {/* Panel abstracto secundario superior izquierdo */}
          <g transform="translate(56, 86)">
            <rect
              width="126"
              height="84"
              rx="14"
              fill="#383236"
              fillOpacity="0.92"
              stroke="#DADDD8"
              strokeOpacity="0.2"
              strokeWidth="1.2"
            />
            <circle cx="20" cy="20" r="4" fill="#419D78" />
            <rect x="32" y="17" width="54" height="6" rx="3" fill="#DADDD8" fillOpacity="0.45" />
            <rect x="16" y="38" width="94" height="8" rx="4" fill="#434371" />
            <rect x="16" y="38" width="66" height="8" rx="4" fill="#419D78" />
            <rect x="16" y="56" width="76" height="8" rx="4" fill="#434371" />
            <rect x="16" y="56" width="42" height="8" rx="4" fill="#B5F44A" />
          </g>

          {/* Nodo matriz inferior derecho */}
          <g transform="translate(464, 314)">
            <rect
              width="120"
              height="78"
              rx="14"
              fill="#363034"
              fillOpacity="0.94"
              stroke="#419D78"
              strokeOpacity="0.42"
              strokeWidth="1.2"
            />
            <g transform="translate(18, 18)">
              {[0, 28, 56].map((dx, i) => (
                <rect
                  key={dx}
                  x={dx}
                  y="0"
                  width="20"
                  height="20"
                  rx="5"
                  fill={i === 1 ? '#B5F44A' : i === 0 ? '#419D78' : '#434371'}
                />
              ))}
              <rect x="0" y="30" width="84" height="7" rx="3.5" fill="#DADDD8" fillOpacity="0.22" />
            </g>
          </g>
        </svg>
      </div>

      {/* CHASIS VOLUMÉTRICO EXTRUIDO (Z: +10px) */}
      <div className="ov-plane-mid-base pointer-events-none absolute flex items-center justify-center">
        <div className="h-[246px] w-[336px] rounded-[24px] border border-[#434371] bg-[#2D2729] shadow-[0_36px_70px_-12px_rgba(18,15,16,0.88)] sm:h-[286px] sm:w-[408px]" />
      </div>

      {/* PLANO PRINCIPAL (Z: +28px) — Interfaz Modular Central con Geometría Limpia */}
      <div className="ov-plane-mid pointer-events-none relative flex items-center justify-center">
        <div className="relative h-[246px] w-[336px] overflow-hidden rounded-[24px] border border-[#DADDD8]/25 bg-linear-to-br from-[#484041]/96 via-[#3A3548]/96 to-[#2B2628]/98 p-4 shadow-[inset_0_1px_1px_rgba(218,221,216,0.28)] backdrop-blur-xl sm:h-[286px] sm:w-[408px] sm:p-5">
          <div className="ov-specular-glare absolute inset-0" />

          {/* Cabecera minimalista de ventana de arquitectura */}
          <div className="relative flex items-center justify-between border-b border-[#DADDD8]/12 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rotate-45 bg-[#B5F44A]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#419D78]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#DADDD8]/25" />
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-16 rounded-full bg-[#DADDD8]/20" />
              <span className="h-2 w-6 rounded-full bg-[#419D78]" />
            </div>
          </div>

          {/* Rejilla visual de componentes integrados */}
          <div className="relative mt-4 grid h-[172px] grid-cols-12 gap-3.5 sm:h-[204px]">
            {/* Columna de módulos apilados */}
            <div className="col-span-4 flex flex-col justify-between rounded-2xl border border-[#DADDD8]/10 bg-[#2C2728]/80 p-3">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 rounded-lg bg-[#419D78]/25 p-2">
                  <span className="h-2 w-2 rotate-45 bg-[#B5F44A]" />
                  <span className="h-2 flex-1 rounded-full bg-[#DADDD8]/85" />
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#419D78]" />
                  <span className="h-2 flex-1 rounded-full bg-[#DADDD8]/35" />
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#434371]" />
                  <span className="h-2 w-3/4 rounded-full bg-[#DADDD8]/25" />
                </div>
              </div>

              {/* Bloque de estado activo */}
              <div className="rounded-xl border border-[#419D78]/35 bg-[#434371]/40 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="h-2 w-8 rounded-full bg-[#DADDD8]/50" />
                  <span className="h-2 w-2 rounded-full bg-[#B5F44A]" />
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#242021]">
                  <div className="h-full w-4/5 rounded-full bg-linear-to-r from-[#419D78] to-[#B5F44A]" />
                </div>
              </div>
            </div>

            {/* Área visual principal: curva dinámica + bloques conectados */}
            <div className="col-span-8 flex flex-col justify-between gap-3">
              <div className="flex-1 rounded-2xl border border-[#DADDD8]/12 bg-[#2C2728]/75 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="h-2 w-20 rounded-full bg-[#DADDD8]/40" />
                  <div className="flex gap-1.5">
                    <span className="h-2 w-5 rounded-full bg-[#419D78]" />
                    <span className="h-2 w-3 rounded-full bg-[#B5F44A]" />
                  </div>
                </div>
                <svg viewBox="0 0 220 74" className="mt-2 h-16 w-full overflow-visible sm:h-20">
                  <defs>
                    <linearGradient id="s1-curve-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#419D78" stopOpacity="0.52" />
                      <stop offset="100%" stopColor="#419D78" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 4 60 C 38 56, 52 34, 86 38 C 120 42, 136 16, 170 18 C 190 19, 202 8, 216 6 L 216 70 L 4 70 Z"
                    fill="url(#s1-curve-fill)"
                  />
                  <path
                    d="M 4 60 C 38 56, 52 34, 86 38 C 120 42, 136 16, 170 18 C 190 19, 202 8, 216 6"
                    fill="none"
                    stroke="#419D78"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <circle cx="86" cy="38" r="3.5" fill="#DADDD8" />
                  <circle cx="170" cy="18" r="3.5" fill="#419D78" />
                  <circle cx="216" cy="6" r="5" fill="#B5F44A" />
                </svg>
              </div>

              {/* Tres módulos inferiores sincronizados */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { w: 'w-4/5', c: 'bg-[#419D78]' },
                  { w: 'w-full', c: 'bg-[#B5F44A]' },
                  { w: 'w-2/3', c: 'bg-[#DADDD8]/75' },
                ].map((bar, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#DADDD8]/10 bg-[#434371]/45 p-2.5"
                  >
                    <div className="h-2 w-8 rounded-full bg-[#DADDD8]/35" />
                    <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#242021]">
                      <div className={`h-full ${bar.w} rounded-full ${bar.c}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PLANO MEDIO-FRONTAL (Z: +54px) — Clúster de Bloques 3D Isométricos Ensamblables */}
      <div className="ov-plane-front-mid pointer-events-none absolute inset-0">
        <div className="ov-anim-float absolute right-[5%] top-[10%] sm:right-[7%] sm:top-[9%]">
          <svg
            viewBox="0 0 150 150"
            className="h-28 w-28 drop-shadow-[-14px_22px_24px_rgba(18,15,16,0.82)] sm:h-34 sm:w-34"
          >
            {/* Cubo base índigo */}
            <g transform="translate(75, 86)">
              <polygon points="0,-28 48,-4 0,20 -48,-4" fill="#434371" />
              <polygon points="-48,-4 0,20 0,58 -48,34" fill="#393654" />
              <polygon points="48,-4 0,20 0,58 48,34" fill="#2F2B34" />
            </g>
            {/* Cubo superior esmeralda desplazado en encaje */}
            <g transform="translate(75, 48)">
              <polygon points="0,-24 40,-4 0,16 -40,-4" fill="#4DC095" />
              <polygon points="-40,-4 0,16 0,48 -40,28" fill="#419D78" />
              <polygon points="40,-4 0,16 0,48 40,28" fill="#296D53" />
              {/* Prisma conector lima brillante */}
              <polygon points="0,-13 20,-3 0,7 -20,-3" fill="#B5F44A" />
            </g>
          </svg>
        </div>
      </div>

      {/* PRIMER PLANO (Z: +78px) — Módulo Flotante con Medidor Radial de Precisión */}
      <div className="ov-plane-front pointer-events-none absolute inset-0">
        <div className="ov-anim-float-alt absolute bottom-[11%] left-[6%] flex items-center gap-3.5 rounded-2xl border border-[#DADDD8]/24 bg-[#383234]/94 p-3.5 shadow-[0_24px_44px_rgba(18,15,16,0.86)] backdrop-blur-xl sm:left-[9%] sm:p-4">
          <svg viewBox="0 0 52 52" className="h-12 w-12 shrink-0">
            <circle
              cx="26"
              cy="26"
              r="20"
              fill="none"
              stroke="#434371"
              strokeWidth="4.5"
            />
            <circle
              cx="26"
              cy="26"
              r="20"
              fill="none"
              stroke="#419D78"
              strokeWidth="4.5"
              strokeDasharray="96 126"
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
            />
            <circle cx="26" cy="26" r="5" fill="#B5F44A" />
          </svg>
          <div className="space-y-2 pr-1">
            <div className="h-2 w-18 rounded-full bg-[#DADDD8]/85" />
            <div className="h-1.5 w-14 rounded-full bg-[#419D78]" />
            <div className="h-1.5 w-10 rounded-full bg-[#B5F44A]" />
          </div>
        </div>
      </div>
    </div>
  )
}
