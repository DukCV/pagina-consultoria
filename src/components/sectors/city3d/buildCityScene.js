import { createCylinder, createPlane } from '../../../engine3d/primitives.js'
import { buildSceneAsset } from '../../../engine3d/sceneAsset.js'
import { glowTexture } from '../../scene3d/panelTextures.js'
import { meshNode, quatX, screen, solid, sprite } from '../../scene3d/sceneKit.js'
import { buildCityGeometry } from './buildCityGeometry.js'
import { createCityMaterials } from './cityMaterials.js'
import { CITY, VEHICLES } from './cityRig.js'
import { buildLogoMonument } from './logoMonument.js'
import { facadeOfficeTexture, groundTexture } from './textures.js'
import { buildVehicleNodes } from './vehicles.js'

/**
 * Ensambla la escena 3D de la ciudad: el suelo con su plano de calles y las sombras de los lotes (horneadas en
 * su textura), el monumento del logotipo, los edificios y el mobiliario urbano (fusionados por material), los vehículos y el
 * foco de luz que acompaña al distrito activo. Todo procedural: no descarga ningún modelo. Solo para
 * navegador (crea texturas con canvas).
 *
 * @param {{ detail?: 0 | 1 }} options `detail: 0` usa menos segmentos y adornos y la mitad de los vehículos.
 * @returns {Promise<{ asset: object, detail: number, hasVehicles: boolean }>}
 */

const GROUND_TEXTURE_SIZE = { 1: 2048, 0: 1280 }
const DISTRICT_GLOW_SIZE = 11

function buildGround(textures, detail) {
  const { radius, thickness } = CITY
  return [
    meshNode(
      'ground-body',
      createCylinder({ radiusTop: radius, radiusBottom: radius * 0.97, height: thickness, radialSegments: detail >= 1 ? 96 : 48 }),
      solid('city-ground-body', 'charcoalDeep', { metallic: 0.3, roughness: 0.55 }),
      { translation: [0, -thickness / 2 - 0.01, 0] },
    ),
    meshNode(
      'ground-top',
      createCylinder({ radiusTop: radius, radiusBottom: radius, height: 0.02, radialSegments: detail >= 1 ? 96 : 48, capBottom: false }),
      screen('city-ground', textures.ground, 0.55),
      { translation: [0, -0.01, 0] },
    ),
  ]
}

/** Foco lima que el runtime coloca sobre el distrito al que mira la cámara. */
function buildDistrictGlow(textures) {
  return meshNode(
    'district-glow',
    createPlane({ width: DISTRICT_GLOW_SIZE, height: DISTRICT_GLOW_SIZE }),
    sprite('city-district-glow', textures.glow, 'lime', 0.14, { additive: true }),
    { translation: [0, 0.02, 0], rotation: quatX(-Math.PI / 2) },
  )
}

export async function loadCityScene({ detail = 1 } = {}) {
  const textures = {
    ground: groundTexture(GROUND_TEXTURE_SIZE[detail >= 1 ? 1 : 0]),
    facadeOffice: facadeOfficeTexture(),
    glow: glowTexture(),
  }
  const materials = createCityMaterials(textures)
  const hasVehicles = VEHICLES.length > 0

  const nodes = [
    ...buildGround(textures, detail),
    ...buildCityGeometry({ detail }).nodes('city', materials),
    buildLogoMonument({ detail, textures }),
    buildDistrictGlow(textures),
    ...(hasVehicles ? buildVehicleNodes({ detail }) : []),
  ]
  return { asset: buildSceneAsset({ nodes }), detail, hasVehicles }
}
