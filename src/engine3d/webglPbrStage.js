import {
  mat4Create,
  mat4FromTRS,
  mat4LookAt,
  mat4Multiply,
  mat4Perspective,
  mat4TransformPoint,
  quatFromEulerXYZ,
  quatMultiply,
  quatNormalize,
} from './math3d'

const MAX_JOINTS = 32
// Poses por nombre de nodo que `applyPoseAnimations` sabe aplicar (opción `poses` del stage)
const POSE_KINDS = ['quest3', 'ai-character']

const VERTEX_SHADER_SRC = `#version 300 es
precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;
layout(location = 3) in vec4 a_joints;
layout(location = 4) in vec4 a_weights;

uniform mat4 u_viewProj;
uniform mat4 u_model;
uniform bool u_hasSkin;
uniform mat4 u_joints[${MAX_JOINTS}];
// Solo el preset 'scene': con escala no uniforme mat3(worldMat) deforma las normales
uniform bool u_exactNormals;

out vec3 v_worldPos;
out vec3 v_normal;
out vec2 v_uv;

void main() {
  mat4 worldMat = u_model;
  if (u_hasSkin) {
    int j0 = clamp(int(a_joints.x + 0.5), 0, ${MAX_JOINTS - 1});
    int j1 = clamp(int(a_joints.y + 0.5), 0, ${MAX_JOINTS - 1});
    int j2 = clamp(int(a_joints.z + 0.5), 0, ${MAX_JOINTS - 1});
    int j3 = clamp(int(a_joints.w + 0.5), 0, ${MAX_JOINTS - 1});

    mat4 skinMat =
      a_weights.x * u_joints[j0] +
      a_weights.y * u_joints[j1] +
      a_weights.z * u_joints[j2] +
      a_weights.w * u_joints[j3];

    worldMat = u_model * skinMat;
  }

  vec4 wp = worldMat * vec4(a_position, 1.0);
  v_worldPos = wp.xyz;
  if (u_exactNormals) {
    // Inversa traspuesta por cofactores (columnas = productos cruzados de las otras dos)
    mat3 m = mat3(worldMat);
    v_normal = normalize(mat3(cross(m[1], m[2]), cross(m[2], m[0]), cross(m[0], m[1])) * a_normal);
  } else {
    v_normal = normalize(mat3(worldMat) * a_normal);
  }
  v_uv = a_uv;
  gl_Position = u_viewProj * wp;
}
`

const FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;

in vec3 v_worldPos;
in vec3 v_normal;
in vec2 v_uv;

uniform vec3 u_camPos;
uniform vec4 u_baseColorFactor;
uniform float u_metallicFactor;
uniform float u_roughnessFactor;
uniform vec3 u_emissiveFactor;
uniform float u_occlusionStrength;

uniform bool u_hasBaseColorTex;
uniform bool u_hasMrTex;
uniform bool u_hasEmissiveTex;

// Niebla lineal en espacio sRGB (solo si el llamador pasa «fog» a renderFrame)
uniform bool u_fogOn;
uniform vec3 u_fogColor;
uniform vec2 u_fogRange;

uniform sampler2D u_baseColorTex;
uniform sampler2D u_mrTex;
uniform sampler2D u_emissiveTex;

out vec4 outColor;

const float PI = 3.14159265359;

vec3 srgbToLinear(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(2.2));
}

vec3 linearToSrgb(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
}

float distributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float NdotH2 = NdotH * NdotH;
  float denom = NdotH2 * (a2 - 1.0) + 1.0;
  return a2 / max(PI * denom * denom, 0.0001);
}

float geometrySchlickGGX(float NdotV, float roughness) {
  float r = roughness + 1.0;
  float k = (r * r) / 8.0;
  return NdotV / max(NdotV * (1.0 - k) + k, 0.0001);
}

float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  return geometrySchlickGGX(max(dot(N, V), 0.0), roughness) *
         geometrySchlickGGX(max(dot(N, L), 0.0), roughness);
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 evalDirectLight(
  vec3 Ldir,
  vec3 radiance,
  vec3 N,
  vec3 V,
  vec3 albedo,
  float metallic,
  float roughness,
  vec3 F0
) {
  vec3 L = normalize(Ldir);
  vec3 H = normalize(V + L);
  float NdotL = max(dot(N, L), 0.0);
  if (NdotL <= 0.0) return vec3(0.0);

  float NdotV = max(dot(N, V), 0.001);
  float D = distributionGGX(N, H, roughness);
  float G = geometrySmith(N, V, L, roughness);
  vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

  vec3 spec = (D * G * F) / max(4.0 * NdotV * NdotL, 0.001);
  vec3 kD = (vec3(1.0) - F) * (1.0 - metallic);
  return (kD * albedo / PI + spec) * radiance * NdotL;
}

