import { useMemo, useRef, useEffect } from 'react'
import { useOntologyStore } from '@/store/ontology-store'

export function ReasonerConsole() {
  const reasonerResult = useOntologyStore((s) => s.reasonerResult)
  const reasonerLog = useOntologyStore((s) => s.reasonerLog)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [reasonerLog])

  const stats = useMemo(() => {
    if (!reasonerResult) return null
    return {
      classifications: reasonerResult.classifications.length,
      relations: reasonerResult.inferredRelations.length,
      violations: reasonerResult.violations.length,
      timestamp: new Date(reasonerResult.timestamp).toLocaleTimeString(),
    }
  }, [reasonerResult])

  const violationList = useMemo(() => {
    if (!reasonerResult) return []
    return reasonerResult.violations
  }, [reasonerResult])

  if (!reasonerResult) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[10px] text-muted-foreground/50">Run the reasoner to see results</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="px-1">
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
          Reasoner Results
        </div>
        <p className="mt-1 text-[8px] text-muted-foreground/50">Last run: {stats?.timestamp}</p>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <StatBox label="Classified" value={stats?.classifications ?? 0} color="text-cyan-400" />
        <StatBox label="Relations" value={stats?.relations ?? 0} color="text-emerald-400" />
        <StatBox label="Violations" value={stats?.violations ?? 0} color={violationList.length > 0 ? 'text-red-400' : 'text-green-400'} />
      </div>

      {violationList.length > 0 && (
        <div>
          <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-widest text-red-400/60">
            Constraint Violations
          </div>
          <div className="space-y-0.5">
            {violationList.map((v, i) => (
              <div key={i} className="rounded-[2px] border border-red-400/20 bg-red-400/5 px-2 py-1">
                <p className="text-[9px] leading-relaxed text-red-300/90">{v.message}</p>
                <p className="text-[7px] text-muted-foreground/40">axiom: {v.axiomId} · entity: {v.entityId}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {reasonerLog.length > 0 && (
        <div>
          <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Execution Log
          </div>
          <div
            ref={scrollRef}
            className="max-h-32 overflow-y-auto rounded-[2px] border border-border/40 bg-background/60 p-2 font-mono text-[8px] leading-relaxed text-muted-foreground/70"
          >
            {reasonerLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-[2px] border border-border/40 bg-background/20 px-2 py-1.5 text-center">
      <span className={`block font-mono text-xs tabular-nums ${color}`}>{value}</span>
      <span className="block text-[7px] uppercase text-muted-foreground/50">{label}</span>
    </div>
  )
}
