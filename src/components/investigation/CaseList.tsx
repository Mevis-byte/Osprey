import { useMemo } from 'react'
import { useCaseStore } from '@/store/case-store'
import type { InvestigationCase } from '@/types'

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

const statusDotColors: Record<string, string> = {
  'open': 'bg-sky-400',
  'in-progress': 'bg-cyan-400',
  'pending-review': 'bg-amber-400',
  'closed': 'bg-green-400',
  'archived': 'bg-muted-foreground/30',
}

export function CaseList() {
  const cases = useCaseStore((s) => s.cases)
  const selectedCaseId = useCaseStore((s) => s.selectedCaseId)
  const setSelectedCaseId = useCaseStore((s) => s.setSelectedCaseId)
  const searchQuery = useCaseStore((s) => s.searchQuery)

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return cases
    const q = searchQuery.toLowerCase()
    return cases.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    )
  }, [cases, searchQuery])

  const byStatus = useMemo(() => {
    const order: InvestigationCase['status'][] = ['open', 'in-progress', 'pending-review', 'closed', 'archived']
    const grouped: Record<string, InvestigationCase[]> = {}
    for (const s of order) grouped[s] = []
    for (const c of filtered) {
      if (grouped[c.status]) grouped[c.status].push(c)
    }
    return Object.entries(grouped).filter(([, items]) => items.length > 0)
  }, [filtered])

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[10px] text-muted-foreground/50">
          {searchQuery ? 'No matching cases' : 'No cases yet. Create your first case.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {byStatus.map(([status, items]) => (
        <div key={status}>
          <div className="mb-1 flex items-center gap-1.5 px-1">
            <span className={`h-1.5 w-1.5 rounded-[2px] ${statusDotColors[status] ?? 'bg-muted-foreground/30'}`} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
              {status.replace('-', ' ')}
            </span>
            <span className="text-[8px] text-muted-foreground/30">{items.length}</span>
          </div>
          {items.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCaseId(selectedCaseId === c.id ? null : c.id)}
              className={`w-full text-left rounded-[2px] border px-2.5 py-2 transition-all ${
                selectedCaseId === c.id
                  ? 'border-primary/30 bg-primary/10'
                  : 'border-transparent hover:border-border/60 hover:bg-accent/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-[2px] ${priorityColors[c.priority]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[10px] font-medium text-foreground/90">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] text-muted-foreground/50">
                    <span>{c.id}</span>
                    <span>{c.owner}</span>
                    <span>{c.entities.length} entities</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
