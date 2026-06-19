import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import { useCaseStore } from '@/store/case-store'
import MissionDetail from './MissionDetail'
import { OperationalDashboard } from './OperationalDashboard'
import type { Asset, ThreatLevel, AssetStatus } from '@/types'
import type { Aircraft, MaritimeAsset, Satellite } from '@/types'

function formatCoord(value: number, dirs: [string, string]): string {
  const dir = value >= 0 ? dirs[0] : dirs[1]
  return `${Math.abs(value).toFixed(4)}° ${dir}`
}

function formatAltitude(meters: number): string {
  if (meters >= 1_000_000) return `${(meters / 1000).toFixed(0)} km`
  return `${meters.toLocaleString()} m`
}

function formatSpeed(kts: number): string {
  return `${kts} kts`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toUTCString().slice(5, 22)
}

const statusColors: Record<AssetStatus, string> = {
  active: 'bg-emerald-500',
  standby: 'bg-amber-500',
  offline: 'bg-red-500',
  lost: 'bg-red-500',
  maintenance: 'bg-yellow-500',
  unknown: 'bg-slate-500',
}

const threatColors: Record<ThreatLevel, string> = {
  critical: 'text-red-400',
  high: 'text-amber-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
  none: 'text-green-400',
}

function mockThreatLevel(asset: Asset): ThreatLevel {
  if (asset.status === 'lost') return 'critical'
  if (asset.status === 'offline') return 'high'
  if (asset.status === 'maintenance') return 'medium'
  if (asset.status === 'active' && asset.speed > 600) return 'medium'
  return 'low'
}

function mockSignalStrength(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
  }
  return Math.abs(hash % 30) + 70
}

function mockMissionStatus(status: AssetStatus): string {
  switch (status) {
    case 'active':
      return 'In Progress'
    case 'standby':
      return 'Standing By'
    case 'offline':
      return 'Interrupted'
    case 'maintenance':
      return 'Suspended'
    case 'unknown':
      return 'Pending'
    case 'lost':
      return 'Aborted'
  }
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="data-label">{label}</span>
      <span className="data-value font-mono">{value}</span>
    </div>
  )
}

function SectionCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay }}
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

function TelemetryView({ asset }: { asset: Asset }) {
  return (
    <div className="grid grid-cols-3 gap-px rounded-[2px] bg-border/30">
      {([
        ['HDG', `${asset.heading}°`],
        ['SPD', formatSpeed(asset.speed)],
        ['ALT', formatAltitude(asset.altitude)],
      ] as const).map(([label, value]) => (
        <div key={label} className="bg-background/40 px-2 py-1.5 text-center">
          <span className="block text-[9px] text-muted-foreground/60">{label}</span>
          <span className="block font-mono text-[11px] tabular-nums text-foreground">{value}</span>
        </div>
      ))}
    </div>
  )
}

function AircraftMetadata({ asset }: { asset: Aircraft }) {
  return (
    <>
      {asset.callsign && <PropertyRow label="Callsign" value={asset.callsign} />}
      {asset.icao && <PropertyRow label="ICAO" value={asset.icao} />}
      {asset.pilot && <PropertyRow label="Pilot" value={asset.pilot} />}
      <PropertyRow label="Range" value={`${asset.range.toLocaleString()} km`} />
      <PropertyRow label="Fuel" value={`${(asset.fuelLevel * 100).toFixed(0)}%`} />
    </>
  )
}

function MaritimeMetadata({ asset }: { asset: MaritimeAsset }) {
  return (
    <>
      <PropertyRow label="MMSI" value={asset.mmsi} />
      {asset.imo && <PropertyRow label="IMO" value={asset.imo} />}
      {asset.destination && <PropertyRow label="Destination" value={asset.destination} />}
      <PropertyRow label="Draft" value={`${asset.draft} m`} />
      <PropertyRow label="Dimensions" value={`${asset.length} × ${asset.beam} m`} />
    </>
  )
}

function SatelliteMetadata({ asset }: { asset: Satellite }) {
  return (
    <>
      <PropertyRow label="NORAD ID" value={asset.noradId} />
      <PropertyRow label="Inclination" value={`${asset.inclination}°`} />
      <PropertyRow label="Apogee" value={formatAltitude(asset.apogee)} />
      <PropertyRow label="Perigee" value={formatAltitude(asset.perigee)} />
      <PropertyRow label="Period" value={`${asset.period} min`} />
      <PropertyRow label="Launched" value={asset.launchDate} />
    </>
  )
}

