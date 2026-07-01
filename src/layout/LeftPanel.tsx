import { useState, useMemo, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plane, Ship, Satellite, Radio, Activity, Share2, Layers, Network, FileText } from 'lucide-react'
import { useAppStore } from '@/store'
import type { FeedEvent } from '@/types'
import RegionalIntel from './RegionalIntel'
import GraphWorkspace from '@/components/graph/GraphWorkspace'
import { LayerControlPanel } from './LayerControlPanel'
import { OntologyPanel } from '@/components/ontology/OntologyPanel'
import { InvestigationPanel } from '@/components/investigation/InvestigationPanel'

const MAX_VISIBLE = 100

type ChipKey = 'aircraft' | 'maritime' | 'satellite' | 'signals'

const chips: { key: ChipKey; label: string; icon: typeof Plane }[] = [
  { key: 'aircraft', label: 'Aircraft', icon: Plane },
  { key: 'maritime', label: 'Maritime', icon: Ship },
  { key: 'satellite', label: 'Satellite', icon: Satellite },
  { key: 'signals', label: 'Signals', icon: Radio },
]

function eventMatchesChip(event: FeedEvent, chip: ChipKey): boolean {
  const assets = useAppStore.getState().assetData
  const chipTypeMap: Record<ChipKey, 'satellite' | 'aircraft' | 'maritime' | 'intel'> = {
    aircraft: 'aircraft',
    maritime: 'maritime',
    satellite: 'satellite',
    signals: 'intel',
  }

  const targetType = chipTypeMap[chip]
  if (targetType === 'intel') return event.type === 'intel'

  const aircraftTypes = new Set(['fixed-wing', 'rotary-wing'])

  return event.assetIds.some((id) => {
    const asset = assets.find((a) => a.id === id)
    if (asset) {
      if (targetType === 'aircraft') return aircraftTypes.has(asset.type)
      return asset.type === targetType
    }
    if (targetType === 'satellite') return id.startsWith('SV') || id.startsWith('SAT')
    if (targetType === 'aircraft') return id.startsWith('AC')
    if (targetType === 'maritime') return id.startsWith('MV')
    return false
  })
}

const severityColors: Record<FeedEvent['severity'], string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-yellow-500',
  low: 'bg-slate-500',
}

const FeedItem = memo(function FeedItem({ event }: { event: FeedEvent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group flex cursor-pointer items-start gap-2 border-l-2 border-transparent px-3 py-1.5 transition-colors hover:border-primary/30 hover:bg-accent/30"
    >
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-[2px] ${severityColors[event.severity]}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">
            {event.timestamp.slice(11, 19)}
          </span>
          <span className="rounded-[2px] border border-border/60 px-1 text-[9px] uppercase text-muted-foreground/70">
            {event.type}
          </span>
        </div>
        <p className="truncate text-[11px] text-foreground/90 group-hover:text-foreground">
          {event.title}
        </p>
        {event.body && event.body !== event.title && (
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-[1.3] text-muted-foreground/60">
            {event.body}
          </p>
        )}
      </div>

      <span className="shrink-0 self-start pt-1 text-[9px] text-muted-foreground/60">
        {event.severity.toUpperCase()}
      </span>
    </motion.div>
  )
})

type PanelTab = 'stream' | 'intel' | 'graph' | 'layers' | 'ontology' | 'cases'

