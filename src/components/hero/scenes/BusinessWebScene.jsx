/**
 * Diapositiva 05 — Sistemas y páginas web para negocios.
 * Escena multidispositivo 3D limpia y coherente:
 * - Monitor panorámico de estudio sobre soporte metálico esculpido (panel empresarial).
 * - Computadora portátil (Ultrabook 3D) con teclado en perspectiva (sitio web corporativo).
 * - Teléfono inteligente 3D en primer plano (adaptación móvil sincronizada).
 */
export default function BusinessWebScene() {
  return (
    <div
      aria-hidden="true"
      className="ov-preserve-3d relative flex h-full w-full items-center justify-center select-none"
    >
      {/* PLANO HORIZONTE (Z: -85px) — Iluminación ambiental de estudio y sombra realista */}
      <div className="ov-plane-horizon pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 660 500" className="h-full w-full overflow-visible">
          <defs>
            <radialGradient id="web5-glow" cx="50%" cy="46%" r="52%">
              <stop offset="0%" stopColor="#419D78" stopOpacity="0.32" />
              <stop offset="52%" stopColor="#434371" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#434371" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="web5-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1B1718" stopOpacity="0.84" />
              <stop offset="100%" stopColor="#1B1718" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="330" cy="235" rx="280" ry="198" fill="url(#web5-glow)" />
          <ellipse cx="330" cy="434" rx="245" ry="30" fill="url(#web5-shadow)" />
        </svg>
      </div>

      {/* PLANO POSTERIOR (Z: -34px) — Retícula editorial limpia detrás del monitor */}
      <div className="ov-plane-back pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[268px] w-[380px] -translate-y-8 rounded-[26px] border border-[#DADDD8]/12 bg-[#434371]/35 backdrop-blur-sm sm:h-[304px] sm:w-[446px]" />
      </div>

      {/* CHASIS EXTRUIDO DEL MONITOR DE ESTUDIO (Z: +10px) */}
      <div className="ov-plane-mid-base pointer-events-none absolute flex items-center justify-center -mt-20 sm:-mt-22">
        <div className="h-[222px] w-[332px] rounded-[20px] border border-[#434371] bg-[#292425] shadow-[0_34px_65px_rgba(16,13,14,0.9)] sm:h-[256px] sm:w-[404px]" />
      </div>

      {/* PLANO PRINCIPAL (Z: +28px) — MONITOR DE ESTUDIO 3D CON PANEL DE SISTEMA EMPRESARIAL */}
      <div className="ov-plane-mid pointer-events-none relative flex flex-col items-center justify-center -mt-8 sm:-mt-10">
        {/* Pantalla panorámica con bisel metálico fino */}
        <div className="relative h-[222px] w-[332px] overflow-hidden rounded-[20px] border-2 border-[#DADDD8]/32 bg-linear-to-b from-[#484041] via-[#37323F] to-[#292528] p-3 shadow-[0_32px_60px_rgba(16,13,14,0.88),inset_0_1px_1px_rgba(218,221,216,0.35)] sm:h-[256px] sm:w-[404px] sm:p-4">
          <div className="ov-specular-glare absolute inset-0" />

          {/* Barra superior limpia del navegador / sistema */}
          <div className="relative flex items-center justify-between border-b border-[#DADDD8]/12 pb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#B5F44A]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#434371]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#419D78]" />
            </div>
            <div className="flex h-4 w-36 items-center gap-1.5 rounded-full bg-[#242022]/85 px-2.5 sm:w-48">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B5F44A]" />
              <span className="h-1.5 flex-1 rounded-full bg-[#DADDD8]/25" />
            </div>
            <div className="h-2.5 w-8 rounded-full bg-[#419D78]/60" />
          </div>

          {/* Interfaz limpia de administración empresarial */}
          <div className="relative mt-3 grid h-[164px] grid-cols-12 gap-3 sm:h-[192px]">
            {/* Barra lateral de navegación */}
            <div className="col-span-3 flex flex-col justify-between rounded-xl border border-[#DADDD8]/10 bg-[#2C2729]/82 p-2.5">
              <div className="space-y-2">
                <div className="h-2.5 w-full rounded-md bg-[#419D78]/45" />
                <div className="h-2 w-4/5 rounded-md bg-[#DADDD8]/22" />
                <div className="h-2 w-3/4 rounded-md bg-[#DADDD8]/16" />
                <div className="h-2 w-5/6 rounded-md bg-[#DADDD8]/16" />
              </div>
              <div className="h-6 w-full rounded-lg bg-[#434371]/55 p-1.5">
                <div className="h-full w-2/3 rounded-sm bg-[#B5F44A]" />
              </div>
            </div>

            {/* Panel analítico y tarjetas visuales */}
            <div className="col-span-9 flex flex-col justify-between gap-2.5">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { accent: 'bg-[#419D78]', top: 'w-10' },
                  { accent: 'bg-[#B5F44A]', top: 'w-12' },
                  { accent: 'bg-[#DADDD8]/75', top: 'w-9' },
                ].map((kpi, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#DADDD8]/10 bg-[#434371]/45 p-2.5"
                  >
                    <div className="h-1.5 w-7 rounded-full bg-[#DADDD8]/35" />
                    <div className={`mt-2 h-2.5 ${kpi.top} rounded-full ${kpi.accent}`} />
                  </div>
                ))}
              </div>

              {/* Gráfico limpio de rendimiento del negocio */}
              <div className="flex-1 rounded-xl border border-[#DADDD8]/10 bg-[#2C2729]/85 p-2.5">
                <svg viewBox="0 0 220 68" className="h-full w-full overflow-visible">
                  <defs>
                    <linearGradient id="web5-chart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#419D78" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#419D78" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 4 56 C 36 52, 58 34, 92 36 C 126 38, 146 16, 178 18 C 196 19, 206 9, 216 6 L 216 64 L 4 64 Z"
                    fill="url(#web5-chart)"
                  />
                  <path
                    d="M 4 56 C 36 52, 58 34, 92 36 C 126 38, 146 16, 178 18 C 196 19, 206 9, 216 6"
                    fill="none"
                    stroke="#419D78"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="216" cy="6" r="4.5" fill="#B5F44A" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Cuello y peana metálica esculpida del monitor de estudio */}
        <svg viewBox="0 0 180 54" className="-mt-1 h-12 w-40 overflow-visible">
          <defs>
            <linearGradient id="web5-stand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DADDD8" />
              <stop offset="55%" stopColor="#8E9693" />
              <stop offset="100%" stopColor="#434371" />
            </linearGradient>
          </defs>
          <polygon points="74,0 106,0 114,34 66,34" fill="url(#web5-stand)" />
          <polygon
            points="90,26 154,40 90,50 26,40"
            fill="#9BA29F"
            stroke="#DADDD8"
            strokeOpacity="0.6"
            strokeWidth="1"
          />
          <polygon points="26,40 90,50 90,54 26,44" fill="#434371" />
          <polygon points="154,40 90,50 90,54 154,44" fill="#2A2C52" />
        </svg>
      </div>

      {/* PLANO MEDIO-FRONTAL (Z: +54px) — COMPUTADORA PORTÁTIL 3D (SITIO WEB CORPORATIVO) */}
      <div className="ov-plane-front-mid pointer-events-none absolute inset-0 flex items-end justify-start pl-[2%] pb-[6%] sm:pl-[5%] sm:pb-[7%]">
        <div className="ov-anim-float-alt relative w-[206px] sm:w-[244px]">
          {/* Pantalla de la portátil */}
          <div className="relative h-[126px] w-full overflow-hidden rounded-t-[14px] border-2 border-[#DADDD8]/36 bg-linear-to-br from-[#484041] via-[#373345] to-[#2A2528] p-2.5 shadow-[0_22px_40px_rgba(16,13,14,0.86)] sm:h-[146px] sm:p-3">
            <div className="ov-specular-glare absolute inset-0" />
            {/* Cabecera web minimalista */}
            <div className="relative flex items-center justify-between pb-2">
              <span className="h-2 w-10 rounded-full bg-[#DADDD8]/80" />
              <div className="flex gap-1.5">
                <span className="h-1.5 w-5 rounded-full bg-[#DADDD8]/35" />
                <span className="h-1.5 w-5 rounded-full bg-[#DADDD8]/35" />
                <span className="h-2 w-7 rounded-full bg-[#B5F44A]" />
              </div>
            </div>

            {/* Hero visual limpio de página web para negocio */}
            <div className="relative rounded-xl border border-[#419D78]/35 bg-linear-to-r from-[#419D78]/30 via-[#434371]/50 to-[#342E30] p-2.5">
              <div className="h-2.5 w-3/4 rounded-full bg-[#DADDD8]" />
              <div className="mt-1.5 h-2 w-1/2 rounded-full bg-[#DADDD8]/55" />
              <div className="mt-2.5 inline-block h-3.5 w-14 rounded-full bg-[#B5F44A]" />
            </div>

            {/* Tres tarjetas inferiores de servicios/catálogo */}
            <div className="relative mt-2 grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((card) => (
                <div
                  key={card}
                  className="h-7 rounded-lg border border-[#DADDD8]/12 bg-[#434371]/45 p-1.5"
                >
                  <div className="h-1.5 w-2/3 rounded-full bg-[#419D78]" />
                </div>
              ))}
            </div>
          </div>

          {/* Base de teclado de aluminio extruido en perspectiva 3D */}
          <svg viewBox="0 0 260 30" className="-mt-0.5 w-full overflow-visible">
            <polygon
              points="12,0 248,0 260,18 0,18"
              fill="#C7CCC8"
              stroke="#DADDD8"
              strokeWidth="1"
            />
            <polygon points="34,4 226,4 234,12 26,12" fill="#484041" />
            <polygon points="104,13 156,13 159,17 101,17" fill="#949B97" />
            <path d="M 0 18 L 260 18 L 252 24 L 8 24 Z" fill="#6F7673" />
          </svg>
        </div>
      </div>

      {/* PRIMER PLANO (Z: +78px) — TELÉFONO INTELIGENTE 3D (DISEÑO MÓVIL ADAPTATIVO) */}
      <div className="ov-plane-front pointer-events-none absolute inset-0 flex items-end justify-end pr-[4%] pb-[7%] sm:pr-[7%] sm:pb-[8%]">
        <div className="ov-anim-float relative h-[196px] w-[106px] rounded-[24px] border-2 border-[#DADDD8]/42 bg-linear-to-b from-[#484041] to-[#282325] p-2 shadow-[-22px_26px_46px_rgba(16,13,14,0.92),inset_0_1px_1px_rgba(218,221,216,0.4)] sm:h-[222px] sm:w-[120px] sm:p-2.5">
          <div className="ov-specular-glare absolute inset-0 rounded-[22px]" />

          {/* Cámara superior */}
          <div className="relative mx-auto mb-2 h-1.5 w-9 rounded-full bg-[#221E1F]" />

          {/* Interfaz móvil limpia y accesible */}
          <div className="relative flex h-[160px] flex-col justify-between rounded-[16px] border border-[#DADDD8]/14 bg-[#322C2F] p-2 sm:h-[182px] sm:p-2.5">
            <div className="rounded-xl bg-linear-to-br from-[#419D78] to-[#2B6E55] p-2.5">
              <div className="h-2 w-12 rounded-full bg-[#DADDD8]" />
              <div className="mt-1.5 h-1.5 w-8 rounded-full bg-[#DADDD8]/75" />
              <div className="mt-2.5 h-3 w-11 rounded-full bg-[#B5F44A]" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 rounded-lg bg-[#434371]/55 p-2">
                <span className="h-3 w-3 shrink-0 rounded-md bg-[#419D78]" />
                <span className="h-1.5 flex-1 rounded-full bg-[#DADDD8]/65" />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#434371]/55 p-2">
                <span className="h-3 w-3 shrink-0 rounded-md bg-[#B5F44A]" />
                <span className="h-1.5 flex-1 rounded-full bg-[#DADDD8]/65" />
              </div>
            </div>

            <div className="mx-auto h-1 w-9 rounded-full bg-[#DADDD8]/35" />
          </div>
        </div>
      </div>
    </div>
  )
}
