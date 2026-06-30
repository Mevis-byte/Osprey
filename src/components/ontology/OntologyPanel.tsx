import type React from 'react'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, FileText, Braces, Terminal, Play } from 'lucide-react'
import { useAppStore } from '@/store'
import { useOntologyStore } from '@/store/ontology-store'
import { runReasoner, getOntologyInstanceLinks } from '@/services/ontology-reasoner'
import { groundStations as gsData } from '@/mock-data'
import { ClassTree } from './ClassTree'
import { PropertyTable } from './PropertyTable'
import { RelationGraph } from './RelationGraph'
import { ReasonerConsole } from './ReasonerConsole'

type OntologyTab = 'hierarchy' | 'properties' | 'graph' | 'reasoner'

const TABS: { key: OntologyTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'hierarchy', label: 'Hierarchy', icon: FileText },
  { key: 'properties', label: 'Properties', icon: Braces },
  { key: 'graph', label: 'Graph', icon: Network },
  { key: 'reasoner', label: 'Reasoner', icon: Terminal },
]

export function OntologyPanel() {
  const [tab, setTab] = useState<OntologyTab>('hierarchy')

  const ontologyClasses = useOntologyStore((s) => s.ontologyClasses)
  const relationDefs = useOntologyStore((s) => s.relationDefs)
  const axioms = useOntologyStore((s) => s.axioms)
  const setReasonerResult = useOntologyStore((s) => s.setReasonerResult)
  const appendReasonerLog = useOntologyStore((s) => s.appendReasonerLog)
  const clearReasonerLog = useOntologyStore((s) => s.clearReasonerLog)
  const setInstanceLinks = useOntologyStore((s) => s.setInstanceLinks)

  const assetData = useAppStore((s) => s.assetData)
  const missions = useAppStore((s) => s.missions)
  const alerts = useAppStore((s) => s.alerts)
  const regions = useAppStore((s) => s.regions)
  const constellations = useAppStore((s) => s.constellations ?? [])
  const handleRunReasoner = useCallback(() => {
    clearReasonerLog()
    const log = (msg: string) => appendReasonerLog(msg)

    const result = runReasoner(
      ontologyClasses,
      relationDefs,
      axioms,
      { assets: assetData, missions, alerts, regions, groundStations: gsData, constellations },
      log,
    )

    setReasonerResult(result)

    const links = getOntologyInstanceLinks(result)
    setInstanceLinks(links)

    appendReasonerLog('=== Reasoner complete ===')
  }, [ontologyClasses, relationDefs, axioms, assetData, missions, alerts, regions, constellations, setReasonerResult, appendReasonerLog, clearReasonerLog, setInstanceLinks])

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="flex items-center border-b border-border/40">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-1 py-1.5 text-[9px] font-semibold uppercase tracking-widest transition-colors ${
                tab === key
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground/50 hover:text-muted-foreground/80'
              }`}
            >
              <Icon className="h-2.5 w-2.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[8px] text-muted-foreground/40">
            {ontologyClasses.size} classes · {relationDefs.size} relations · {axioms.length} axioms
          </span>
          <button
            type="button"
            onClick={handleRunReasoner}
            className="flex items-center gap-1 rounded-[2px] border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400 transition-colors hover:bg-emerald-500/20"
          >
            <Play className="h-2.5 w-2.5" />
            Reason
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <AnimatePresence mode="wait">
          {tab === 'hierarchy' && (
            <motion.div key="hierarchy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              <ClassTree />
            </motion.div>
          )}
          {tab === 'properties' && (
            <motion.div key="properties" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              <PropertyTable />
            </motion.div>
          )}
          {tab === 'graph' && (
            <motion.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-80">
              <RelationGraph />
            </motion.div>
          )}
          {tab === 'reasoner' && (
            <motion.div key="reasoner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              <ReasonerConsole />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
