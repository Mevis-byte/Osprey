import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Satellite, Crosshair, Bell, Clock } from 'lucide-react'
import { useAppStore } from '@/store'
import { ViewModeSelector } from '@/components/ViewModeSelector'

function useUtcClock() {
  const [time, setTime] = useState(new Date().toISOString().slice(11, 19))

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toISOString().slice(11, 19))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return time
}

function StatusDot() {
  return (
    <motion.span
      className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"
      animate={{ opacity: [1, 0.4, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.span
        className="absolute inset-0 rounded-full bg-emerald-500"
        animate={{ scale: [1, 2], opacity: [0.35, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.span>
  )
}

function TopBar() {
  const utcTime = useUtcClock()
  const alerts = useAppStore((s) => s.alerts)
  const assetData = useAppStore((s) => s.assetData)
  const operationalMode = useAppStore((s) => s.operationalMode)
  const setOperationalMode = useAppStore((s) => s.setOperationalMode)

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between border-b border-border bg-card px-3"
      style={{ height: 32 }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-primary/10 border border-primary/20">
            <Satellite className="h-2.5 w-2.5 text-primary" />
          </div>
          <span className="text-xs font-black tracking-[0.2em] text-primary">OSPREY</span>
        </div>

        <span className="h-3 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold tracking-widest text-muted-foreground/40 uppercase">NODE:</span>
          <span className="text-[10px] font-bold tracking-wider text-foreground/80">GEOINT-01</span>
        </div>

        <span className="h-3 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold tracking-widest text-muted-foreground/40 uppercase">MODE:</span>
          <select 
            value={operationalMode}
            onChange={(e) => setOperationalMode(e.target.value as any)}
            className="bg-transparent text-[10px] font-bold tracking-wider text-cyan-400 uppercase outline-none cursor-pointer hover:text-cyan-300 transition-colors"
          >
            <option value="global-surveillance">Global Surveillance</option>
            <option value="space-operations">Space Operations</option>
            <option value="maritime-operations">Maritime Operations</option>
            <option value="tactical-operations">Tactical Operations</option>
          </select>
        </div>

        <span className="h-3 w-px bg-white/10" />

        <ViewModeSelector />

        <span className="h-3 w-px bg-white/10" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <StatusDot />
            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">System Nominal</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Crosshair className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] tabular-nums text-foreground">{assetData.length}</span>
          <span className="text-[10px] text-muted-foreground">TRACKS</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Bell className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] tabular-nums text-foreground">{alerts.length}</span>
          <span className="text-[10px] text-muted-foreground">ALERTS</span>
        </div>

        <span className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-[11px] tabular-nums tracking-wider text-foreground">
            {utcTime}
          </span>
          <span className="text-[10px] text-muted-foreground">Z</span>
        </div>
      </div>
    </motion.header>
  )
}

export default TopBar
