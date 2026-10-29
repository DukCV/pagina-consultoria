import { useEffect, useRef, useState } from 'react'
import { BRAND_COLORS, RING_METRICS } from '../assets/overlayerGeometry'
import IsometricBlueprintGrid from './IsometricBlueprintGrid'
import OverlayerLogoRig from './OverlayerLogoRig'
import SplashAtmosphereCanvas from './SplashAtmosphereCanvas'

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const lerp = (a, b, t) => a + (b - a) * t
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5)
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const easeInOutQuart = (t) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2

/**
 * Curva magnética con micro-asentamiento elástico al encajar ambos anillos.
 */
function magneticConvergence(t) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  if (t < 0.82) {
    const u = t / 0.82
    return easeInOutQuart(u) * 1.022
  }
  const settleU = (t - 0.82) / 0.18
  return 1 + 0.022 * Math.cos(settleU * Math.PI * 1.5) * (1 - settleU)
}

const TOTAL_INTRO_SECONDS = 3.85

export default function OverlayerSplash({
  logoAnchorRef,
  onSettled,
  exitState,
}) {
  const [frame, setFrame] = useState(() => ({
    elapsed: 0,
    blueprintGrid: 0,
    traceProgress: 0,
    fillOpacity: 0,
    wireframeOpacity: 1,
    echoSpread: 0,
    prismFlash: 0,
    irisProgress: 0,
    irisClip: 'circle(0px at 50% 50%)',
    irisVisible: false,
    symbolX: RING_METRICS.centerStageSymbolX,
    symbolScale: 1.28,
    ringScale: 0.88,
    upperOffset: { x: 0, y: -96 },
    lowerOffset: { x: 0, y: 96 },
    glyphProgresses: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    sheenProgress: -1,
    tiltX: 0,
    tiltY: 0,
    settled: false,
  }))

  const studioSvgRef = useRef(null)
  const ignitionOriginRef = useRef(null)
  const settledNotifiedRef = useRef(false)
  const onSettledRef = useRef(onSettled)
  const exitStateRef = useRef(exitState)

  const pointerTargetRef = useRef({ nx: 0, ny: 0, px: 0, py: 0, active: false })
  const pointerSmoothRef = useRef({ nx: 0, ny: 0 })

  useEffect(() => {
    onSettledRef.current = onSettled
  }, [onSettled])

  useEffect(() => {
    exitStateRef.current = exitState
  }, [exitState])

  // Estado compartido sin re-renders para el motor Canvas 60/120fps
  const canvasSyncRef = useRef({
    elapsed: 0,
    runId: 0,
    irisOrigin: { x: 0, y: 0 },
    irisRadius: 0,
    pointer: { x: 0, y: 0, active: false },
  })

  // Seguimiento suave de puntero para paralaje multicapa 3D durante la bienvenida
  useEffect(() => {
    const onPointerMove = (e) => {
      const vw = window.innerWidth || 1
      const vh = window.innerHeight || 1
      pointerTargetRef.current.nx = (e.clientX / vw) * 2 - 1
      pointerTargetRef.current.ny = (e.clientY / vh) * 2 - 1
      pointerTargetRef.current.px = e.clientX
      pointerTargetRef.current.py = e.clientY
      pointerTargetRef.current.active = true
    }
    const onPointerLeave = () => {
      pointerTargetRef.current.nx = 0
      pointerTargetRef.current.ny = 0
      pointerTargetRef.current.active = false
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  // Reloj maestro de coreografía de bienvenida
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    let startTime = null
    ignitionOriginRef.current = null
    settledNotifiedRef.current = false
    let rafId = 0

    const tick = (now) => {
      if (startTime === null) startTime = now
      const t = prefersReduced ? 4.2 : Math.max(0, (now - startTime) / 1000)

      const currentExit = exitStateRef.current
      const parallaxDamp = currentExit?.isActive
        ? currentExit.parallaxDamping
        : 1

      // Suavizado exponencial del puntero
      const ptr = pointerTargetRef.current
      const sm = pointerSmoothRef.current
      sm.nx += (ptr.nx - sm.nx) * 0.075
      sm.ny += (ptr.ny - sm.ny) * 0.075

      // Acto I: Retícula isométrica y trazado láser perimetral
      const blueprintGrid = easeOutQuint(clamp01(t / 1.05))
      const traceProgress = easeInOutCubic(clamp01((t - 0.1) / 0.92))
      const ringScale = lerp(0.88, 1.0, easeOutQuint(clamp01((t - 0.08) / 1.05)))

      // Acto II: Materialización dimensional, ecos arquitectónicos y convergencia magnética
      const fillOpacity = easeOutQuint(clamp01((t - 0.78) / 0.56))
      const echoIn = easeOutQuint(clamp01((t - 0.82) / 0.45))
      const echoOut = 1 - easeInOutCubic(clamp01((t - 1.58) / 0.46))
      const echoSpread = echoIn * echoOut

      const convRaw = clamp01((t - 1.06) / 0.98)
      const conv = magneticConvergence(convRaw)
      const wireframeOpacity = 1 - easeOutQuint(clamp01((t - 1.92) / 0.42))

      // Acto III: Ignición del prisma lima (#BFF559) y onda diurna (#DADBD5)
      let prismFlash = 0
      if (t >= 2.0 && t < 2.07) {
        prismFlash = (t - 2.0) / 0.07
      } else if (t >= 2.07 && t < 2.68) {
        prismFlash = 1 - easeOutQuint((t - 2.07) / 0.61)
      }

      const irisRaw = clamp01((t - 2.06) / 0.92)
      const irisProgress =
        irisRaw <= 0
          ? 0
          : irisRaw >= 1
            ? 1
            : 0.35 * easeOutQuint(irisRaw) + 0.65 * easeInOutQuart(irisRaw)

      // Acto IV: Deslizamiento de isotipo hacia lockup y ascenso de los 9 glifos de "Overlayer"
      const glide = easeOutQuint(clamp01((t - 2.28) / 1.02))
      const symbolX = lerp(
        RING_METRICS.centerStageSymbolX,
        RING_METRICS.lockupSymbolX,
        glide,
      )
      const symbolScale = lerp(1.28, 1.0, glide)

      const glyphProgresses = Array.from({ length: 9 }, (_, idx) => {
        const gStart = 2.46 + idx * 0.042
        return easeOutQuint(clamp01((t - gStart) / 0.64))
      })

      // Barrido especular inicial o barrido cinematográfico durante el vuelo hacia el header
      let sheenProgress = -1
      if (currentExit?.isActive && currentExit.flightSheen >= 0) {
        sheenProgress = currentExit.flightSheen
      } else if (t >= 3.08 && t <= 3.96) {
        sheenProgress = easeInOutCubic((t - 3.08) / 0.88)
      }

      // Acto V: Respiración orgánica sutil + paralaje diferencial amortiguado al salir
      const interactiveWeight =
        easeOutQuint(clamp01((t - 3.15) / 0.8)) * parallaxDamp
      const breath = interactiveWeight * Math.sin((t - 3.15) * 1.65) * 1.15
      const parallaxX = sm.nx * 3.8 * interactiveWeight
      const parallaxY = sm.ny * 2.6 * interactiveWeight

      const baseUpperY = lerp(-96, RING_METRICS.upperRestY, conv)
      const baseLowerY = lerp(96, RING_METRICS.lowerRestY, conv)

      const upperOffset = {
        x: parallaxX,
        y: baseUpperY - breath + parallaxY,
      }
      const lowerOffset = {
        x: -parallaxX,
        y: baseLowerY + breath - parallaxY,
      }

      // Proyección exacta a coordenadas de pantalla del epicentro de ignición del prisma (#BFF559)
      const vw = window.innerWidth || 1280
      const vh = window.innerHeight || 720
      let originPxX = vw * 0.54
      let originPxY = vh * 0.5

      if (t < 2.04 || !ignitionOriginRef.current) {
        if (studioSvgRef.current) {
          const rect = studioSvgRef.current.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            const ignitionSvgX =
              RING_METRICS.centerStageSymbolX +
              RING_METRICS.limeCentroidOffset.x * 1.28
            const ignitionSvgY =
              RING_METRICS.symbolCenterY +
              RING_METRICS.limeCentroidOffset.y * 1.28
            originPxX = rect.left + (ignitionSvgX / 1024) * rect.width
            originPxY = rect.top + (ignitionSvgY / 572) * rect.height
            if (t >= 2.02) {
              ignitionOriginRef.current = { x: originPxX, y: originPxY }
            }
          }
        }
      } else {
        originPxX = ignitionOriginRef.current.x
        originPxY = ignitionOriginRef.current.y
      }

      const maxCornerDist =
        Math.hypot(
          Math.max(originPxX, vw - originPxX),
          Math.max(originPxY, vh - originPxY),
        ) * 1.06

      const irisRadiusPx = irisProgress * maxCornerDist
      const irisVisible = irisProgress > 0.0001
      const irisClip = !irisVisible
        ? `circle(0px at ${originPxX.toFixed(1)}px ${originPxY.toFixed(1)}px)`
        : irisProgress >= 0.999
          ? 'none'
          : `circle(${irisRadiusPx.toFixed(1)}px at ${originPxX.toFixed(1)}px ${originPxY.toFixed(1)}px)`

      canvasSyncRef.current.elapsed = t
      canvasSyncRef.current.irisOrigin.x = originPxX
      canvasSyncRef.current.irisOrigin.y = originPxY
      canvasSyncRef.current.irisRadius = irisRadiusPx
      canvasSyncRef.current.pointer.x = ptr.px
      canvasSyncRef.current.pointer.y = ptr.py
      canvasSyncRef.current.pointer.active = ptr.active

      const isSettled = t >= TOTAL_INTRO_SECONDS
      if (isSettled && !settledNotifiedRef.current) {
        settledNotifiedRef.current = true
        onSettledRef.current?.()
      }

      setFrame({
        elapsed: t,
        blueprintGrid,
        traceProgress,
        fillOpacity,
        wireframeOpacity,
        echoSpread,
        prismFlash,
        irisProgress,
        irisClip,
        irisVisible,
        symbolX,
        symbolScale,
        ringScale,
        upperOffset,
        lowerOffset,
        glyphProgresses,
        sheenProgress,
        tiltX: -sm.ny * 4.2 * interactiveWeight,
        tiltY: sm.nx * 5.2 * interactiveWeight,
        settled: isSettled,
      })

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const isExiting = Boolean(exitState?.isActive)
  const backdropOpacity = isExiting ? exitState.backdropOpacity : 1
  const secondaryOpacity = isExiting ? exitState.secondaryOpacity : 1

  const tiltStyle =
    Math.abs(frame.tiltX) > 0.01 || Math.abs(frame.tiltY) > 0.01
      ? {
          transform: `perspective(1200px) rotateX(${frame.tiltX.toFixed(2)}deg) rotateY(${frame.tiltY.toFixed(2)}deg)`,
        }
      : undefined

  const progressPct = Math.min(
    100,
    Math.round(clamp01(frame.elapsed / 3.45) * 100),
  )

  return (
    <div
      role="region"
      aria-label="Bienvenida de Overlayer"
      className={`fixed inset-0 z-50 select-none ${
        isExiting ? 'pointer-events-none overflow-visible' : 'overflow-hidden'
      }`}
      style={{
        backgroundColor:
          frame.irisProgress < 0.999 ? BRAND_COLORS.obsidianVoid : 'transparent',
      }}
    >
      {/* =====================================================================
          MUNDO 1 (ACTO I – II): CÁMARA ARQUITECTÓNICA BLUEPRINT NOCTURNA
      ===================================================================== */}
      {frame.irisProgress < 0.999 && (
        <section
          className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
          style={{
            background: `radial-gradient(circle at 50% 48%, #1B1F36 0%, ${BRAND_COLORS.obsidianVoid} 58%, ${BRAND_COLORS.obsidianDeep} 100%)`,
          }}
          aria-hidden="true"
        >
          <div
            className="pointer-events-none absolute h-[52vmin] w-[52vmin] -translate-y-12 rounded-full blur-[95px]"
            style={{
              background: 'rgba(94, 99, 168, 0.28)',
              opacity: Math.min(1, frame.elapsed * 1.2),
            }}
          />
          <div
            className="pointer-events-none absolute h-[48vmin] w-[48vmin] translate-y-14 rounded-full blur-[95px]"
            style={{
              background: 'rgba(53, 151, 113, 0.22)',
              opacity: Math.min(1, frame.elapsed * 1.2),
            }}
          />

          <IsometricBlueprintGrid
            mode="dark"
            drawProgress={frame.blueprintGrid}
            opacity={0.92}
          />

          <div className="ov-grain-overlay pointer-events-none absolute inset-0 opacity-[0.045]" />

          <div className="relative z-10 flex w-full items-center justify-center sm:px-8">
            <div className="flex w-[112%] shrink-0 min-w-0 justify-center sm:w-[92%] sm:max-w-[940px]">
              <OverlayerLogoRig
                variant="blueprint"
                symbolX={frame.symbolX}
                symbolScale={frame.symbolScale}
                ringScale={frame.ringScale}
                upperOffset={frame.upperOffset}
                lowerOffset={frame.lowerOffset}
                traceProgress={frame.traceProgress}
                fillOpacity={frame.fillOpacity}
                wireframeOpacity={frame.wireframeOpacity}
                echoSpread={frame.echoSpread}
                prismFlash={frame.prismFlash}
                tiltStyle={tiltStyle}
              />
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          MUNDO 2 (ACTO III – V + SALIDA COMPARTIDA AL HEADER):
          El fondo y elementos secundarios se disuelven independientemente
          mientras el logotipo viaja físicamente hacia el header principal.
      ===================================================================== */}
      <section
        className={`ov-gpu absolute inset-0 z-20 flex items-center justify-center ${
          isExiting ? 'overflow-visible' : 'overflow-hidden'
        }`}
        style={{
          clipPath: isExiting ? 'none' : frame.irisClip,
          visibility: frame.irisVisible || isExiting ? 'visible' : 'hidden',
        }}
      >
        {/* Capas de fondo de bienvenida con fade-out progresivo en Fase 2 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: backdropOpacity,
            background: `radial-gradient(circle at 50% 46%, ${BRAND_COLORS.stoneLight} 0%, ${BRAND_COLORS.stoneCanvas} 62%, ${BRAND_COLORS.stoneShadow} 100%)`,
          }}
        >
          <IsometricBlueprintGrid
            mode="light"
            drawProgress={1}
            opacity={(frame.settled ? 0.55 : 0.85) * secondaryOpacity}
          />

          <div className="ov-grain-overlay pointer-events-none absolute inset-0 opacity-[0.032] mix-blend-multiply" />
        </div>

        {/* Marcas sutiles de encuadre editorial en las 4 esquinas */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-5 sm:inset-8"
          style={{ opacity: secondaryOpacity }}
        >
          <span className="absolute left-0 top-0 h-3 w-3 border-l border-t border-[#483D3B]/20" />
          <span className="absolute right-0 top-0 h-3 w-3 border-r border-t border-[#483D3B]/20" />
          <span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-[#483D3B]/20" />
          <span className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-[#483D3B]/20" />
        </div>

        {/* Ancla estática de medición + contenedor GPU de vuelo compartido (FLIP) */}
        <div className="relative z-10 flex w-full items-center justify-center sm:px-8">
          <div className="flex w-[112%] shrink-0 min-w-0 justify-center sm:w-[92%] sm:max-w-[940px]">
            <div
              ref={logoAnchorRef}
              className="w-full max-w-[940px] aspect-[1024/572]"
            >
              <div
                className="ov-gpu h-full w-full"
                style={{
                  transform: isExiting ? exitState.logoTransform : undefined,
                  transformOrigin: exitState?.logoTransformOrigin,
                  opacity: isExiting ? exitState.splashLogoOpacity : 1,
                }}
              >
                <OverlayerLogoRig
                  ref={studioSvgRef}
                  variant="studio"
                  symbolX={frame.symbolX}
                  symbolScale={frame.symbolScale}
                  ringScale={frame.ringScale}
                  upperOffset={frame.upperOffset}
                  lowerOffset={frame.lowerOffset}
                  traceProgress={1}
                  fillOpacity={1}
                  wireframeOpacity={0}
                  echoSpread={frame.echoSpread}
                  prismFlash={frame.prismFlash}
                  glyphProgresses={frame.glyphProgresses}
                  sheenProgress={frame.sheenProgress}
                  tiltStyle={tiltStyle}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CAPA 3: MOTOR DE PARTÍCULAS Y ONDAS DE CHOQUE ISOMÉTRICAS (CANVAS)
      ===================================================================== */}
      <SplashAtmosphereCanvas
        syncRef={canvasSyncRef}
        opacity={secondaryOpacity}
      />

      {/* =====================================================================
          PIE DE ESTADO DE BIENVENIDA (SE DISUELVE SUAVEMENTE AL INICIAR SALIDA)
      ===================================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex flex-col items-center justify-center gap-3 px-6 sm:bottom-9"
        style={{ opacity: secondaryOpacity }}
      >
        <div
          className="flex flex-col items-center gap-2 transition-all duration-700"
          style={{
            opacity: frame.settled ? 0 : Math.min(1, frame.elapsed / 0.45),
            transform: frame.settled ? 'translateY(8px)' : 'translateY(0px)',
          }}
        >
          <div className="h-[2px] w-40 overflow-hidden rounded-full bg-white/15 backdrop-blur-xs">
            <div
              className="h-full rounded-full transition-none"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${BRAND_COLORS.indigoLight}, ${BRAND_COLORS.emeraldLight}, ${BRAND_COLORS.lime})`,
              }}
            />
          </div>
          <span
            className="text-[10px] font-medium tracking-[0.28em] uppercase transition-colors duration-300"
            style={{
              color:
                frame.irisProgress > 0.55
                  ? 'rgba(72, 61, 59, 0.55)'
                  : 'rgba(218, 219, 213, 0.55)',
            }}
          >
            {progressPct < 100
              ? `Sincronizando capas · ${String(progressPct).padStart(2, '0')}%`
              : 'Bienvenido'}
          </span>
        </div>

        <div
          className="flex items-center justify-center gap-2.5 text-[11px] font-medium tracking-[0.24em] text-[#483D3B]/65 uppercase transition-all duration-700"
          style={{
            opacity: frame.settled ? 1 : 0,
            transform: frame.settled ? 'translateY(0px)' : 'translateY(10px)',
          }}
        >
          <span
            className="inline-block h-2 w-2 rotate-45"
            style={{ backgroundColor: BRAND_COLORS.emerald }}
          />
          <span>Bienvenido · Consultoría Estratégica</span>
        </div>
      </div>
    </div>
  )
}
