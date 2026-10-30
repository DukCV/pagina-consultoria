import { createBox, createCylinder, createPlane, createSphere, createTube, mergeGeometries } from '../../../../engine3d/primitives.js'
import { curve, groupNode, light, matrix, meshNode, quatY, screen, solid, sprite } from './common.js'

/**
 * 2 · Infraestructura y nube: tres racks de servidores sobre una plataforma, una nube sobre ellos y
 * enlaces de datos luminosos que los conectan (servidores, redes y nube).
 */

function buildCloud() {
  // Una nube de esferas solapadas: las cuatro «cúpulas» y una base alargada
  const puffs = [
    { at: [-0.32, 0, 0], radius: 0.2 },
    { at: [-0.08, 0.11, 0.02], radius: 0.26 },
    { at: [0.2, 0.07, 0], radius: 0.24 },
    { at: [0.44, -0.02, 0.01], radius: 0.18 },
  ]
  const items = puffs.map(({ at, radius }) => ({
    geometry: createSphere({ radius, widthSegments: 20, heightSegments: 12 }),
    matrix: matrix({ translation: at }),
  }))
  items.push({
    geometry: createSphere({ radius: 0.26, widthSegments: 20, heightSegments: 12 }),
    matrix: matrix({ translation: [0.06, -0.08, 0], scale: [1.9, 0.5, 0.9] }),
  })
  return mergeGeometries(items)
}

export function buildInfrastructure({ textures }) {
  const rackBody = createBox({ width: 0.46, height: 1.02, depth: 0.46 })
  const rackFace = createPlane({ width: 0.4, height: 0.9 })
  const body = solid('infra-body', 'charcoalDeep', { metallic: 0.5, roughness: 0.3 })
  const front = screen('infra-front', textures.rack, 0.7)
  const rack = (name, translation, yaw, height = 1) =>
    groupNode(name, { translation, rotation: quatY(yaw), scale: [1, height, 1] }, [
      meshNode(`${name}-body`, rackBody, body),
      meshNode(`${name}-face`, rackFace, front, { translation: [0, 0, 0.235] }),
    ])

  const link = (name, from, to) =>
    meshNode(
      name,
      createTube({ path: curve([from, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + 0.12, (from[2] + to[2]) / 2 + 0.1], to], 8), radius: 0.013, radialSegments: 6 }),
      light('infra-link', 'emerald', 0.85),
    )

  return {
    children: [
      meshNode('svc1-platform', createCylinder({ radiusTop: 1.05, radiusBottom: 1.12, height: 0.05, radialSegments: 48 }), solid('infra-platform', 'indigo', { metallic: 0.4, roughness: 0.3, glow: 0.12 }), {
        translation: [0, -0.62, 0],
      }),
      rack('svc1-rack-left', [-0.6, -0.1, 0.05], 0.4),
      rack('svc1-rack-right', [0.6, -0.1, 0.05], -0.4),
      rack('svc1-rack-center', [0, -0.02, 0.22], 0, 1.12),
      meshNode('svc1-cloud', buildCloud(), solid('infra-cloud', 'lightGray', { metallic: 0, roughness: 0.75, glow: 0.3 }), {
        translation: [0, 0.82, 0.1],
      }),
      link('svc1-link-left', [-0.18, 0.7, 0.1], [-0.6, 0.48, 0.1]),
      link('svc1-link-center', [0, 0.62, 0.1], [0, 0.58, 0.22]),
      link('svc1-link-right', [0.22, 0.7, 0.1], [0.6, 0.48, 0.1]),
      meshNode('svc1-glow', createPlane({ width: 3, height: 3 }), sprite('infra-glow', textures.glow, 'indigo', 0.5, { additive: true }), {
        translation: [0, 0.05, -0.6],
      }),
    ],
    animate: () => ({}),
  }
}
