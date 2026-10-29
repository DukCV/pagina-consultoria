/**
 * Gestiona el clic en un enlace interno a una sección de la página con el mismo criterio que la
 * navegación del header: si la sección ya existe se deja actuar al navegador; si aún no se ha
 * desarrollado, se actualiza el hash sin saltos bruscos y se avisa con `hashchange` para que el
 * header resalte la opción correspondiente.
 */
export function followSectionLink(event, href) {
  if (document.querySelector(href)) return

  event.preventDefault()
  window.history.replaceState(null, '', href)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}
