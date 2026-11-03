/**
 * Movimiento del progreso de la cámara entre paradas (puro, sin DOM). Cada viaje es una curva Hermite
 * con tangente final nula: arranca con la velocidad que ya llevaba el progreso (de modo que pulsar
 * «siguiente» a mitad de camino no produce tirones ni saltos) y se detiene con suavidad en el destino.
 * La duración crece poco con el número de pasos para que un salto largo no marée.
 */

export const STEP_DURATION_MS = 1350
export const EXTRA_STEP_DURATION_MS = 380
export const MAX_DURATION_MS = 2300
// Fracción del viaje a partir de la cual la diapositiva nueva sustituye a la anterior
export const SWAP_FRACTION = 0.55

export const durationFor = (steps) =>
  Math.min(MAX_DURATION_MS, STEP_DURATION_MS + EXTRA_STEP_DURATION_MS * (Math.max(1, Math.abs(steps)) - 1))

/**
 * @param {number} initial progreso inicial
 */
export function createMotion(initial = 0) {
  let from = initial
  let to = initial
  let startVelocity = 0 // unidades de progreso por ms
  let startedAt = 0
  let duration = 1
  let value = initial
  let velocity = 0

  const evaluate = (now) => {
    if (from === to) return { value: to, velocity: 0, fraction: 1 }
    const u = Math.min(1, Math.max(0, (now - startedAt) / duration))
    // Hermite con tangente inicial v0·duración y tangente final 0
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1
    const h10 = u ** 3 - 2 * u ** 2 + u
    const h01 = -2 * u ** 3 + 3 * u ** 2
    const dh00 = (6 * u ** 2 - 6 * u) / duration
    const dh10 = (3 * u ** 2 - 4 * u + 1) / duration
    const dh01 = (-6 * u ** 2 + 6 * u) / duration
    return {
      value: h00 * from + h10 * startVelocity * duration + h01 * to,
      velocity: dh00 * from + dh10 * startVelocity * duration + dh01 * to,
      fraction: u,
    }
  }

  return {
    /** Nuevo destino desde la posición y velocidad actuales. */
    retarget(target, now, { immediate = false } = {}) {
      const current = evaluate(now)
      value = current.value
      velocity = current.velocity
      if (immediate) {
        from = to = value = target
        velocity = startVelocity = 0
        return
      }
      from = value
      to = target
      startVelocity = velocity
      startedAt = now
      duration = durationFor(target - from)
    },
    /** Estado en el instante `now`: `{ value, fraction (0‥1 del viaje), isMoving }`. */
    sample(now) {
      const current = evaluate(now)
      const done = from === to || current.fraction >= 1
      value = done ? to : current.value
      velocity = done ? 0 : current.velocity
      return { value, fraction: from === to ? 1 : current.fraction, isMoving: !done }
    },
    get target() {
      return to
    },
  }
}
