import { useEffect, useState } from 'react'

/**
 * Indica si un elemento está (o estuvo hace poco) en pantalla. Pasa a `true` en cuanto asoma y solo
 * vuelve a `false` cuando lleva `releaseDelayMs` fuera de ella: sirve para crear recursos pesados
 * (un contexto WebGL) al llegar y liberarlos al alejarse, sin parpadeos por un simple rebote de scroll.
 */
// Un margen negativo de 2 px evita que un elemento que solo roza el borde de la ventana cuente como visible
// (la sección de servicios empieza justo donde acaba el hero)
export function useNearViewport(ref, { rootMargin = '-2px 0px', releaseDelayMs = 6000 } = {}) {
  const [isNear, setIsNear] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsNear(true)
      return undefined
    }

    let releaseTimer = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(releaseTimer)
        if (entry.isIntersecting) setIsNear(true)
        else releaseTimer = window.setTimeout(() => setIsNear(false), releaseDelayMs)
      },
      { rootMargin },
    )
    observer.observe(element)

    return () => {
      window.clearTimeout(releaseTimer)
      observer.disconnect()
    }
  }, [ref, rootMargin, releaseDelayMs])

  return isNear
}
