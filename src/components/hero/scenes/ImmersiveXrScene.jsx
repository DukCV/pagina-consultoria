import { MODEL_ASSETS } from '../../../constants/modelAssets'
import Model3DShowcase from '../Model3DShowcase'

/**
 * Diapositiva 02 — Realidad virtual y aumentada.
 * Escena tridimensional protagonizada por el modelo 3D real del visor Meta Quest 3
 * junto a sus controladores Touch Plus en suspensión espacial (VR), complementado
 * en primer plano por un dispositivo móvil proyectando geometría holográfica (AR).
 */
export default function ImmersiveXrScene() {
  return (
    <div
      aria-hidden="true"
      className="ov-preserve-3d relative flex h-full w-full items-center justify-center select-none"
    >
      {/* PLANO HORIZONTE (Z: -85px) — Portal de Inmersión VR y sombra volumétrica de estudio */}
      <div className="ov-plane-horizon pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 680 540" className="h-full w-full overflow-visible">
          <defs>
            <radialGradient id="xr-vr-portal" cx="44%" cy="46%" r="50%">
              <stop offset="0%" stopColor="#419D78" stopOpacity="0.34" />
              <stop offset="48%" stopColor="#434371" stopOpacity="0.46" />
              <stop offset="100%" stopColor="#484041" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="xr-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B5F44A" stopOpacity="0.58" />
              <stop offset="52%" stopColor="#419D78" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#434371" stopOpacity="0.18" />
            </linearGradient>
            <radialGradient id="xr-floor-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1D191A" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#1D191A" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="294" cy="242" r="236" fill="url(#xr-vr-portal)" />
          <circle
            cx="294"
            cy="236"
            r="186"
            fill="none"
            stroke="url(#xr-ring-grad)"
            strokeWidth="1.5"
          />
          <circle
            cx="294"
            cy="236"
            r="146"
            fill="none"
            stroke="#419D78"
            strokeOpacity="0.3"
            strokeDasharray="9 11"
            strokeWidth="1.3"
          />
          <ellipse cx="305" cy="466" rx="228" ry="28" fill="url(#xr-floor-shadow)" />
        </svg>
      </div>

      {/* PLANO POSTERIOR (Z: -34px) — Retícula espacial del entorno virtual */}
      <div className="ov-plane-back pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 680 540" className="h-full w-full overflow-visible">
          <g stroke="#DADDD8" strokeOpacity="0.14" strokeWidth="1" fill="none">
            <polygon points="294,68 468,236 294,404 120,236" />
            <line x1="88" y1="236" x2="500" y2="236" strokeDasharray="4 6" />
          </g>

          <g transform="translate(108, 126)" className="ov-anim-float-alt">
            <polygon
              points="0,-22 22,0 0,22 -22,0"
              fill="#434371"
              stroke="#419D78"
              strokeWidth="1.4"
            />
            <polygon points="0,-22 22,0 0,5" fill="#419D78" fillOpacity="0.65" />
          </g>
        </svg>
      </div>

      {/* PLANO PRINCIPAL (Z: +28px) — MODELO 3D REAL DEL VISOR META QUEST 3 + CONTROLADORES */}
      <div className="ov-plane-mid pointer-events-none relative flex h-full w-full items-center justify-center pr-[10%] sm:pr-[12%]">
        <Model3DShowcase
          model={MODEL_ASSETS.quest3}
          className="h-[275px] w-[305px] sm:h-[365px] sm:w-[405px] lg:h-[435px] lg:w-[485px] xl:h-[470px] xl:w-[525px]"
        />
      </div>

      {/* PLANO MEDIO-FRONTAL (Z: +54px) — DISPOSITIVO MÓVIL DE REALIDAD AUMENTADA */}
      <div className="ov-plane-front-mid pointer-events-none absolute inset-0 flex items-end justify-end pr-[2%] pb-[5%] sm:pr-[4%] sm:pb-[6%]">
        <div className="ov-anim-float-alt relative h-[206px] w-[114px] -rotate-6 rounded-[24px] border-2 border-[#DADDD8]/36 bg-linear-to-b from-[#484041] via-[#35303A] to-[#272328] p-2.5 shadow-[-20px_26px_44px_rgba(20,17,18,0.85),inset_0_1px_1px_rgba(218,221,216,0.4)] sm:h-[238px] sm:w-[132px] sm:p-3">
          <div className="ov-specular-glare absolute inset-0 rounded-[22px]" />

          <div className="relative mx-auto mb-2 flex h-2 w-10 items-center justify-end rounded-full bg-[#221E1F] px-1.5">
            <span className="h-1 w-1 rounded-full bg-[#419D78]" />
          </div>

          <div className="relative flex h-[168px] w-full flex-col justify-between overflow-hidden rounded-[16px] border border-[#419D78]/45 bg-linear-to-b from-[#434371]/85 via-[#2E383C] to-[#282427] p-2.5 sm:h-[194px]">
            <div className="flex justify-between">
              <span className="h-2.5 w-2.5 border-l-2 border-t-2 border-[#B5F44A]" />
              <span className="h-2.5 w-2.5 border-r-2 border-t-2 border-[#B5F44A]" />
            </div>

            <svg viewBox="0 0 100 90" className="my-auto h-22 w-full overflow-visible">
              <ellipse
                cx="50"
                cy="64"
                rx="38"
                ry="13"
                fill="#419D78"
                fillOpacity="0.24"
                stroke="#B5F44A"
                strokeWidth="1.5"
              />
              <ellipse
                cx="50"
                cy="64"
                rx="24"
                ry="8"
                fill="none"
                stroke="#DADDD8"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <polygon
                points="16,64 84,64 96,-10 4,-10"
                fill="#419D78"
                fillOpacity="0.18"
              />
            </svg>

            <div className="flex items-center justify-between">
              <span className="h-2.5 w-2.5 border-b-2 border-l-2 border-[#419D78]" />
              <span className="h-1 w-9 rounded-full bg-[#DADDD8]/45" />
              <span className="h-2.5 w-2.5 border-b-2 border-r-2 border-[#419D78]" />
            </div>
          </div>
        </div>
      </div>

      {/* PRIMER PLANO (Z: +78px) — CAPA HOLOGRÁFICA AR PROYECTADA */}
      <div className="ov-plane-front pointer-events-none absolute inset-0 flex items-center justify-end pr-[1.5%] pt-[6%] sm:pr-[3.5%]">
        <div className="ov-anim-float relative">
          <svg
            viewBox="0 0 160 160"
            className="h-32 w-32 overflow-visible drop-shadow-[0_18px_26px_rgba(20,17,18,0.78)] sm:h-38 sm:w-38"
          >
            <ellipse
              cx="80"
              cy="122"
              rx="52"
              ry="16"
              fill="none"
              stroke="#B5F44A"
              strokeOpacity="0.78"
              strokeDasharray="6 6"
              strokeWidth="1.6"
              className="ov-anim-flow-fast"
            />
            <g transform="translate(80, 74)">
              <polygon
                points="0,-40 38,-14 0,12 -38,-14"
                fill="#419D78"
                fillOpacity="0.9"
                stroke="#DADDD8"
                strokeWidth="1.2"
              />
              <polygon
                points="-38,-14 0,12 0,44 -38,16"
                fill="#2F785B"
                fillOpacity="0.92"
                stroke="#419D78"
                strokeWidth="1.2"
              />
              <polygon
                points="38,-14 0,12 0,44 38,16"
                fill="#434371"
                fillOpacity="0.94"
                stroke="#DADDD8"
                strokeOpacity="0.45"
                strokeWidth="1.2"
              />
              <polygon points="0,-22 16,-11 0,0 -16,-11" fill="#B5F44A" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
