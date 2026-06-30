import { useEffect, useRef, useMemo } from 'react'
import Sigma from 'sigma'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { useOntologyStore } from '@/store/ontology-store'
import { buildOntologyGraph } from '@/services/ontology-graph'

const sigmaSettings = {
  renderLabels: true,
  labelRenderedSizeThreshold: 0,
  labelDensity: 0.07,
  labelFont: 'JetBrains Mono, monospace',
  labelSize: 7,
  labelColor: { color: '#e2e8f0' },
  defaultNodeColor: '#6b7280',
  defaultEdgeColor: '#374151',
  minCameraRatio: 0.1,
  maxCameraRatio: 20,
  labelBackground: { color: '#0f1219', opacity: 0.7, size: 0.5 },
  labelStroke: '#0f1219',
  labelStrokeWidth: 2,
  edgesSaturation: 0.4,
  nodesPowRatio: 0.5,
}

function randomPositions(g: import("graphology").default): void {
  g.forEachNode((node: string) => {
    if (g.getNodeAttribute(node, 'x') === undefined) {
      g.setNodeAttribute(node, 'x', (Math.random() - 0.5) * 200)
      g.setNodeAttribute(node, 'y', (Math.random() - 0.5) * 200)
    }
  })
}

export function RelationGraph() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)

  const ontologyClasses = useOntologyStore((s) => s.ontologyClasses)
  const relationDefs = useOntologyStore((s) => s.relationDefs)
  const setSelectedConceptId = useOntologyStore((s) => s.setSelectedConceptId)
  const setSelectedRelationId = useOntologyStore((s) => s.setSelectedRelationId)

  const graph = useMemo(() => buildOntologyGraph(ontologyClasses, relationDefs), [ontologyClasses, relationDefs])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (graph.order === 0) return

    randomPositions(graph)
    forceAtlas2.assign(graph, {
      iterations: 80,
      settings: {
        gravity: 0.3,
        scalingRatio: 3,
        slowDown: 8,
        edgeWeightInfluence: 0.3,
        strongGravityMode: true,
      },
    })

    const sigma = new Sigma(graph, container, sigmaSettings)
    sigmaRef.current = sigma

    return () => {
      sigma.kill()
      sigmaRef.current = null
    }
  }, [graph])

  useEffect(() => {
    const sigma = sigmaRef.current
    if (!sigma) return

    const onClick = ({ node }: { node: string }) => {
      if (!graph.hasNode(node)) return
      const nodeType = graph.getNodeAttribute(node, 'nodeType')
      if (nodeType === 'ontology-class') {
        setSelectedConceptId(node)
        setSelectedRelationId(null)
      } else if (nodeType === 'relation') {
        const relId = node.replace('rel:', '')
        setSelectedRelationId(relId)
        setSelectedConceptId(null)
      }
    }

    sigma.on('clickNode', onClick)
    return () => { sigma.removeListener('clickNode', onClick) }
  }, [graph, setSelectedConceptId, setSelectedRelationId])

  if (graph.order === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[10px] text-muted-foreground/50">No ontology graph data</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ position: 'relative', minHeight: 200, background: '#0a0c12' }}
    />
  )
}
