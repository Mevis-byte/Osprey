import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useOntologyStore } from '@/store/ontology-store'
import type { OntologyClass, OntologyClassId } from '@/types'

function buildTree(classes: Map<string, OntologyClass>): OntologyClass[] {
  const sorted = [...classes.values()].sort((a, b) => a.displayOrder - b.displayOrder)
  const roots = sorted.filter((c) => c.parentIds.length === 0)
  return roots
}

function TreeNode({
  classId,
  classes,
  depth,
  selectedConceptId,
  onSelect,
}: {
  classId: OntologyClassId
  classes: Map<string, OntologyClass>
  depth: number
  selectedConceptId: string | null
  onSelect: (id: string) => void
}) {
  const cls = classes.get(classId)
  const [expanded, setExpanded] = useState(depth < 2)
  if (!cls) return null

  const children = [...classes.values()].filter((c) => c.parentIds.includes(classId))
  const hasChildren = children.length > 0
  const isSelected = selectedConceptId === classId

  return (
    <div>
      <button
        type="button"
        onClick={() => { onSelect(classId); if (hasChildren) setExpanded(!expanded) }}
        className={`flex w-full items-center gap-1 rounded-sm px-1.5 py-1 text-left text-[10px] transition-colors ${
          isSelected
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground/70 hover:bg-accent/30 hover:text-muted-foreground'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-2.5 w-2.5 shrink-0" /> : <ChevronRight className="h-2.5 w-2.5 shrink-0" />
        ) : (
          <span className="w-2.5 shrink-0" />
        )}
        <span
          className="h-2 w-2 shrink-0 rounded-[2px]"
          style={{ backgroundColor: cls.color }}
        />
        <span className="truncate font-medium">{cls.name}</span>
        {cls.properties.length > 0 && (
          <span className="ml-auto text-[8px] text-muted-foreground/40">{cls.properties.length} props</span>
        )}
      </button>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.12 }}
          >
            {children.map((child) => (
              <TreeNode
                key={child.id}
                classId={child.id}
                classes={classes}
                depth={depth + 1}
                selectedConceptId={selectedConceptId}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ClassTree() {
  const ontologyClasses = useOntologyStore((s) => s.ontologyClasses)
  const selectedConceptId = useOntologyStore((s) => s.selectedConceptId)
  const setSelectedConceptId = useOntologyStore((s) => s.setSelectedConceptId)

  const roots = useMemo(() => buildTree(ontologyClasses), [ontologyClasses])

  return (
    <div className="flex flex-col gap-0.5">
      <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
        Class Hierarchy
      </div>
      {roots.map((root) => (
        <TreeNode
          key={root.id}
          classId={root.id}
          classes={ontologyClasses}
          depth={0}
          selectedConceptId={selectedConceptId}
          onSelect={setSelectedConceptId}
        />
      ))}
    </div>
  )
}
