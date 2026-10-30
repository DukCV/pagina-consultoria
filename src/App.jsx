import { useEffect, useRef } from 'react'
import HeroBanner from './components/hero/HeroBanner'
import MainHeader from './components/MainHeader'
import OverlayerSplash from './components/OverlayerSplash'
import ServicesSection from './components/services/ServicesSection'
import GraphicsQualityProvider from './context/GraphicsQualityProvider'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useWelcomeToHeaderTransition } from './hooks/useWelcomeToHeaderTransition'

function App() {
  const splashLogoAnchorRef = useRef(null)
  const headerLogoRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  const {
    phase,
    exitState,
    isHeaderLogoVisible,
    isHeaderRevealed,
    isHeaderInteractive,
    handleWelcomeSettled,
  } = useWelcomeToHeaderTransition({
    splashLogoAnchorRef,
    headerLogoRef,
    prefersReducedMotion,
  })

  // Bloquea desplazamiento durante la secuencia inicial y restaura al finalizar
  useEffect(() => {
    const isSequenceActive = phase !== 'complete'
    document.body.style.overflow = isSequenceActive ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [phase])

  return (
    <GraphicsQualityProvider prefersReducedMotion={prefersReducedMotion} isReady={isHeaderRevealed}>
      <div className="flex min-h-svh w-full flex-col overflow-x-clip bg-[#DADDD8] text-[#484041]">
        <MainHeader
          ref={headerLogoRef}
          isLogoVisible={isHeaderLogoVisible}
          isRevealed={isHeaderRevealed}
          isInteractive={isHeaderInteractive}
          prefersReducedMotion={prefersReducedMotion}
        />

        <main
          id="contenido-principal"
          inert={!isHeaderInteractive || undefined}
          className="relative z-10 flex w-full flex-1 flex-col"
        >
          <HeroBanner
            isReady={isHeaderRevealed}
            prefersReducedMotion={prefersReducedMotion}
          />
          <ServicesSection isReady={isHeaderRevealed} prefersReducedMotion={prefersReducedMotion} />
        </main>

        {phase !== 'complete' && (
          <OverlayerSplash
            logoAnchorRef={splashLogoAnchorRef}
            onSettled={handleWelcomeSettled}
            exitState={exitState}
          />
        )}
      </div>
    </GraphicsQualityProvider>
  )
}

export default App
