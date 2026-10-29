import { MODEL_ASSETS } from '../../../constants/modelAssets'
import Model3DShowcase from '../Model3DShowcase'

function DataInputModule({ x, y, accent = '#419D78' }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="36" rx="40" ry="11" fill="#1D191A" fillOpacity="0.68" />
      <polygon
        points="0,-6 40,12 0,30 -40,12"
        fill="#434371"
        stroke="#DADDD8"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      <polygon points="-40,12 0,30 0,43 -40,25" fill="#35303A" />
      <polygon points="40,12 0,30 0,43 40,25" fill="#2A2528" />

      <polygon
        points="0,-26 34,-10 0,6 -34,-10"
        fill="#484041"
        stroke={accent}
        strokeOpacity="0.78"
        strokeWidth="1.3"
      />
      <polygon points="-34,-10 0,6 0,20 -34,4" fill="#3A3437" />
      <polygon points="34,-10 0,6 0,20 34,4" fill="#2E292B" />

      <line
        x1="-20"
        y1="2"
        x2="-5"
        y2="9"
        stroke={accent}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="0" cy="-10" r="4" fill="#B5F44A" />
      <circle cx="14" cy="4" r="2.6" fill={accent} />
    </g>
  )
}

/**
 * Diapositiva 03 — Automatizaciones con IA.
 * Protagonizada por el personaje 3D existente rediseñado con materiales y texturas PBR
 * exclusivos de Overlayer (#DADDD8 cerámico, #484041 chasis carbón, #419D78 anillos esmeralda,
 * #434371 visor óptico índigo y sensores luminosos #B5F44A lima), coordinando flujos autónomos.
 */
