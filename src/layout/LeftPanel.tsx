import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plane, Ship, Satellite, Radio, Activity, Share2, Layers, Network, FileText } from 'lucide-react'
import { useAppStore } from '@/store'
import type { FeedEvent } from '@/types'
import RegionalIntel from './RegionalIntel'
import GraphWorkspace from '@/components/graph/GraphWorkspace'
import { LayerControlPanel } from './LayerControlPanel'
import { OntologyPanel } from '@/components/ontology/OntologyPanel'
import { InvestigationPanel } from '@/components/investigation/InvestigationPanel'

type ChipKey = 'aircraft' | 'maritime' | 'satellite' | 'signals'

const chips: { key: ChipKey; label: string; icon: typeof Plane }[] = [
  { key: 'aircraft', label: 'Aircraft', icon: Plane },
  { key: 'maritime', label: 'Maritime', icon: Ship },
  { key: 'satellite', label: 'Satellite', icon: Satellite },
  { key: 'signals', label: 'Signals', icon: Radio },
]

function eventMatchesChip(event: FeedEvent, chip: ChipKey): boolean {
  switch (chip) {
    case 'aircraft':
      return event.assetIds.some((id) => id.startsWith('AC'))
    case 'maritime':
      return event.assetIds.some((id) => id.startsWith('MV'))
    case 'satellite':
      return event.assetIds.some((id) => id.startsWith('SV'))
    case 'signals':
      return event.type === 'intel'
    default:
      return false
  }
}

const severityColors: Record<FeedEvent['severity'], string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-yellow-500',
  low: 'bg-slate-500',
}

function FeedItem({ event, index }: { event: FeedEvent; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2, delay: index * 0.015, ease: 'easeOut' }}
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
      </div>

      <span className="shrink-0 self-center text-[9px] text-muted-foreground/60">
        {event.severity.toUpperCase()}
      </span>
    </motion.div>
  )
}

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
  }, [search, activeChips])

  return (
    <aside className="flex flex-col border-r border-border bg-card">
      <div className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="flex items-center border-b border-border/40">
          <button
            type="button"
            onClick={() => setTab('stream')}
            className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[9px] font-semibold uppercase tracking-widest transition-colors ${
              tab === 'stream'
                ? 'text-primary border-b-2 border-primary'
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
                ? 'text-primary border-b-2 border-primary'
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
                ? 'text-primary border-b-2 border-primary'
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
                ? 'text-primary border-b-2 border-primary'
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
                ? 'text-primary border-b-2 border-primary'
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
                ? 'text-primary border-b-2 border-primary'
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
          <div className="h-full overflow-y-auto">
            {filteredFeed.length === 0 ? (
              <p className="px-3 py-12 text-center text-[11px] text-muted-foreground/60">
                No matching intelligence
              </p>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredFeed.map((event, i) => (
                  <FeedItem key={event.id} event={event} index={i} />
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
              {filteredFeed.length} / {feed.length} events
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}

export default LeftPanel
