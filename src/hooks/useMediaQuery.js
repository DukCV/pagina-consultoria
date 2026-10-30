import { useCallback, useSyncExternalStore } from 'react'

/** Estado reactivo de una media query; en servidor o sin matchMedia devuelve `fallback`. */
export function useMediaQuery(query, fallback = false) {
  // La función de suscripción debe ser estable: si cambia, React se vuelve a suscribir en cada render
  const subscribe = useCallback(
    (notify) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : fallback),
    () => fallback,
  )
}