function LeftPanel() {
  const feed = useAppStore((s) => s.feedData)
  const [tab, setTab] = useState<PanelTab>('stream')
  const [search, setSearch] = useState('')
  const [activeChips, setActiveChips] = useState<Set<ChipKey>>(
    new Set(['aircraft', 'maritime', 'satellite', 'signals']),
  )

  const toggleChip = useCallback((key: ChipKey) => {
    setActiveChips((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const filteredFeed = useMemo(() => {
    const query = search.toLowerCase().trim()
    return feed.filter((event) => {
      const matchesChip =
        activeChips.size === 0 ||
        [...activeChips].some((chip) => eventMatchesChip(event, chip))
      if (!matchesChip) return false
      if (!query) return true
      return (
        event.title.toLowerCase().includes(query) ||
        event.body.toLowerCase().includes(query) ||
        event.source.toLowerCase().includes(query)
      )
    })
  }, [feed, search, activeChips])

  const reversedFeed = useMemo(
    () => filteredFeed.slice(-MAX_VISIBLE).reverse(),
    [filteredFeed],
  )

  return (
    <aside className="flex flex-col border-r border-border bg-card">
      <div className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="flex items-center border-b border-border/40">
          <button
            type="button"
            onClick={() => setTab('stream')}
            className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-widest transition-colors ${
              tab === 'stream'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground/50 hover:text-muted-foreground/80'
            }`}
          >
            <Search className="h-2.5 w-2.5" />
            Stream
          </button>
          <button
            type="button"
            onClick={() => setTab('intel')}
            className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-widest transition-colors ${
              tab === 'intel'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground/50 hover:text-muted-foreground/80'
            }`}
          >
            <Activity className="h-2.5 w-2.5" />
            Intel
          </button>
          <button
            type="button"
            onClick={() => setTab('graph')}
            className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-widest transition-colors ${
              tab === 'graph'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground/50 hover:text-muted-foreground/80'
            }`}
          >
            <Share2 className="h-2.5 w-2.5" />
            Graph
          </button>
          <button
            type="button"
            onClick={() => setTab('layers')}
            className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-widest transition-colors ${
              tab === 'layers'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground/50 hover:text-muted-foreground/80'
            }`}
          >
            <Layers className="h-2.5 w-2.5" />
            Layers
          </button>
          <button
            type="button"
            onClick={() => setTab('ontology')}
            className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-widest transition-colors ${
              tab === 'ontology'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground/50 hover:text-muted-foreground/80'
            }`}
          >
            <Network className="h-2.5 w-2.5" />
            Ontology
          </button>
          <button
            type="button"
            onClick={() => setTab('cases')}
            className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-widest transition-colors ${
              tab === 'cases'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted-foreground/50 hover:text-muted-foreground/80'
            }`}
          >
            <FileText className="h-2.5 w-2.5" />
            Cases
          </button>
        </div>

        {tab === 'stream' && (
          <>
            <div className="px-3 pb-2 pt-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-[2px] border border-border/60 bg-background py-1 pl-5 pr-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-muted-foreground/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1 px-3 pb-2">
              {chips.map(({ key, label, icon: Icon }) => {
                const active = activeChips.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleChip(key)}
                    className={active ? 'chip-base chip-active' : 'chip-base chip-inactive'}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {label}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'stream' ? (
          <div className="h-full overflow-y-auto custom-scrollbar">
            {reversedFeed.length === 0 ? (
              <p className="px-3 py-12 text-center text-[11px] text-muted-foreground/60">
                No matching intelligence
              </p>
            ) : (
              <AnimatePresence initial={false}>
                {reversedFeed.map((event) => (
                  <FeedItem key={event.id} event={event} />
                ))}
              </AnimatePresence>
            )}
          </div>
        ) : tab === 'intel' ? (
          <div className="h-full overflow-y-auto">
            <RegionalIntel />
          </div>
        ) : tab === 'graph' ? (
          <GraphWorkspace />
        ) : tab === 'ontology' ? (
          <OntologyPanel />
        ) : tab === 'cases' ? (
          <InvestigationPanel />
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <LayerControlPanel />
          </div>
        )}
      </div>

      {tab === 'stream' && (
        <div className="sticky bottom-0 border-t border-border bg-card px-3 py-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
            <span>
              {reversedFeed.length > 0
                ? `Showing ${reversedFeed.length} of ${filteredFeed.length} events`
                : `0 events`}
            </span>
            {filteredFeed.length > MAX_VISIBLE && (
              <span className="text-[9px] text-muted-foreground/40">
                +{filteredFeed.length - MAX_VISIBLE} hidden
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

export default LeftPanel
