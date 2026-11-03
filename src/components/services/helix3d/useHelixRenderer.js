import { useMemo } from 'react'
import { useSceneRenderer } from '../../scene3d/useSceneRenderer.js'
import { frameLayerStyle } from '../frameSequence.js'
import { loadHelixScene } from './buildHelixScene.js'
import { createSceneRuntime } from './sceneRuntime.js'

/** Posición horizontal del eje de la hélice (0‥1): la define el CSS con `--ov-axis-x`. */
function readAxis(element) {
  const value = Number.parseFloat(window.getComputedStyle(element).getPropertyValue('--ov-axis-x'))
  return { axisScreenX: Number.isFinite(value) ? value / 100 : 0.5 }
}

/** Renderizador de respaldo: mueve las capas de fotogramas pre-renderizados según el progreso. */
function createFramesRenderer(layerRefs) {
  return {
    update(progress) {
      layerRefs.current.forEach((layer, step) => {
        if (!layer) return
        const { opacity, translateYPercent, scale } = frameLayerStyle(step, progress)
        layer.style.opacity = opacity.toFixed(3)
        layer.style.transform = `translate3d(0, ${translateYPercent.toFixed(2)}%, 0) scale(${scale.toFixed(4)})`
      })
    },
  }
}

/**
 * Escena 3D de la hélice de servicios: aporta al ciclo de vida genérico (`useSceneRenderer`) sus recursos,
 * su animación por fotograma y su alternativa 2D (fotogramas pre-renderizados de la misma escena).
 */
export function useHelixRenderer({ stageRef, rendererRef, labelRefs, layerRefs, isEnabled, onRendererChange }) {
  const scene = useMemo(
    () => ({
      label: 'servicios',
      canvasClass: 'ov-svc-canvas',
      load: loadHelixScene,
      createRuntime: ({ stage, scene: loaded }) => createSceneRuntime({ stage, scene: loaded, labelRefs }),
      stageOptions: { preset: 'scene', poses: ['quest3', 'ai-character'] },
      createFallbackRenderer: () => createFramesRenderer(layerRefs),
      readFrameExtras: readAxis,
    }),
    [labelRefs, layerRefs],
  )

  return useSceneRenderer({ stageRef, rendererRef, scene, isEnabled, onRendererChange })
}
