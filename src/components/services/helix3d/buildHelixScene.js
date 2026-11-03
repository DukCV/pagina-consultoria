import { MODEL_ASSETS } from '../../../constants/modelAssets.js'
import { loadGlbAsset } from '../../../engine3d/glbLoader.js'
import { createTorus } from '../../../engine3d/primitives.js'
import { buildSceneAsset, mergeAssets, overrideMaterials } from '../../../engine3d/sceneAsset.js'
import { SERVICE_COUNT } from './helixRig.js'
import { buildAi } from './objects/ai.js'
import { groupNode, meshNode, quatX, rgb, solid } from '../../scene3d/sceneKit.js'
import { buildInfrastructure } from './objects/infrastructure.js'
import { buildMaintenance } from './objects/maintenance.js'
import { buildStructure } from './objects/structure.js'
import { buildSystems } from './objects/systems.js'
import { buildWeb } from './objects/web.js'
import { buildXr } from './objects/xr.js'
import * as textures from '../../scene3d/panelTextures.js'

/**
 * Ensambla la escena 3D completa: estructura de la hélice, los seis objetos de servicio (cinco con
 * piezas procedurales y dos con modelos GLB reales, el Meta Quest 3 y el personaje IA) y los anillos
 * que marcan el servicio activo, todo fusionado en un único asset para un único stage WebGL.
 *
 * Solo para navegador: crea texturas con canvas y descarga los GLB (que comparten caché con el hero).
 */

const SERVICE_BUILDERS = [buildSystems, buildInfrastructure, buildWeb, buildMaintenance, buildXr, buildAi]

// El Quest 3 del recurso es casi blanco: se lleva a la paleta (carcasa gris claro, correa y mandos carbón)
const QUEST3_TINT = {
  MQ3_OuterShell: { baseColorFactor: [...rgb('lightGray'), 1], roughnessFactor: 0.38 },
  MQ3_FabricStrap: { baseColorFactor: [...rgb('charcoal'), 1] },
  MQ3_TouchPlusControllers: { baseColorFactor: [...rgb('charcoal').map((c) => c * 1.25), 1] },
}

function createTextures() {
  return {
    dashboard: textures.dashboardTexture(),
    bars: textures.barsTexture(),
    rack: textures.rackTexture(),
    browser: textures.browserTexture(),
    phone: textures.phoneTexture(),
    grid: textures.gridTexture(),
    modules: textures.modulesTexture(),
    glow: textures.glowTexture(),
  }
}

/** Anillo lima que rodea al servicio activo (indicador de protagonista). */
function haloNode(index) {
  return meshNode(
    `halo-${index}`,
    createTorus({ radius: 1, tube: 0.02, radialSegments: 10, tubularSegments: 96 }),
    solid('halo', 'lime', { metallic: 0, roughness: 0.6, glow: 0.22 }),
    { rotation: quatX(Math.PI / 2), scale: 0.0001 },
  )
}

/**
 * @param {{ detail?: 0 | 1 }} options `detail: 0` usa geometría más ligera (nivel `balanced`).
 * @returns {Promise<{ asset: object, services: Array<{ index: number, animate: Function, model: object | null }> }>}
 */
export async function loadHelixScene({ detail = 1 } = {}) {
  const sceneTextures = createTextures()

  const services = SERVICE_BUILDERS.map((build, index) => {
    const built = build({ textures: sceneTextures })
    return {
      index,
      animate: built.animate,
      model: built.model ?? null,
      node: groupNode(`svc-${index}`, {}, [...built.children, haloNode(index)]),
    }
  })

  const procedural = buildSceneAsset({ nodes: [buildStructure({ detail }), ...services.map((service) => service.node)] })

  const [quest3, aiCharacter] = await Promise.all([
    loadGlbAsset(MODEL_ASSETS.quest3.glbUrl, { priority: 'high' }),
    loadGlbAsset(MODEL_ASSETS.aiCharacter.glbUrl, { priority: 'high' }),
  ])

  const parts = [{ asset: procedural, wrapperName: 'scene-root' }]
  for (const service of services) {
    if (!service.model) continue
    const source = service.index === 4 ? overrideMaterials(quest3, QUEST3_TINT) : aiCharacter
    parts.push({ asset: source, wrapperName: service.model.wrapperName })
  }
  const { asset } = mergeAssets(parts)

  if (services.length !== SERVICE_COUNT) throw new Error('La escena debe definir los seis servicios')
  return { asset, services: services.map(({ index, animate, model }) => ({ index, animate, model })) }
}
