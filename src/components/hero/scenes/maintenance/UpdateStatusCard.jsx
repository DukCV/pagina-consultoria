/** Tarjeta flotante de actualización completada con su progresión de versiones. */
export default function UpdateStatusCard() {
  return (
    <div className="ov-anim-float absolute bottom-[3%] right-[5%] flex items-center gap-3 rounded-2xl border border-[#B5F44A]/50 bg-linear-to-br from-[#434371]/92 to-[#352F31]/95 p-2.5 shadow-[0_24px_44px_rgba(18,15,16,0.88)] backdrop-blur-xl sm:bottom-[12%] sm:right-[6%] sm:p-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B5F44A]/16 sm:h-12 sm:w-12">
        <svg viewBox="0 0 48 48" className="h-8 w-8 sm:h-11 sm:w-11">
          <circle cx="24" cy="24" r="19" fill="none" stroke="#434371" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r="19"
            fill="none"
            stroke="#419D78"
            strokeWidth="4"
            strokeDasharray="96 120"
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
          />
          <path
            d="M 24 33 L 24 16 M 16.5 22.5 L 24 15 L 31.5 22.5"
            fill="none"
            stroke="#B5F44A"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="hidden space-y-2 pr-1 sm:block">
        <div className="h-2 w-14 rounded-full bg-[#DADDD8]" />
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-[#434371]" />
          <span className="h-1.5 w-3 rounded-full bg-[#419D78]" />
          <span className="h-1.5 w-5 rounded-full bg-[#B5F44A]" />
        </div>
      </div>
    </div>
  )
}
