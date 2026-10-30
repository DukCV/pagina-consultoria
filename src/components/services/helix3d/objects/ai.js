import { createPlane, createSphere, createTorus, createTube } from '../../../../engine3d/primitives.js'
import { composeQuat, curve, groupNode, light, meshNode, quatX, quatY, quatZ, solid, sprite } from './common.js'

/**
 * 6 · Automatización con inteligencia artificial: el personaje 3D real (se fusiona aparte, ver
 * `model`) rodeado de nodos de datos que orbitan, conectados entre sí por anillos y enlaces luminosos.
 */
export const AI_MODEL = {
  wrapperName: 'glb-ai',
  // El personaje mide ≈2,2 de alto con los pies en el origen: se reduce y se centra
  local: { translation: [0, -0.7, 0], rotation: quatY(0), scale: 0.62 },
}

const ORBIT = { radius: 0.98, nodes: 6 }

const nodePosition = (i) => {
  const angle = (i / ORBIT.nodes) * Math.PI * 2
  return [Math.cos(angle) * ORBIT.radius, Math.sin(i * 1.7) * 0.34 + 0.05, Math.sin(angle) * ORBIT.radius]
}

export function buildAi({ textures }) {
  const dot = createSphere({ radius: 0.075, widthSegments: 16, heightSegments: 10 })
  // Tres materiales para seis nodos (se alternan los tonos) y uno solo para todos los enlaces
  const dotMaterials = ['emerald', 'indigoSoft', 'lightGray'].map((tone) => solid(`ai-dot-${tone}`, tone, { metallic: 0.3, roughness: 0.3, glow: 0.65 }))
  const linkMaterial = light('ai-link', 'emerald', 0.8)

  const nodes = Array.from({ length: ORBIT.nodes }, (_, i) =>
    meshNode(`svc5-dot-${i}`, dot, dotMaterials[i % dotMaterials.length], { translation: nodePosition(i) }),
  )
  // Cada nodo se enlaza con el siguiente por un arco de datos (todo gira junto con el grupo)
  const links = Array.from({ length: ORBIT.nodes }, (_, i) => {
    const a = nodePosition(i)
    const b = nodePosition((i + 1) % ORBIT.nodes)
    const lift = [(a[0] + b[0]) / 2 * 0.86, (a[1] + b[1]) / 2 + 0.1, (a[2] + b[2]) / 2 * 0.86]
    return meshNode(`svc5-link-${i}`, createTube({ path: curve([a, lift, b], 6), radius: 0.011, radialSegments: 6 }), linkMaterial)
  })

  return {
    model: AI_MODEL,
    children: [
      groupNode('svc5-orbit', { translation: [0, 0.02, 0] }, [...nodes, ...links]),
      meshNode('svc5-ring-a', createTorus({ radius: 0.98, tube: 0.01, radialSegments: 8, tubularSegments: 80 }), light('ai-ring-a', 'emerald', 0.7), {
        translation: [0, 0.02, 0],
        rotation: composeQuat(quatX(Math.PI / 2 - 0.5), quatZ(0.2)),
      }),
      meshNode('svc5-ring-b', createTorus({ radius: 0.98, tube: 0.01, radialSegments: 8, tubularSegments: 80 }), light('ai-ring-b', 'indigoSoft', 0.7), {
        translation: [0, 0.02, 0],
        rotation: composeQuat(quatX(Math.PI / 2 + 0.55), quatZ(-0.3)),
      }),
      meshNode('svc5-glow', createPlane({ width: 3, height: 3 }), sprite('ai-glow', textures.glow, 'indigoSoft', 0.5, { additive: true }), {
        translation: [0, 0.05, -0.6],
      }),
    ],
    animate: (time) => ({
      'svc5-orbit': { translation: [0, 0.02, 0], rotation: quatY(time * 0.32) },
      'svc5-ring-a': { translation: [0, 0.02, 0], rotation: composeQuat(quatY(-time * 0.2), quatX(Math.PI / 2 - 0.5), quatZ(0.2)) },
    }),
  }
}
