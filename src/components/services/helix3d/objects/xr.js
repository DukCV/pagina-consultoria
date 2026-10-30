import { createBox, createPlane, createTorus } from '../../../../engine3d/primitives.js'
import { composeQuat, glass, groupNode, light, meshNode, quatX, quatY, solid, sprite } from './common.js'

/**
 * 5 · Realidad virtual y aumentada: el Meta Quest 3 real (se fusiona aparte, ver `model`) dentro de un
 * marco de realidad aumentada, sobre una rejilla de entorno virtual y con un holograma que gira.
 */
export const XR_MODEL = {
  wrapperName: 'glb-quest3',
  // Posición/giro/escala respecto al objeto; el Quest 3 mide ≈0,19 × 0,14 × 0,26 en su espacio
  local: { translation: [0, 0.1, 0.12], rotation: quatY(-0.28), scale: 5.2 },
}

const FRAME = { width: 1.55, height: 1.0, bar: 0.035, arm: 0.26 }

function cornerBrackets() {
  // Los ocho tramos comparten material y las dos geometrías (horizontal y vertical)
  const material = light('xr-bracket', 'emerald', 0.95)
  const geometries = {
    h: createBox({ width: FRAME.arm, height: FRAME.bar, depth: 0.02 }),
    v: createBox({ width: FRAME.bar, height: FRAME.arm, depth: 0.02 }),
  }
  const bar = (name, translation, direction) => meshNode(name, geometries[direction], material, { translation })
  const halfW = FRAME.width / 2
  const halfH = FRAME.height / 2
  const out = []
  ;[
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ].forEach(([sx, sy], i) => {
    out.push(bar(`svc4-bracket-${i}-h`, [sx * (halfW - FRAME.arm / 2), sy * halfH, 0], 'h'))
    out.push(bar(`svc4-bracket-${i}-v`, [sx * halfW, sy * (halfH - FRAME.arm / 2), 0], 'v'))
  })
  return out
}

export function buildXr({ textures }) {
  return {
    model: XR_MODEL,
    children: [
      groupNode('svc4-frame', { translation: [0, 0.1, -0.42], rotation: quatY(0.1) }, [
        meshNode('svc4-frame-glass', createPlane({ width: FRAME.width, height: FRAME.height }), glass('xr-glass', 'indigo', 0.2)),
        ...cornerBrackets(),
      ]),
      meshNode('svc4-grid', createPlane({ width: 2.3, height: 2.3 }), sprite('xr-grid', textures.grid, 'emerald', 0.6, { additive: true }), {
        translation: [0, -0.72, 0.1],
        rotation: composeQuat(quatX(-Math.PI / 2)),
      }),
      meshNode('svc4-ring', createTorus({ radius: 0.98, tube: 0.012, radialSegments: 8, tubularSegments: 80 }), light('xr-ring', 'emerald', 0.85), {
        translation: [0, -0.72, 0.1],
      }),
      meshNode('svc4-holo', createBox({ width: 0.2, height: 0.2, depth: 0.2 }), light('xr-holo', 'indigoSoft', 0.55), { translation: [0.72, 0.12, 0.34] }),
      meshNode('svc4-holo-core', createBox({ width: 0.09, height: 0.09, depth: 0.09 }), solid('xr-holo-core', 'lightGray', { glow: 0.9 }), { translation: [0.72, 0.12, 0.34] }),
      meshNode('svc4-glow', createPlane({ width: 3, height: 3 }), sprite('xr-glow', textures.glow, 'emerald', 0.4, { additive: true }), {
        translation: [0, 0.05, -0.6],
      }),
    ],
    animate: (time) => ({
      'svc4-holo': { translation: [0.72, 0.12 + Math.sin(time * 1.2) * 0.04, 0.34], rotation: composeQuat(quatY(time * 0.8), quatX(time * 0.5)) },
      'svc4-holo-core': { translation: [0.72, 0.12 + Math.sin(time * 1.2) * 0.04, 0.34], rotation: composeQuat(quatY(-time * 0.8), quatX(-time * 0.5)) },
    }),
  }
}
