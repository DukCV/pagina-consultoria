/**
 * Cargador y decodificador binario glTF 2.0 (.glb) con caché en memoria.
 * Separa la descarga/decodificación de activos de la instancia WebGL2 para evitar
 * peticiones duplicadas al cambiar entre diapositivas del slider.
 *
 * - Admite prioridad de red (`high` para el modelo que se va a mostrar, `low` para precargas).
 * - Recuerda los fallos durante un tiempo para no reintentar la descarga en cada visita a la diapositiva.
 * - Permite liberar de memoria los activos decodificados cuando ya no van a usarse.
 */

const GLB_MAGIC = 0x46546c67
const JSON_CHUNK_TYPE = 0x4e4f534a
const BIN_CHUNK_TYPE = 0x004e4942

// Tras un fallo, durante este tiempo se rechaza de inmediato en lugar de volver a la red
const FAILURE_COOLDOWN_MS = 45000

const assetPromiseCache = new Map()
const assetResolvedCache = new Map()
const failureMemo = new Map()

function decodeImageFromBytes(uint8Slice, mimeType = 'image/png') {
  const blob = new Blob([uint8Slice], { type: mimeType })

  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    return window
      .createImageBitmap(blob, {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
      })
      .catch(() => decodeViaHtmlImage(blob))
  }

  return decodeViaHtmlImage(blob)
}

function decodeViaHtmlImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

export async function parseGlbBuffer(arrayBuffer) {
  const view = new DataView(arrayBuffer)
  if (arrayBuffer.byteLength < 20 || view.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error('Formato GLB inválido')
  }

  const version = view.getUint32(4, true)
  if (version !== 2) {
    throw new Error(`Versión glTF no compatible: ${version}`)
  }

  let offset = 12
  let gltf = null
  let binChunk = null

  while (offset + 8 <= arrayBuffer.byteLength) {
    const chunkLen = view.getUint32(offset, true)
    const chunkType = view.getUint32(offset + 4, true)
    const dataStart = offset + 8

    if (chunkType === JSON_CHUNK_TYPE) {
      const jsonBytes = new Uint8Array(arrayBuffer, dataStart, chunkLen)
      gltf = JSON.parse(new TextDecoder('utf-8').decode(jsonBytes))
    } else if (chunkType === BIN_CHUNK_TYPE) {
      binChunk = new Uint8Array(arrayBuffer, dataStart, chunkLen)
    }

    offset = dataStart + chunkLen
  }

  if (!gltf || !binChunk) {
    throw new Error('Archivo GLB incompleto')
  }

  const decodedImages = await Promise.all(
    (gltf.images || []).map((imgDef) => {
      const bv = gltf.bufferViews[imgDef.bufferView]
      if (!bv) throw new Error('Textura embebida ausente en GLB')
      const start = bv.byteOffset || 0
      const slice = binChunk.subarray(start, start + bv.byteLength)
      return decodeImageFromBytes(slice, imgDef.mimeType || 'image/png')
    }),
  )

  return {
    gltf,
    binChunk,
    decodedImages,
  }
}

function fetchBinaryBuffer(url, priority) {
  if (typeof window !== 'undefined' && window.location?.protocol === 'file:') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.responseType = 'arraybuffer'
      xhr.onload = () => {
        if ((xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) && xhr.response) {
          resolve(xhr.response)
        } else {
          reject(new Error(`XHR ${xhr.status} al cargar ${url}`))
        }
      }
      xhr.onerror = () => reject(new Error(`Error de red local al cargar ${url}`))
      xhr.send()
    })
  }

  return fetch(url, { priority }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`)
    return res.arrayBuffer()
  })
}

/**
 * Descarga y decodifica un GLB (una única vez por URL).
 * @param {string} url
 * @param {{ priority?: 'high' | 'low' | 'auto' }} [options] Prioridad de red; solo aplica a la primera petición.
 */
export function loadGlbAsset(url, { priority = 'auto' } = {}) {
  if (assetPromiseCache.has(url)) {
    return assetPromiseCache.get(url)
  }

  const failure = failureMemo.get(url)
  if (failure && Date.now() - failure.at < FAILURE_COOLDOWN_MS) {
    return Promise.reject(failure.error)
  }

  const promise = fetchBinaryBuffer(url, priority)
    .then((buf) => parseGlbBuffer(buf))
    .then((asset) => {
      failureMemo.delete(url)
      assetResolvedCache.set(url, asset)
      return asset
    })
    .catch((error) => {
      assetPromiseCache.delete(url)
      failureMemo.set(url, { at: Date.now(), error })
      throw error
    })

  assetPromiseCache.set(url, promise)
  return promise
}

export function prefetchGlbAsset(url) {
  loadGlbAsset(url, { priority: 'low' }).catch(() => {
    // Silencioso en precarga; el componente gestionará su degradación 2D si fuera necesario
  })
}

/** Indica si el GLB ya está descargado y decodificado (listo para subir a la GPU). */
export function isGlbAssetReady(url) {
  return assetResolvedCache.has(url)
}

/** Indica si la última carga falló hace poco y no se volverá a intentar todavía. */
export function hasRecentGlbFailure(url) {
  const failure = failureMemo.get(url)
  return Boolean(failure && Date.now() - failure.at < FAILURE_COOLDOWN_MS)
}

/** Libera de memoria los activos decodificados (p. ej. al pasar definitivamente a modo 2D). */
export function clearGlbCache() {
  for (const asset of assetResolvedCache.values()) {
    for (const image of asset.decodedImages) image.close?.()
  }
  assetResolvedCache.clear()
  assetPromiseCache.clear()
}
