import { useEffect } from 'react'
import { prefetchGlbAsset } from '../../engine3d/glbLoader'
import { SCENE_REGISTRY } from './sceneRegistry'

// Espera tras mostrarse (o cambiar) una diapositiva antes de empezar a anticipar las siguientes
const FIRST_PLAN_DELAY_MS = 1200
const NEXT_PLAN_DELAY_MS = 900
const IDLE_TIMEOUT_MS = 1500

function runWhenIdle(task) {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(task, 200)
  return () => window.clearTimeout(id)
}

function prefetchPoster(poster) {
  const image = new Image()
  image.sizes = poster.sizes
  image.srcset = poster.webpSrcSet
  image.src = poster.fallbackSrc
}

/** Diapositivas por orden de proximidad a la activa: la siguiente, la anterior y después el resto. */
function proximityOrder(activeIndex, total) {
  const order = []
  for (let step = 1; step < total; step += 1) {
    const forward = (activeIndex + step) % total
    const backward = (activeIndex - step + total) % total
    if (!order.includes(forward)) order.push(forward)
    if (!order.includes(backward)) order.push(backward)
  }
  return order.slice(0, total - 1)
}

/**
 * Anticipa los recursos de las diapositivas cercanas sin competir con la visible:
 *  - el JS de cada escena (unos pocos KB) y los renders 2D, siempre;
 *  - los modelos GLB, solo del vecino inmediato (siguiente y anterior), y solo si el dispositivo
 *    puede renderizar 3D y la red es rápida. En redes moderadas el modelo se pide al llegar a su
 *    diapositiva mientras se muestra su render 2D.
 * Todo se ejecuta en tiempo ocioso y de uno en uno, con prioridad de red baja.
 */
export function useScenePreloader({ services, activeIndex, isReady, canPrefetchModels }) {
  useEffect(() => {
    if (!isReady) return undefined

    const total = services.length
    const neighbours = new Set([(activeIndex + 1) % total, (activeIndex - 1 + total) % total])
    const tasks = []

    for (const index of proximityOrder(activeIndex, total)) {
      const entry = SCENE_REGISTRY[services[index].sceneKey]
      if (!entry) continue
      if (entry.load) tasks.push(() => entry.load())
      for (const model of entry.models) {
        tasks.push(() => prefetchPoster(model.poster))
        if (canPrefetchModels && neighbours.has(index)) {
          tasks.push(() => prefetchGlbAsset(model.glbUrl))
        }
      }
    }

    let cancelIdle = () => {}
    const runNext = () => {
      const task = tasks.shift()
      if (!task) return
      cancelIdle = runWhenIdle(() => {
        task()
        runNext()
      })
    }

    const delay = activeIndex === 0 ? FIRST_PLAN_DELAY_MS : NEXT_PLAN_DELAY_MS
    const timerId = window.setTimeout(runNext, delay)
    return () => {
      window.clearTimeout(timerId)
      cancelIdle()
    }
  }, [services, activeIndex, isReady, canPrefetchModels])
}
