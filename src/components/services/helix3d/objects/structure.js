import { createCylinder, createSphere, createTube, mergeGeometries } from '../../../../engine3d/primitives.js'
import { HELIX, SERVICE_COUNT, serviceState, strandPoint } from '../helixRig.js'
import { curve, groupNode, light, matrix, meshNode, segmentItem, solid } from '../../../scene3d/sceneKit.js'

/**
 * Estructura de la doble hélice: dos hilos tubulares, peldaños entre ellos, cuentas en los extremos
 * de cada peldaño y un conector luminoso desde el hilo hasta el objeto de cada servicio. Todo va
 * fusionado en pocas mallas (≈7 draw calls) y cuelga del nodo `helix`, que el renderizador gira.
 */

const MARGIN = 2.6 // altura extra por encima y por debajo de los servicios
const STRAND_SAMPLE = 0.11
const RUNG_SPACING = 0.25
const STRAND_RADIUS = 0.05
const RUNG_RADIUS = 0.016
const BEAD_RADIUS = 0.058
const NODE_RADIUS = 0.115

const top = MARGIN
const bottom = -(SERVICE_COUNT - 1) * HELIX.spacing - MARGIN

const heights = (step) => {
  const out = []
  for (let y = top; y >= bottom; y -= step) out.push(y)
  return out
}

function strandGeometry(strand, radialSegments) {
  const path = heights(STRAND_SAMPLE).map((y) => strandPoint(strand, y))
  return createTube({ path, radius: STRAND_RADIUS, radialSegments, capEnds: true })
}

export function buildStructure({ detail = 1 } = {}) {
  const radial = detail >= 1 ? 10 : 6
  const beadSegments = detail >= 1 ? [14, 8] : [8, 5]
  const rungHeights = heights(RUNG_SPACING)

  const rungs = mergeGeometries(
    rungHeights.map((y) => segmentItem(createCylinder, strandPoint(0, y), strandPoint(1, y), RUNG_RADIUS)),
  )
  const beadFor = (strand) =>
    mergeGeometries(
      rungHeights.map((y) => ({
        geometry: createSphere({ radius: BEAD_RADIUS, widthSegments: beadSegments[0], heightSegments: beadSegments[1] }),
        matrix: matrix({ translation: strandPoint(strand, y) }),
      })),
    )

  // Nodos de servicio (esferas mayores sobre su hilo) y conectores hacia los objetos
  const nodeItems = []
  const connectorItems = []
  for (let index = 0; index < SERVICE_COUNT; index += 1) {
    const { nodeLocal, objectLocal } = serviceState(index, 0)
    nodeItems.push({
      geometry: createSphere({ radius: NODE_RADIUS, widthSegments: beadSegments[0] + 4, heightSegments: beadSegments[1] + 2 }),
      matrix: matrix({ translation: nodeLocal }),
    })
    const toward = objectLocal.map((value, axis) => nodeLocal[axis] + (value - nodeLocal[axis]) * 0.62)
    const bend = [(nodeLocal[0] + toward[0]) / 2, nodeLocal[1] + 0.12, (nodeLocal[2] + toward[2]) / 2]
    connectorItems.push({
      geometry: createTube({ path: curve([nodeLocal, bend, toward], 6), radius: 0.016, radialSegments: 6, capEnds: true }),
    })
  }

  return groupNode('helix', {}, [
    meshNode('strand-a', strandGeometry(0, radial), solid('strand-a', 'emerald', { metallic: 0.35, roughness: 0.3, glow: 0.3 })),
    meshNode('strand-b', strandGeometry(1, radial), solid('strand-b', 'indigoDeep', { metallic: 0.3, roughness: 0.35, glow: 0.7 })),
    meshNode('rungs', rungs, light('rungs', 'lightGray', 0.5)),
    meshNode('beads-a', beadFor(0), solid('beads-a', 'emerald', { metallic: 0.2, roughness: 0.3, glow: 0.45 })),
    meshNode('beads-b', beadFor(1), solid('beads-b', 'indigoDeep', { metallic: 0.2, roughness: 0.3, glow: 1 })),
    meshNode('service-nodes', mergeGeometries(nodeItems), solid('service-nodes', 'lightGray', { metallic: 0.4, roughness: 0.25, glow: 0.2 })),
    meshNode('connectors', mergeGeometries(connectorItems), light('connectors', 'emerald', 0.75)),
  ])
}
