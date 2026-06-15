import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'
import { computeAnalytics } from '@/services/analytics'
import type { RegionAnalytics } from '@/services/analytics'
import type { Mission } from '@/types'

const BAR_COLS = 12

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const filled = Math.round(pct * BAR_COLS)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-px">
        {Array.from({ length: BAR_COLS }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-[1px] ${
              i < filled ? color : 'bg-muted/20'
            }`}
          />
        ))}
      </div>
      <span className="w-4 text-right text-[9px] tabular-nums text-muted-foreground/70">
        {value}
      </span>
    </div>
  )
}

function RegionCard({ region, max }: { region: RegionAnalytics; max: RegionAnalytics }) {
  return (
    <div className="rounded-[2px] border border-border/60 px-3 py-2">
      <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
        {region.name}
      </h3>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
          <span>Assets</span>
        </div>
        <StatBar value={region.assetCount} max={max.assetCount} color="bg-cyan-500" />

        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
          <span>Threats</span>
        </div>
        <StatBar value={region.threatCount} max={max.threatCount || 1} color="bg-red-500" />

        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
          <span>Missions</span>
        </div>
        <StatBar value={region.missionCount} max={max.missionCount || 1} color="bg-amber-500" />

        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
          <span>Alerts</span>
        </div>
        <StatBar value={region.alertCount} max={max.alertCount || 1} color="bg-violet-500" />
      </div>
    </div>
  )
}

function MissionItem({ mission }: { mission: Mission }) {
  const setSelectedMission = useAppStore((s) => s.setSelectedMission)
  const setSelectedAsset = useAppStore((s) => s.setSelectedAsset)
  const selectedMissionId = useAppStore((s) => s.selectedMission?.id ?? null)

  const statusColor: Record<string, string> = {
    'in-progress': 'bg-emerald-500',
    pending: 'bg-amber-500',
    standby: 'bg-yellow-500',
    completed: 'bg-blue-500',
    aborted: 'bg-red-500',
    cancelled: 'bg-slate-500',
  }

  const isSelected = selectedMissionId === mission.id

  return (
    <motion.button
      type="button"
      onClick={() => {
        setSelectedAsset(null)
        setSelectedMission(mission)
      }}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className={`w-full rounded-[2px] border px-3 py-2 text-left transition-colors ${
        isSelected
          ? 'border-primary/30 bg-primary/5'
          : 'border-border/60 hover:border-muted-foreground/30'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColor[mission.status] ?? 'bg-slate-500'}`} />
        <h4 className="truncate text-[11px] font-medium text-foreground/90">{mission.name}</h4>
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-[9px] text-muted-foreground/60">
        <span>{mission.region}</span>
        <span className="text-muted-foreground/30">·</span>
        <span className="capitalize">{mission.status.replace('-', ' ')}</span>
      </div>
    </motion.button>
  )
}

function RegionalIntel() {
  const assets = useAppStore((s) => s.assetData)
  const alerts = useAppStore((s) => s.alerts)
  const missions = useAppStore((s) => s.missions)

  const analytics = useMemo(() => computeAnalytics(assets, alerts, missions), [assets, alerts, missions])

  const max = useMemo<RegionAnalytics>(() => {
    const m: RegionAnalytics = { key: '', name: '', assetCount: 0, threatCount: 0, missionCount: 0, alertCount: 0 }
    for (const r of analytics) {
      if (r.assetCount > m.assetCount) m.assetCount = r.assetCount
      if (r.threatCount > m.threatCount) m.threatCount = r.threatCount
      if (r.missionCount > m.missionCount) m.missionCount = r.missionCount
      if (r.alertCount > m.alertCount) m.alertCount = r.alertCount
    }
    return m
  }, [analytics])

  const activeMissions = useMemo(() => missions.filter((m) => m.status !== 'completed' && m.status !== 'cancelled'), [missions])

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <span className="h-3 w-px bg-muted-foreground/20" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
            Regional Analytics
          </span>
        </div>
        {analytics.map((region) => (
          <RegionCard key={region.key} region={region} max={max} />
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <span className="h-3 w-px bg-muted-foreground/20" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
            Active Missions
          </span>
        </div>
        {activeMissions.length === 0 ? (
          <p className="px-1 text-[10px] text-muted-foreground/50">No active missions</p>
        ) : (
          <div className="space-y-1">
            {activeMissions.map((mission) => (
              <MissionItem key={mission.id} mission={mission} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RegionalIntel
