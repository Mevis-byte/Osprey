import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Target, Crosshair } from 'lucide-react'
import { useAppStore } from '@/store'
import type { Mission, ThreatLevel } from '@/types'

const statusConfig: Record<string, { label: string; color: string }> = {
  'in-progress': { label: 'In Progress', color: 'bg-emerald-500' },
  pending: { label: 'Pending', color: 'bg-amber-500' },
  standby: { label: 'Standing By', color: 'bg-yellow-500' },
  completed: { label: 'Completed', color: 'bg-blue-500' },
  aborted: { label: 'Aborted', color: 'bg-red-500' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-500' },
}

const threatColors: Record<ThreatLevel, string> = {
  critical: 'text-red-400',
  high: 'text-amber-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
  none: 'text-muted-foreground/50',
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="mb-1 flex items-center gap-2 px-1">
        <span className="h-3 w-px bg-muted-foreground/20" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
          {title}
        </span>
      </div>
      <div className="space-y-0.5 rounded-[2px] border border-border/50 bg-background/40 px-2.5 py-2">
        {children}
      </div>
    </motion.div>
  )
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="data-label">{label}</span>
      <span className="data-value font-mono">{value}</span>
    </div>
  )
}

function TimelineBar({ start, end }: { start: string; end?: string }) {
  const startMs = new Date(start).getTime()
  const endMs = end ? new Date(end).getTime() : Date.now() + 4 * 3_600_000
  const now = Date.now()
  const duration = endMs - startMs
  const elapsed = now - startMs
  const pct = Math.min(100, Math.max(0, (elapsed / duration) * 100))

  const startStr = new Date(start).toUTCString().slice(5, 17)
  const endStr = end ? new Date(end).toUTCString().slice(5, 17) : 'Ongoing'

  return (
    <div className="space-y-1">
      <div className="relative h-1.5 rounded-full bg-muted/30">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-primary/70 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/50">
        <span>{startStr}</span>
        <span>{endStr}</span>
      </div>
    </div>
  )
}

function AssetBadge({ assetId }: { assetId: string }) {
  const assetData = useAppStore((s) => s.assetData)
  const asset = assetData.find((a) => a.id === assetId)
  return (
    <span className="inline-flex items-center gap-1 rounded-[2px] border border-border/30 bg-background/60 px-1.5 py-0.5 text-[9px] font-medium text-foreground/80">
      <span
        className={`h-1 w-1 rounded-full ${
          asset?.status === 'active' ? 'bg-emerald-500' :
          asset?.status === 'standby' ? 'bg-amber-500' : 'bg-red-500'
        }`}
      />
      <span className="truncate max-w-[120px]">{asset?.name ?? assetId}</span>
      <span className="text-muted-foreground/50">{assetId}</span>
    </span>
  )
}

function MissionDetail({ mission, onClose }: { mission: Mission; onClose: () => void }) {
  const assetData = useAppStore((s) => s.assetData)
  const status = statusConfig[mission.status] ?? { label: mission.status, color: 'bg-slate-500' }

  const assignedAssets = useMemo(
    () => assetData.filter((a) => mission.assets.includes(a.id)),
    [assetData, mission.assets],
  )

  return (
    <div className="flex flex-col gap-2.5 px-3 py-2.5">
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-foreground">{mission.name}</h2>
              <span className={`mt-0.5 inline-flex h-2 w-2 shrink-0 rounded-[2px] ${status.color}`} />
            </div>
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
              <Target className="h-2.5 w-2.5" />
              {mission.region}
            </p>
          </div>
        </div>
      </motion.div>

      <SectionCard title="Status">
        <PropertyRow label="Status" value={status.label} />
        <div className="flex items-center justify-between gap-2">
          <span className="data-label">Threat Level</span>
          <span className={`font-mono text-xs font-medium tabular-nums ${threatColors[mission.threatLevel]}`}>
            {mission.threatLevel.toUpperCase()}
          </span>
        </div>
        <PropertyRow label="Mission ID" value={mission.id} />
      </SectionCard>

      <SectionCard title="Timeline">
        <TimelineBar start={mission.startTime} end={mission.endTime} />
        <PropertyRow label="Start" value={new Date(mission.startTime).toUTCString().slice(5, 22)} />
        {mission.endTime && (
          <PropertyRow label="End" value={new Date(mission.endTime).toUTCString().slice(5, 22)} />
        )}
      </SectionCard>

      <SectionCard title="Objectives">
        <div className="space-y-1.5">
          {mission.objective.split('. ').filter(Boolean).map((sentence, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <Crosshair className="mt-0.5 h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />
              <span className="text-[10.5px] leading-relaxed text-foreground/80">
                {sentence.replace(/\.$/, '')}.
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Assigned Assets">
        <div className="flex flex-wrap gap-1">
          {assignedAssets.length > 0 ? (
            assignedAssets.map((a) => <AssetBadge key={a.id} assetId={a.id} />)
          ) : (
            mission.assets.map((id) => <AssetBadge key={id} assetId={id} />)
          )}
        </div>
        <PropertyRow label="Total" value={`${assignedAssets.length} assets`} />
      </SectionCard>

      <button
        type="button"
        onClick={onClose}
        className="mt-1 w-full rounded-[2px] border border-border/60 py-1.5 text-[10px] font-medium text-muted-foreground/70 transition-colors hover:border-muted-foreground/30 hover:text-muted-foreground"
      >
        Close Mission View
      </button>
    </div>
  )
}

export default MissionDetail
