import { useEffect, useRef } from 'react'

const ISO_ANGLES = [
  Math.atan2(5, 8),
  Math.atan2(-5, 8),
  Math.PI - Math.atan2(5, 8),
  Math.PI + Math.atan2(5, 8),
]

/**
 * Motor visual en HTML5 Canvas sincronizado al reloj maestro de la animación.
 * Renderiza auroras volumétricas, ondas de choque isométricas, el estallido
 * prismático (#BFF559) en t = 2.04s y micro-partículas geométricas ambientales.
 */
export default function SplashAtmosphereCanvas({ syncRef, opacity = 1 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // Micro-rombos ambientales flotantes
    const motes = Array.from({ length: 30 }, (_, i) => ({
      x: ((i * 137.5) % 100) / 100,
      y: ((i * 73.1 + 19) % 100) / 100,
      vx: (Math.cos(i * 2.1) * 0.14),
      vy: (Math.sin(i * 1.7) * 0.11) - 0.05,
      size: 1.8 + (i % 4) * 0.75,
      tone: i % 3, // 0 indigo, 1 emerald, 2 lime
      phase: i * 0.9,
    }))

    let sparks = []
    let burstFiredForRun = -1
    let rafId = 0
    let lastTime = performance.now()

    const spawnPrismBurst = (ox, oy) => {
      const palette = ['#BFF559', '#E6FFAD', '#BFF559', '#49C796', '#838AE6', '#FFFFFF']
      sparks = Array.from({ length: 52 }, (_, i) => {
        // 70% alineadas con los 4 ejes isométricos exactos ±32.005°, 30% radial libre
        const baseAngle =
          i < 36
            ? ISO_ANGLES[i % 4] + (Math.sin(i * 12.9898) * 0.24)
            : (i / 16) * Math.PI * 2
        const speed = 3.2 + ((i * 29) % 11) * 1.15
        return {
          x: ox,
          y: oy,
          vx: Math.cos(baseAngle) * speed,
          vy: Math.sin(baseAngle) * speed,
          drag: 0.942 + (i % 5) * 0.006,
          life: 1,
          decay: 0.013 + (i % 4) * 0.0035,
          len: 10 + (i % 5) * 5,
          width: i % 4 === 0 ? 2.2 : 1.35,
          color: palette[i % palette.length],
        }
      })
    }

    const drawIsometricDiamond = (cx, cy, halfW, halfH) => {
      ctx.beginPath()
      ctx.moveTo(cx, cy - halfH)
      ctx.lineTo(cx + halfW, cy)
      ctx.lineTo(cx, cy + halfH)
      ctx.lineTo(cx - halfW, cy)
      ctx.closePath()
    }

    const render = (now) => {
      const dt = Math.min(2.5, (now - lastTime) / 16.667)
      lastTime = now

      const state = syncRef.current
      const elapsed = state.elapsed
      const ox = state.irisOrigin.x || width * 0.55
      const oy = state.irisOrigin.y || height * 0.5
      const irisR = state.irisRadius || 0

      if (state.runId !== burstFiredForRun && elapsed < 1.9) {
        sparks = []
      }
      if (state.runId !== burstFiredForRun && elapsed >= 2.03 && elapsed < 2.5) {
        burstFiredForRun = state.runId
        spawnPrismBurst(ox, oy)
      }

      ctx.clearRect(0, 0, width, height)

      // 1. Halo sutil interactivo de cursor en modo estudio diurno
      if (elapsed > 2.6 && state.pointer.active) {
        const halo = ctx.createRadialGradient(
          state.pointer.x,
          state.pointer.y,
          0,
          state.pointer.x,
          state.pointer.y,
          280,
        )
        halo.addColorStop(0, 'rgba(255, 255, 250, 0.24)')
        halo.addColorStop(0.5, 'rgba(191, 245, 89, 0.06)')
        halo.addColorStop(1, 'rgba(218, 219, 213, 0)')
        ctx.fillStyle = halo
        ctx.fillRect(0, 0, width, height)
      }

      // 2. Micro-rombos flotantes (cambian cromática según si están dentro o fuera del iris diurno)
      for (const m of motes) {
        m.x = (m.x + (m.vx * 0.0007 * dt) + 1) % 1
        m.y = (m.y + (m.vy * 0.0007 * dt) + 1) % 1
        const px = m.x * width
        const py = m.y * height
        const pulse = 0.55 + 0.45 * Math.sin(elapsed * 1.8 + m.phase)

        const insideDaylight =
          irisR > 0 && Math.hypot(px - ox, py - oy) < irisR

        if (insideDaylight) {
          ctx.fillStyle =
            m.tone === 0
              ? `rgba(59, 62, 105, ${0.13 * pulse})`
              : m.tone === 1
                ? `rgba(53, 151, 113, ${0.15 * pulse})`
                : `rgba(130, 175, 45, ${0.16 * pulse})`
        } else {
          const introFade = Math.min(1, elapsed / 0.6)
          ctx.fillStyle =
            m.tone === 0
              ? `rgba(130, 138, 235, ${0.32 * pulse * introFade})`
              : m.tone === 1
                ? `rgba(73, 199, 150, ${0.32 * pulse * introFade})`
                : `rgba(191, 245, 89, ${0.42 * pulse * introFade})`
        }

        drawIsometricDiamond(px, py, m.size * 1.6, m.size)
        ctx.fill()
      }

      // 3. Ondas de choque isométricas (proporción exacta 8:5) al bloquear el prisma lima
      if (elapsed >= 2.03 && elapsed <= 3.05) {
        const waveT = (elapsed - 2.03) / 1.02
        const easeWave = 1 - Math.pow(1 - Math.min(1, waveT), 4)
        const maxSpan = Math.max(width, height) * 0.72

        const w1 = 28 + easeWave * maxSpan
        ctx.save()
        ctx.strokeStyle = `rgba(191, 245, 89, ${(1 - easeWave) * 0.55})`
        ctx.lineWidth = 2.2 * (1 - easeWave * 0.6)
        drawIsometricDiamond(ox, oy, w1, w1 * 0.625)
        ctx.stroke()

        if (waveT > 0.08) {
          const t2 = Math.min(1, (waveT - 0.08) / 0.92)
          const ease2 = 1 - Math.pow(1 - t2, 4)
          const w2 = 20 + ease2 * maxSpan * 0.82
          ctx.strokeStyle = `rgba(53, 151, 113, ${(1 - ease2) * 0.35})`
          ctx.lineWidth = 1.4
          drawIsometricDiamond(ox, oy, w2, w2 * 0.625)
          ctx.stroke()
        }
        ctx.restore()
      }

      // 4. Corona cáustica luminosa sobre el borde exacto del iris diurno en expansión
      if (irisR > 4 && irisR < Math.hypot(width, height) * 1.08) {
        ctx.save()
        const rimGrad = ctx.createRadialGradient(
          ox,
          oy,
          Math.max(0, irisR - 26),
          ox,
          oy,
          irisR + 18,
        )
        rimGrad.addColorStop(0, 'rgba(218, 219, 213, 0)')
        rimGrad.addColorStop(0.55, 'rgba(191, 245, 89, 0.34)')
        rimGrad.addColorStop(0.78, 'rgba(255, 255, 255, 0.55)')
        rimGrad.addColorStop(1, 'rgba(191, 245, 89, 0)')
        ctx.fillStyle = rimGrad
        ctx.beginPath()
        ctx.arc(ox, oy, irisR + 18, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // 5. Agujas prismáticas de luz disparadas desde la intersección (#BFF559)
      if (sparks.length > 0) {
        ctx.save()
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i]
          s.x += s.vx * dt
          s.y += s.vy * dt
          const dragFactor = Math.pow(s.drag, dt)
          s.vx *= dragFactor
          s.vy *= dragFactor
          s.life -= s.decay * dt

          if (s.life <= 0) {
            sparks.splice(i, 1)
            continue
          }

          const speed = Math.hypot(s.vx, s.vy) || 0.001
          const ux = s.vx / speed
          const uy = s.vy / speed
          const tailLen = s.len * s.life * (0.4 + speed * 0.16)

          ctx.strokeStyle = s.color
          ctx.globalAlpha = Math.min(1, s.life * 1.25)
          ctx.lineWidth = s.width
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(s.x - ux * tailLen, s.y - uy * tailLen)
          ctx.lineTo(s.x + ux * 2, s.y + uy * 2)
          ctx.stroke()
        }
        ctx.restore()
      }

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [syncRef])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-30 h-full w-full"
      style={{ opacity }}
      aria-hidden="true"
    />
  )
}
