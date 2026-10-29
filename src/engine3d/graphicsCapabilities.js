/**
 * Detección de capacidades gráficas basada en señales reales, no en el tipo de dispositivo:
 *  - disponibilidad de WebGL2 y de un contexto sin «major performance caveat» (render por software),
 *  - nombre del renderizador cuando el navegador lo expone,
 *  - límites de textura de la GPU,
 *  - pistas coarse de memoria, núcleos y red (solo para elegir el nivel inicial, nunca para bloquear).
 * El resultado se calcula una sola vez y se reutiliza.
 */

// Rasterizadores por software: técnicamente «funcionan», pero llevan el hero a <5 fps
const SOFTWARE_RENDERER_PATTERN = /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i

const MIN_TEXTURE_SIZE = 2048
const LOW_END_MEMORY_GB = 2
const LOW_END_CORES = 2
const CONSTRAINED_CONNECTIONS = new Set(['slow-2g', '2g'])
const MODERATE_CONNECTIONS = new Set(['3g'])

let cachedCapabilities = null

function readNetwork() {
  const connection =
    typeof navigator !== 'undefined'
      ? navigator.connection || navigator.mozConnection || navigator.webkitConnection
      : null
  const saveData = Boolean(connection?.saveData)
  const effectiveType = connection?.effectiveType ?? null

  let tier = 'fast'
  if (saveData || CONSTRAINED_CONNECTIONS.has(effectiveType)) tier = 'constrained'
  else if (MODERATE_CONNECTIONS.has(effectiveType)) tier = 'moderate'

  return { saveData, effectiveType, tier }
}

function createProbeContext(attributes) {
  try {
    const canvas = document.createElement('canvas')
    return canvas.getContext('webgl2', {
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'default',
      ...attributes,
    })
  } catch {
    return null
  }
}

function readRendererName(gl) {
  try {
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
  } catch {
    return ''
  }
}

function probeWebGL() {
  if (typeof document === 'undefined') {
    return { webgl2: false, reason: 'no-dom' }
  }

  // Con failIfMajorPerformanceCaveat el navegador rechaza el contexto si solo dispone de render por software
  const gl = createProbeContext({ failIfMajorPerformanceCaveat: true })
  if (!gl) {
    const permissive = createProbeContext({ failIfMajorPerformanceCaveat: false })
    if (!permissive) return { webgl2: false, reason: 'webgl2-unavailable' }
    const rendererName = readRendererName(permissive)
    permissive.getExtension('WEBGL_lose_context')?.loseContext()
    return { webgl2: true, softwareRenderer: true, rendererName, reason: 'software-renderer' }
  }

  const rendererName = readRendererName(gl)
  const result = {
    webgl2: true,
    softwareRenderer: SOFTWARE_RENDERER_PATTERN.test(rendererName),
    rendererName,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    parallelShaderCompile: Boolean(gl.getExtension('KHR_parallel_shader_compile')),
  }
  // Libera el contexto de sondeo de inmediato para no consumir uno de los ~16 que admite el navegador
  gl.getExtension('WEBGL_lose_context')?.loseContext()
  return result
}

/**
 * Decisión pura a partir de las señales medidas (sin acceso al DOM, por lo que es verificable
 * con datos sintéticos). Nunca consulta el tipo de dispositivo: un teléfono con buena GPU obtiene
 * 3D y un equipo de escritorio con render por software no.
 *
 * @returns {{
 *   canRender3D: boolean,
 *   startLevel: 'full' | 'balanced' | 'static',
 *   reason: string,
 *   network: { tier: string, saveData: boolean, effectiveType: string | null },
 *   webgl2: boolean, softwareRenderer: boolean, rendererName: string,
 *   maxTextureSize: number, parallelShaderCompile: boolean,
 *   deviceMemoryGb: number | null, cpuCores: number | null,
 * }}
 */
export function evaluateCapabilities({ probe, network, deviceMemoryGb, cpuCores }) {
  let reason = 'ok'
  let canRender3D = true
  if (!probe.webgl2) {
    canRender3D = false
    reason = probe.reason
  } else if (probe.softwareRenderer) {
    canRender3D = false
    reason = 'software-renderer'
  } else if ((probe.maxTextureSize ?? 0) < MIN_TEXTURE_SIZE) {
    canRender3D = false
    reason = 'low-texture-limit'
  } else if (network.tier === 'constrained') {
    // La GPU puede, pero descargar los GLB con ahorro de datos o 2G no compensa
    canRender3D = false
    reason = network.saveData ? 'save-data' : 'slow-network'
  }

  const isLowEnd =
    (deviceMemoryGb !== null && deviceMemoryGb <= LOW_END_MEMORY_GB) ||
    (cpuCores !== null && cpuCores <= LOW_END_CORES)

  let startLevel = 'full'
  if (!canRender3D) startLevel = 'static'
  else if (isLowEnd) startLevel = 'balanced'

  return {
    canRender3D,
    startLevel,
    reason: canRender3D && isLowEnd ? 'low-end-hints' : reason,
    network,
    webgl2: Boolean(probe.webgl2),
    softwareRenderer: Boolean(probe.softwareRenderer),
    rendererName: probe.rendererName ?? '',
    maxTextureSize: probe.maxTextureSize ?? 0,
    parallelShaderCompile: Boolean(probe.parallelShaderCompile),
    deviceMemoryGb,
    cpuCores,
  }
}

/** Mide las capacidades del dispositivo actual (una sola vez) y devuelve el veredicto. */
export function detectGraphicsCapabilities() {
  if (cachedCapabilities) return cachedCapabilities

  cachedCapabilities = evaluateCapabilities({
    probe: probeWebGL(),
    network: readNetwork(),
    deviceMemoryGb: typeof navigator !== 'undefined' ? (navigator.deviceMemory ?? null) : null,
    cpuCores: typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? null) : null,
  })
  return cachedCapabilities
}
