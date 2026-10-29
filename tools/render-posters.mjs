/**
 * Genera los renders 2D de cada modelo (WebP responsive + PNG de respaldo) con el propio motor
 * WebGL2 del proyecto, en la pose de reposo (t = 0, sin parallax) y con la misma relación de
 * aspecto que el canvas de su escena. Así el render 2D coincide con el primer fotograma 3D y
 * el cambio entre ambos modos no produce saltos.
 *
 * Herramienta de desarrollo: sus dependencias NO forman parte del proyecto. Instálalas sin guardarlas:
 *   npm i --no-save playwright-core sharp
 *
 * Requiere el servidor de desarrollo en marcha (`npm run dev`) y un Chrome/Chromium instalado:
 *   node tools/render-posters.mjs [--url http://localhost:5173] [--out public/models/renders-2d]
 *   (opcional) CHROME_PATH=/ruta/a/chrome
 *
 * Los nombres de archivo y anchos deben coincidir con src/constants/modelAssets.js.
 */
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : fallback
}
const baseUrl = arg('url', 'http://localhost:5173')
const outDir = arg('out', 'public/models/renders-2d')

// Tamaño CSS del canvas en su escena a 2× (px de renderizado) y preset de cámara del motor
const MODELS = [
  { name: 'meta-quest-3-studio', glb: '/models/overlayer-optimized/meta-quest-3.glb', preset: 'quest3', cssWidth: 540, cssHeight: 485 },
  { name: 'ai-character-overlayer-studio', glb: '/models/overlayer-optimized/ai-character-overlayer.glb', preset: 'ai-character', cssWidth: 540, cssHeight: 540 },
]
const WIDTHS = [360, 720, 1080]
const RENDER_DPR = 2

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  channel: process.env.CHROME_PATH ? undefined : 'chrome',
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } })
page.setDefaultTimeout(180000)
await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })

for (const model of MODELS) {
  const dataUrl = await page.evaluate(async ({ glb, preset, cssWidth, cssHeight, dpr }) => {
    const { loadGlbAsset } = await import('/src/engine3d/glbLoader.js')
    const { createWebGLPbrStage } = await import('/src/engine3d/webglPbrStage.js')
    const canvas = document.createElement('canvas')
    canvas.style.cssText = `position:fixed;left:0;top:0;width:${cssWidth}px;height:${cssHeight}px`
    document.body.appendChild(canvas)
    const stage = createWebGLPbrStage(canvas, await loadGlbAsset(glb), { preset, preserveDrawingBuffer: true })
    while (!stage.pollReady()) await new Promise((resolve) => requestAnimationFrame(resolve))
    stage.renderFrame({ timeSec: 0, rx: 0, ry: 0, dpr, cssWidth, cssHeight })
    const url = canvas.toDataURL('image/png')
    stage.dispose()
    canvas.remove()
    return url
  }, { glb: model.glb, preset: model.preset, cssWidth: model.cssWidth, cssHeight: model.cssHeight, dpr: RENDER_DPR })

  const source = Buffer.from(dataUrl.split(',')[1], 'base64')
  for (const width of WIDTHS) {
    await sharp(source).resize({ width, kernel: 'lanczos3' }).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(path.join(outDir, `${model.name}-${width}.webp`))
  }
  await sharp(source).resize({ width: 720, kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(path.join(outDir, `${model.name}-720.png`))
  console.log(`✓ ${model.name}`)
}
await browser.close()
