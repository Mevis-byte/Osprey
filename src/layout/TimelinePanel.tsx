import { useMemo, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'
import { useAppStore } from '@/store'


const SPEEDS = [1, 2, 4, 8, 16] as const

function useTimeRange() {
  return useMemo(() => {
    const now = new Date()
    const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
    return {
      start: day + 14 * 3_600_000,
      end: day + 18 * 3_600_000,
    }
  }, [])
}

const MARKERS = [14, 15, 16, 17, 18]

function formatPosition(ms: number): string {
  const d = new Date(ms)
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hours = String(d.getUTCHours()).padStart(2, '0')
  const minutes = String(d.getUTCMinutes()).padStart(2, '0')
  return `${month}/${day} ${hours}:${minutes}Z`
}

function TimelinePanel() {
  const timelinePosition = useAppStore((s) => s.timelinePosition)
  const simulationSpeed = useAppStore((s) => s.simulationSpeed)
  const isPlaying = useAppStore((s) => s.isPlaying)
  const missions = useAppStore((s) => s.missions)
  const alerts = useAppStore((s) => s.alerts)
  const setTimelinePosition = useAppStore((s) => s.setTimelinePosition)
  const setSimulationSpeed = useAppStore((s) => s.setSimulationSpeed)
  const setPlaying = useAppStore((s) => s.setPlaying)

  const range = useTimeRange()

  const timelineMarkers = useMemo(() => {
    const markers: { time: number; type: 'mission' | 'alert'; color: string }[] = []
    
    missions.forEach(m => {
      markers.push({ time: new Date(m.startTime).getTime(), type: 'mission', color: 'bg-cyan-500' })
    })
    
    alerts.forEach(a => {
      markers.push({ time: new Date(a.timestamp).getTime(), type: 'alert', color: 'bg-red-500' })
    })
    
    return markers
  }, [missions, alerts])

  const clampedPosition = Math.max(range.start, Math.min(range.end, timelinePosition))
  const pct = ((clampedPosition - range.start) / (range.end - range.start)) * 100

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = range.start + (Number(e.target.value) / 100) * (range.end - range.start)
      setTimelinePosition(Math.round(value))
    },
    [range, setTimelinePosition],
  )

  return (
    <footer className="flex items-center gap-4 border-t border-white/5 bg-[#0a0c12] px-4" style={{ height: 40 }}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setPlaying(!isPlaying)}
          className={`flex h-6 w-6 items-center justify-center rounded-sm border transition-all ${
            isPlaying 
              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' 
              : 'border-white/10 text-muted-foreground/60 hover:border-white/20 hover:text-foreground'
          }`}
        >
          {isPlaying ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current ml-0.5" />}
        </button>

        <div className="flex items-center gap-px rounded-sm border border-white/5 bg-white/5 p-0.5">
          {SPEEDS.map((speed) => {
            const active = simulationSpeed === speed
            return (
              <button
                key={speed}
                type="button"
                onClick={() => setSimulationSpeed(speed)}
                className={`rounded-[1px] px-2 py-0.5 text-[9px] font-bold transition-all ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                    : 'text-muted-foreground/40 hover:text-muted-foreground/70'
                }`}
              >
                {speed}x
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-4 w-px bg-white/5" />

      <div className="relative flex flex-1 items-center" style={{ height: 24 }}>
        {/* Track Markers */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 overflow-hidden pointer-events-none">
          {timelineMarkers.map((m, i) => {
            const mPct = ((m.time - range.start) / (range.end - range.start)) * 100
            if (mPct < 0 || mPct > 100) return null
            return (
              <div 
                key={i}
                className={`absolute h-full w-0.5 ${m.color} opacity-60`}
                style={{ left: `${mPct}%` }}
              />
            )
          })}
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={0.01}
          value={pct}
          onChange={handleSliderChange}
          className="absolute inset-x-0 top-1/2 z-10 h-1 -translate-y-1/2 cursor-pointer appearance-none rounded-full bg-white/5
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:w-1
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:bg-cyan-400
            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,211,238,0.8)]
            hover:[&::-webkit-slider-thumb]:scale-y-125
            transition-all
          "
        />

        <div className="pointer-events-none absolute inset-x-0 -bottom-1 flex items-end justify-between">
          {MARKERS.map((h) => {
            const markerMs = range.start + (h - 14) * 3_600_000
            const markerPct = ((markerMs - range.start) / (range.end - range.start)) * 100
            return (
              <div
                key={h}
                className="flex flex-col items-center"
                style={{ position: 'absolute', left: `${markerPct}%`, transform: 'translateX(-50%)' }}
              >
                <div className="h-1 w-px bg-white/10 mb-1" />
                <span className="text-[7px] font-bold text-muted-foreground/30 uppercase tabular-nums">
                  {String(h).padStart(2, '0')}:00Z
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-4 w-px bg-white/5" />

      <div className="flex flex-col items-end justify-center min-w-[100px]">
        <span className="text-[10px] font-black tabular-nums tracking-wider text-cyan-400/90 leading-none">
          {formatPosition(clampedPosition).split(' ')[1]}
        </span>
        <span className="text-[7px] font-bold text-muted-foreground/40 uppercase tracking-tighter mt-0.5">
          {formatPosition(clampedPosition).split(' ')[0]} / UTC-0
        </span>
      </div>
    </footer>
  )
}

export default TimelinePanel
