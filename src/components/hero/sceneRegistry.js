import { lazy } from 'react'
import { MODEL_ASSETS } from '../../constants/modelAssets'
import CustomSystemsScene from './scenes/CustomSystemsScene'

// Un fallo transitorio de red al pedir el chunk de una escena se reintenta una vez antes de rendirse
const RETRY_DELAY_MS = 700
const withRetry = (importer) => () =>
  importer().catch(
    () => new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS)).then(importer),
  )

function lazyScene(importer, models = []) {
  const load = withRetry(importer)
  return { Component: lazy(load), load, models }
}

/**
 * Escenas del hero por `sceneKey`. La primera se incluye en el bundle principal para pintarse de
 * inmediato; el resto se carga de forma diferida. `models` lista los activos 3D que necesita cada
 * escena, que el precargador utiliza para anticiparse sin duplicar rutas.
 */
export const SCENE_REGISTRY = {
  'custom-systems': { Component: CustomSystemsScene, load: null, models: [] },
  'immersive-xr': lazyScene(() => import('./scenes/ImmersiveXrScene'), [MODEL_ASSETS.quest3]),
  'ai-automation': lazyScene(() => import('./scenes/AiAutomationScene'), [MODEL_ASSETS.aiCharacter]),
  infrastructure: lazyScene(() => import('./scenes/InfrastructureScene')),
  'business-web': lazyScene(() => import('./scenes/BusinessWebScene')),
  'maintenance-upgrades': lazyScene(() => import('./scenes/MaintenanceScene')),
}
