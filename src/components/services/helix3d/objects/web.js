import { createBox, createCylinder, createPlane, createSphere } from '../../../../engine3d/primitives.js'
import { eulerQuat, glass, groupNode, meshNode, quatY, screen, solid, sprite } from '../../../scene3d/sceneKit.js'

/**
 * 3 · Diseño y desarrollo web: un monitor con una página, un teléfono con su versión adaptada y una
 * ventana flotante de datos (dispositivos, interfaces web y ventanas en profundidad).
 */
export function buildWeb({ textures }) {
  const slab = solid('web-slab', 'charcoalDeep', { metallic: 0.45, roughness: 0.3 })
  const metal = solid('web-metal', 'lightGray', { metallic: 0.7, roughness: 0.3 })

  return {
    children: [
      groupNode('svc2-monitor', { translation: [-0.05, 0.12, 0], rotation: quatY(-0.16) }, [
        meshNode('svc2-monitor-frame', createBox({ width: 1.62, height: 1.02, depth: 0.06 }), slab, { translation: [0, 0, -0.04] }),
        meshNode('svc2-monitor-face', createPlane({ width: 1.54, height: 0.96 }), screen('web-browser', textures.browser), { translation: [0, 0, 0.005] }),
        meshNode('svc2-monitor-neck', createCylinder({ radiusTop: 0.05, radiusBottom: 0.07, height: 0.36, radialSegments: 16 }), metal, { translation: [0, -0.7, -0.05] }),
        meshNode('svc2-monitor-base', createCylinder({ radiusTop: 0.34, radiusBottom: 0.38, height: 0.04, radialSegments: 32 }), metal, { translation: [0, -0.9, -0.03] }),
      ]),
      groupNode('svc2-phone', { translation: [0.78, -0.22, 0.46], rotation: eulerQuat(0, -0.34, 0.06) }, [
        meshNode('svc2-phone-body', createBox({ width: 0.36, height: 0.72, depth: 0.045 }), slab, { translation: [0, 0, -0.025] }),
        meshNode('svc2-phone-face', createPlane({ width: 0.32, height: 0.66 }), screen('web-phone', textures.phone, 0.8), { translation: [0, 0, 0.003] }),
      ]),
      groupNode('svc2-window', { translation: [-0.82, 0.62, 0.4], rotation: quatY(0.34) }, [
        meshNode('svc2-window-slab', createBox({ width: 0.74, height: 0.48, depth: 0.03 }), slab, { translation: [0, 0, -0.02] }),
        meshNode('svc2-window-face', createPlane({ width: 0.7, height: 0.44 }), screen('web-bars', textures.bars, 0.8), { translation: [0, 0, 0.003] }),
      ]),
      meshNode('svc2-dot-a', createSphere({ radius: 0.05, widthSegments: 12, heightSegments: 8 }), solid('web-dot-a', 'emerald', { glow: 0.7 }), { translation: [0.92, 0.5, 0.2] }),
      meshNode('svc2-dot-b', createSphere({ radius: 0.035, widthSegments: 12, heightSegments: 8 }), solid('web-dot-b', 'lightGray', { glow: 0.6 }), { translation: [-0.95, -0.2, 0.3] }),
      meshNode('svc2-pane', createPlane({ width: 1.95, height: 1.35 }), glass('web-glass', 'indigo', 0.16), { translation: [-0.05, 0.12, -0.3], rotation: quatY(-0.16) }),
      meshNode('svc2-glow', createPlane({ width: 3, height: 3 }), sprite('web-glow', textures.glow, 'emerald', 0.38, { additive: true }), { translation: [0, 0.05, -0.55] }),
    ],
    animate: () => ({}),
  }
}
