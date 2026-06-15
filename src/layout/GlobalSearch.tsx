import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import type { Asset, Aircraft, MaritimeAsset, Satellite } from '@/types'

function getRegionName(lat: number, lon: number, type: string): string {
  if (type === 'satellite') return 'Orbit'

  const regions: [number, number, number, number, string][] = [
    [-170, 15, -50, 85, 'North America'],
    [-85, -60, -30, 15, 'South America'],
    [-15, 35, 45, 75, 'Europe'],
    [-10, -35, 55, 37, 'Africa'],
    [30, 10, 65, 40, 'Middle East'],
    [55, 5, 100, 40, 'Central Asia'],
    [100, 5, 155, 55, 'East Asia'],
    [95, -10, 140, 25, 'Southeast Asia'],
    [110, -50, 180, -10, 'Oceania'],
    [30, -50, 110, 0, 'Indian Ocean'],
    [-80, 40, -10, 70, 'North Atlantic'],
    [-55, -60, 10, 0, 'South Atlantic'],
    [120, 30, -120, 65, 'North Pacific'],
    [50, 0, 75, 30, 'Arabian Sea'],
    [-5, 30, 37, 48, 'Mediterranean'],
    [10, 54, 30, 65, 'Baltic Sea'],
    [105, 0, 122, 25, 'South China Sea'],
  ]

  for (const [minLon, minLat, maxLon, maxLat, name] of regions) {
    if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
      return name
    }
  }

  const latBand = lat >= 0 ? 'Northern' : 'Southern'
  const lonBand = lon >= -30 && lon <= 60 ? 'Atlantic' : lon >= 60 && lon <= 180 ? 'Pacific' : 'Ocean'
  return `${latBand} ${lonBand}`
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  standby: 'bg-amber-500',
  offline: 'bg-red-500',
  maintenance: 'bg-yellow-500',
  unknown: 'bg-slate-500',
  lost: 'bg-red-500',
}

const TYPE_BADGES: Record<string, string> = {
  'fixed-wing': 'FW',
  'rotary-wing': 'RW',
  'maritime': 'MAR',
  'satellite': 'SAT',
}

function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<(HTMLButtonElement | null)[]>([])

  const assetData = useAppStore((s) => s.assetData)
  const setSelectedAsset = useAppStore((s) => s.setSelectedAsset)
  const requestFocus = useAppStore((s) => s.requestFocus)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      resultsRef.current = []
      const id = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [open])

  const results = useMemo(() => {
    if (!query.trim()) return [] as Asset[]
    const q = query.toLowerCase()

    return assetData.filter((asset) => {
      const region = getRegionName(asset.latitude, asset.longitude, asset.type)
      const typeLabel = asset.type.replace('-', ' ')

      const searches: string[] = [
        asset.name,
        asset.id,
        asset.type,
        typeLabel,
        asset.status,
        region,
      ]

      if (asset.type === 'fixed-wing' || asset.type === 'rotary-wing') {
        const a = asset as Aircraft
        searches.push(a.callsign)
      }
      if (asset.type === 'maritime') {
        const m = asset as MaritimeAsset
        searches.push(m.mmsi)
        if (m.destination) searches.push(m.destination)
      }
      if (asset.type === 'satellite') {
        const s = asset as Satellite
        searches.push(s.noradId)
      }

      return searches.some((s) => s?.toLowerCase().includes(q))
    }).slice(0, 20)
  }, [query, assetData])

  const selectAsset = useCallback(
    (asset: Asset) => {
      setSelectedAsset(asset)
      requestFocus(asset.id)
      setOpen(false)
    },
    [setSelectedAsset, requestFocus],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => {
        const next = Math.min(i + 1, results.length - 1)
        resultsRef.current[next]?.scrollIntoView({ block: 'nearest' })
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => {
        const next = Math.max(i - 1, 0)
        resultsRef.current[next]?.scrollIntoView({ block: 'nearest' })
        return next
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        selectAsset(results[selectedIndex])
      }
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm"
          style={{ paddingTop: '12vh' }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-lg overflow-hidden rounded-lg border border-border/60 bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 border-b border-border/50 px-3.5 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search assets by name, ID, type, status, or region..."
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
              />
              <kbd className="hidden rounded-[2px] border border-border/50 px-1.5 py-0.5 text-[10px] text-muted-foreground/50 sm:inline-block">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 && query.trim() && (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-muted-foreground/60">No assets match</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/40">"{query}"</p>
                </div>
              )}

              {results.length === 0 && !query.trim() && (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-muted-foreground/50">Type to search assets</p>
                </div>
              )}

              {results.map((asset, i) => {
                const region = getRegionName(asset.latitude, asset.longitude, asset.type)
                const isSelected = i === selectedIndex

                return (
                  <button
                    key={asset.id}
                    ref={(el) => { resultsRef.current[i] = el }}
                    type="button"
                    className={`flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-primary/10'
                        : 'hover:bg-muted/30'
                    }`}
                    onClick={() => selectAsset(asset)}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-[2px] ${STATUS_COLORS[asset.status] ?? 'bg-slate-500'}`} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {asset.name}
                        </span>
                        <span className="shrink-0 rounded-[2px] border border-border/50 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                          {TYPE_BADGES[asset.type] ?? asset.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                        <span>{asset.id}</span>
                        <span>·</span>
                        <span className="first-letter:uppercase">{region}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {results.length > 0 && (
              <div className="border-t border-border/50 px-3.5 py-1.5">
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground/40">
                  <span>↑↓ Navigate</span>
                  <span>⏎ Select</span>
                  <span>Esc Close</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default GlobalSearch
