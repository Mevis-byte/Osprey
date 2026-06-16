import { useMemo } from 'react'
import { useOntologyStore } from '@/store/ontology-store'
import type { OntologyClass, PropertyDef } from '@/types'

function getEffectiveProperties(
  classId: string,
  classes: Map<string, OntologyClass>,
): PropertyDef[] {
  const seen = new Set<string>()
  const props: PropertyDef[] = []
  const stack = [classId]

  while (stack.length > 0) {
    const current = stack.pop()!
    if (seen.has(current)) continue
    seen.add(current)
    const cls = classes.get(current)
    if (!cls) continue
    props.push(...cls.properties)
    stack.push(...cls.parentIds)
  }

  return props
}

export function PropertyTable() {
  const ontologyClasses = useOntologyStore((s) => s.ontologyClasses)
  const selectedConceptId = useOntologyStore((s) => s.selectedConceptId)
  const relationDefs = useOntologyStore((s) => s.relationDefs)
  const selectedRelationId = useOntologyStore((s) => s.selectedRelationId)

  const selectedClass = selectedConceptId ? ontologyClasses.get(selectedConceptId) : null
  const selectedRelation = selectedRelationId ? relationDefs.get(selectedRelationId) : null

  const inheritedProps = useMemo(() => {
    if (!selectedConceptId) return []
    const all = getEffectiveProperties(selectedConceptId, ontologyClasses)
    const direct = ontologyClasses.get(selectedConceptId)?.properties ?? []
    const directNames = new Set(direct.map((p) => p.name))
    return all.filter((p) => !directNames.has(p.name))
  }, [selectedConceptId, ontologyClasses])

  if (selectedRelation) {
    return (
      <div className="space-y-2">
        <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
          Relation Details
        </div>
        <div className="space-y-1 rounded-[2px] border border-border/50 bg-background/40 px-2.5 py-2">
          <PropertyRow label="Name" value={selectedRelation.name} />
          <PropertyRow label="ID" value={selectedRelation.id} />
          <PropertyRow label="Inverse" value={selectedRelation.inverse ?? 'N/A'} />
          <PropertyRow label="Functional" value={selectedRelation.isFunctional ? 'Yes' : 'No'} />
          <PropertyRow label="Transitive" value={selectedRelation.isTransitive ? 'Yes' : 'No'} />
          <PropertyRow label="Symmetric" value={selectedRelation.isSymmetric ? 'Yes' : 'No'} />
          <PropertyRow label="Domain" value={selectedRelation.domain.join(', ')} />
          <PropertyRow label="Range" value={selectedRelation.range.join(', ')} />
        </div>
        <p className="px-1 text-[9px] leading-relaxed text-muted-foreground/60">
          {selectedRelation.description}
        </p>
      </div>
    )
  }

  if (!selectedClass) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[10px] text-muted-foreground/50">Select a concept to view properties</p>
      </div>
    )
  }

  const directProps = selectedClass.properties

  return (
    <div className="space-y-3">
      <div className="px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: selectedClass.color }} />
          <span className="text-xs font-bold text-foreground">{selectedClass.name}</span>
        </div>
        <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground/60">
          {selectedClass.description}
        </p>
        <p className="mt-1 text-[8px] text-muted-foreground/40">
          ID: {selectedClass.id} · Parents: {selectedClass.parentIds.length ? selectedClass.parentIds.join(', ') : '(root)'}
        </p>
      </div>

      {directProps.length > 0 && (
        <div>
          <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Direct Properties ({directProps.length})
          </div>
          <div className="space-y-0.5">
            {directProps.map((prop) => (
              <PropertyCard key={prop.name} prop={prop} />
            ))}
          </div>
        </div>
      )}

      {inheritedProps.length > 0 && (
        <div>
          <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">
            Inherited Properties ({inheritedProps.length})
          </div>
          <div className="space-y-0.5 opacity-60">
            {inheritedProps.map((prop) => (
              <PropertyCard key={prop.name} prop={prop} />
            ))}
          </div>
        </div>
      )}

      {directProps.length === 0 && inheritedProps.length === 0 && (
        <p className="px-1 text-[10px] text-muted-foreground/50">No properties defined</p>
      )}
    </div>
  )
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[9px] text-muted-foreground/60">{label}</span>
      <span className="text-[10px] font-mono text-foreground/80">{value}</span>
    </div>
  )
}

function PropertyCard({ prop }: { prop: PropertyDef }) {
  return (
    <div className="rounded-[2px] border border-border/40 bg-background/20 px-2.5 py-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-foreground/80">{prop.name}</span>
        <span className="rounded-[2px] border border-border/40 px-1 text-[8px] uppercase text-muted-foreground/50">
          {prop.type}
        </span>
      </div>
      <p className="mt-0.5 text-[8px] text-muted-foreground/50">{prop.description}</p>
      <div className="mt-0.5 flex flex-wrap gap-1.5">
        {prop.required && <span className="text-[7px] text-red-400/70">required</span>}
        {prop.unit && <span className="text-[7px] text-muted-foreground/40">unit: {prop.unit}</span>}
        {prop.enumValues && (
          <span className="text-[7px] text-muted-foreground/40">
            values: {prop.enumValues.join(' | ')}
          </span>
        )}
        {prop.range && (
          <span className="text-[7px] text-muted-foreground/40">
            range: [{prop.range[0]}, {prop.range[1]}]
          </span>
        )}
      </div>
    </div>
  )
}
