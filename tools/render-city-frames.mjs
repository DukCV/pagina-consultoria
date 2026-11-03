/**
 * Genera los fotogramas 2D de la ciudad de «Sectores» (alternativa de los niveles `static` y de la carga
 * previa de la escena 3D): la MISMA escena 3D vista desde cada una de las cinco paradas de la cámara, en
 * WebP con transparencia. Hay dos juegos según la proporción del escenario en pantalla: `wide` (tableta y
 * escritorio) y `square` (móvil). Usa el propio motor WebGL2 del proyecto, así que el cambio entre 2D y 3D
 * mantiene la misma composición, iluminación y materiales.
 *
 * Requiere el servidor de desarrollo en marcha (`npm run dev`) y el Chrome del sistema (o `CHROME_PATH`):
 *   node tools/render-city-frames.mjs [--url http://localhost:5173] [--out public/models/renders-2d]
 *
 * No necesita dependencias nuevas: el WebP lo codifica el propio navegador desde el canvas. Las
 * proporciones, los anchos y los nombres deben coincidir con src/components/sectors/frameSequence.js.
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

const VARIANTS = {
  wide: { aspect: 1.78, axis: 0.66, widths: [960, 1600] },
  square: { aspect: 1.2, axis: 0.5, widths: [520, 900] },
}
const WEBP_QUALITY = 0.86
const POSE_TIME_SEC = 1.7 // instante de las animaciones ambientales (anillos, vehículos)
const STEPS = 5

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

for (const [variant, { aspect, axis, widths }] of Object.entries(VARIANTS)) {
  for (const width of widths) {
    const height = Math.round(width / aspect)
    const frames = await page.evaluate(
      async ({ width, height, steps, timeSec, quality, axis }) => {
        const { loadCityScene } = await import('/src/components/sectors/city3d/buildCityScene.js')
        const { createCityRuntime } = await import('/src/components/sectors/city3d/cityRuntime.js')
        const { createWebGLPbrStage } = await import('/src/engine3d/webglPbrStage.js')

        const scene = await loadCityScene({ detail: 1 })
        const canvas = document.createElement('canvas')
        canvas.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px`
        document.body.appendChild(canvas)
        const stage = createWebGLPbrStage(canvas, scene.asset, { preset: 'scene', preserveDrawingBuffer: true })
        while (!stage.pollReady()) await new Promise((resolve) => requestAnimationFrame(resolve))
        const runtime = createCityRuntime({ stage, scene })

        const out = []
        for (let step = 0; step < steps; step += 1) {
          runtime.update({ progress: step, pointer: { x: 0, y: 0 }, timeSec, width, height, dpr: 1, fog: true, level: 'full', axisScreenX: axis })
          out.push(canvas.toDataURL('image/webp', quality))
        }
        stage.dispose()
        canvas.remove()
        return out
      },
      { width, height, steps: STEPS, timeSec: POSE_TIME_SEC, quality: WEBP_QUALITY, axis },
    )

    frames.forEach((dataUrl, step) => {
      const bytes = Buffer.from(dataUrl.split(',')[1], 'base64')
      const file = path.join(outDir, `city-${variant}-${step + 1}-${width}.webp`)
      fs.writeFileSync(file, bytes)
      console.log(`✓ ${file} (${(bytes.length / 1024).toFixed(0)} kB)`)
    })
  }
}
await browser.close()
