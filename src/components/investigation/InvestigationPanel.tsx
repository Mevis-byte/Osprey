import { useState, useMemo, useCallback } from 'react'
import { Plus, Search, ArrowLeft } from 'lucide-react'
import { useCaseStore } from '@/store/case-store'
import { useAppStore } from '@/store'
import { CaseList } from './CaseList'
import { CaseDetail } from './CaseDetail'
import { CaseFormDialog } from './CaseFormDialog'
import type { InvestigationCase, CaseEntityRef } from '@/types'

export function InvestigationPanel() {
  const cases = useCaseStore((s) => s.cases)
  const selectedCaseId = useCaseStore((s) => s.selectedCaseId)
  const setSelectedCaseId = useCaseStore((s) => s.setSelectedCaseId)
  const searchQuery = useCaseStore((s) => s.searchQuery)
  const setSearchQuery = useCaseStore((s) => s.setSearchQuery)
  const addEntityToCase = useCaseStore((s) => s.addEntityToCase)

  const selectedAsset = useAppStore((s) => s.selectedAsset)

  const [formOpen, setFormOpen] = useState(false)
  const [editCase, setEditCase] = useState<InvestigationCase | null>(null)

  const selectedCase = useMemo(
    () => (selectedCaseId ? cases.find((c) => c.id === selectedCaseId) ?? null : null),
    [selectedCaseId, cases],
  )

  const openCreate = useCallback(() => {
    setEditCase(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback(() => {
    if (selectedCase) {
      setEditCase(selectedCase)
      setFormOpen(true)
    }
  }, [selectedCase])

  const handleAddSelectedAsset = useCallback(() => {
    if (!selectedAsset || !selectedCaseId) return
    const entity: CaseEntityRef = {
      entityType: 'asset',
      entityId: selectedAsset.id,
      entityName: selectedAsset.name,
      addedAt: new Date().toISOString(),
    }
    addEntityToCase(selectedCaseId, entity)
  }, [selectedAsset, selectedCaseId, addEntityToCase])

  const availableCasesForAsset = useMemo(() => {
    if (!selectedAsset) return []
    return cases.filter((c) => c.status !== 'archived' && !c.entities.some((e) => e.entityId === selectedAsset.id))
  }, [cases, selectedAsset])

  const handleAddAssetToCase = useCallback(
    (caseId: string) => {
      if (!selectedAsset) return
      const entity: CaseEntityRef = {
        entityType: 'asset',
        entityId: selectedAsset.id,
        entityName: selectedAsset.name,
        addedAt: new Date().toISOString(),
      }
      addEntityToCase(caseId, entity)
    },
    [selectedAsset, addEntityToCase],
  )

  return (
    <div className="flex h-full flex-col">
      {!selectedCase ? (
        <>
          <div className="sticky top-0 z-10 border-b border-border bg-card px-3 py-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                Cases ({cases.length})
              </h3>
              <button
                type="button"
                onClick={openCreate}
                className="flex items-center gap-1 rounded-[2px] border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-cyan-400 transition-colors hover:bg-cyan-500/20"
              >
                <Plus className="h-2.5 w-2.5" />
                New Case
              </button>
            </div>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases..."
                className="w-full rounded-[2px] border border-border/60 bg-background py-1 pl-5 pr-1.5 text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:border-muted-foreground/30 focus:outline-none"
              />
            </div>

            {selectedAsset && availableCasesForAsset.length > 0 && (
              <div className="mt-2 rounded-[2px] border border-cyan-400/20 bg-cyan-500/5 px-2 py-1.5">
                <p className="text-[8px] font-bold uppercase tracking-wider text-cyan-400/70 mb-1">Add {selectedAsset.name} to:</p>
                <div className="flex flex-wrap gap-1">
                  {availableCasesForAsset.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleAddAssetToCase(c.id)}
                      className="rounded-[2px] border border-border/60 px-1.5 py-0.5 text-[8px] text-muted-foreground/70 hover:border-cyan-400/30 hover:text-cyan-400 transition-colors"
                    >
                      {c.id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedAsset && availableCasesForAsset.length === 0 && (
              <div className="mt-2 rounded-[2px] border border-border/40 bg-background/20 px-2 py-1">
                <p className="text-[8px] text-muted-foreground/60">
                  {selectedAsset.name} is already in all active cases
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            <CaseList />
          </div>
        </>
      ) : (
        <>
          <div className="sticky top-0 z-10 border-b border-border bg-card">
            <div className="flex items-center justify-between px-2 py-1.5">
              <button
                type="button"
                onClick={() => setSelectedCaseId(null)}
                className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-[9px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
              <div className="flex items-center gap-1">
                {selectedAsset && (
                  <button
                    type="button"
                    onClick={handleAddSelectedAsset}
                    className="rounded-[2px] border border-cyan-400/30 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  >
                    + Asset
                  </button>
                )}
                <button
                  type="button"
                  onClick={openEdit}
                  className="rounded-[2px] border border-border/60 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {selectedCase && <CaseDetail caseItem={selectedCase} />}
          </div>
        </>
      )}

      <CaseFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditCase(null) }}
        editCase={editCase}
      />
    </div>
  )
}
