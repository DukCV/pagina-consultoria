/**
 * Genera los fotogramas 2D de la hélice de servicios (alternativa de los niveles `static` y de la
 * carga previa de la escena 3D): la MISMA escena 3D vista con la cámara de cada uno de los seis
 * servicios, en WebP con transparencia y tres anchos. Usa el propio motor WebGL2 del proyecto, así que
 * el cambio entre 2D y 3D mantiene la misma composición, iluminación y materiales.
 *
 * Requiere el servidor de desarrollo en marcha (`npm run dev`) y el Chrome del sistema (o `CHROME_PATH`):
 *   node tools/render-helix-frames.mjs [--url http://localhost:5173] [--out public/models/renders-2d]
 *
 * No necesita dependencias nuevas: el WebP lo codifica el propio navegador desde el canvas. Los anchos
 * y el nombre de archivo deben coincidir con src/components/services/frameSequence.js.
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : fallback
}
const baseUrl = arg('url', 'http://localhost:5173')
const outDir = arg('out', 'public/models/renders-2d')

const WIDTHS = [640, 1100, 1600]
const ASPECT = 1.25 // ancho / alto del fotograma: la escena completa con sus vecinos
const WEBP_QUALITY = 0.86
const POSE_TIME_SEC = 0.9 // instante de las animaciones ambientales (flotación, órbitas)
const STEPS = 6

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  channel: process.env.CHROME_PATH ? undefined : 'chrome',
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } })
page.setDefaultTimeout(300000)
await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })

for (const width of WIDTHS) {
  const height = Math.round(width / ASPECT)
  const frames = await page.evaluate(
    async ({ width, height, steps, timeSec, quality }) => {
      const { loadHelixScene } = await import('/src/components/services/helix3d/buildHelixScene.js')
      const { createSceneRuntime } = await import('/src/components/services/helix3d/sceneRuntime.js')
      const { createWebGLPbrStage } = await import('/src/engine3d/webglPbrStage.js')

      const scene = await loadHelixScene({ detail: 1 })
      const canvas = document.createElement('canvas')
      canvas.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px`
      document.body.appendChild(canvas)
      const stage = createWebGLPbrStage(canvas, scene.asset, {
        preset: 'scene',
        poses: ['quest3', 'ai-character'],
        preserveDrawingBuffer: true,
      })
      while (!stage.pollReady()) await new Promise((resolve) => requestAnimationFrame(resolve))
      const runtime = createSceneRuntime({ stage, scene, labelRefs: { current: [] } })

      const out = []
      for (let step = 0; step < steps; step += 1) {
        runtime.update({ progress: step, pointer: { x: 0, y: 0 }, timeSec, width, height, dpr: 1, fog: true })
        out.push(canvas.toDataURL('image/webp', quality))
      }
      stage.dispose()
      canvas.remove()
      return out
    },
    { width, height, steps: STEPS, timeSec: POSE_TIME_SEC, quality: WEBP_QUALITY },
  )

  frames.forEach((dataUrl, step) => {
    const bytes = Buffer.from(dataUrl.split(',')[1], 'base64')
    const file = path.join(outDir, `helix-step-${step + 1}-${width}.webp`)
    fs.writeFileSync(file, bytes)
    console.log(`✓ ${file} (${(bytes.length / 1024).toFixed(0)} kB)`)
  })
}
await browser.close()
