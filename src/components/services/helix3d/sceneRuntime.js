import { SERVICE_COUNT, cameraFor, helixRotation, serviceState } from './helixRig.js'
import { quatY } from '../../scene3d/sceneKit.js'

/**
 * Animación por fotograma de la escena: coloca la hélice, los servicios y sus anillos según el
 * progreso, calcula la cámara, dibuja y mueve las etiquetas DOM de los servicios secundarios.
 * No conoce React: recibe el stage ya creado y las referencias a las etiquetas.
 */

// Eje de la hélice cuando no se indica otro (los fotogramas 2D se generan con la hélice centrada)
const DEFAULT_AXIS_SCREEN_X = 0.5
const LABEL_RADIUS_WORLD = 0.72
const LABEL_MIN_OPACITY = 0.04
// Niebla suave hacia el tono del fondo de la sección: separa los planos lejanos de la hélice
const FOG = { color: [0.17, 0.16, 0.19], near: 9, far: 18 }

const rotateY = (point, angle) => {
  const sin = Math.sin(angle)
  const cos = Math.cos(angle)
  return [point[0] * cos + point[2] * sin, point[1], -point[0] * sin + point[2] * cos]
}

export function createSceneRuntime({ stage, scene, labelRefs }) {
  const projected = { x: 0, y: 0, depth: 0, visible: false }
  const servicesWithModel = scene.services.filter((service) => service.model)

  /**
   * `axisScreenX` (0‥1) es dónde queda el eje de la hélice en la escena: lo decide el CSS (`--ov-axis-x`),
   * que sabe si el texto está a la izquierda o debajo.
   * @param {{ progress: number, pointer: {x: number, y: number}, timeSec: number, width: number,
   *           height: number, dpr: number, fog: boolean, axisScreenX?: number }} frame
   */
  function update({ progress, pointer, timeSec, width, height, dpr, fog, axisScreenX = DEFAULT_AXIS_SCREEN_X }) {
    const aspect = width / height
    const camera = cameraFor(progress, {
      aspect,
      axisScreenX,
      pointer,
      distanceScale: Math.max(1, 0.95 / aspect),
    })

    const transforms = { helix: { rotation: quatY(helixRotation(progress)) } }
    const states = []
    const floating = [] // posición de cada servicio con su flotación: los modelos GLB la comparten

    for (let index = 0; index < SERVICE_COUNT; index += 1) {
      const state = serviceState(index, progress)
      states.push(state)
      const bob = Math.sin(timeSec * 0.9 + index * 1.3) * 0.035 * (0.4 + 0.6 * state.activeness)
      const translation = [state.objectWorld[0], state.objectWorld[1] + bob, state.objectWorld[2]]
      floating[index] = translation
      transforms[`svc-${index}`] = { translation, rotation: quatY(state.yawWorld), scale: state.scale }
      transforms[`halo-${index}`] = { scale: Math.max(0.0001, state.haloScale * 1.02) }
      transforms[`svc${index}-glow`] = { scale: (0.35 + 0.65 * state.activeness) * Math.max(0.0001, state.presence) }

      const { animate } = scene.services[index]
      Object.assign(transforms, animate(timeSec, state.activeness))
    }

    // Los modelos GLB cuelgan de su servicio: se colocan con la misma posición, giro y escala
    for (const { index, model } of servicesWithModel) {
      const state = states[index]
      const local = model.local
      const offset = rotateY(local.translation.map((value) => value * state.scale), state.yawWorld)
      transforms[model.wrapperName] = {
        translation: [floating[index][0] + offset[0], floating[index][1] + offset[1], floating[index][2] + offset[2]],
        rotation: composeYaw(state.yawWorld, local.rotation),
        scale: state.scale * local.scale,
      }
    }

    stage.setNodeTransforms(transforms)
    stage.renderFrame({
      timeSec,
      rx: pointer.x,
      ry: pointer.y,
      dpr,
      cssWidth: width,
      cssHeight: height,
      camera,
      fog: fog ? FOG : undefined,
    })

    placeLabels(states, camera, width, height)
  }

  function placeLabels(states, camera, width, height) {
    for (const state of states) {
      const label = labelRefs.current[state.index]
      if (!label) continue
      stage.project(state.objectWorld, projected)
      const opacity = (1 - state.activeness) ** 1.5 * state.presence ** 2
      const inside = projected.visible && projected.x > 80 && projected.x < width - 80 && projected.y > 60 && projected.y < height - 60
      if (!inside || opacity < LABEL_MIN_OPACITY) {
        label.style.visibility = 'hidden'
        continue
      }
      const pixelsPerUnit = height / (2 * Math.tan((camera.fovDeg * Math.PI) / 360) * projected.depth)
      const offsetY = LABEL_RADIUS_WORLD * state.scale * pixelsPerUnit
      label.style.visibility = 'visible'
      label.style.opacity = opacity.toFixed(3)
      label.style.transform = `translate3d(${projected.x.toFixed(1)}px, ${(projected.y + offsetY).toFixed(1)}px, 0) translate(-50%, 0)`
    }
  }

  return { update }
}

/** yaw · rotación local (ambos cuaterniones [x, y, z, w]). */
function composeYaw(yaw, local) {
  const [x1, y1, z1, w1] = quatY(yaw)
  const [x2, y2, z2, w2] = local
  return [
    w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
    w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
    w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
    w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
  ]
}
