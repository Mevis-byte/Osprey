import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useCaseStore } from '@/store/case-store'
import type { CasePriority, CaseStatus, InvestigationCase } from '@/types'

interface CaseFormDialogProps {
  open: boolean
  onClose: () => void
  editCase?: InvestigationCase | null
}

export function CaseFormDialog({ open, onClose, editCase }: CaseFormDialogProps) {
  const createCase = useCaseStore((s) => s.createCase)
  const updateCase = useCaseStore((s) => s.updateCase)

  const [title, setTitle] = useState(editCase?.title ?? '')
  const [description, setDescription] = useState(editCase?.description ?? '')
  const [priority, setPriority] = useState<CasePriority>(editCase?.priority ?? 'medium')
  const [owner, setOwner] = useState(editCase?.owner ?? '')
  const [status, setStatus] = useState(editCase?.status ?? 'open')

  const isEditing = !!editCase

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (isEditing && editCase) {
      updateCase(editCase.id, { title: title.trim(), description: description.trim(), priority, owner: owner.trim(), status })
    } else {
      createCase({ title: title.trim(), description: description.trim(), priority, owner: owner.trim() || 'Unassigned' })
    }
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg rounded-sm border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/80">
                {isEditing ? 'Edit Case' : 'Create New Case'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 px-4 py-3">
              <div>
                <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Investigation title"
                  required
                  className="w-full rounded-[2px] border border-border/60 bg-background px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-muted-foreground/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the investigation scope and objectives"
                  rows={3}
                  className="w-full resize-none rounded-[2px] border border-border/60 bg-background px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-muted-foreground/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as CasePriority)}
                    className="w-full rounded-[2px] border border-border/60 bg-background px-2.5 py-1.5 text-[11px] text-foreground focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Owner</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Analyst name"
                    className="w-full rounded-[2px] border border-border/60 bg-background px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-muted-foreground/30 focus:outline-none"
                  />
                </div>
              </div>

              {isEditing && (
                <div>
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CaseStatus)}
                    className="w-full rounded-[2px] border border-border/60 bg-background px-2.5 py-1.5 text-[11px] text-foreground focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="pending-review">Pending Review</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-[2px] border border-border/60 px-3 py-1.5 text-[10px] font-medium text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[2px] px-3 py-1.5 text-[10px] font-bold transition-colors"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: 'var(--theme-primary, #00BFFF)',
                  }}
                >
                  {isEditing ? 'Save Changes' : 'Create Case'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
