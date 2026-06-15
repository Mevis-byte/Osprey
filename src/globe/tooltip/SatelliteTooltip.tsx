import { motion } from 'framer-motion'
import type { Satellite } from '@/types'

interface SatelliteTooltipProps {
  asset: Satellite
  x: number
  y: number
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  standby: 'bg-yellow-500',
  offline: 'bg-red-500',
  maintenance: 'bg-orange-500',
  unknown: 'bg-gray-500',
  lost: 'bg-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'ACTIVE',
  standby: 'STANDBY',
  offline: 'OFFLINE',
  maintenance: 'MAINTENANCE',
  unknown: 'UNKNOWN',
  lost: 'LOST',
}

function formatSpeed(speed: number): string {
  if (speed > 1000) {
    return `${(speed / 3600).toFixed(1)} km/s`
  }
  return `${speed.toFixed(1)} km/s`
}

function formatAltitude(meters: number): string {
  const km = meters / 1000
  if (km >= 1000) {
    return `${(km / 1000).toFixed(1)} km`
  }
  return `${Math.round(km).toLocaleString()} km`
}

export function SatelliteTooltip({ asset, x, y }: SatelliteTooltipProps) {
  const statusColor = STATUS_COLORS[asset.status] ?? 'bg-gray-500'
  const statusLabel = STATUS_LABELS[asset.status] ?? asset.status.toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="pointer-events-none absolute z-50"
      style={{ left: x, top: y }}
    >
      <div className="min-w-44 rounded-[2px] border border-border/60 bg-[#0d1117]/95 shadow-lg backdrop-blur-sm">
        <div className="border-b border-border/40 px-3 py-2">
          <p className="truncate text-[12px] font-semibold text-foreground/90">
            {asset.name}
          </p>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">SPEED</span>
          <span className="truncate text-right text-[11px] tabular-nums text-foreground/80">
            {formatSpeed(asset.speed)}
          </span>

          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">ALTITUDE</span>
          <span className="truncate text-right text-[11px] tabular-nums text-foreground/80">
            {formatAltitude(asset.altitude)}
          </span>

          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">STATUS</span>
          <span className="flex items-center justify-end gap-1.5 text-right text-[11px] text-foreground/80">
            <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
            {statusLabel}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
