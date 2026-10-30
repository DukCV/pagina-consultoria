import { useEffect, useState } from 'react'

/**
 * Indica si la página se ha desplazado más de `threshold` píxeles. Escucha el scroll de forma pasiva
 * y una vez por fotograma como máximo; `useState` descarta los valores repetidos, así que solo
 * hay un nuevo render al cruzar el umbral.
 */
export function useIsScrolled(threshold = 12) {
  const [isScrolled, setIsScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > threshold,
  )

  useEffect(() => {
    let frameId = 0
    const update = () => {
      frameId = 0
      setIsScrolled(window.scrollY > threshold)
    }
    const handleScroll = () => {
      if (!frameId) frameId = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [threshold])

  return isScrolled
}
