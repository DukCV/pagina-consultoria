import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import {
  NAVIGATION_ITEMS,
  OVERLAYER_PALETTE,
  TRANSITION_TIMINGS,
} from '../constants/brandTheme'
import { useGraphicsQuality } from '../context/graphicsQuality'
import { useActiveSection } from '../hooks/useActiveSection'
import { useIsScrolled } from '../hooks/useIsScrolled'
import OverlayerBrandLogo from './OverlayerBrandLogo'

// Las opciones de navegación que son enlaces apuntan a secciones con su mismo id: se resalta la que se está leyendo
const SPY_SECTION_IDS = NAVIGATION_ITEMS.filter((item) => item.variant === 'link').map((item) => item.id)

/**
 * Header principal de Overlayer.
 * Integra el logotipo recibido desde la transición compartida y presenta las cuatro
 * opciones oficiales de navegación con entrada escalonada, microinteracciones discretas,
 * adaptación responsive completa y soporte total de teclado y accesibilidad.
 */
const MainHeader = forwardRef(function MainHeader(
  {
    isLogoVisible = false,
    isRevealed = false,
    isInteractive = false,
    prefersReducedMotion = false,
  },
  logoRef,
) {
  const [activeId, setActiveId] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const headerContainerRef = useRef(null)
  const mobileToggleRef = useRef(null)
  const isScrolled = useIsScrolled()
  const { level } = useGraphicsQuality()
  const visibleSectionId = useActiveSection(SPY_SECTION_IDS)
  const lastVisibleSectionRef = useRef(null)

  // Al entrar o salir de una sección, la navegación resalta (o deja de resaltar) su opción
  useEffect(() => {
    if (lastVisibleSectionRef.current === visibleSectionId) return
    lastVisibleSectionRef.current = visibleSectionId
    setActiveId(visibleSectionId)
  }, [visibleSectionId])

  // Sincroniza estado activo inicial si existiera un hash válido en la URL
  useEffect(() => {
    const syncFromHash = () => {
      const currentHash = window.location.hash
      const matched = NAVIGATION_ITEMS.find((item) => item.href === currentHash)
      if (matched) setActiveId(matched.id)
    }
    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  // Cierra el menú móvil al ampliar la ventana a tableta/escritorio
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const handleViewportChange = (e) => {
      if (e.matches) setIsMobileMenuOpen(false)
    }
    mediaQuery.addEventListener('change', handleViewportChange)
    return () => mediaQuery.removeEventListener('change', handleViewportChange)
  }, [])

  // Cierra el menú móvil con Escape o clic fuera del header
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
        mobileToggleRef.current?.focus()
      }
    }

    const handlePointerDownOutside = (event) => {
      if (
        headerContainerRef.current &&
        !headerContainerRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pointerdown', handlePointerDownOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pointerdown', handlePointerDownOutside)
    }
  }, [isMobileMenuOpen])

  const handleNavClick = useCallback((event, item) => {
    const targetSection = document.querySelector(item.href)
    setActiveId(item.id)
    setIsMobileMenuOpen(false)

    // Si la sección aún no se ha desarrollado, actualiza el hash limpiamente sin saltos bruscos
    if (!targetSection) {
      event.preventDefault()
      window.history.replaceState(null, '', item.href)
    }
  }, [])

  const handleBrandClick = useCallback((event) => {
    event.preventDefault()
    setActiveId(null)
    setIsMobileMenuOpen(false)
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const transitionEase = 'cubic-bezier(0.22, 1, 0.36, 1)'

  return (
    <header
      ref={headerContainerRef}
      inert={!isInteractive || undefined}
      aria-hidden={!isInteractive || undefined}
      data-scrolled={isScrolled ? 'true' : 'false'}
      className={`sticky top-0 z-40 w-full shrink-0 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-out ${
        // El cristal esmerilado solo se usa en calidad completa: en el resto se prefiere un fondo casi opaco
        isScrolled
          ? level === 'full'
            ? 'bg-[#DADDD8]/86 shadow-[0_14px_34px_-22px_rgba(16,13,14,0.7)] backdrop-blur-xl'
            : 'bg-[#DADDD8]/97 shadow-[0_10px_24px_-20px_rgba(16,13,14,0.7)]'
          : level === 'full'
            ? 'bg-[#DADDD8]/95 backdrop-blur-md'
            : 'bg-[#DADDD8]/98'
      } ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none select-none'}`}
    >
      {/* Línea cromática superior sutil con la identidad tecnológica de Overlayer */}
      <div
        aria-hidden="true"
        className="h-[2px] w-full origin-left"
        style={{
          background: `linear-gradient(90deg, ${OVERLAYER_PALETTE.indigo} 0%, ${OVERLAYER_PALETTE.emerald} 68%, ${OVERLAYER_PALETTE.lime} 100%)`,
          opacity: isRevealed ? 0.9 : 0,
          transform: prefersReducedMotion
            ? 'scaleX(1)'
            : `scaleX(${isRevealed ? 1 : 0})`,
          transition: prefersReducedMotion
            ? 'opacity 280ms ease-out'
            : `transform 680ms ${transitionEase}, opacity 420ms ease-out`,
        }}
      />

      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:h-[78px] sm:px-8 lg:h-[82px] lg:px-12 xl:px-16">
        {/* Logotipo de Overlayer a la izquierda */}
        <a
          href="#"
          onClick={handleBrandClick}
          aria-label="Overlayer — Ir al inicio"
          className="group/brand inline-flex shrink-0 items-center rounded-sm py-1 focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#434371]"
        >
          <OverlayerBrandLogo
            ref={logoRef}
            isVisible={isLogoVisible}
            className="h-auto w-[112px] sm:w-[126px] lg:w-[142px]"
          />
        </a>

        {/* Navegación horizontal en escritorio y tabletas */}
        <nav aria-label="Navegación principal" className="hidden md:block">
          <ul className="flex items-center gap-6 lg:gap-9">
            {NAVIGATION_ITEMS.map((item, index) => {
              const isActive = activeId === item.id
              const isCta = item.variant === 'cta'
              const staggerDelayMs = prefersReducedMotion
                ? 0
                : index * TRANSITION_TIMINGS.navStaggerMs

              const itemRevealStyle = {
                opacity: isRevealed ? 1 : 0,
                transform:
                  prefersReducedMotion || isRevealed
                    ? 'translate3d(0, 0px, 0)'
                    : 'translate3d(0, -10px, 0)',
                transition: prefersReducedMotion
                  ? 'opacity 260ms ease-out'
                  : `opacity 500ms ${transitionEase} ${staggerDelayMs}ms, transform 540ms ${transitionEase} ${staggerDelayMs}ms`,
              }

              if (isCta) {
                return (
                  <li key={item.id} style={itemRevealStyle} className="ml-1 lg:ml-2">
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full px-5 py-2.5 text-[14px] font-medium tracking-[0.02em] transition-all duration-300 lg:px-6 lg:text-[14.5px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#419D78] ${
                        isActive
                          ? 'bg-[#434371] text-[#DADDD8] shadow-xs'
                          : 'bg-[#484041] text-[#DADDD8] hover:bg-[#434371]'
                      }`}
                    >
                      {/* Acento estratégico en verde lima brillante (#B5F44A) */}
                      <span
                        aria-hidden="true"
                        className="inline-block h-[6px] w-[6px] rotate-45 bg-[#B5F44A] transition-transform duration-300 ease-out group-hover:rotate-135 group-hover:scale-110"
                      />
                      <span>{item.label}</span>
                    </a>
                  </li>
                )
              }

              return (
                <li key={item.id} style={itemRevealStyle}>
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`group relative inline-flex items-center gap-1.5 py-2 text-[14.5px] font-medium tracking-[0.015em] transition-colors duration-250 lg:text-[15px] focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#434371] ${
                      isActive
                        ? 'text-[#434371]'
                        : 'text-[#484041] hover:text-[#434371]'
                    }`}
                  >
                    <span>{item.label}</span>

                    {/* Subrayado animado arquitectónico en verde esmeralda con punta lima */}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-x-0 bottom-0.5 flex h-[2px] origin-left items-center transition-transform duration-300 ease-out ${
                        isActive
                          ? 'scale-x-100'
                          : 'scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100'
                      }`}
                    >
                      <span className="h-full flex-1 bg-[#419D78]" />
                      <span className="h-full w-1.5 bg-[#B5F44A]" />
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Botón compacto accesible para dispositivos móviles */}
        <div
          className="md:hidden"
          style={{
            opacity: isRevealed ? 1 : 0,
            transform:
              prefersReducedMotion || isRevealed
                ? 'translate3d(0, 0px, 0)'
                : 'translate3d(0, -8px, 0)',
            transition: prefersReducedMotion
              ? 'opacity 260ms ease-out'
              : `opacity 480ms ${transitionEase} 60ms, transform 520ms ${transitionEase} 60ms`,
          }}
        >
          <button
            ref={mobileToggleRef}
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="overlayer-mobile-nav"
            aria-label={
              isMobileMenuOpen
                ? 'Cerrar menú de navegación'
                : 'Abrir menú de navegación'
            }
            className="inline-flex h-10 cursor-pointer items-center gap-2.5 rounded-full border border-[#484041]/22 bg-[#484041]/6 px-3.5 text-[12.5px] font-medium tracking-[0.08em] text-[#484041] uppercase transition-colors duration-250 hover:border-[#434371]/45 hover:bg-[#484041] hover:text-[#DADDD8] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#434371]"
          >
            <span>Menú</span>
            <span aria-hidden="true" className="relative flex h-3.5 w-4 flex-col justify-center">
              <span
                className={`absolute h-[1.5px] w-4 bg-current transition-transform duration-300 ease-out ${
                  isMobileMenuOpen ? 'translate-y-0 rotate-45' : '-translate-y-[4px]'
                }`}
              />
              <span
                className={`absolute h-[1.5px] bg-current transition-all duration-300 ease-out ${
                  isMobileMenuOpen
                    ? 'w-4 translate-y-0 -rotate-45'
                    : 'right-0 w-2.5 translate-y-[4px]'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Horizonte cromático de unión arquitectónica entre el header y el hero banner */}
      <div
        aria-hidden="true"
        className="h-[2px] w-full origin-left"
        style={{
          background: `linear-gradient(90deg, ${OVERLAYER_PALETTE.charcoal} 0%, ${OVERLAYER_PALETTE.indigo} 38%, ${OVERLAYER_PALETTE.emerald} 76%, ${OVERLAYER_PALETTE.lime} 100%)`,
          opacity: isRevealed ? 0.88 : 0,
          transform: prefersReducedMotion
            ? 'scaleX(1)'
            : `scaleX(${isRevealed ? 1 : 0})`,
          transition: prefersReducedMotion
            ? 'opacity 260ms ease-out'
            : `transform 720ms ${transitionEase}, opacity 420ms ease-out`,
        }}
      />

      {/* Panel desplegable móvil en gris carbón cálido (#484041) */}
      <div
        id="overlayer-mobile-nav"
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen || undefined}
        className={`absolute inset-x-0 top-full overflow-hidden md:hidden transition-all duration-300 ease-out ${
          isMobileMenuOpen
            ? 'pointer-events-auto visible translate-y-0 opacity-100'
            : 'pointer-events-none invisible -translate-y-2 opacity-0'
        }`}
      >
        <nav
          aria-label="Navegación móvil"
          className="border-b border-[#434371]/45 bg-[#484041] px-5 py-5 shadow-lg sm:px-8"
        >
          <ul className="flex flex-col divide-y divide-[#DADDD8]/10">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = activeId === item.id
              const isCta = item.variant === 'cta'

              if (isCta) {
                return (
                  <li key={item.id} className="pt-4">
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item)}
                      aria-current={isActive ? 'true' : undefined}
                      className="group flex w-full items-center justify-between rounded-xl border border-[#419D78]/45 bg-[#434371]/45 px-4 py-3.5 text-[15px] font-medium tracking-[0.02em] text-[#DADDD8] transition-colors duration-250 hover:border-[#B5F44A]/70 hover:bg-[#434371] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5F44A]"
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="inline-block h-2 w-2 rotate-45 bg-[#B5F44A]"
                        />
                        <span>{item.label}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-xs tracking-widest text-[#B5F44A] transition-transform duration-250 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </a>
                  </li>
                )
              }

              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`group flex items-center justify-between py-3.5 text-[15.5px] font-medium tracking-[0.015em] transition-colors duration-200 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B5F44A] ${
                      isActive
                        ? 'text-[#B5F44A]'
                        : 'text-[#DADDD8] hover:text-[#419D78]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rotate-45 transition-all duration-250 ${
                        isActive
                          ? 'scale-100 bg-[#B5F44A]'
                          : 'scale-75 bg-[#419D78]/0 group-hover:scale-100 group-hover:bg-[#419D78]'
                      }`}
                    />
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
})

export default MainHeader
