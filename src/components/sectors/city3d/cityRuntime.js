import { quatY } from '../../scene3d/sceneKit.js'
import { cameraAngle, cameraFor } from './cityCamera.js'
import { VEHICLES, polar } from './cityRig.js'
import { MONUMENT_SCALE, RING_ANCHOR_Y, RING_SCALE } from './logoMonument.js'

/**
 * Animación por fotograma de la ciudad: coloca la cámara orbital, gira el monumento del logotipo hacia
 * ella, mueve el foco del distrito activo y los vehículos, y dibuja. No conoce React: recibe el stage ya
 * creado (ver `useSceneRenderer`).
 */

const TWO_PI = Math.PI * 2
const MONUMENT_BOB = 0.05
// Distancia al centro a la que se coloca el foco del distrito activo
const DISTRICT_GLOW_RADIUS = 8.6
// Niebla suave hacia el tono del fondo de la sección: aleja el plano trasero de la ciudad
const FOG = { color: [0.2, 0.17, 0.19], near: 22, far: 54 }
const NO_POINTER = { x: 0, y: 0 }
// Los coches se modelan a escala de maqueta; vistos desde la cámara orbital hay que ampliarlos para que se distingan
const CAR_SCALE = 1.9

export function createCityRuntime({ stage, scene }) {
  /**
   * `progress` es el progreso de la cámara (0‥4, con decimales durante el viaje). El paralaje del cursor
   * solo se aplica en calidad completa.
   * `axisScreenX` (0‥1) es dónde queda el centro de la ciudad en la escena: lo decide el CSS (`--ov-sec-axis`).
   * @param {{ progress: number, pointer: {x: number, y: number}, timeSec: number, width: number,
   *           height: number, dpr: number, fog: boolean, level: string, axisScreenX?: number }} frame
   */
  function update({ progress, pointer, timeSec, width, height, dpr, fog, level, axisScreenX = 0.5 }) {
    const camera = cameraFor(progress, { aspect: width / height, pointer: level === 'full' ? pointer : NO_POINTER, axisScreenX })
    const angle = cameraAngle(progress)
    const [glowX, glowZ] = polar(angle, DISTRICT_GLOW_RADIUS)

    const transforms = {
      logo: { rotation: quatY(angle), scale: MONUMENT_SCALE },
      'logo-rings': {
        translation: [0, RING_ANCHOR_Y * (1 - RING_SCALE) + Math.sin(timeSec * 0.9) * MONUMENT_BOB, 0],
        rotation: quatY(Math.sin(timeSec * 0.35) * 0.12),
        scale: RING_SCALE,
      },
      'district-glow': { translation: [glowX, 0.02, glowZ] },
    }

    if (scene.hasVehicles) {
      VEHICLES.forEach(({ radius, direction, speed, phase }, index) => {
        const theta = (phase + direction * timeSec * speed) * TWO_PI
        const [x, z] = polar(theta, radius)
        transforms[`car-${index}`] = {
          translation: [x, 0, z],
          rotation: quatY(theta + (direction > 0 ? Math.PI / 2 : -Math.PI / 2)),
          scale: CAR_SCALE,
        }
      })
    }

    stage.setNodeTransforms(transforms)
    stage.renderFrame({
      timeSec,
      rx: 0,
      ry: 0,
      dpr,
      cssWidth: width,
      cssHeight: height,
      camera,
      fog: fog ? FOG : undefined,
    })
  }

  return { update }
}
