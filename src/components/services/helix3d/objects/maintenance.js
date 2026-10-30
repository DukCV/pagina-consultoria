import { createBox, createCylinder, createGear, createPlane, createTorus } from '../../../../engine3d/primitives.js'
import { composeQuat, groupNode, light, meshNode, quatX, quatY, screen, solid, sprite } from './common.js'

/**
 * 4 · Mantenimiento y actualización: una plataforma en tres capas separadas (interfaz, módulos y
 * motor) unidas por pilares de energía, engranajes que giran y módulos nuevos que entran en órbita
 * (componentes, módulos conectados y evolución).
 */
const SLAB = { width: 1.3, depth: 1.3, height: 0.06 }
const LAYERS = [0.58, 0.1, -0.38]
const ORBIT_RADIUS = 0.98
const ORBIT_MODULES = 3

export function buildMaintenance({ textures }) {
  const slabGeometry = createBox({ width: SLAB.width, height: SLAB.height, depth: SLAB.depth })
  const moduleGeometry = createBox({ width: 0.15, height: 0.15, depth: 0.15 })
  const pillar = createCylinder({ radiusTop: 0.015, radiusBottom: 0.015, height: LAYERS[0] - LAYERS[2], radialSegments: 8 })
  const corner = (SLAB.width / 2) * 0.84
  const diamond = quatY(Math.PI / 4)
  const pillarMaterial = light('maint-pillar', 'emerald', 0.75)

  const modules = Array.from({ length: ORBIT_MODULES }, (_, i) =>
    meshNode(
      `svc3-module-${i}`,
      moduleGeometry,
      solid(`maint-module-${i}`, ['emerald', 'indigoSoft', 'lightGray'][i], { metallic: 0.3, roughness: 0.35, glow: 0.35 }),
      { translation: [ORBIT_RADIUS, LAYERS[1], 0] },
    ),
  )

  return {
    children: [
      groupNode('svc3-tilt', { rotation: composeQuat(quatX(0.42)) }, [
        meshNode('svc3-slab-top', slabGeometry, solid('maint-top', 'indigo', { metallic: 0.4, roughness: 0.3 }), { translation: [0, LAYERS[0], 0], rotation: diamond }),
        meshNode(
          'svc3-top-face',
          createPlane({ width: 1.2, height: 1.2 }),
          screen('maint-modules', textures.modules, 0.7),
          { translation: [0, LAYERS[0] + 0.032, 0], rotation: composeQuat(quatY(Math.PI / 4), quatX(-Math.PI / 2)) },
        ),
        meshNode('svc3-slab-mid', slabGeometry, solid('maint-mid', 'charcoal', { metallic: 0.4, roughness: 0.35 }), { translation: [0, LAYERS[1], 0], rotation: diamond }),
        meshNode('svc3-slab-bottom', slabGeometry, solid('maint-bottom', 'charcoalDeep', { metallic: 0.5, roughness: 0.3, glow: 0.05 }), { translation: [0, LAYERS[2], 0], rotation: diamond }),
        meshNode('svc3-ring', createTorus({ radius: 0.78, tube: 0.012, radialSegments: 8, tubularSegments: 72 }), light('maint-ring', 'emerald', 0.8), { translation: [0, LAYERS[2] + 0.04, 0] }),
        ...[
          [corner, 0],
          [-corner, 0],
          [0, corner],
          [0, -corner],
        ].map(([x, z], i) =>
          meshNode(`svc3-pillar-${i}`, pillar, pillarMaterial, { translation: [x, (LAYERS[0] + LAYERS[2]) / 2, z] }),
        ),
        meshNode('svc3-gear-a', createGear({ teeth: 14, outerRadius: 0.36, thickness: 0.09, boreRadius: 0.07 }), solid('maint-gear-a', 'lightGray', { metallic: 0.75, roughness: 0.3 }), { translation: [-0.1, (LAYERS[1] + LAYERS[2]) / 2 + 0.02, 0] }),
        meshNode('svc3-gear-b', createGear({ teeth: 10, outerRadius: 0.25, thickness: 0.09, boreRadius: 0.05 }), solid('maint-gear-b', 'emerald', { metallic: 0.6, roughness: 0.3, glow: 0.2 }), { translation: [0.38, (LAYERS[1] + LAYERS[2]) / 2 + 0.02, 0.05] }),
        ...modules,
      ]),
      meshNode('svc3-glow', createPlane({ width: 3, height: 3 }), sprite('maint-glow', textures.glow, 'emerald', 0.34, { additive: true }), { translation: [0, 0.05, -0.6] }),
    ],
    // Los engranajes engranan en sentidos opuestos; los módulos orbitan despacio alrededor de la plataforma
    animate: (time) => {
      const out = {
        'svc3-gear-a': { rotation: quatY(time * 0.5) },
        'svc3-gear-b': { rotation: quatY(-time * 0.7 + 0.2) },
      }
      for (let i = 0; i < ORBIT_MODULES; i += 1) {
        const angle = time * 0.35 + (i * Math.PI * 2) / ORBIT_MODULES
        out[`svc3-module-${i}`] = {
          translation: [Math.cos(angle) * ORBIT_RADIUS, LAYERS[1] + Math.sin(angle * 2) * 0.05, Math.sin(angle) * ORBIT_RADIUS],
          rotation: quatY(angle * 2),
        }
      }
      return out
    },
  }
}
