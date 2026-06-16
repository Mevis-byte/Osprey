import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { InvestigationCase, CaseEntityRef, CaseEventRef, CaseAlertRef, CaseScreenshot, CasePriority, CaseStatus } from '@/types'
import { mockCases } from '@/mock-data'

function generateId(): string {
  return `CASE-${Date.now().toString(36).slice(-4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function now(): string {
  return new Date().toISOString()
}

export interface CreateCaseInput {
  title: string
  description: string
  priority: CasePriority
  owner: string
}

export interface CaseStore {
  cases: InvestigationCase[]
  selectedCaseId: string | null
  searchQuery: string

  setSelectedCaseId: (id: string | null) => void
  setSearchQuery: (query: string) => void

  createCase: (input: CreateCaseInput) => string
  updateCase: (id: string, data: Partial<InvestigationCase>) => void
  deleteCase: (id: string) => void
  archiveCase: (id: string) => void
  restoreCase: (id: string) => void

  addEntityToCase: (caseId: string, entity: CaseEntityRef) => void
  removeEntityFromCase: (caseId: string, entityId: string) => void

  addNote: (caseId: string, author: string, content: string) => void
  addEvent: (caseId: string, event: CaseEventRef) => void
  addAlert: (caseId: string, alert: CaseAlertRef) => void
  addScreenshot: (caseId: string, screenshot: Omit<CaseScreenshot, 'id'>) => void

  getFilteredCases: () => InvestigationCase[]
}

export const useCaseStore = create<CaseStore>()(
  devtools(
    (set, get) => ({
      cases: mockCases,
      selectedCaseId: null,
      searchQuery: '',

      setSelectedCaseId: (id) => set({ selectedCaseId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      createCase: (input) => {
        const id = generateId()
        const c: InvestigationCase = {
          id,
          title: input.title,
          description: input.description,
          priority: input.priority,
          status: 'open',
          owner: input.owner,
          createdAt: now(),
          updatedAt: now(),
          entities: [],
          events: [],
          alerts: [],
          screenshots: [],
          notes: [],
          attachments: [],
        }
        set((s) => ({ cases: [c, ...s.cases], selectedCaseId: id }))
        return id
      },

      updateCase: (id, data) =>
        set((s) => ({
          cases: s.cases.map((c) => (c.id === id ? { ...c, ...data, updatedAt: now() } : c)),
        })),

      deleteCase: (id) =>
        set((s) => ({
          cases: s.cases.filter((c) => c.id !== id),
          selectedCaseId: s.selectedCaseId === id ? null : s.selectedCaseId,
        })),

      archiveCase: (id) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id === id ? { ...c, status: 'archived' as CaseStatus, updatedAt: now() } : c,
          ),
        })),

      restoreCase: (id) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id === id ? { ...c, status: 'open' as CaseStatus, updatedAt: now() } : c,
          ),
        })),

      addEntityToCase: (caseId, entity) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id === caseId
              ? { ...c, entities: c.entities.some((e) => e.entityId === entity.entityId) ? c.entities : [...c.entities, entity], updatedAt: now() }
              : c,
          ),
        })),

      removeEntityFromCase: (caseId, entityId) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id === caseId
              ? { ...c, entities: c.entities.filter((e) => e.entityId !== entityId), updatedAt: now() }
              : c,
          ),
        })),

      addNote: (caseId, author, content) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id === caseId
              ? {
                  ...c,
                  notes: [
                    ...c.notes,
                    { id: `N-${Date.now()}`, author, content, createdAt: now() },
                  ],
                  updatedAt: now(),
                }
              : c,
          ),
        })),

      addEvent: (caseId, event) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id === caseId
              ? { ...c, events: [...c.events, event], updatedAt: now() }
              : c,
          ),
        })),

      addAlert: (caseId, alert) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id === caseId
              ? { ...c, alerts: [...c.alerts, alert], updatedAt: now() }
              : c,
          ),
        })),

      addScreenshot: (caseId, screenshot) =>
        set((s) => ({
          cases: s.cases.map((c) =>
            c.id === caseId
              ? { ...c, screenshots: [...c.screenshots, { ...screenshot, id: `SS-${Date.now()}` }], updatedAt: now() }
              : c,
          ),
        })),

      getFilteredCases: () => {
        const { cases, searchQuery } = get()
        if (!searchQuery.trim()) return cases
        const q = searchQuery.toLowerCase()
        return cases.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.owner.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q),
        )
      },
    }),
    { name: 'case-store' },
  ),
)
