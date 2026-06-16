import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { OntologyClass, RelationDef, Axiom, OntologyClassId, ReasonerResult, OntologyInstanceLink } from '@/types'
import { ontologyClasses as defaultClasses, relationDefs as defaultRelations, axiomDefs as defaultAxioms } from '@/mock-data'

export interface OntologyStore {
  ontologyClasses: Map<OntologyClassId, OntologyClass>
  relationDefs: Map<string, RelationDef>
  axioms: Axiom[]
  instanceLinks: OntologyInstanceLink[]
  selectedConceptId: OntologyClassId | null
  selectedRelationId: string | null
  reasonerResult: ReasonerResult | null
  reasonerLog: string[]

  initOntology: () => void
  setSelectedConceptId: (id: OntologyClassId | null) => void
  setSelectedRelationId: (id: string | null) => void
  setReasonerResult: (result: ReasonerResult) => void
  appendReasonerLog: (entry: string) => void
  clearReasonerLog: () => void
  addInstanceLink: (link: OntologyInstanceLink) => void
  removeInstanceLink: (entityId: string) => void
  setInstanceLinks: (links: OntologyInstanceLink[]) => void
}

function arrayToMap<T extends { id: string }>(arr: T[]): Map<string, T> {
  const m = new Map<string, T>()
  arr.forEach((item) => m.set(item.id, item))
  return m
}

export const useOntologyStore = create<OntologyStore>()(
  devtools(
    (set) => ({
      ontologyClasses: arrayToMap(defaultClasses),
      relationDefs: arrayToMap(defaultRelations),
      axioms: defaultAxioms,
      instanceLinks: [],
      selectedConceptId: null,
      selectedRelationId: null,
      reasonerResult: null,
      reasonerLog: [],

      initOntology: () => set({
        ontologyClasses: arrayToMap(defaultClasses),
        relationDefs: arrayToMap(defaultRelations),
        axioms: defaultAxioms,
      }),

      setSelectedConceptId: (id) => set({ selectedConceptId: id, selectedRelationId: null }),
      setSelectedRelationId: (id) => set({ selectedRelationId: id, selectedConceptId: null }),
      setReasonerResult: (result) => set({ reasonerResult: result }),
      appendReasonerLog: (entry) => set((s) => ({ reasonerLog: [...s.reasonerLog.slice(-199), entry] })),
      clearReasonerLog: () => set({ reasonerLog: [] }),

      addInstanceLink: (link) => set((s) => {
        const existing = s.instanceLinks.filter((l) => l.entityId !== link.entityId)
        return { instanceLinks: [...existing, link] }
      }),

      removeInstanceLink: (entityId) => set((s) => ({
        instanceLinks: s.instanceLinks.filter((l) => l.entityId !== entityId),
      })),

      setInstanceLinks: (links) => set({ instanceLinks: links }),
    }),
    { name: 'ontology-store' },
  ),
)
