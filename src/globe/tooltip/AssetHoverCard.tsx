import { motion } from 'framer-motion'
import type { Asset, Satellite, Aircraft } from '@/types'
import { Gauge, Navigation, Shield, Zap } from 'lucide-react'

interface Props {
  asset: Asset
  x: number
  y: number
}

export function AssetHoverCard({ asset, x, y }: Props) {
  const isSatellite = asset.type === 'satellite'
  const isAircraft = asset.type === 'fixed-wing' || asset.type === 'rotary-wing'
  
  const getSpecifics = () => {
    if (isSatellite) {
      const s = asset as Satellite
      return [
        { label: 'Inclination', value: `${s.inclination}°` },
        { label: 'Period', value: `${s.period}m` },
      ]
    }
    if (isAircraft) {
      const a = asset as Aircraft
      return [
        { label: 'Callsign', value: a.callsign },
        { label: 'Fuel', value: `${(a.fuelLevel * 100).toFixed(0)}%` },
      ]
    }
    return []
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 5 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none absolute z-[100] w-64 overflow-hidden rounded-sm border border-white/10 bg-card/95 shadow-2xl backdrop-blur-md"
      style={{ left: x + 15, top: y - 10 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-3 py-2">
        <div>
          <h3 className="text-[12px] font-bold tracking-tight text-foreground/90">{asset.name}</h3>
          <p className="text-[9px] uppercase tracking-widest text-cyan-400/80 font-semibold">{asset.type.replace('-', ' ')}</p>
        </div>
        <div className={`h-2 w-2 rounded-full shadow-[0_0_8px] ${
          asset.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'
        }`} />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-white/5">
        <StatItem icon={Gauge} label="Speed" value={isSatellite ? `${asset.speed.toFixed(1)} km/s` : `${asset.speed.toFixed(0)} kts`} />
        <StatItem icon={Navigation} label="Altitude" value={isSatellite ? `${(asset.altitude / 1000).toFixed(0)} km` : `${asset.altitude.toLocaleString()} ft`} />
        <StatItem icon={Zap} label="Heading" value={`${asset.heading.toFixed(0)}°`} />
        <StatItem icon={Shield} label="Status" value={asset.status.toUpperCase()} />
      </div>

      {/* Specifics & Footer */}
      <div className="space-y-1.5 p-3">
        {getSpecifics().map((s) => (
          <div key={s.label} className="flex justify-between text-[10px]">
            <span className="text-muted-foreground/60 uppercase tracking-wider">{s.label}</span>
            <span className="font-mono text-foreground/80">{s.value}</span>
          </div>
        ))}
        <div className="mt-2 border-t border-white/5 pt-2 flex items-center justify-between text-[9px] text-muted-foreground/40 uppercase tracking-widest">
          <span>Operational Node 01</span>
          <span>{new Date().toISOString().slice(11, 19)} UTC</span>
        </div>
      </div>
    </motion.div>
  )
}

function StatItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-card p-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{label}</span>
      </div>
      <div className="font-mono text-[11px] font-medium text-foreground/90">{value}</div>
    </div>
  )
}
