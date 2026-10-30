/**
 * Comunicación entre el hero y la sección de servicios: los botones «Saber más» piden llevar la
 * hélice hasta un servicio concreto. La solicitud se guarda además de emitirse, porque la sección se
 * carga de forma diferida y puede no estar montada todavía cuando se pulsa el botón.
 */
export const SERVICE_FOCUS_EVENT = 'ov:service-focus'

let pendingServiceId = null

/**
 * Pide enfocar un servicio. Devuelve `true` si la sección ya estaba montada y se hizo cargo del
 * desplazamiento (el llamador debe entonces evitar el salto de ancla del navegador).
 */
export function requestServiceFocus(serviceId) {
  pendingServiceId = serviceId
  const event = new CustomEvent(SERVICE_FOCUS_EVENT, { detail: { serviceId }, cancelable: true })
  return !window.dispatchEvent(event)
}

/** Devuelve (y olvida) la solicitud pendiente, si la hay. */
export function takePendingServiceFocus() {
  const serviceId = pendingServiceId
  pendingServiceId = null
  return serviceId
}

/** `handler(serviceId)` debe devolver `true` si atendió la solicitud. */
export function subscribeToServiceFocus(handler) {
  const listener = (event) => {
    if (!handler(event.detail.serviceId)) return
    pendingServiceId = null
    event.preventDefault()
  }
  window.addEventListener(SERVICE_FOCUS_EVENT, listener)
  return () => window.removeEventListener(SERVICE_FOCUS_EVENT, listener)
}
