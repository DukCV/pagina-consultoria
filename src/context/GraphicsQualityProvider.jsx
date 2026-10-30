import { useGraphicsGovernor } from '../hooks/useGraphicsGovernor'
import { GraphicsQualityContext } from './graphicsQuality'

/**
 * Proveedor único del nivel de calidad gráfica de toda la página. El hero y la sección de servicios
 * comparten el mismo veredicto: una degradación detectada en uno protege también al otro.
 */
export default function GraphicsQualityProvider({ prefersReducedMotion, isReady, children }) {
  const graphics = useGraphicsGovernor({ prefersReducedMotion, isReady })
  return (
    <GraphicsQualityContext.Provider value={graphics}>{children}</GraphicsQualityContext.Provider>
  )
}
