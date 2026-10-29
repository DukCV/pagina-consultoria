import { forwardRef, useId } from 'react'
import {
  BRAND_COLORS,
  LIME_PRISM_PATH,
  LOCKUP_VIEWBOX_BOUNDS,
  RING_COMPOUND_PATH,
  RING_METRICS,
  WORDMARK_GLYPHS,
  WORDMARK_ORIGIN,
} from '../assets/overlayerGeometry'

/**
 * Logotipo oficial reutilizable de Overlayer para el header principal.
 * Comparte exactamente la misma geometría CAD que el rig de bienvenida para garantizar
 * una continuidad sub-píxel sin saltos ni parpadeos al finalizar la transición.
 */
const OverlayerBrandLogo = forwardRef(function OverlayerBrandLogo(
  { className = '', isVisible = true },
  ref,
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const upperClipId = `hdr-up-${uid}`
  const lowerClipId = `hdr-lo-${uid}`

  const { x, y, width, height } = LOCKUP_VIEWBOX_BOUNDS

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`${x} ${y} ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className={`block select-none overflow-visible ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        aspectRatio: `${width} / ${height}`,
      }}
      role="img"
      aria-label="Overlayer"
    >
      <defs>
        <clipPath id={upperClipId}>
          <path
            d={RING_COMPOUND_PATH}
            transform={`translate(0, ${RING_METRICS.upperRestY})`}
            clipRule="evenodd"
          />
        </clipPath>
        <clipPath id={lowerClipId}>
          <path
            d={RING_COMPOUND_PATH}
            transform={`translate(0, ${RING_METRICS.lowerRestY})`}
            clipRule="evenodd"
          />
        </clipPath>
      </defs>

      {/* Isotipo isométrico entrelazado con respuesta sutil en hover */}
      <g
        transform={`translate(${RING_METRICS.lockupSymbolX}, ${RING_METRICS.symbolCenterY})`}
      >
        <g
          className="transition-transform duration-300 ease-out group-hover/brand:scale-[1.035]"
          style={{ transformOrigin: '0px 0px' }}
        >
          <path
            d={RING_COMPOUND_PATH}
            transform={`translate(0, ${RING_METRICS.lowerRestY})`}
            fill={BRAND_COLORS.emerald}
            fillRule="evenodd"
          />
          <path
            d={RING_COMPOUND_PATH}
            transform={`translate(0, ${RING_METRICS.upperRestY})`}
            fill={BRAND_COLORS.indigo}
            fillRule="evenodd"
          />
          <g clipPath={`url(#${upperClipId})`}>
            <g clipPath={`url(#${lowerClipId})`}>
              <rect x="0" y="-120" width="140" height="240" fill={BRAND_COLORS.lime} />
            </g>
          </g>
          {/* Destello discreto en el prisma lima al interactuar con la marca */}
          <path
            d={LIME_PRISM_PATH}
            fill="#E8FFB5"
            className="opacity-0 transition-opacity duration-300 group-hover/brand:opacity-55"
          />
        </g>
      </g>

      {/* Logotipo tipográfico vectorial "Overlayer" */}
      <g transform={`translate(${WORDMARK_ORIGIN.x}, ${WORDMARK_ORIGIN.y})`}>
        {WORDMARK_GLYPHS.map((glyph) => (
          <path
            key={glyph.id}
            d={glyph.d}
            fill={BRAND_COLORS.espresso}
            fillRule="evenodd"
          />
        ))}
      </g>
    </svg>
  )
})

export default OverlayerBrandLogo
