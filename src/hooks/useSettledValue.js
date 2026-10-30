import { useEffect, useState } from 'react'

/**
 * Devuelve `value` solo cuando lleva `delayMs` sin cambiar. Sirve para no montar recursos costosos
 * (un modelo 3D, un anuncio de accesibilidad) mientras el valor aún está cambiando.
 */
export function useSettledValue(value, delayMs) {
  const [settled, setSettled] = useState(value)

  useEffect(() => {
    const timerId = window.setTimeout(() => setSettled(value), delayMs)
    return () => window.clearTimeout(timerId)
  }, [value, delayMs])

  return settled
}
