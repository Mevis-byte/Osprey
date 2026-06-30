import type React from 'react'
import { Globe, Map, Satellite, BarChart3 } from 'lucide-react'
import { useAppStore } from '@/store'
import type { ProjectionMode } from '@/types'

const MODES: { key: ProjectionMode; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'globe', label: 'Globe Mode', shortLabel: 'Globe', icon: Globe },
  { key: 'flat', label: 'Flat Mode', shortLabel: 'Flat', icon: Map },
  { key: 'space', label: 'Space Mode', shortLabel: 'Space', icon: Satellite },
  { key: 'analytics', label: 'Analytics Mode', shortLabel: 'Analytics', icon: BarChart3 },
]

export function ViewModeSelector() {
  const projectionMode = useAppStore((s) => s.projectionMode)
  const setProjectionMode = useAppStore((s) => s.setProjectionMode)

  return (
    <div className="flex items-center gap-0.5 rounded-[2px] border border-border/60 bg-background/60 p-0.5">
      {MODES.map(({ key, label, icon: Icon }) => {
        const isActive = projectionMode === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => setProjectionMode(key)}
            title={label}
            className={`flex items-center gap-1 rounded-[1px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all ${
              isActive
                ? 'bg-cyan-500/15 text-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.15)]'
                : 'text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-accent/20'
            }`}
          >
            <Icon className="h-3 w-3" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
