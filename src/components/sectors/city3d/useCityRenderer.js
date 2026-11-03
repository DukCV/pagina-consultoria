import { useMemo } from 'react'
import { useSceneRenderer } from '../../scene3d/useSceneRenderer.js'
import { frameLayerStyle } from '../frameSequence.js'
import { loadCityScene } from './buildCityScene.js'
import { createCityRuntime } from './cityRuntime.js'

// Movimiento ambiental (vehículos, luces, anillos) en reposo: ~24 fotogramas por segundo bastan
const IDLE_FRAME_INTERVAL_MS = 42

/** Posición horizontal del centro de la ciudad (0‥1): la define el CSS con `--ov-sec-axis`. */
function readAxis(element) {
  const value = Number.parseFloat(window.getComputedStyle(element).getPropertyValue('--ov-sec-axis'))
  return { axisScreenX: Number.isFinite(value) ? value / 100 : 0.5 }
}

/** Renderizador de respaldo: funde y desliza los fotogramas pre-renderizados según el progreso de la cámara. */
function createFramesRenderer(layerRefs) {
  return {
    update(progress) {
      layerRefs.current.forEach((layer, step) => {
        if (!layer) return
        const { opacity, translateXPercent, scale } = frameLayerStyle(step, progress)
        layer.style.opacity = opacity.toFixed(3)
        layer.style.transform = `translate3d(${translateXPercent.toFixed(2)}%, 0, 0) scale(${scale.toFixed(4)})`
      })
    },
  }
}

/**
 * Escena 3D de la ciudad: aporta al ciclo de vida genérico (`useSceneRenderer`) sus recursos, su
 * animación por fotograma y su alternativa 2D (fotogramas pre-renderizados de las cinco paradas).
 */
export function useCityRenderer({ stageRef, rendererRef, layerRefs, isEnabled, onRendererChange }) {
  const scene = useMemo(
    () => ({
      label: 'sectores',
      canvasClass: 'ov-city-canvas',
      load: loadCityScene,
      createRuntime: ({ stage, scene: loaded }) => createCityRuntime({ stage, scene: loaded }),
      stageOptions: { preset: 'scene' },
      createFallbackRenderer: () => createFramesRenderer(layerRefs),
      readFrameExtras: readAxis,
      idleFrameIntervalMs: IDLE_FRAME_INTERVAL_MS,
    }),
    [layerRefs],
  )

  return useSceneRenderer({ stageRef, rendererRef, scene, isEnabled, onRendererChange })
}
