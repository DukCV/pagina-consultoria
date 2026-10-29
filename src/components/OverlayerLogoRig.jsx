import { forwardRef, useId } from 'react'
import {
  BRAND_COLORS,
  LIME_PRISM_PATH,
  RING_COMPOUND_PATH,
  RING_INNER_CW_PATH,
  RING_METRICS,
  RING_OUTER_PATH,
  WORDMARK_GLYPHS,
  WORDMARK_ORIGIN,
} from '../assets/overlayerGeometry'

/**
 * Rig vectorial maestro del logotipo Overlayer.
 * Calcula en tiempo real la intersección booleana del prisma lima (#BFF559)
 * mediante <clipPath> anidados sincronizados con ambos anillos isométricos.
 */
const OverlayerLogoRig = forwardRef(function OverlayerLogoRig(
  {
    variant = 'studio', // 'blueprint' | 'studio'
    symbolX = RING_METRICS.lockupSymbolX,
    symbolY = RING_METRICS.symbolCenterY,
    symbolScale = 1,
    upperOffset = { x: 0, y: RING_METRICS.upperRestY },
    lowerOffset = { x: 0, y: RING_METRICS.lowerRestY },
    ringScale = 1,
    traceProgress = 1,
    fillOpacity = 1,
    wireframeOpacity = 0,
    echoSpread = 0, // 0..1 separación de capas fantasma ("over-layers")
    prismFlash = 0, // 0..1 destello en el instante de colisión
    glyphProgresses = [1, 1, 1, 1, 1, 1, 1, 1, 1],
    sheenProgress = -1, // -1 inactivo, 0..1 barrido especular
    tiltStyle = undefined,
  },
  ref,
) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const pfx = `ov-${variant}-${rawId}`

  const upperClipId = `${pfx}-clip-upper`
  const lowerClipId = `${pfx}-clip-lower`
  const wordmarkMaskId = `${pfx}-wm-clip`
  const indigoGradId = `${pfx}-ind-grad`
  const emeraldGradId = `${pfx}-em-grad`
  const symSheenGradId = `${pfx}-sym-sheen`
  const wmSheenGradId = `${pfx}-wm-sheen`
  const glowFilterId = `${pfx}-prism-glow`

  const isBlueprint = variant === 'blueprint'

  const upperTransform = `translate(${upperOffset.x.toFixed(2)}, ${upperOffset.y.toFixed(2)}) scale(${ringScale.toFixed(4)})`
  const lowerTransform = `translate(${lowerOffset.x.toFixed(2)}, ${lowerOffset.y.toFixed(2)}) scale(${ringScale.toFixed(4)})`

  const dashOffset = Math.max(0, 1 - traceProgress) * 1000
  const showSheen = sheenProgress >= 0 && sheenProgress <= 1
  // Coordenada global del barrido de luz (X: 110 -> 960 en el lienzo 1024×572)
  const globalSheenX = 110 + sheenProgress * 860
  const symSheenX = (globalSheenX - symbolX) / symbolScale
  const wmSheenX = globalSheenX - WORDMARK_ORIGIN.x

  return (
    <svg
      ref={ref}
      width="1024"
      height="572"
      viewBox="0 0 1024 572"
      preserveAspectRatio="xMidYMid meet"
      className="ov-gpu w-full max-w-[940px] h-auto select-none overflow-visible"
      style={tiltStyle}
      role="img"
      aria-label="Overlayer Consultoría"
    >
      <defs>
        {/* Recortes booleanos dinámicos de ambos anillos para tallar el prisma lima en vivo */}
        <clipPath id={upperClipId}>
          <path d={RING_COMPOUND_PATH} transform={upperTransform} clipRule="evenodd" />
        </clipPath>
        <clipPath id={lowerClipId}>
          <path d={RING_COMPOUND_PATH} transform={lowerTransform} clipRule="evenodd" />
        </clipPath>

        {/* Ventana arquitectónica de emergencia para los 9 glifos de "Overlayer" */}
        <clipPath id={wordmarkMaskId}>
          <rect x="0" y="14" width="475" height="106" />
        </clipPath>

        {/* Gradientes dimensionales para el acto Blueprint nocturno */}
        <linearGradient id={indigoGradId} x1="-100" y1="-65" x2="100" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#656BC2" />
          <stop offset="55%" stopColor="#3B3E69" />
          <stop offset="100%" stopColor="#282B4D" />
        </linearGradient>

        <linearGradient id={emeraldGradId} x1="-100" y1="65" x2="100" y2="-65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#267A5A" />
          <stop offset="50%" stopColor="#359771" />
          <stop offset="100%" stopColor="#58D8A5" />
        </linearGradient>

        {/* Barrido especular continuo de izquierda a derecha sobre isotipo y logotipo */}
        <linearGradient
          id={symSheenGradId}
          x1={symSheenX - 60}
          y1="-110"
          x2={symSheenX + 60}
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <linearGradient
          id={wmSheenGradId}
          x1={wmSheenX - 55}
          y1="20"
          x2={wmSheenX + 55}
          y2="115"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFFDF7" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <filter id={glowFilterId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* =====================================================================
          ISOTIPO INTERLOCKING DE OVERLAYER
      ===================================================================== */}
      <g
        transform={`translate(${symbolX.toFixed(2)}, ${symbolY.toFixed(2)}) scale(${symbolScale.toFixed(4)})`}
      >
        {/* Capas fantasma arquitectónicas ("Over-layers") durante la convergencia */}
        {echoSpread > 0.005 && (
          <g pointerEvents="none">
            {[2, 1].map((layerIdx) => {
              const dist = echoSpread * layerIdx * 24
              const alpha = echoSpread * (layerIdx === 1 ? 0.28 : 0.13)
              return (
                <g key={layerIdx}>
                  <path
                    d={RING_COMPOUND_PATH}
                    fillRule="evenodd"
                    transform={`translate(${lowerOffset.x.toFixed(2)}, ${(lowerOffset.y + dist).toFixed(2)}) scale(${(ringScale * (1 - layerIdx * 0.025 * echoSpread)).toFixed(4)})`}
                    fill={isBlueprint ? 'rgba(73, 199, 150, 0.14)' : 'rgba(53, 151, 113, 0.12)'}
                    stroke={BRAND_COLORS.emeraldLight}
                    strokeWidth="1"
                    opacity={alpha}
                  />
                  <path
                    d={RING_COMPOUND_PATH}
                    fillRule="evenodd"
                    transform={`translate(${upperOffset.x.toFixed(2)}, ${(upperOffset.y - dist).toFixed(2)}) scale(${(ringScale * (1 - layerIdx * 0.025 * echoSpread)).toFixed(4)})`}
                    fill={isBlueprint ? 'rgba(110, 117, 209, 0.16)' : 'rgba(59, 62, 105, 0.12)'}
                    stroke={BRAND_COLORS.indigoLight}
                    strokeWidth="1"
                    opacity={alpha}
                  />
                </g>
              )
            })}
          </g>
        )}

        {/* CAPA INFERIOR: Anillo Esmeralda (#359771) */}
        <g transform={lowerTransform}>
          {fillOpacity > 0.002 && (
            <path
              d={RING_COMPOUND_PATH}
              fillRule="evenodd"
              fill={isBlueprint ? `url(#${emeraldGradId})` : BRAND_COLORS.emerald}
              opacity={fillOpacity}
            />
          )}
          {wireframeOpacity > 0.005 && (
            <g opacity={wireframeOpacity}>
              <path
                d={RING_OUTER_PATH}
                fill="none"
                pathLength="1000"
                stroke={BRAND_COLORS.emeraldLight}
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeDasharray="1000"
                strokeDashoffset={dashOffset}
              />
              <path
                d={RING_INNER_CW_PATH}
                fill="none"
                pathLength="1000"
                stroke={BRAND_COLORS.lime}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeDasharray="1000"
                strokeDashoffset={dashOffset}
                opacity="0.85"
              />
            </g>
          )}
        </g>

        {/* CAPA SUPERIOR: Anillo Índigo (#3B3E69) — se superpone en el cruce izquierdo */}
        <g transform={upperTransform}>
          {fillOpacity > 0.002 && (
            <path
              d={RING_COMPOUND_PATH}
              fillRule="evenodd"
              fill={isBlueprint ? `url(#${indigoGradId})` : BRAND_COLORS.indigo}
              opacity={fillOpacity}
            />
          )}
          {wireframeOpacity > 0.005 && (
            <g opacity={wireframeOpacity}>
              <path
                d={RING_OUTER_PATH}
                fill="none"
                pathLength="1000"
                stroke="#858CE0"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeDasharray="1000"
                strokeDashoffset={dashOffset}
              />
              <path
                d={RING_INNER_CW_PATH}
                fill="none"
                pathLength="1000"
                stroke="#C5CAFF"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeDasharray="1000"
                strokeDashoffset={dashOffset}
                opacity="0.85"
              />
            </g>
          )}
        </g>

        {/* INTERSECCIÓN BOOLEANA VIVA (x > 0): Prisma Lima Eléctrico (#BFF559) */}
        {fillOpacity > 0.02 && (
          <g clipPath={`url(#${upperClipId})`}>
            <g clipPath={`url(#${lowerClipId})`}>
              <rect
                x="0"
                y="-150"
                width="160"
                height="300"
                fill={BRAND_COLORS.lime}
                opacity={Math.min(1, fillOpacity * 1.15)}
              />
              {prismFlash > 0.01 && (
                <rect
                  x="0"
                  y="-150"
                  width="160"
                  height="300"
                  fill="#F3FFD6"
                  opacity={prismFlash * 0.9}
                />
              )}
            </g>
          </g>
        )}

        {/* Halo energético en el instante exacto de bloqueo del prisma */}
        {prismFlash > 0.015 && (
          <g pointerEvents="none" opacity={prismFlash}>
            <path
              d={LIME_PRISM_PATH}
              fill={BRAND_COLORS.limeGlow}
              filter={`url(#${glowFilterId})`}
              opacity={prismFlash * 0.75}
            />
            <path
              d={LIME_PRISM_PATH}
              fill="none"
              stroke="#F6FFE0"
              strokeWidth={1.5 + prismFlash * 2.5}
              transform={`translate(39.2, 0) scale(${(1 + (1 - prismFlash) * 0.55).toFixed(3)}) translate(-39.2, 0)`}
            />
          </g>
        )}

        {/* Barrido especular sutil sobre el isotipo ensamblado */}
        {showSheen && (
          <g pointerEvents="none">
            <g clipPath={`url(#${lowerClipId})`}>
              <rect x="-130" y="-130" width="260" height="260" fill={`url(#${symSheenGradId})`} />
            </g>
            <g clipPath={`url(#${upperClipId})`}>
              <rect x="-130" y="-130" width="260" height="260" fill={`url(#${symSheenGradId})`} />
            </g>
          </g>
        )}
      </g>

      {/* =====================================================================
          LOGOTIPO VECTORIAL DE FUNDICIÓN "Overlayer" (9 Glifos Cinéticos)
      ===================================================================== */}
      {!isBlueprint && (
        <g
          transform={`translate(${WORDMARK_ORIGIN.x}, ${WORDMARK_ORIGIN.y})`}
          clipPath={`url(#${wordmarkMaskId})`}
        >
          {WORDMARK_GLYPHS.map((glyph, idx) => {
            const p = glyphProgresses[idx] ?? 0
            if (p <= 0.001) return null
            const ySlide = (1 - p) * 78
            const xSlide = (1 - p) * 10
            return (
              <g
                key={glyph.id}
                transform={`translate(${xSlide.toFixed(2)}, ${ySlide.toFixed(2)})`}
                opacity={Math.min(1, p * 1.35)}
              >
                <path d={glyph.d} fill={BRAND_COLORS.espresso} fillRule="evenodd" />
                {showSheen && (
                  <path d={glyph.d} fill={`url(#${wmSheenGradId})`} fillRule="evenodd" />
                )}
              </g>
            )
          })}
        </g>
      )}
    </svg>
  )
})

export default OverlayerLogoRig