export default function AiAutomationScene() {
  return (
    <div
      aria-hidden="true"
      className="ov-preserve-3d relative flex h-full w-full items-center justify-center select-none"
    >
      {/* PLANO HORIZONTE (Z: -85px) — Atmósfera de estudio y plataforma de coordinación */}
      <div className="ov-plane-horizon pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 680 540" className="h-full w-full overflow-visible">
          <defs>
            <radialGradient id="ai3-stage-light" cx="50%" cy="46%" r="50%">
              <stop offset="0%" stopColor="#419D78" stopOpacity="0.34" />
              <stop offset="50%" stopColor="#434371" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#484041" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ai3-floor-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1B1718" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#1B1718" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="332" cy="248" rx="285" ry="215" fill="url(#ai3-stage-light)" />
          <ellipse cx="332" cy="468" rx="215" ry="30" fill="url(#ai3-floor-shadow)" />

          {/* Pedestal arquitectónico bajo los pies del personaje IA */}
          <polygon
            points="332,418 476,458 332,498 188,458"
            fill="#342E30"
            fillOpacity="0.82"
            stroke="#419D78"
            strokeOpacity="0.42"
            strokeWidth="1.4"
          />
          <polygon
            points="332,430 432,458 332,486 232,458"
            fill="#434371"
            fillOpacity="0.32"
            stroke="#B5F44A"
            strokeOpacity="0.28"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* PLANO POSTERIOR (Z: -34px) — Red de flujos inteligentes de entrada y despacho */}
      <div className="ov-plane-back pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 680 540" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="ai3-stream-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#434371" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#419D78" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#B5F44A" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Conductos estructurales conectados al núcleo del coordinador IA */}
          <g fill="none" stroke="#DADDD8" strokeOpacity="0.16" strokeWidth="2.8" strokeLinecap="round">
            <path d="M 104 168 C 175 168, 212 225, 274 248" />
            <path d="M 92 292 C 168 292, 206 274, 274 268" />
            <path d="M 118 398 C 188 398, 224 318, 278 292" />

            <path d="M 392 242 C 452 226, 476 144, 548 138" />
            <path d="M 398 268 C 458 268, 492 268, 562 268" />
            <path d="M 392 294 C 452 312, 480 390, 548 396" />
          </g>

          {/* Impulsos luminosos continuos */}
          <g fill="none" stroke="url(#ai3-stream-grad)" strokeWidth="3" strokeLinecap="round">
            <path d="M 104 168 C 175 168, 212 225, 274 248" className="ov-anim-flow-fast" />
            <path d="M 92 292 C 168 292, 206 274, 274 268" className="ov-anim-flow" />
            <path d="M 118 398 C 188 398, 224 318, 278 292" className="ov-anim-flow-fast" />

            <path d="M 392 242 C 452 226, 476 144, 548 138" className="ov-anim-flow-fast" />
            <path d="M 398 268 C 458 268, 492 268, 562 268" className="ov-anim-flow" />
            <path d="M 392 294 C 452 312, 480 390, 548 396" className="ov-anim-flow-fast" />
          </g>

          {/* Módulos 3D de fuentes de información a la izquierda */}
          <g className="ov-anim-float-alt">
            <DataInputModule x={84} y={158} accent="#419D78" />
            <DataInputModule x={72} y={282} accent="#B5F44A" />
            <DataInputModule x={98} y={388} accent="#419D78" />
          </g>
        </svg>
      </div>

      {/* PLANO PRINCIPAL (Z: +28px) — PERSONAJE 3D DE IA REDISEÑADO CON IDENTIDAD OVERLAYER */}
      <div className="ov-plane-mid pointer-events-none relative flex h-full w-full items-center justify-center">
        <Model3DShowcase
          model={MODEL_ASSETS.aiCharacter}
          className="h-[290px] w-[290px] sm:h-[385px] sm:w-[385px] lg:h-[455px] lg:w-[455px] xl:h-[495px] xl:w-[495px]"
        />
      </div>

      {/* PLANO MEDIO-FRONTAL (Z: +54px) — Cápsulas autónomas sincronizadas */}
      <div className="ov-plane-front-mid pointer-events-none absolute inset-0">
        <div className="ov-ai-cycle-1 absolute right-[3%] top-[12%] flex items-center gap-2.5 rounded-2xl border border-[#419D78]/48 bg-[#383234]/92 p-2.5 shadow-[0_20px_38px_rgba(20,17,18,0.82)] backdrop-blur-xl sm:right-[5%] sm:p-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#419D78]/20">
            <svg viewBox="0 0 44 44" className="h-9 w-9">
              <circle cx="22" cy="22" r="17" fill="none" stroke="#434371" strokeWidth="3.5" />
              <circle
                cx="22"
                cy="22"
                r="17"
                fill="none"
                stroke="#B5F44A"
                strokeWidth="3.5"
                strokeDasharray="88 108"
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
              />
              <path
                d="M 15.5 22.5 L 20 27 L 29 17.5"
                fill="none"
                stroke="#B5F44A"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="space-y-1.5 pr-1.5">
            <div className="h-2 w-14 rounded-full bg-[#DADDD8]/90" />
            <div className="h-1.5 w-10 rounded-full bg-[#419D78]" />
          </div>
        </div>

        <div className="ov-ai-cycle-3 absolute bottom-[12%] right-[3%] flex items-center gap-2.5 rounded-2xl border border-[#DADDD8]/22 bg-[#383234]/92 p-2.5 shadow-[0_20px_38px_rgba(20,17,18,0.82)] backdrop-blur-xl sm:right-[5%] sm:p-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#434371]/45">
            <svg viewBox="0 0 44 44" className="h-9 w-9">
              <circle cx="22" cy="22" r="17" fill="none" stroke="#434371" strokeWidth="3.5" />
              <circle
                cx="22"
                cy="22"
                r="17"
                fill="none"
                stroke="#419D78"
                strokeWidth="3.5"
                strokeDasharray="96 108"
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
              />
              <path
                d="M 15.5 22.5 L 20 27 L 29 17.5"
                fill="none"
                stroke="#DADDD8"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="space-y-1.5 pr-1.5">
            <div className="h-2 w-12 rounded-full bg-[#DADDD8]/85" />
            <div className="h-1.5 w-9 rounded-full bg-[#B5F44A]" />
          </div>
        </div>
      </div>

      {/* PRIMER PLANO (Z: +78px) — Nodo Principal de Ejecución Autónoma */}
      <div className="ov-plane-front pointer-events-none absolute inset-0 flex items-center justify-end pr-[1.5%] sm:pr-[3%]">
        <div className="ov-ai-cycle-2 flex items-center gap-3 rounded-2xl border border-[#B5F44A]/55 bg-linear-to-br from-[#434371]/92 to-[#352F31]/95 p-3 shadow-[0_24px_44px_rgba(18,15,16,0.88)] backdrop-blur-xl sm:p-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#B5F44A]/18">
            <svg viewBox="0 0 48 48" className="h-10 w-10">
              <circle
                cx="24"
                cy="24"
                r="19"
                fill="none"
                stroke="#419D78"
                strokeOpacity="0.38"
                strokeWidth="3.5"
              />
              <circle
                cx="24"
                cy="24"
                r="19"
                fill="none"
                stroke="#B5F44A"
                strokeWidth="3.8"
                strokeDasharray="120 120"
                strokeLinecap="round"
              />
              <path
                d="M 16.5 24.5 L 21.5 29.5 L 32 18.5"
                fill="none"
                stroke="#B5F44A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="space-y-1.5 pr-1.5">
            <div className="h-2 w-16 rounded-full bg-[#DADDD8]" />
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-10 rounded-full bg-[#419D78]" />
              <span className="h-2 w-3.5 rounded-full bg-[#B5F44A]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
