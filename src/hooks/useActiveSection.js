import { useEffect, useState } from 'react'

/**
 * Devuelve el `id` de la sección que ocupa la franja central de la ventana, o `null` si ninguna de
 * las indicadas la ocupa (p. ej. cuando se está en el hero). Solo observa las secciones que existen
 * en ese momento, así que los destinos aún por desarrollar no producen efectos.
 *
 * `ids` debe ser estable entre renders (constante de módulo).
 */
export function useActiveSection(ids) {
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return undefined

    const visible = new Set()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        setActiveId(ids.find((id) => visible.has(id)) ?? null)
      },
      // Franja estrecha en el centro de la ventana: la sección «activa» es la que se está leyendo
      { rootMargin: '-45% 0px -50% 0px' },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [ids])

  return activeId
}
