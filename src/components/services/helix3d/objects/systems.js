import { createBox, createPlane, createSphere } from '../../../../engine3d/primitives.js'
import { glass, groupNode, meshNode, quatY, screen, solid, sprite } from '../../../scene3d/sceneKit.js'

/**
 * 1 · Sistemas a la medida: un panel de control flotante con su ventana de datos, módulos de software
 * apilados (interfaces, paneles y visualización de datos).
 * El objeto cabe en una esfera de ≈0,8 de radio y mira hacia +Z.
 */
export function buildSystems({ textures }) {
  const panelSlab = createBox({ width: 1.74, height: 1.1, depth: 0.05 })
  const panelFace = createPlane({ width: 1.66, height: 1.04 })
  const smallSlab = createBox({ width: 0.96, height: 0.62, depth: 0.04 })
  const smallFace = createPlane({ width: 0.9, height: 0.56 })
  const cube = createBox({ width: 0.24, height: 0.24, depth: 0.24 })

  const dashboard = screen('systems-dashboard', textures.dashboard)
  const bars = screen('systems-bars', textures.bars)
  const slab = solid('systems-slab', 'charcoalDeep', { metallic: 0.4, roughness: 0.35 })

  return {
    children: [
      groupNode('svc0-panel', { rotation: quatY(-0.2), translation: [0.05, 0.12, 0] }, [
        meshNode('svc0-panel-slab', panelSlab, slab, { translation: [0, 0, -0.04] }),
        meshNode('svc0-panel-face', panelFace, dashboard, { translation: [0, 0, 0.005] }),
      ]),
      groupNode('svc0-window', { rotation: quatY(0.32), translation: [0.62, -0.42, 0.42] }, [
        meshNode('svc0-window-slab', smallSlab, slab, { translation: [0, 0, -0.03] }),
        meshNode('svc0-window-face', smallFace, bars, { translation: [0, 0, 0.005] }),
      ]),
      groupNode('svc0-modules', { translation: [-0.78, -0.55, 0.3] }, [
        meshNode('svc0-cube-a', cube, solid('systems-cube-a', 'charcoal', { metallic: 0.3, roughness: 0.4 }), { translation: [0, 0, 0], rotation: quatY(0.4) }),
        meshNode('svc0-cube-b', cube, solid('systems-cube-b', 'emerald', { metallic: 0.3, roughness: 0.35, glow: 0.25 }), { translation: [0.26, 0.02, 0.1], rotation: quatY(-0.3) }),
        meshNode('svc0-cube-c', cube, solid('systems-cube-c', 'indigo', { metallic: 0.3, roughness: 0.4 }), { translation: [0.1, 0.27, 0.04], rotation: quatY(0.8) }),
      ]),
      meshNode('svc0-orb', createSphere({ radius: 0.06, widthSegments: 14, heightSegments: 8 }), solid('systems-orb', 'lightGray', { glow: 0.6 }), {
        translation: [0.85, 0.5, 0.2],
      }),
      meshNode('svc0-pane-glass', createPlane({ width: 1.9, height: 1.3 }), glass('systems-glass', 'indigo', 0.18), {
        translation: [0.05, 0.12, -0.28],
        rotation: quatY(-0.2),
      }),
      meshNode('svc0-glow', createPlane({ width: 3, height: 3 }), sprite('systems-glow', textures.glow, 'emerald', 0.4, { additive: true }), {
        translation: [0, 0.05, -0.55],
      }),
    ],
    animate: () => ({}),
  }
}
