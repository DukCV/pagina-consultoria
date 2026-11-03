import { createBox, createCylinder, createSphere, mergeGeometries } from '../../engine3d/primitives.js'
import { composeQuat, matrix, meshNode, quatY } from './sceneKit.js'

/**
 * Pincel para componer escenas con volúmenes sencillos. Cada pieza se asigna a una «capa» (un material)
 * y todas las de una capa se fusionan en una sola malla: un barrio entero cuesta unas pocas llamadas de
 * dibujo, no centenares. Las cajas y cilindros se colocan por la base (`y` es el suelo de la pieza).
 *
 * `frame(origin, yaw, draw)` dibuja en coordenadas de un grupo girado y trasladado (p. ej. un lote
 * orientado hacia la calle), sin que cada pieza tenga que calcular la rotación.
 */

const UNIT_BOX = createBox({ width: 1, height: 1, depth: 1 })
const NO_ROTATION = [0, 0, 0, 1]

const rotateY = ([x, y, z], angle) => {
  const sin = Math.sin(angle)
  const cos = Math.cos(angle)
  return [x * cos + z * sin, y, -x * sin + z * cos]
}

export function createBrush({ detail = 1 } = {}) {
  const layers = new Map()
  let frame = { origin: [0, 0, 0], yaw: 0 }
  const radial = (segments) => (detail >= 1 ? segments : Math.max(6, Math.round(segments / 2)))

  const push = (layer, geometry, { translation, rotation = NO_ROTATION, scale }) => {
    if (!layers.has(layer)) layers.set(layer, [])
    const turned = rotateY(translation, frame.yaw)
    layers.get(layer).push({
      geometry,
      matrix: matrix({
        translation: turned.map((value, axis) => value + frame.origin[axis]),
        rotation: frame.yaw === 0 ? rotation : composeQuat(quatY(frame.yaw), rotation),
        scale,
      }),
    })
  }

  return {
    /** Nivel de detalle (1 = completo, 0 = reducido) para que los pintores decidan cuántos adornos añadir. */
    detail,
    /** Caja de `size` [ancho, alto, fondo] con la base en `at` = [x, y, z]; `rotation` es un cuaternión. */
    box(layer, at, size, rotation) {
      push(layer, UNIT_BOX, { translation: [at[0], at[1] + size[1] / 2, at[2]], rotation, scale: size })
    },
    /** Cilindro (o tronco de cono con `radiusTop`) con la base en `at`. */
    cylinder(layer, at, { radius, radiusTop = radius, height, segments = 14, rotation }) {
      const geometry = createCylinder({ radiusTop, radiusBottom: radius, height, radialSegments: radial(segments) })
      push(layer, geometry, { translation: [at[0], at[1] + height / 2, at[2]], rotation })
    },
    /** Esfera centrada en `at`. */
    sphere(layer, at, radius, segments = 12) {
      const widthSegments = radial(segments)
      push(layer, createSphere({ radius, widthSegments, heightSegments: Math.max(4, widthSegments / 2) }), { translation: at })
    },
    /** Geometría ya creada (engranajes…) con su transformación. */
    custom(layer, geometry, transform) {
      push(layer, geometry, transform)
    },
    /** Dibuja `draw()` en un marco girado `yaw` radianes sobre Y y desplazado a `origin`. */
    frame(origin, yaw, draw) {
      const previous = frame
      frame = { origin: rotateY(origin, previous.yaw).map((value, axis) => value + previous.origin[axis]), yaw: previous.yaw + yaw }
      draw()
      frame = previous
    },
    /** Número de vértices acumulados (para vigilar el presupuesto). */
    vertexCount() {
      let total = 0
      for (const items of layers.values()) for (const { geometry } of items) total += geometry.positions.length / 3
      return total
    },
    /** Una malla por capa usada: `materials[capa]` define el aspecto. Falla si falta algún material. */
    nodes(prefix, materials) {
      return [...layers].map(([layer, items]) => {
        if (!materials[layer]) throw new Error(`Falta el material de la capa «${layer}»`)
        return meshNode(`${prefix}-${layer}`, mergeGeometries(items), materials[layer])
      })
    },
  }
}
