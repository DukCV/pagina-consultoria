import { useEffect, useState } from 'react'

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Suscribe el estado reactivo a la preferencia de accesibilidad prefers-reduced-motion.
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(MEDIA_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mediaQueryList = window.matchMedia(MEDIA_QUERY)
    const handleChange = (event) => setPrefersReducedMotion(event.matches)

    mediaQueryList.addEventListener('change', handleChange)
    return () => mediaQueryList.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}
