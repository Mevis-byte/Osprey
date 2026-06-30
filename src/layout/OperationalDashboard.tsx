import type React from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store'
import { Shield, Globe, Satellite, Plane, Ship, AlertTriangle } from 'lucide-react'

export function OperationalDashboard() {
  const assetData = useAppStore((s) => s.assetData)
  const missions = useAppStore((s) => s.missions)
  const alerts = useAppStore((s) => s.alerts)
  const operationalMode = useAppStore((s) => s.operationalMode)

  const stats = {
    satellites: assetData.filter((a) => a.type === 'satellite').length,
    aircraft: assetData.filter((a) => a.type === 'fixed-wing' || a.type === 'rotary-wing').length,
    maritime: assetData.filter((a) => a.type === 'maritime').length,
    missions: missions.filter((m) => m.status === 'in-progress').length,
    alerts: alerts.filter((a) => !a.acknowledged).length,
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Node Info */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/90">Operational Node 01</h2>
          <p className="text-[10px] uppercase text-muted-foreground/60">{operationalMode.replace('-', ' ')}</p>
        </div>
        <div className="flex items-center gap-2 rounded-sm border px-2 py-1"
          style={{
            borderColor: 'rgba(0,255,136,0.2)',
            backgroundColor: 'rgba(0,255,136,0.05)',
          }}>
          <div className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: 'var(--theme-success, #00FF88)' }} />
          <span className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: 'var(--theme-success, #00FF88)' }}>System Nominal</span>
        </div>
      </div>

      {/* Global Coverage Summary */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard icon={Globe} label="Network Status" value="OPTimal" trend="+4.2%" />
        <SummaryCard icon={Shield} label="Threat Level" value="DEFCON 4" color="text-emerald-400" />
      </div>

      {/* Asset Counts */}
      <div className="space-y-2">
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Active Assets</div>
        <div className="grid grid-cols-3 gap-2">
          <CountCard icon={Satellite} label="Space" count={stats.satellites} color="text-amber-400" />
          <CountCard icon={Plane} label="Air" count={stats.aircraft} color="text-cyan-400" />
          <CountCard icon={Ship} label="Sea" count={stats.maritime} color="text-emerald-400" />
        </div>
      </div>

      {/* Real-time Alerts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Active Alerts</div>
          <span className="text-[9px] font-mono text-red-400">{stats.alerts} Critical</span>
        </div>
        <div className="space-y-1.5">
          {alerts.filter(a => !a.acknowledged).slice(0, 3).map((alert) => (
            <div key={alert.id} className="flex items-start gap-2.5 rounded-sm border border-red-500/20 bg-red-500/5 p-2 transition-colors hover:bg-red-500/10">
              <AlertTriangle className="mt-0.5 h-3 w-3 text-red-400" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="truncate text-[10px] font-bold text-red-100">{alert.title}</h4>
                  <span className="shrink-0 text-[8px] font-mono text-red-400/60 uppercase">{new Date(alert.timestamp).toISOString().slice(11, 16)}</span>
                </div>
                <p className="mt-0.5 truncate text-[9px] text-red-200/60 leading-tight">{alert.message}</p>
              </div>
            </div>
          ))}
          {stats.alerts === 0 && (
            <div className="flex items-center justify-center py-4 rounded-sm border border-dashed border-white/5 text-[9px] text-muted-foreground/40 uppercase tracking-widest">
              No active threats detected
            </div>
          )}
        </div>
      </div>

      {/* Network Activity */}
      <div className="space-y-2">
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Network Activity</div>
        <div className="h-16 w-full rounded-sm bg-white/5 p-2 overflow-hidden relative">
          <div className="absolute inset-0 flex items-center gap-1 px-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: '20%' }}
                animate={{ height: [`${Math.random() * 60 + 20}%`, `${Math.random() * 60 + 20}%`, `${Math.random() * 60 + 20}%`] }}
                transition={{ duration: 1 + Math.random(), repeat: Infinity, repeatType: 'reverse' }}
                className="w-full bg-cyan-500/40 rounded-t-[1px]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, trend, color = "text-foreground" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; trend?: string; color?: string }) {
  return (
    <div className="rounded-sm border border-white/5 bg-white/5 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className={`font-mono text-xs font-bold uppercase ${color}`}>{value}</span>
        {trend && <span className="text-[8px] text-emerald-400 font-mono">{trend}</span>}
      </div>
    </div>
  )
}

function CountCard({ icon: Icon, label, count, color }: { icon: React.ComponentType<{ className?: string }>; label: string; count: number; color?: string }) {
  return (
    <div className="rounded-sm border border-white/5 bg-white/5 p-2.5 text-center">
      <Icon className={`mx-auto mb-1 h-3.5 w-3.5 ${color}`} />
      <div className="text-xs font-bold font-mono">{count}</div>
      <div className="text-[8px] uppercase tracking-tighter text-muted-foreground/60">{label}</div>
    </div>
  )
}
