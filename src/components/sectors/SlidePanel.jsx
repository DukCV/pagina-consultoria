import { useRef } from 'react'
import SlideContent from './SlideContent'
import SliderNav from './SliderNav'

/**
 * Panel de la diapositiva activa: contador, barra de progreso, texto y controles. Gestiona el teclado del
 * slider (flechas izquierda/derecha, Inicio y Fin; las verticales siguen siendo scroll). `targetIndex` es
 * el destino pedido (lo reflejan al instante los indicadores) y `shownIndex` el texto visible, que cambia
 * cuando la cámara casi ha llegado.
 */
export default function SlidePanel({ slides, targetIndex, shownIndex, phase, onSelect, onStep }) {
  const panelRef = useRef(null)
  const lastIndex = slides.length - 1

  const keepFocusOnDot = (index) => {
    const dots = panelRef.current?.querySelector('.ov-slider-dots')
    if (dots?.contains(document.activeElement)) dots.querySelector(`[data-index="${index}"]`)?.focus()
  }

  const handleKeyDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    let next
    if (event.key === 'ArrowRight') next = onStep(1)
    else if (event.key === 'ArrowLeft') next = onStep(-1)
    else if (event.key === 'Home') next = onSelect(0)
    else if (event.key === 'End') next = onSelect(lastIndex)
    else return
    event.preventDefault()
    keepFocusOnDot(next)
  }

  return (
    <div
      ref={panelRef}
      role="group"
      aria-roledescription="carrusel"
      aria-label="Sectores"
      className="ov-slide-panel"
      style={{ '--ov-slide-progress': targetIndex / lastIndex }}
      onKeyDown={handleKeyDown}
    >
      <span aria-hidden="true" className="ov-slider-progress">
        <span className="ov-slider-progress__fill" />
      </span>
      <SlideContent slide={slides[shownIndex]} phase={phase} />
      <SliderNav slides={slides} activeIndex={targetIndex} onSelect={onSelect} onStep={onStep} />
    </div>
  )
}
