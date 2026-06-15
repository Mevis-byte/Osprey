import { useMemo, useState, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'
import { useAppStore } from '@/store'

const SPEEDS = [1, 2, 4, 10] as const

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
  const setTimelinePosition = useAppStore((s) => s.setTimelinePosition)
  const setSimulationSpeed = useAppStore((s) => s.setSimulationSpeed)

  const [isPlaying, setIsPlaying] = useState(false)
  const range = useTimeRange()

  const clampedPosition = Math.max(range.start, Math.min(range.end, timelinePosition))
  const pct = ((clampedPosition - range.start) / (range.end - range.start)) * 100

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = range.start + (Number(e.target.value) / 100) * (range.end - range.start)
      setTimelinePosition(Math.round(value))
    },
    [range, setTimelinePosition],
  )

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  return (
    <footer className="flex items-center gap-2.5 border-t border-border bg-card px-3" style={{ height: 32 }}>
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-5 w-5 items-center justify-center rounded-[2px] border border-border/60 text-muted-foreground/70 transition-colors hover:border-muted-foreground/30 hover:text-muted-foreground"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
      </button>

      <div className="flex items-center gap-px">
        {SPEEDS.map((speed) => {
          const active = simulationSpeed === speed
          return (
            <button
              key={speed}
              type="button"
              onClick={() => setSimulationSpeed(speed)}
              className={`rounded-[2px] border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                active
                  ? 'border-primary/20 bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground/60 hover:border-muted-foreground/30 hover:text-muted-foreground'
              }`}
            >
              {speed}x
            </button>
          )
        })}
      </div>

      <span className="h-4 w-px bg-border/60" />

      <div className="relative flex flex-1 items-center" style={{ height: 16 }}>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={pct}
          onChange={handleSliderChange}
          className="absolute inset-x-0 top-1/2 z-10 h-1 -translate-y-1/2 cursor-pointer appearance-none rounded-full bg-transparent
            [&::-webkit-slider-runnable-track]:h-1
            [&::-webkit-slider-runnable-track]:rounded-full
            [&::-webkit-slider-runnable-track]:bg-muted/60
            [&::-webkit-slider-thumb]:mt-[-3px]
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border
            [&::-webkit-slider-thumb]:border-border
            [&::-webkit-slider-thumb]:bg-foreground
            [&::-webkit-slider-thumb]:shadow-sm
            hover:[&::-webkit-slider-thumb]:bg-primary
            [&::-moz-range-track]:h-1
            [&::-moz-range-track]:rounded-full
            [&::-moz-range-track]:bg-muted/60
            [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:w-3
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border
            [&::-moz-range-thumb]:border-border
            [&::-moz-range-thumb]:bg-foreground
          "
          style={{
            background: `linear-gradient(to right, hsl(var(--primary) / 0.35) 0%, hsl(var(--primary) / 0.35) ${pct}%, transparent ${pct}%, transparent 100%)`,
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between">
          {MARKERS.map((h) => {
            const markerMs = range.start + (h - 14) * 3_600_000
            const markerPct = ((markerMs - range.start) / (range.end - range.start)) * 100
            return (
              <div
                key={h}
                className="flex flex-col items-center"
                style={{ position: 'absolute', left: `${markerPct}%`, transform: 'translateX(-50%)' }}
              >
                <span className="mt-0.5 text-[8px] text-muted-foreground/40">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <span className="h-4 w-px bg-border/60" />

      <span className="whitespace-nowrap font-mono text-[10px] tabular-nums tracking-wider text-foreground/80">
        {formatPosition(clampedPosition)}
      </span>
    </footer>
  )
}

export default TimelinePanel
