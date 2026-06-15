import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Satellite, Crosshair, Bell, Clock } from 'lucide-react'
import { useAppStore } from '@/store'

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

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between border-b border-border bg-card px-3"
      style={{ height: 32 }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Satellite className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-bold tracking-[0.15em] text-primary">OSPREY</span>
        </div>

        <span className="h-4 w-px bg-border" />

        <span className="text-[10px] font-medium tracking-wider text-muted-foreground">
          GEOINT NODE-01
        </span>

        <span className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <StatusDot />
            <span className="text-[10px] text-muted-foreground">SYS OK</span>
          </div>
          <div className="flex items-center gap-1">
            <StatusDot />
            <span className="text-[10px] text-muted-foreground">NET OK</span>
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
