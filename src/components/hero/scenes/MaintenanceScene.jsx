import EvolutionCard from './maintenance/EvolutionCard'
import ExplodedPlatform from './maintenance/ExplodedPlatform'
import SatelliteModules from './maintenance/SatelliteModules'
import StageFloor from './maintenance/StageFloor'
import UpdateStatusCard from './maintenance/UpdateStatusCard'

/**
 * Diapositiva 06 — Mantenimiento y mejoras.
 * Plataforma de software en vista explosionada (interfaz, módulos y motor de engranajes)
 * flotando sobre un ciclo de mejora continua, con módulos satélite que migran a su versión
 * modernizada y tarjetas de progreso en primer plano. Sin texto: la composición comunica
 * mantenimiento, optimización y evolución de sistemas existentes.
 */
export default function MaintenanceScene() {
  return (
    <div
      aria-hidden="true"
      className="ov-preserve-3d relative flex h-full w-full items-center justify-center select-none"
    >
      {/* PLANO HORIZONTE (Z: -85px) — Luz ambiental, sombra de contacto y suelo técnico */}
      <div className="ov-plane-horizon pointer-events-none absolute inset-0 flex items-center justify-center">
        <StageFloor />
      </div>

      {/* PLANO POSTERIOR (Z: -34px) — Módulos satélite conectados y ruta de migración */}
      <div className="ov-plane-back pointer-events-none absolute inset-0 flex items-center justify-center">
        <SatelliteModules />
      </div>

      {/* PLANO PRINCIPAL (Z: +28px) — Plataforma explosionada en tres capas */}
      <div className="ov-plane-mid pointer-events-none relative flex h-full w-full items-center justify-center">
        <ExplodedPlatform />
      </div>

      {/* PLANO MEDIO-FRONTAL (Z: +54px) — Línea de evolución de versiones */}
      <div className="ov-plane-front-mid pointer-events-none absolute inset-0">
        <EvolutionCard />
      </div>

      {/* PRIMER PLANO (Z: +78px) — Actualización completada */}
      <div className="ov-plane-front pointer-events-none absolute inset-0">
        <UpdateStatusCard />
      </div>
    </div>
  )
}
