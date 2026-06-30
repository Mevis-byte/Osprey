import { useState } from 'react'
import { useCaseStore } from '@/store/case-store'
import { useAppStore } from '@/store'
import type { InvestigationCase, CaseEntityRef } from '@/types'

const priorityColors: Record<string, string> = {
  critical: 'text-red-400 border-red-400/30 bg-red-500/10',
  high: 'text-amber-400 border-amber-400/30 bg-amber-500/10',
  medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10',
  low: 'text-green-400 border-green-400/30 bg-green-500/10',
}

const statusColors: Record<string, string> = {
  'open': 'text-sky-400 border-sky-400/30 bg-sky-500/10',
  'in-progress': 'text-cyan-400 border-cyan-400/30 bg-cyan-500/10',
  'pending-review': 'text-amber-400 border-amber-400/30 bg-amber-500/10',
  'closed': 'text-green-400 border-green-400/30 bg-green-500/10',
  'archived': 'text-muted-foreground/50 border-muted-foreground/20 bg-muted/10',
}

export function CaseDetail({ caseItem }: { caseItem: InvestigationCase }) {
  const deleteCase = useCaseStore((s) => s.deleteCase)
  const archiveCase = useCaseStore((s) => s.archiveCase)
  const restoreCase = useCaseStore((s) => s.restoreCase)
  const setSelectedCaseId = useCaseStore((s) => s.setSelectedCaseId)
  const addNote = useCaseStore((s) => s.addNote)
  const removeEntityFromCase = useCaseStore((s) => s.removeEntityFromCase)

  const setSelectedAsset = useAppStore((s) => s.setSelectedAsset)
  const assetData = useAppStore((s) => s.assetData)

  const [newNote, setNewNote] = useState('')
  const [tab, setTab] = useState<'overview' | 'entities' | 'activity' | 'notes'>('overview')

  const isArchived = caseItem.status === 'archived'

  const handleAddNote = () => {
    if (!newNote.trim()) return
    addNote(caseItem.id, caseItem.owner, newNote.trim())
    setNewNote('')
  }

  const handleEntityClick = (entity: CaseEntityRef) => {
    setSelectedCaseId(null)
    if (entity.entityType === 'asset') {
      const asset = assetData.find((a) => a.id === entity.entityId)
      if (asset) setSelectedAsset(asset)
    }
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="flex flex-col gap-2.5 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-mono text-muted-foreground/50">{caseItem.id}</span>
            {isArchived && (
              <span className="rounded-[2px] border border-muted-foreground/20 bg-muted/10 px-1 text-[7px] text-muted-foreground/50 uppercase">Archived</span>
            )}
          </div>
          <h2 className="mt-0.5 text-sm font-semibold text-foreground leading-tight">{caseItem.title}</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-[2px] border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${priorityColors[caseItem.priority]}`}>
              {caseItem.priority}
            </span>
            <span className={`rounded-[2px] border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${statusColors[caseItem.status]}`}>
              {caseItem.status}
            </span>
          </div>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-muted-foreground/70">{caseItem.description}</p>

      <div className="flex items-center gap-3 text-[9px] text-muted-foreground/50">
        <span>Owner: {caseItem.owner}</span>
        <span>Created: {new Date(caseItem.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="flex items-center gap-2 border-t border-border/40 pt-2">
        <button
          type="button"
          onClick={() => setTab('overview')}
          className={`rounded-[2px] px-2 py-1 text-[8px] font-bold uppercase tracking-wider transition-colors ${
            tab === 'overview' ? 'bg-accent/15 text-accent' : 'text-muted-foreground/50 hover:text-muted-foreground/80'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab('entities')}
          className={`rounded-[2px] px-2 py-1 text-[8px] font-bold uppercase tracking-wider transition-colors ${
            tab === 'entities' ? 'bg-accent/15 text-accent' : 'text-muted-foreground/50 hover:text-muted-foreground/80'
          }`}
        >
          Entities ({caseItem.entities.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('activity')}
          className={`rounded-[2px] px-2 py-1 text-[8px] font-bold uppercase tracking-wider transition-colors ${
            tab === 'activity' ? 'bg-accent/15 text-accent' : 'text-muted-foreground/50 hover:text-muted-foreground/80'
          }`}
        >
          Activity ({caseItem.events.length + caseItem.alerts.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('notes')}
          className={`rounded-[2px] px-2 py-1 text-[8px] font-bold uppercase tracking-wider transition-colors ${
            tab === 'notes' ? 'bg-accent/15 text-accent' : 'text-muted-foreground/50 hover:text-muted-foreground/80'
          }`}
        >
          Notes ({caseItem.notes.length})
        </button>
      </div>

      <div className="flex-1">
        {tab === 'overview' && (
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Entities</div>
              <div className="space-y-0.5">
                {caseItem.entities.slice(0, 5).map((e) => (
                  <button
                    key={e.entityId}
                    onClick={() => handleEntityClick(e)}
                    className="flex w-full items-center justify-between rounded-[2px] border border-border/40 bg-background/20 px-2 py-1 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-foreground/80">{e.entityName}</span>
                      <span className="ml-1.5 text-[7px] uppercase text-muted-foreground/50">{e.entityType}</span>
                    </div>
                    <span className="text-[7px] text-muted-foreground/40">{timeAgo(e.addedAt)}</span>
                  </button>
                ))}
                {caseItem.entities.length === 0 && (
                  <p className="text-[9px] text-muted-foreground/50">No entities linked</p>
                )}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Recent Activity</div>
              <div className="space-y-0.5">
                {[...caseItem.events, ...caseItem.alerts.map((a) => ({ ...a, isAlert: true }))]
                  .slice(0, 4)
                  .map((item: { isAlert?: boolean; title: string; timestamp?: string }, i) => (
                    <div key={i} className="rounded-[2px] border border-border/40 bg-background/20 px-2 py-1">
                      <div className="flex items-center gap-1.5">
                        <span className={'h-1.5 w-1.5 rounded-[2px] ' + (item.isAlert ? 'bg-red-400' : 'bg-cyan-400')} />
                        <span className="text-[9px] text-foreground/70">{item.title}</span>
                      </div>
                      {item.timestamp && <span className="text-[7px] text-muted-foreground/40">{timeAgo(item.timestamp)}</span>}
                    </div>
                  ))}
                {caseItem.events.length === 0 && caseItem.alerts.length === 0 && (
                  <p className="text-[9px] text-muted-foreground/50">No activity recorded</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'entities' && (
          <div className="space-y-0.5">
            {caseItem.entities.map((e) => (
              <div key={e.entityId} className="group flex items-center justify-between rounded-[2px] border border-border/40 bg-background/20 px-2 py-1">
                <button
                  onClick={() => handleEntityClick(e)}
                  className="min-w-0 flex-1 text-left transition-colors hover:text-white"
                >
                  <span className="text-[10px] text-foreground/80">{e.entityName}</span>
                  <span className="ml-1.5 text-[7px] uppercase text-muted-foreground/50">{e.entityType}</span>
                  <span className="ml-2 text-[7px] text-muted-foreground/40">{timeAgo(e.addedAt)}</span>
                </button>
                {!isArchived && (
                  <button
                    type="button"
                    onClick={() => removeEntityFromCase(caseItem.id, e.entityId)}
                    className="hidden group-hover:block rounded-sm px-1 py-0.5 text-[7px] text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {caseItem.entities.length === 0 && (
              <p className="py-4 text-center text-[10px] text-muted-foreground/50">Select an asset and use "Add to Case"</p>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="space-y-2">
            {caseItem.alerts.length > 0 && (
              <div>
                <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-red-400/50">Alerts</div>
                {caseItem.alerts.map((a, i) => (
                  <div key={i} className="mb-0.5 rounded-[2px] border border-red-400/20 bg-red-500/5 px-2 py-1">
                    <span className="text-[9px] text-red-300/90">{a.title}</span>
                    <span className="ml-2 rounded-[2px] border border-red-400/30 px-1 text-[7px] uppercase text-red-400/70">{a.severity}</span>
                  </div>
                ))}
              </div>
            )}
            {caseItem.events.length > 0 && (
              <div>
                <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Events</div>
                {caseItem.events.map((e, i) => (
                  <div key={i} className="mb-0.5 rounded-[2px] border border-border/40 bg-background/20 px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-[2px] bg-cyan-400" />
                      <span className="text-[9px] text-foreground/70">{e.title}</span>
                    </div>
                    <span className="text-[7px] text-muted-foreground/40">{timeAgo(e.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
            {caseItem.events.length === 0 && caseItem.alerts.length === 0 && (
              <p className="py-4 text-center text-[10px] text-muted-foreground/50">No activity recorded</p>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-2">
            {!isArchived && (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote() }}
                  placeholder="Add a note..."
                  className="flex-1 rounded-[2px] border border-border/60 bg-background px-2 py-1 text-[10px] text-foreground placeholder:text-muted-foreground/40 focus:border-muted-foreground/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="rounded-[2px] px-2.5 py-1 text-[9px] font-bold transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'var(--theme-primary, #00BFFF)' }}
                >
                  Add
                </button>
              </div>
            )}
            <div className="space-y-1">
              {caseItem.notes.map((note) => (
                <div key={note.id} className="rounded-[2px] border border-border/40 bg-background/20 px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-muted-foreground/60">{note.author}</span>
                    <span className="text-[7px] text-muted-foreground/40">{timeAgo(note.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-[9px] leading-relaxed text-foreground/70">{note.content}</p>
                </div>
              ))}
              {caseItem.notes.length === 0 && (
                <p className="py-4 text-center text-[10px] text-muted-foreground/50">No notes yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-border/40 pt-2">
        {!isArchived ? (
          <>
            <button
              type="button"
              onClick={() => archiveCase(caseItem.id)}
              className="flex-1 rounded-[2px] border border-border/60 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={() => { deleteCase(caseItem.id) }}
              className="flex-1 rounded-[2px] border border-red-400/30 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-red-400/70 hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => restoreCase(caseItem.id)}
            className="flex-1 rounded-[2px] border border-cyan-400/30 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-cyan-400/70 hover:bg-cyan-500/10 transition-colors"
          >
            Restore Case
          </button>
        )}
      </div>
    </div>
  )
}
