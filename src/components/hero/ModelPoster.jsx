/**
 * Render 2D de un modelo 3D (alternativa de alta calidad y estado de carga). WebP responsive
 * con respaldo PNG; tiene la misma relación de aspecto que el canvas para no producir saltos.
 */
export default function ModelPoster({ poster, className = '' }) {
  return (
    <picture className="contents">
      <source type="image/webp" srcSet={poster.webpSrcSet} sizes={poster.sizes} />
      <img
        src={poster.fallbackSrc}
        alt=""
        decoding="async"
        draggable={false}
        className={`pointer-events-none h-full w-full object-contain select-none ${className}`}
      />
    </picture>
  )
}