vec3 acesToneMap(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec4 baseSample = vec4(1.0);
  if (u_hasBaseColorTex) {
    vec4 tex = texture(u_baseColorTex, v_uv);
    baseSample = vec4(srgbToLinear(tex.rgb), tex.a);
  }
  vec4 baseColor = baseSample * vec4(srgbToLinear(u_baseColorFactor.rgb), u_baseColorFactor.a);

  float roughness = u_roughnessFactor;
  float metallic = u_metallicFactor;
  float ao = 1.0;

  if (u_hasMrTex) {
    vec4 mr = texture(u_mrTex, v_uv);
    ao = mix(1.0, mr.r, u_occlusionStrength);
    roughness *= mr.g;
    metallic *= mr.b;
  }
  roughness = clamp(roughness, 0.055, 1.0);
  metallic = clamp(metallic, 0.0, 1.0);

  vec3 N = normalize(gl_FrontFacing ? v_normal : -v_normal);
  vec3 V = normalize(u_camPos - v_worldPos);
  float NdotV = max(dot(N, V), 0.001);

  vec3 albedo = baseColor.rgb;
  vec3 F0 = mix(vec3(0.04), albedo, metallic);

  // Iluminación de estudio de 4 fuentes calibrada a la paleta de Overlayer
  vec3 Lo = vec3(0.0);
  // 1. Luz principal suave de estudio (#DADDD8 / luz diurna cálida)
  Lo += evalDirectLight(vec3(-0.52, 0.68, 0.86), vec3(2.35, 2.34, 2.28), N, V, albedo, metallic, roughness, F0);
  // 2. Luz de recorte / contraluz tecnológica en Verde Esmeralda (#419D78)
  Lo += evalDirectLight(vec3(0.84, 0.36, -0.62), vec3(0.28, 1.38, 0.86), N, V, albedo, metallic, roughness, F0);
  // 3. Luz de relleno profunda en Azul Índigo (#434371) para volumen en sombras
  Lo += evalDirectLight(vec3(-0.82, -0.14, 0.38), vec3(0.42, 0.44, 0.95), N, V, albedo, metallic, roughness, F0);
  // 4. Luz cenital de definición con matiz lima sutil (#B5F44A / #DADDD8)
  Lo += evalDirectLight(vec3(0.18, 0.96, 0.28), vec3(0.76, 0.88, 0.66), N, V, albedo, metallic, roughness, F0);

  // Irradiancia hemisférica ambiental + reflejo especular analítico de softbox de estudio
  float hemi = N.y * 0.5 + 0.5;
  vec3 skyAmb = vec3(0.30, 0.32, 0.42);
  vec3 groundAmb = vec3(0.11, 0.09, 0.10);
  vec3 irradiance = mix(groundAmb, skyAmb, hemi);

  vec3 Fenv = fresnelSchlick(NdotV, F0);
  vec3 kDenv = (vec3(1.0) - Fenv) * (1.0 - metallic);
  vec3 diffuseAmb = kDenv * albedo * irradiance;

  vec3 R = reflect(-V, N);
  float softboxBand = smoothstep(-0.15, 0.65, R.y) * (0.55 + 0.45 * smoothstep(-0.4, 0.8, R.z));
  float emeraldRimEnv = pow(clamp(1.0 - NdotV, 0.0, 1.0), 3.2) * smoothstep(-0.3, 0.6, R.x);
  vec3 envSpecColor =
    mix(vec3(0.08, 0.08, 0.14), vec3(0.85, 0.88, 0.86), softboxBand) +
    vec3(0.08, 0.38, 0.26) * emeraldRimEnv;
  float gloss = (1.0 - roughness) * (1.0 - roughness);
  vec3 specAmb = envSpecColor * Fenv * (0.22 + 0.95 * gloss);

  vec3 emissive = vec3(0.0);
  if (u_hasEmissiveTex) {
    emissive = srgbToLinear(texture(u_emissiveTex, v_uv).rgb) * u_emissiveFactor * 1.45;
  } else {
    // Emisivo plano (sin textura): misma intensidad que con textura
    emissive = u_emissiveFactor * 1.45;
  }

  vec3 color = (diffuseAmb + specAmb) * ao + Lo + emissive;
  color = acesToneMap(color);
  color = linearToSrgb(color);

  if (u_fogOn) {
    float fogAmount = clamp(
      (length(u_camPos - v_worldPos) - u_fogRange.x) / max(u_fogRange.y - u_fogRange.x, 0.0001),
      0.0,
      1.0
    );
    color = mix(color, u_fogColor, fogAmount);
  }

  float alpha = clamp(baseColor.a, 0.0, 1.0);
  outColor = vec4(color * alpha, alpha);
}
`

/**
 * Inicia la compilación y el enlazado SIN consultar su estado, para que el navegador pueda
 * hacerlo en paralelo (KHR_parallel_shader_compile) en lugar de bloquear el hilo principal.
 */
function beginProgramCompile(gl, vsSrc, fsSrc) {
  const vs = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vs, vsSrc)
  gl.compileShader(vs)

  const fs = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fs, fsSrc)
  gl.compileShader(fs)

  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  return { program, vs, fs }
}

/** Valida el enlazado (solo cuando ya terminó) y libera los shaders intermedios. */
function finishProgramCompile(gl, { program, vs, fs }) {
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS)
  const log = linked
    ? ''
    : `${gl.getProgramInfoLog(program)} ${gl.getShaderInfoLog(vs)} ${gl.getShaderInfoLog(fs)}`
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!linked) {
    gl.deleteProgram(program)
    throw new Error(`Error enlazando programa WebGL2: ${log.trim()}`)
  }
  return program
}

const UNIFORM_NAMES = {
  viewProj: 'u_viewProj',
  model: 'u_model',
  hasSkin: 'u_hasSkin',
  joints: 'u_joints[0]',
  camPos: 'u_camPos',
  baseColorFactor: 'u_baseColorFactor',
  metallicFactor: 'u_metallicFactor',
  roughnessFactor: 'u_roughnessFactor',
  emissiveFactor: 'u_emissiveFactor',
  occlusionStrength: 'u_occlusionStrength',
  hasBaseColorTex: 'u_hasBaseColorTex',
  hasMrTex: 'u_hasMrTex',
  hasEmissiveTex: 'u_hasEmissiveTex',
  baseColorTex: 'u_baseColorTex',
  mrTex: 'u_mrTex',
  emissiveTex: 'u_emissiveTex',
  exactNormals: 'u_exactNormals',
  fogOn: 'u_fogOn',
  fogColor: 'u_fogColor',
  fogRange: 'u_fogRange',
}

/** Centro de la caja delimitadora (min/max del accesor POSITION) para ordenar la pasada translúcida. */
function localBoundsCenter(positionAccessor) {
  const { min, max } = positionAccessor ?? {}
  if (!min || !max) return new Float32Array(3)
  return new Float32Array([(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2])
}

const DEFAULT_BASE_COLOR = [1, 1, 1, 1]
const DEFAULT_EMISSIVE = [0, 0, 0]
const IDENTITY_MATRIX = mat4Create()
// La niebla aditiva se desvanece hacia negro: sumar el color de la niebla iluminaría el fondo
const BLACK = new Float32Array(3)

/**
 * Instancia aislada de escena WebGL2 para renderizar modelos glTF 2.0 PBR
 * con soporte de jerarquía de nodos, skinning por GPU y liberación determinista.
 *
 * La compilación del shader es asíncrona: hay que esperar a que `pollReady()` devuelva true
 * antes de llamar a `renderFrame()` (que, hasta entonces, no hace nada).
 *
 * Opciones:
 * - `preset`: 'quest3' | 'ai-character' (visores del hero: cámara, giro con el puntero y pose propios)
 *   o 'scene' (escena compuesta: sin giro por puntero, cámara explícita en `renderFrame`, normales
 *   exactas con escala no uniforme).
 * - `poses`: presets cuyas poses por nombre de nodo se aplican (por defecto, solo el del `preset`).
 *   Permite animar a la vez un Quest 3 y el personaje en un mismo asset fusionado.
 */
export function createWebGLPbrStage(canvas, asset, options = {}) {
  const { preset = 'quest3', preserveDrawingBuffer = false, antialias = true, poses } = options
  const isScene = preset === 'scene'
  const poseKinds = poses ?? (POSE_KINDS.includes(preset) ? [preset] : [])
  const unknownPose = poseKinds.find((kind) => !POSE_KINDS.includes(kind))
  if (unknownPose !== undefined) {
    throw new Error(`Pose desconocida «${unknownPose}» (disponibles: ${POSE_KINDS.join(', ')})`)
  }

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    // «default» evita forzar la GPU discreta (y su consumo) para un modelo de tamaño reducido
    powerPreference: 'default',
    preserveDrawingBuffer,
  })

  if (!gl) {
    throw new Error('Contexto WebGL2 no disponible')
  }

  const { gltf, binChunk, decodedImages } = asset
  const pendingProgram = beginProgramCompile(gl, VERTEX_SHADER_SRC, FRAGMENT_SHADER_SRC)
  const parallelCompileExt = gl.getExtension('KHR_parallel_shader_compile')

  let program = null
  let uniforms = null
  let isReady = false
  let lastViewportW = 0
  let lastViewportH = 0

  /** Devuelve true cuando el programa está enlazado y listo; lanza si el enlazado falló. */
  function pollReady() {
    if (isReady) return true
    if (
      parallelCompileExt &&
      !gl.getProgramParameter(pendingProgram.program, parallelCompileExt.COMPLETION_STATUS_KHR)
    ) {
      return false
    }

    program = finishProgramCompile(gl, pendingProgram)
    uniforms = {}
    for (const [key, name] of Object.entries(UNIFORM_NAMES)) {
      uniforms[key] = gl.getUniformLocation(program, name)
    }

    // Estado global constante: se fija una sola vez en lugar de en cada fotograma
    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)
    gl.useProgram(program)
    gl.uniform1i(uniforms.baseColorTex, 0)
    gl.uniform1i(uniforms.mrTex, 1)
    gl.uniform1i(uniforms.emissiveTex, 2)
    if (isScene) gl.uniform1i(uniforms.exactNormals, 1)

    isReady = true
    return true
  }

  const gpuBuffers = []
  const gpuTextures = []
  const gpuVaos = []

  // Subir texturas decodificadas a GPU con mipmaps trilineales
  const glTextures = (gltf.textures || []).map((texDef) => {
    const img = decodedImages[texDef.source]
    const tex = gl.createTexture()
    gpuTextures.push(tex)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    return tex
  })

  // Materiales resueltos una sola vez: evita asignaciones y búsquedas por primitiva en cada fotograma
  const textureOrNull = (textureInfo) => glTextures[textureInfo?.index] ?? null
  const compiledMaterials = (gltf.materials || []).map((matDef) => {
    const pbr = matDef.pbrMetallicRoughness || {}
    const blend = matDef.alphaMode === 'BLEND'
    return {
      baseColorFactor: pbr.baseColorFactor || DEFAULT_BASE_COLOR,
      metallicFactor: pbr.metallicFactor ?? 0.0,
      roughnessFactor: pbr.roughnessFactor ?? 0.5,
      emissiveFactor: matDef.emissiveFactor || DEFAULT_EMISSIVE,
      occlusionStrength: matDef.occlusionTexture?.strength ?? 1.0,
      baseColorTexture: textureOrNull(pbr.baseColorTexture),
      metallicRoughnessTexture: textureOrNull(pbr.metallicRoughnessTexture),
      emissiveTexture: textureOrNull(matDef.emissiveTexture),
      blend,
      additive: blend && matDef.extras?.additive === true,
      doubleSided: matDef.doubleSided === true,
    }
  })
  const fallbackMaterial = {
    baseColorFactor: DEFAULT_BASE_COLOR,
    metallicFactor: 0.0,
    roughnessFactor: 0.5,
    emissiveFactor: DEFAULT_EMISSIVE,
    occlusionStrength: 1.0,
    baseColorTexture: null,
    metallicRoughnessTexture: null,
    emissiveTexture: null,
    blend: false,
    additive: false,
    doubleSided: false,
  }

  // Subir bufferViews de geometría bajo demanda
  const bufferByView = new Map()
  function getGlBufferForAccessor(acc, target) {
    const bvIdx = acc.bufferView
    if (bufferByView.has(bvIdx)) return bufferByView.get(bvIdx)
    const bv = gltf.bufferViews[bvIdx]
    const slice = binChunk.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength)
    const buf = gl.createBuffer()
    gpuBuffers.push(buf)
    gl.bindBuffer(target, buf)
    gl.bufferData(target, slice, gl.STATIC_DRAW)
    bufferByView.set(bvIdx, buf)
    return buf
  }

  function bindAttribute(attrName, loc, primAttrs, size, defaultVals) {
    const accIdx = primAttrs[attrName]
    if (accIdx === undefined) {
      gl.disableVertexAttribArray(loc)
      gl.vertexAttrib4fv(loc, defaultVals)
      return
    }
    const acc = gltf.accessors[accIdx]
    const bv = gltf.bufferViews[acc.bufferView]
    const buf = getGlBufferForAccessor(acc, gl.ARRAY_BUFFER)
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(
      loc,
      size,
      acc.componentType,
      Boolean(acc.normalized),
      bv.byteStride || 0,
      acc.byteOffset || 0,
    )
  }

  // Compilar VAOs de todas las primitivas
  const compiledMeshes = (gltf.meshes || []).map((meshDef) => {
    const prims = meshDef.primitives.map((prim) => {
      const vao = gl.createVertexArray()
      gpuVaos.push(vao)
      gl.bindVertexArray(vao)

      bindAttribute('POSITION', 0, prim.attributes, 3, [0, 0, 0, 1])
      bindAttribute('NORMAL', 1, prim.attributes, 3, [0, 1, 0, 0])
      bindAttribute('TEXCOORD_0', 2, prim.attributes, 2, [0, 0, 0, 0])
      bindAttribute('JOINTS_0', 3, prim.attributes, 4, [0, 0, 0, 0])
      bindAttribute('WEIGHTS_0', 4, prim.attributes, 4, [1, 0, 0, 0])

      const idxAcc = gltf.accessors[prim.indices]
      const idxBuf = getGlBufferForAccessor(idxAcc, gl.ELEMENT_ARRAY_BUFFER)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf)

      gl.bindVertexArray(null)

      return {
        vao,
        count: idxAcc.count,
        indexType: idxAcc.componentType,
        indexOffset: idxAcc.byteOffset || 0,
        materialIdx: prim.material ?? 0,
        center: localBoundsCenter(gltf.accessors[prim.attributes.POSITION]),
      }
    })
    return prims
  })

  // Preparar jerarquía de nodos y skins
  const nodeCount = gltf.nodes.length
  const baseNodes = gltf.nodes.map((n) => ({
    name: n.name || '',
    mesh: n.mesh,
    skin: n.skin,
    children: n.children || [],
    baseT: new Float32Array(n.translation || [0, 0, 0]),
    baseR: new Float32Array(n.rotation || [0, 0, 0, 1]),
    baseS: new Float32Array(n.scale || [1, 1, 1]),
    curT: new Float32Array(n.translation || [0, 0, 0]),
    curR: new Float32Array(n.rotation || [0, 0, 0, 1]),
    localMat: mat4Create(),
    worldMat: mat4Create(),
  }))

  const nodeIdxByName = new Map()
  baseNodes.forEach((n, idx) => {
    if (n.name) nodeIdxByName.set(n.name, idx)
  })

  const compiledSkins = (gltf.skins || []).map((skinDef) => {
    const ibmAcc = gltf.accessors[skinDef.inverseBindMatrices]
    const ibmBv = gltf.bufferViews[ibmAcc.bufferView]
    const byteStart = binChunk.byteOffset + (ibmBv.byteOffset || 0) + (ibmAcc.byteOffset || 0)
    // Copiar en Float32Array alineado
    const rawBytes = binChunk.slice(
      (ibmBv.byteOffset || 0) + (ibmAcc.byteOffset || 0),
      (ibmBv.byteOffset || 0) + (ibmAcc.byteOffset || 0) + ibmAcc.count * 64,
    )
    const ibmFloats = new Float32Array(rawBytes.buffer)
    void byteStart
    return {
      joints: skinDef.joints,
      ibmFloats,
      uniformArray: new Float32Array(MAX_JOINTS * 16),
    }
  })

  const rootNodes = gltf.scenes?.[gltf.scene ?? 0]?.nodes || [0]

  // Matrices reutilizables sin asignaciones por fotograma
  const projMat = mat4Create()
  const viewMat = mat4Create()
  const viewProjMat = mat4Create()
  const sceneRootMat = mat4Create()
  const tmpQuat = new Float32Array([0, 0, 0, 1])
  const tmpPos = new Float32Array([0, 0, 0])
  const unitScale = new Float32Array([1, 1, 1])
  const tmpMat = mat4Create()

  // Parámetros de cámara calibrados por escena para encuadre limpio y sin recortes
  const cameraConfig =
    preset === 'ai-character'
      ? {
          fovDeg: 30,
          near: 0.04,
          far: 24.0,
          eye: new Float32Array([0.04, 1.16, 4.95]),
          target: new Float32Array([0.0, 1.11, 0.0]),
          baseYaw: -0.16,
          basePitch: 0.03,
        }
      : isScene
        ? {
            // Cámara por defecto de una escena compuesta; lo normal es pasar `camera` en cada fotograma
            fovDeg: 40,
            near: 0.1,
            far: 100.0,
            eye: new Float32Array([0.0, 1.5, 9.0]),
            target: new Float32Array([0.0, 0.0, 0.0]),
            baseYaw: 0,
            basePitch: 0,
          }
        : {
            fovDeg: 30,
            near: 0.04,
            far: 24.0,
            eye: new Float32Array([0.0, 0.015, 0.64]),
            target: new Float32Array([0.0, -0.012, 0.0]),
            baseYaw: -0.31,
            basePitch: 0.09,
          }

  const upVec = new Float32Array([0, 1, 0])
  let disposed = false

  function updateNodeHierarchy(nodeIdx, parentMat) {
    const node = baseNodes[nodeIdx]
    mat4FromTRS(node.localMat, node.curT, node.curR, node.baseS)
    mat4Multiply(node.worldMat, parentMat, node.localMat)
    for (let i = 0; i < node.children.length; i++) {
      updateNodeHierarchy(node.children[i], node.worldMat)
    }
  }

  function applyPoseAnimations(timeSec, rx, ry) {
    // Restaurar TRS base
    for (let i = 0; i < nodeCount; i++) {
      baseNodes[i].curT.set(baseNodes[i].baseT)
      baseNodes[i].curR.set(baseNodes[i].baseR)
    }

    if (poseKinds.includes('quest3')) {
      const hsIdx = nodeIdxByName.get('Quest3_Headset')
      const crIdx = nodeIdxByName.get('Quest3_ControllerRight')
      const clIdx = nodeIdxByName.get('Quest3_ControllerLeft')

      if (hsIdx !== undefined) {
        const hs = baseNodes[hsIdx]
        hs.curT[1] = hs.baseT[1] + Math.sin(timeSec * 1.45) * 0.0065
        quatFromEulerXYZ(
          tmpQuat,
          Math.sin(timeSec * 1.1) * 0.025 - ry * 0.06,
          rx * 0.08,
          Math.cos(timeSec * 1.2) * 0.018,
        )
        quatMultiply(hs.curR, hs.baseR, tmpQuat)
      }

      if (crIdx !== undefined) {
        const cr = baseNodes[crIdx]
        cr.curT[1] = cr.baseT[1] + Math.sin(timeSec * 1.65 + 1.4) * 0.0075
        cr.curT[0] = cr.baseT[0] + rx * 0.008
        quatFromEulerXYZ(tmpQuat, Math.cos(timeSec * 1.35) * 0.045, rx * 0.09, 0.03 * Math.sin(timeSec * 1.2))
        quatMultiply(cr.curR, cr.baseR, tmpQuat)
      }

      if (clIdx !== undefined) {
        const cl = baseNodes[clIdx]
        cl.curT[1] = cl.baseT[1] + Math.sin(timeSec * 1.65 + 2.9) * 0.0075
        cl.curT[0] = cl.baseT[0] + rx * 0.008
        quatFromEulerXYZ(tmpQuat, Math.sin(timeSec * 1.35) * 0.045, rx * 0.09, -0.03 * Math.cos(timeSec * 1.2))
        quatMultiply(cl.curR, cl.baseR, tmpQuat)
      }
    }

    if (poseKinds.includes('ai-character')) {
      const hipsIdx = nodeIdxByName.get('hips')
      const chestIdx = nodeIdxByName.get('chest')
      const headIdx = nodeIdxByName.get('head')
      const laRIdx = nodeIdxByName.get('lowerarm.r')
      const laLIdx = nodeIdxByName.get('lowerarm.l')

      const breath = Math.sin(timeSec * 1.65)

      if (hipsIdx !== undefined) {
        baseNodes[hipsIdx].curT[1] = baseNodes[hipsIdx].baseT[1] + breath * 0.008
      }

      if (chestIdx !== undefined) {
        const ch = baseNodes[chestIdx]
        quatFromEulerXYZ(tmpQuat, breath * 0.022 - ry * 0.045, rx * 0.11, 0)
        quatMultiply(ch.curR, ch.baseR, tmpQuat)
      }

      if (headIdx !== undefined) {
        const hd = baseNodes[headIdx]
        quatFromEulerXYZ(
          tmpQuat,
          Math.sin(timeSec * 1.1) * 0.025 - ry * 0.12,
          rx * 0.22 + Math.sin(timeSec * 0.72) * 0.045,
          -rx * 0.04,
        )
        quatMultiply(hd.curR, hd.baseR, tmpQuat)
      }

      if (laRIdx !== undefined) {
        const lar = baseNodes[laRIdx]
        quatFromEulerXYZ(tmpQuat, 0, 0, Math.sin(timeSec * 1.85) * 0.055)
        quatMultiply(lar.curR, lar.baseR, tmpQuat)
      }

      if (laLIdx !== undefined) {
        const lal = baseNodes[laLIdx]
        quatFromEulerXYZ(tmpQuat, 0, 0, Math.cos(timeSec * 1.85) * 0.065)
        quatMultiply(lal.curR, lal.baseR, tmpQuat)
      }
    }
  }

  // Lista plana de primitivas a dibujar, en orden de nodo y de primitiva (el mismo que el recorrido
  // directo de la jerarquía). Las translúcidas se separan para la segunda pasada.
  const drawItems = []
  baseNodes.forEach((node, nodeIdx) => {
    if (node.mesh === undefined) return
    const skin = node.skin !== undefined ? compiledSkins[node.skin] : undefined
    for (const prim of compiledMeshes[node.mesh]) {
      drawItems.push({
        nodeIdx,
        prim,
        skin,
        material: compiledMaterials[prim.materialIdx] ?? fallbackMaterial,
        distSq: 0,
      })
    }
  })
  const opaqueItems = drawItems.filter((item) => !item.material.blend)
  const blendItems = drawItems.filter((item) => item.material.blend)

  // Último nodo/material enlazado: evita repetir los mismos uniformes entre primitivas consecutivas
  let boundNodeIdx = -1
  let boundMaterial = null
  // Niebla del fotograma en curso (se sube a la GPU junto con cada material)
  let fogActive = false
  let fogColor = BLACK
  let fogUniformOn = false

  // Estado de la última llamada a renderFrame, usado por project()
  const centerWorld = new Float32Array(3)
  let viewCssW = 1
  let viewCssH = 1
  let hasRendered = false

  function bindNode(item) {
    boundNodeIdx = item.nodeIdx
    gl.uniform1i(uniforms.hasSkin, item.skin ? 1 : 0)
    if (item.skin) {
      // En glTF 2.0, las jointMatrices ya incorporan la transformación mundial del esqueleto
      gl.uniformMatrix4fv(uniforms.model, false, IDENTITY_MATRIX)
      gl.uniformMatrix4fv(uniforms.joints, false, item.skin.uniformArray)
    } else {
      gl.uniformMatrix4fv(uniforms.model, false, baseNodes[item.nodeIdx].worldMat)
    }
  }

  function bindMaterial(material) {
    boundMaterial = material
    const bcf = material.baseColorFactor
    gl.uniform4f(uniforms.baseColorFactor, bcf[0], bcf[1], bcf[2], bcf[3])
    gl.uniform1f(uniforms.metallicFactor, material.metallicFactor)
    gl.uniform1f(uniforms.roughnessFactor, material.roughnessFactor)

    const emf = material.emissiveFactor
    gl.uniform3f(uniforms.emissiveFactor, emf[0], emf[1], emf[2])
    gl.uniform1f(uniforms.occlusionStrength, material.occlusionStrength)

    if (material.baseColorTexture) {
      gl.uniform1i(uniforms.hasBaseColorTex, 1)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, material.baseColorTexture)
    } else {
      gl.uniform1i(uniforms.hasBaseColorTex, 0)
    }

    if (material.metallicRoughnessTexture) {
      gl.uniform1i(uniforms.hasMrTex, 1)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, material.metallicRoughnessTexture)
    } else {
      gl.uniform1i(uniforms.hasMrTex, 0)
    }

    if (material.emissiveTexture) {
      gl.uniform1i(uniforms.hasEmissiveTex, 1)
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, material.emissiveTexture)
    } else {
      gl.uniform1i(uniforms.hasEmissiveTex, 0)
    }

    if (fogActive) gl.uniform3fv(uniforms.fogColor, material.additive ? BLACK : fogColor)
  }

  /** Dibuja una primitiva; en la pasada translúcida las de doble cara van «cara trasera → cara delantera». */
  function drawItem(item, isBlendPass) {
    if (item.nodeIdx !== boundNodeIdx) bindNode(item)
    if (item.material !== boundMaterial) bindMaterial(item.material)

    const { prim, material } = item
    gl.bindVertexArray(prim.vao)
    if (!material.doubleSided) {
      gl.drawElements(gl.TRIANGLES, prim.count, prim.indexType, prim.indexOffset)
    } else if (isBlendPass) {
      gl.cullFace(gl.FRONT)
      gl.drawElements(gl.TRIANGLES, prim.count, prim.indexType, prim.indexOffset)
      gl.cullFace(gl.BACK)
      gl.drawElements(gl.TRIANGLES, prim.count, prim.indexType, prim.indexOffset)
    } else {
      gl.disable(gl.CULL_FACE)
      gl.drawElements(gl.TRIANGLES, prim.count, prim.indexType, prim.indexOffset)
      gl.enable(gl.CULL_FACE)
    }
  }

  const farthestFirst = (a, b) => b.distSq - a.distSq

  /**
   * Segunda pasada: materiales translúcidos de atrás hacia delante (distancia del centro de su caja
   * al ojo), con mezcla premultiplicada y sin escribir profundidad. Restaura el estado GL al acabar.
   */
  function drawBlendPass(eye) {
    for (const item of blendItems) {
      mat4TransformPoint(centerWorld, baseNodes[item.nodeIdx].worldMat, item.prim.center)
      const dx = centerWorld[0] - eye[0]
      const dy = centerWorld[1] - eye[1]
      const dz = centerWorld[2] - eye[2]
      item.distSq = dx * dx + dy * dy + dz * dz
    }
    blendItems.sort(farthestFirst)

    gl.enable(gl.BLEND)
    gl.depthMask(false)
    let additiveMode = null
    try {
      for (const item of blendItems) {
        if (item.material.additive !== additiveMode) {
          additiveMode = item.material.additive
          // La salida del shader ya está premultiplicada: ONE / ONE_MINUS_SRC_ALPHA; el aditivo suma
          gl.blendFunc(gl.ONE, additiveMode ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA)
        }
        drawItem(item, true)
      }
    } finally {
      gl.disable(gl.BLEND)
      gl.depthMask(true)
      gl.cullFace(gl.BACK)
    }
  }

  /**
   * Dibuja un fotograma. `cssWidth`/`cssHeight` permiten al llamador pasar el tamaño ya medido
   * (p. ej. con ResizeObserver) y evitar leer el layout en cada fotograma.
   *
   * `camera` (opcional) sustituye a la del preset: `{ eye: [x,y,z], target: [x,y,z], fovDeg, near?, far?, up? }`.
   * `fog` (opcional): `{ color: [r,g,b] (sRGB 0‥1), near, far }`, niebla lineal por distancia al ojo.
   */
  function renderFrame({ timeSec = 0, rx = 0, ry = 0, dpr = 1, cssWidth, cssHeight, camera, fog }) {
    if (disposed || !pollReady()) return

    const cssW = cssWidth || canvas.clientWidth || 480
    const cssH = cssHeight || canvas.clientHeight || 420
    const targetW = Math.max(1, Math.round(cssW * dpr))
    const targetH = Math.max(1, Math.round(cssH * dpr))

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW
      canvas.height = targetH
    }
    if (lastViewportW !== targetW || lastViewportH !== targetH) {
      gl.viewport(0, 0, targetW, targetH)
      lastViewportW = targetW
      lastViewportH = targetH
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    viewCssW = cssW
    viewCssH = cssH
    hasRendered = true

    const aspect = targetW / targetH
    const eye = camera?.eye ?? cameraConfig.eye
    const fovDeg = camera?.fovDeg ?? cameraConfig.fovDeg
    mat4Perspective(
      projMat,
      (fovDeg * Math.PI) / 180,
      aspect,
      camera?.near ?? cameraConfig.near,
      camera?.far ?? cameraConfig.far,
    )
    mat4LookAt(viewMat, eye, camera?.target ?? cameraConfig.target, camera?.up ?? upVec)
    mat4Multiply(viewProjMat, projMat, viewMat)

    if (!isScene) {
      // Orientación global de estudio + respuesta controlada al cursor/sensores
      const yaw = cameraConfig.baseYaw + rx * (preset === 'quest3' ? 0.22 : 0.14)
      const pitch = cameraConfig.basePitch - ry * (preset === 'quest3' ? 0.14 : 0.08)
      quatFromEulerXYZ(tmpQuat, pitch, yaw, 0)
      tmpPos[0] = 0
      tmpPos[1] = 0
      tmpPos[2] = 0
      mat4FromTRS(sceneRootMat, tmpPos, tmpQuat, unitScale)
    }

    applyPoseAnimations(timeSec, rx, ry)

    for (let r = 0; r < rootNodes.length; r++) {
      updateNodeHierarchy(rootNodes[r], sceneRootMat)
    }

    // Actualizar matrices de skinning en GPU si el modelo es esquelético
    for (let s = 0; s < compiledSkins.length; s++) {
      const skin = compiledSkins[s]
      const jCount = Math.min(skin.joints.length, MAX_JOINTS)
      for (let j = 0; j < jCount; j++) {
        const jointNode = baseNodes[skin.joints[j]]
        const ibmSub = skin.ibmFloats.subarray(j * 16, j * 16 + 16)
        mat4Multiply(tmpMat, jointNode.worldMat, ibmSub)
        skin.uniformArray.set(tmpMat, j * 16)
      }
    }

    gl.uniformMatrix4fv(uniforms.viewProj, false, viewProjMat)
    gl.uniform3fv(uniforms.camPos, eye)

    fogActive = Boolean(fog)
    if (fogActive) {
      fogColor = fog.color
      gl.uniform3fv(uniforms.fogColor, fogColor)
      gl.uniform2f(uniforms.fogRange, fog.near, fog.far)
    }
    if (fogActive !== fogUniformOn) {
      fogUniformOn = fogActive
      gl.uniform1i(uniforms.fogOn, fogActive ? 1 : 0)
    }

    boundNodeIdx = -1
    boundMaterial = null
    for (let i = 0; i < opaqueItems.length; i++) drawItem(opaqueItems[i], false)
    if (blendItems.length > 0) drawBlendPass(eye)

    gl.bindVertexArray(null)
  }

  /**
   * Sustituye el TRS base de un nodo (por nombre o índice) desde el siguiente fotograma. Las poses
   * por nombre se aplican sobre este TRS. Devuelve false si el nodo no existe (no lanza: se llama
   * dentro del bucle de animación).
   * @param {string | number} nameOrIndex
   * @param {{ translation?: number[], rotation?: number[], scale?: number | number[] }} transform
   */
  function setNodeTransform(nameOrIndex, { translation, rotation, scale } = {}) {
    const index = typeof nameOrIndex === 'number' ? nameOrIndex : nodeIdxByName.get(nameOrIndex)
    const node = baseNodes[index]
    if (!node) return false
    if (translation) node.baseT.set(translation)
    if (rotation) quatNormalize(node.baseR, rotation)
    if (scale !== undefined) {
      if (typeof scale === 'number') node.baseS.fill(scale)
      else node.baseS.set(scale)
    }
    return true
  }

  /**
   * Aplica varias transformaciones a la vez: `Map` o objeto `{ nombreDeNodo: transform }` (con un
   * `Map` las claves pueden ser también índices). Devuelve cuántos nodos se actualizaron.
   */
  function setNodeTransforms(transforms) {
    let applied = 0
    const entries = transforms instanceof Map ? transforms : Object.entries(transforms)
    for (const [key, transform] of entries) {
      if (setNodeTransform(key, transform)) applied++
    }
    return applied
  }

  /**
   * Proyecta un punto del mundo con la matriz vista-proyección del último `renderFrame`.
   * `x`/`y` en píxeles CSS relativos al canvas (origen arriba a la izquierda); `depth` es la
   * distancia del punto al plano de la cámara en unidades de mundo (útil para escalar etiquetas);
   * `visible` indica que cae dentro del frustum. Pasa `out` para no crear un objeto por llamada.
   */
  function project(point, out = { x: 0, y: 0, depth: 0, visible: false }) {
    const m = viewProjMat
    const [px, py, pz] = point
    const clipX = m[0] * px + m[4] * py + m[8] * pz + m[12]
    const clipY = m[1] * px + m[5] * py + m[9] * pz + m[13]
    const clipZ = m[2] * px + m[6] * py + m[10] * pz + m[14]
    const clipW = m[3] * px + m[7] * py + m[11] * pz + m[15]
    if (!hasRendered || clipW <= 0) {
      out.x = 0
      out.y = 0
      out.depth = clipW
      out.visible = false
      return out
    }
    const ndcX = clipX / clipW
    const ndcY = clipY / clipW
    out.x = (ndcX * 0.5 + 0.5) * viewCssW
    out.y = (0.5 - ndcY * 0.5) * viewCssH
    out.depth = clipW
    out.visible = Math.abs(ndcX) <= 1 && Math.abs(ndcY) <= 1 && Math.abs(clipZ) <= clipW
    return out
  }

  /**
   * Libera de forma determinista todos los recursos de GPU. Además pierde el contexto de forma
   * explícita: sin ello el navegador lo conserva hasta el recolector de basura y, tras ~16 visitas
   * a la diapositiva, empieza a descartar contextos antiguos («Too many active WebGL contexts»).
   */
  function dispose() {
    if (disposed) return
    disposed = true
    for (const vao of gpuVaos) gl.deleteVertexArray(vao)
    for (const buf of gpuBuffers) gl.deleteBuffer(buf)
    for (const tex of gpuTextures) gl.deleteTexture(tex)
    if (program) {
      gl.deleteProgram(program)
    } else {
      gl.deleteProgram(pendingProgram.program)
      gl.deleteShader(pendingProgram.vs)
      gl.deleteShader(pendingProgram.fs)
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    // Reducir el búfer de dibujo libera su memoria sin esperar al recolector de basura
    canvas.width = 1
    canvas.height = 1
  }

  return {
    pollReady,
    renderFrame,
    setNodeTransform,
    setNodeTransforms,
    project,
    dispose,
  }
}