function TrackingControls({ asset }: { asset: Asset }) {
  const trackingAssetId = useAppStore((s) => s.trackingAssetId)
  const setTrackingAssetId = useAppStore((s) => s.setTrackingAssetId)
  const requestFocus = useAppStore((s) => s.requestFocus)
  const isTracking = trackingAssetId === asset.id

  return (
    <SectionCard title="Tracking" delay={0.02}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTrackingAssetId(isTracking ? null : asset.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-[2px] border px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
            isTracking
              ? 'border-accent/20 bg-accent/10 text-accent'
              : 'border-border/60 text-muted-foreground/70 hover:border-muted-foreground/30 hover:text-muted-foreground'
          }`}
        >
          {isTracking ? 'Stop Tracking' : 'Track Asset'}
        </button>
        <button
          type="button"
          onClick={() => requestFocus(asset.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[2px] border border-border/60 px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground/70 transition-colors hover:border-muted-foreground/30 hover:text-muted-foreground"
        >
          Focus Asset
        </button>
      </div>
    </SectionCard>
  )
}

function CaseAssignment({ asset }: { asset: Asset }) {
  const cases = useCaseStore((s) => s.cases)
  const addEntityToCase = useCaseStore((s) => s.addEntityToCase)
  const setSelectedCaseId = useCaseStore((s) => s.setSelectedCaseId)

  const activeCases = cases.filter(
    (c) => c.status !== 'archived' && c.status !== 'closed' && !c.entities.some((e) => e.entityId === asset.id),
  )

  const linkedCases = cases.filter((c) => c.entities.some((e) => e.entityId === asset.id))

  const handleAdd = (caseId: string) => {
    addEntityToCase(caseId, {
      entityType: 'asset',
      entityId: asset.id,
      entityName: asset.name,
      addedAt: new Date().toISOString(),
    })
  }

  return (
    <SectionCard title="Investigation Cases" delay={0.025}>
      {linkedCases.length > 0 && (
        <div className="mb-1.5 space-y-0.5">
          {linkedCases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCaseId(c.id)}
              className="flex w-full items-center gap-1.5 rounded-[2px] border border-white/10 px-2 py-1 text-left transition-colors hover:bg-white/5"
              style={{ borderLeft: '2px solid var(--theme-primary, #00BFFF)' }}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-[2px]" style={{ backgroundColor: 'var(--theme-primary, #00BFFF)' }} />
              <span className="min-w-0 flex-1 truncate text-[9px] text-foreground/70">{c.title}</span>
            </button>
          ))}
        </div>
      )}
      {activeCases.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeCases.slice(0, 4).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleAdd(c.id)}
              className="rounded-[2px] border border-border/60 px-1.5 py-0.5 text-[8px] text-muted-foreground/60 transition-colors hover:border-white/30 hover:text-white"
            >
              + {c.id}
            </button>
          ))}
          {activeCases.length > 4 && (
            <span className="text-[7px] text-muted-foreground/40 self-center">+{activeCases.length - 4} more</span>
          )}
        </div>
      )}
      {activeCases.length === 0 && linkedCases.length === 0 && (
        <p className="text-[9px] text-muted-foreground/50">No active cases. Add this asset to a case from the Cases panel.</p>
      )}
    </SectionCard>
  )
}

function AssetDetail({ asset }: { asset: Asset }) {
  const signal = mockSignalStrength(asset.id)
  const threat = mockThreatLevel(asset)
  const mission = mockMissionStatus(asset.status)

  return (
    <div className="flex flex-col gap-2.5 px-3 py-2.5">
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-foreground">{asset.name}</h2>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              {asset.type.replace('-', ' ')}
            </p>
          </div>
          <span
            className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-[2px] ${statusColors[asset.status]}`}
          />
        </div>
      </motion.div>

      <TrackingControls asset={asset} />

      <CaseAssignment asset={asset} />

      <SectionCard title="Position" delay={0.03}>
        <PropertyRow label="Latitude" value={formatCoord(asset.latitude, ['N', 'S'])} />
        <PropertyRow label="Longitude" value={formatCoord(asset.longitude, ['E', 'W'])} />
        <PropertyRow label="Altitude" value={formatAltitude(asset.altitude)} />
        <PropertyRow label="Heading" value={`${asset.heading}°`} />
        <PropertyRow label="Speed" value={formatSpeed(asset.speed)} />
      </SectionCard>

      <SectionCard title="Status" delay={0.06}>
        <PropertyRow
          label="Asset Status"
          value={asset.status.replace('-', ' ')}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="data-label">Threat Level</span>
          <span className={`font-mono text-xs font-medium tabular-nums ${threatColors[threat]}`}>
            {threat.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="data-label">Signal Strength</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-px">
              {[1, 2, 3, 4, 5].map((bar) => (
                <span
                  key={bar}
                  className={`block h-3 w-[3px] rounded-[1px] ${
                    bar * 20 <= signal ? 'bg-emerald-500' : 'bg-muted/50'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-xs tabular-nums text-foreground">{signal}%</span>
          </div>
        </div>
        <PropertyRow label="Mission Status" value={mission} />
      </SectionCard>

      <SectionCard title="Telemetry" delay={0.09}>
        <TelemetryView asset={asset} />
      </SectionCard>

      <SectionCard title="Metadata" delay={0.12}>
        <PropertyRow label="ID" value={asset.id} />
        <PropertyRow label="Last Updated" value={formatTime(asset.lastUpdated)} />
        {asset.type === 'fixed-wing' || asset.type === 'rotary-wing' ? (
          <AircraftMetadata asset={asset as Aircraft} />
        ) : asset.type === 'maritime' ? (
          <MaritimeMetadata asset={asset as MaritimeAsset} />
        ) : (
          <SatelliteMetadata asset={asset as Satellite} />
        )}
      </SectionCard>
    </div>
  )
}

function RightPanel() {
  const selectedAsset = useAppStore((s) => s.selectedAsset)
  const selectedMission = useAppStore((s) => s.selectedMission)
  const setSelectedMission = useAppStore((s) => s.setSelectedMission)

  return (
    <aside className="flex flex-col border-l border-border bg-card">
      <div className="panel-header">
        <h2 className="panel-title uppercase tracking-[0.2em]">
          {selectedMission ? 'Mission Detail' : selectedAsset ? 'Asset Intelligence' : 'Global Dashboard'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {selectedMission ? (
            <motion.div
              key={selectedMission.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <MissionDetail mission={selectedMission} onClose={() => setSelectedMission(null)} />
            </motion.div>
          ) : selectedAsset ? (
            <motion.div
              key={selectedAsset.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <AssetDetail asset={selectedAsset} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <OperationalDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}

export default RightPanel
