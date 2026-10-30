import { useCallback, useEffect, useRef } from 'react'
import {
  HERO_PROTAGONIST_STATEMENT,
  HERO_SERVICES,
  HERO_SERVICES_TOTAL_LABEL,
} from '../../constants/heroServicesData'
import { useGraphicsQuality } from '../../context/graphicsQuality'
import { useHeroSlider } from '../../hooks/useHeroSlider'
import { useSpatialParallax } from '../../hooks/useSpatialParallax'
import HeroSceneViewport from './HeroSceneViewport'
import HeroServiceActions from './HeroServiceActions'

/**
 * Hero Banner inmersivo a pantalla completa de Overlayer.
 * Ocupa la totalidad de la ventana visible junto con el header (100vw × 100svh)
 * sin márgenes ni franjas exteriores, unificando la paleta corporativa oficial
 * (#484041 carbón cálido, #434371 índigo, #419D78 esmeralda, #B5F44A lima y #DADDD8 gris claro).
 */
export default function HeroBanner({
  isReady = true,
  prefersReducedMotion = false,
}) {
  const heroStageRef = useRef(null)

  const {
    activeIndex,
    prevIndex,
    direction,
    transitionId,
    isManuallyPaused,
    announcePolite,
    progressBarRef,
    goToSlide,
    goNext,
    goPrev,
    toggleManualPause,
    setIsInteracting,
  } = useHeroSlider({
    totalSlides: HERO_SERVICES.length,
    isReady,
    prefersReducedMotion,
  })

  // Nivel de calidad gráfica (full → balanced → static), decidido para toda la página por el proveedor
  const graphics = useGraphicsQuality()
  const { markSceneChange } = graphics

  // Cada cambio de diapositiva monta una escena nueva: ese tirón no debe contar como lentitud
  useEffect(() => {
    markSceneChange()
  }, [transitionId, markSceneChange])

  const {
    motionSensorState,
    requestMotionSensor,
    pointerHandlers,
    touchHandlers,
  } = useSpatialParallax({
    containerRef: heroStageRef,
    disabled: prefersReducedMotion || graphics.level === 'static',
    onSwipeNext: goNext,
    onSwipePrev: goPrev,
  })

  const activeService = HERO_SERVICES[activeIndex]

  const handleSliderKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      } else if (event.key === 'Home') {
        event.preventDefault()
        goToSlide(0)
      } else if (event.key === 'End') {
        event.preventDefault()
        goToSlide(HERO_SERVICES.length - 1)
      }
    },
    [goNext, goPrev, goToSlide],
  )

  const specialtyRevealClass =
    transitionId > 0 && !prefersReducedMotion ? 'ov-specialty-reveal' : ''

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Especialidades tecnológicas líderes de Overlayer"
      onKeyDown={handleSliderKeyDown}
      onFocusCapture={() => setIsInteracting(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsInteracting(false)
        }
      }}
      data-ov-quality={graphics.level}
      data-ov-quality-reason={graphics.reason}
      className="ov-hero relative flex w-full flex-1 flex-col bg-[#352F31]"
      style={{
        opacity: isReady ? 1 : 0,
        transition: prefersReducedMotion
          ? 'opacity 280ms ease-out'
          : 'opacity 680ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Escenario inmersivo a pantalla completa (ancho 100vw, alto restante completo de 100svh) */}
      <div
        ref={heroStageRef}
        data-ov-hero-stage=""
        onPointerMove={pointerHandlers.onPointerMove}
        onPointerLeave={pointerHandlers.onPointerLeave}
        className="relative isolate flex min-h-[calc(100svh-76px)] w-full flex-1 flex-col justify-between overflow-hidden text-[#DADDD8] sm:min-h-[calc(100svh-82px)] lg:min-h-[calc(100svh-86px)]"
      >
        {/* ===================================================================
            ATMÓSFERA UNIFICADA OVERLAYER: CARBÓN CÁLIDO + ÍNDIGO + ESMERALDA
        =================================================================== */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          {/* Base arquitectónica en Gris Carbón Cálido (#484041) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #484041 0%, #373133 48%, #2A2527 100%)',
            }}
          />

          {/* Transición cromática natural superior desde el header claro (#DADDD8) */}
          <div
            className="absolute inset-x-0 top-0 h-36"
            style={{
              background:
                'linear-gradient(180deg, rgba(218, 221, 216, 0.13) 0%, rgba(67, 67, 113, 0.1) 46%, rgba(42, 37, 39, 0) 100%)',
            }}
          />

          {/* Profundidad espacial secundaria en Azul Índigo (#434371) sobre el escenario 3D */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 67% 46%, rgba(67, 67, 113, 0.76) 0%, rgba(67, 67, 113, 0.28) 44%, rgba(42, 37, 39, 0) 76%)',
            }}
          />

          {/* Iluminación interactiva en Verde Esmeralda (#419D78) acoplada al cursor */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              background:
                'radial-gradient(660px circle at var(--ov-spot-x, 58%) var(--ov-spot-y, 46%), rgba(65, 157, 120, 0.24) 0%, rgba(67, 67, 113, 0.12) 48%, rgba(42, 37, 39, 0) 76%)',
            }}
          />

          {/* Acento ambiental controlado según la especialidad activa */}
          <div
            className="absolute right-[7%] top-[15%] h-[380px] w-[380px] rounded-full blur-[130px] transition-colors duration-700"
            style={{
              backgroundColor: activeService.stageGlow,
              opacity: 0.16,
            }}
          />

          {/* Líneas arquitectónicas diagonales de horizonte */}
          <svg
            viewBox="0 0 1440 800"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full opacity-[0.09]"
          >
            <line
              x1="540"
              y1="0"
              x2="1380"
              y2="800"
              stroke="#DADDD8"
              strokeWidth="1"
            />
            <line
              x1="1440"
              y1="130"
              x2="460"
              y2="800"
              stroke="#419D78"
              strokeWidth="1"
            />
          </svg>

          <div className="ov-grain-overlay absolute inset-0 opacity-[0.025]" />
        </div>

        {/* Región accesible para lectores de pantalla al cambiar manualmente de especialidad */}
        <div className="sr-only" aria-live={announcePolite ? 'polite' : 'off'}>
          {`${HERO_PROTAGONIST_STATEMENT.fullText} ${activeService.title} (${activeService.indexLabel} de ${HERO_SERVICES_TOTAL_LABEL})`}
        </div>

        {/* ===================================================================
            COMPOSICIÓN PRINCIPAL ALINEADA CON LA RETÍCULA DEL HEADER
        =================================================================== */}
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 py-4 sm:px-8 sm:py-6 lg:px-12 lg:py-4 xl:px-16">
          <div className="grid grid-cols-1 items-center gap-3 sm:gap-5 lg:grid-cols-12 lg:gap-8">
            {/* JERARQUÍA TIPOGRÁFICA PROTAGONISTA */}
            <div className="relative z-10 flex flex-col items-start lg:col-span-5">
              <h1 className="select-none text-[2.3rem] leading-[0.95] font-extrabold tracking-[-0.035em] text-[#DADDD8] uppercase sm:text-[3.25rem] lg:text-[3.7rem] xl:text-[4.35rem]">
                <span className="block">{HERO_PROTAGONIST_STATEMENT.leadLine}</span>
                <span className="mt-1 block bg-linear-to-r from-[#DADDD8] via-[#419D78] to-[#B5F44A] bg-clip-text text-transparent">
                  {HERO_PROTAGONIST_STATEMENT.emphasisLine}
                </span>
              </h1>

              {/* Regla arquitectónica índigo, esmeralda y lima */}
              <div
                aria-hidden="true"
                className="mt-4 flex h-[3px] w-20 items-center overflow-hidden rounded-full bg-[#434371] sm:mt-6 sm:w-24"
              >
                <span className="h-full flex-1 bg-[#419D78]" />
                <span className="h-full w-4 bg-[#B5F44A]" />
              </div>

              {/* Especialidad activa del slider (altura estable para evitar desplazamientos) */}
              <div
                onPointerEnter={() => setIsInteracting(true)}
                onPointerLeave={() => setIsInteracting(false)}
                className="mt-4 flex min-h-[88px] w-full flex-col justify-start sm:mt-6 sm:min-h-[108px] lg:min-h-[132px]"
              >
                <div
                  key={`specialty-${activeService.id}-${transitionId}`}
                  className={specialtyRevealClass}
                >
                  <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#419D78] uppercase">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rotate-45 bg-[#B5F44A]"
                    />
                    <span className="text-[#B5F44A]">{activeService.indexLabel}</span>
                    <span className="text-[#DADDD8]/45">
                      / {HERO_SERVICES_TOTAL_LABEL}
                    </span>
                  </div>

                  <h2 className="mt-2 max-w-md text-[1.55rem] leading-[1.12] font-semibold tracking-[-0.022em] text-[#DADDD8] sm:text-[2.1rem] lg:text-[2.35rem] xl:text-[2.65rem]">
                    {activeService.title}
                  </h2>
                </div>
              </div>

              {/* Acciones de la especialidad activa: Saber más · Contáctanos */}
              <HeroServiceActions
                service={activeService}
                transitionId={transitionId}
                onInteractionChange={setIsInteracting}
              />
            </div>

            {/* ESCENARIO TRIDIMENSIONAL INTERACTIVO */}
            <div className="relative z-10 lg:col-span-7">
              <HeroSceneViewport
                services={HERO_SERVICES}
                activeIndex={activeIndex}
                prevIndex={prevIndex}
                direction={direction}
                transitionId={transitionId}
                isReady={isReady}
                prefersReducedMotion={prefersReducedMotion}
                touchHandlers={touchHandlers}
                onInteractionChange={setIsInteracting}
              />
            </div>
          </div>
        </div>

        {/* ===================================================================
            DOCK INFERIOR DE NAVEGACIÓN Y PROGRESO DEL SLIDER (#484041 + #434371)
        =================================================================== */}
        <div
          onPointerEnter={() => setIsInteracting(true)}
          onPointerLeave={() => setIsInteracting(false)}
          className="relative z-20 border-t border-[#DADDD8]/12 bg-[#322C2E]/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-3 gap-y-2.5 px-5 py-3 sm:flex-nowrap sm:px-8 sm:py-3.5 lg:gap-6 lg:px-12 xl:px-16">
            {/* Indicadores interactivos: una columna por especialidad registrada.
                En móvil ocupan su propia fila para que las seis etiquetas sean legibles y pulsables. */}
            <div
              role="group"
              aria-label="Seleccionar especialidad tecnológica"
              className="grid w-full gap-1.5 sm:w-auto sm:flex-1 sm:gap-2.5"
              style={{
                gridTemplateColumns: `repeat(${HERO_SERVICES.length}, minmax(0, 1fr))`,
              }}
            >
              {HERO_SERVICES.map((service, index) => {
                const isActive = index === activeIndex
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => goToSlide(index)}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={`${service.indexLabel}. ${service.title}`}
                    className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-all duration-250 sm:px-3.5 sm:py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5F44A] ${
                      isActive
                        ? 'border-[#419D78]/70 bg-[#434371]/55 text-[#DADDD8]'
                        : 'border-[#DADDD8]/12 bg-[#484041]/55 text-[#DADDD8]/68 hover:border-[#DADDD8]/28 hover:bg-[#434371]/35 hover:text-[#DADDD8]'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1.5">
                      <span
                        className={`text-[11px] font-semibold tracking-[0.12em] ${
                          isActive ? 'text-[#B5F44A]' : 'text-[#419D78]'
                        }`}
                      >
                        {service.indexLabel}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rotate-45 transition-transform duration-300 ${
                          isActive
                            ? 'scale-115 bg-[#B5F44A]'
                            : 'scale-75 bg-[#DADDD8]/30 group-hover:bg-[#419D78]'
                        }`}
                      />
                    </div>

                    <span className="mt-1 hidden line-clamp-1 text-[12px] font-medium tracking-[0.01em] lg:block">
                      {service.title}
                    </span>

                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-[2.5px] bg-[#DADDD8]/10"
                    >
                      {isActive && (
                        <span
                          ref={progressBarRef}
                          className="block h-full w-full origin-left bg-linear-to-r from-[#419D78] to-[#B5F44A]"
                          style={{
                            transform: prefersReducedMotion
                              ? 'scaleX(1)'
                              : 'scaleX(0)',
                          }}
                        />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Controles accesibles: Sensor 3D opcional en móvil, Anterior, Pausa/Reanudar y Siguiente */}
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              {!prefersReducedMotion && motionSensorState === 'prompt' && (
                <button
                  type="button"
                  onClick={requestMotionSensor}
                  aria-label="Activar inclinación 3D con sensores de movimiento"
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#419D78]/50 bg-[#484041]/85 px-3 text-[11px] font-medium text-[#DADDD8] transition-colors duration-200 hover:border-[#B5F44A]/70 hover:bg-[#434371] hover:text-[#B5F44A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5F44A]"
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rotate-45 bg-[#B5F44A]"
                  />
                  <span>Sensor 3D</span>
                </button>
              )}

              <button
                type="button"
                onClick={goPrev}
                aria-label="Especialidad anterior"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#DADDD8]/20 bg-[#484041]/80 text-[#DADDD8] transition-colors duration-200 hover:border-[#419D78] hover:bg-[#434371] hover:text-[#B5F44A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5F44A]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M12.5 4.5L7 10L12.5 15.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {!prefersReducedMotion && (
                <button
                  type="button"
                  onClick={toggleManualPause}
                  aria-pressed={isManuallyPaused}
                  aria-label={
                    isManuallyPaused
                      ? 'Reanudar recorrido automático'
                      : 'Pausar recorrido automático'
                  }
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#DADDD8]/20 bg-[#484041]/80 text-[#DADDD8] transition-colors duration-200 hover:border-[#419D78] hover:bg-[#434371] hover:text-[#B5F44A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5F44A]"
                >
                  {isManuallyPaused ? (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="h-3.5 w-3.5 translate-x-[0.5px]"
                      fill="currentColor"
                    >
                      <path d="M6.5 4.8L15 10L6.5 15.2V4.8Z" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                    >
                      <rect x="5.5" y="4.5" width="3" height="11" rx="1" />
                      <rect x="11.5" y="4.5" width="3" height="11" rx="1" />
                    </svg>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={goNext}
                aria-label="Siguiente especialidad"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#DADDD8]/20 bg-[#484041]/80 text-[#DADDD8] transition-colors duration-200 hover:border-[#419D78] hover:bg-[#434371] hover:text-[#B5F44A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5F44A]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M7.5 4.5L13 10L7.5 15.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
