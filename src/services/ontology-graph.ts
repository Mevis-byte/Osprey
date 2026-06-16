import Graph from 'graphology'
import type { OntologyClass, RelationDef } from '@/types'

export function buildOntologyGraph(
  classes: Map<string, OntologyClass>,
  relations: Map<string, RelationDef>,
): Graph {
  const graph = new Graph()

  for (const cls of classes.values()) {
    graph.addNode(cls.id, {
      label: cls.name,
      size: cls.parentIds.length === 0 ? 14 : cls.parentIds.length === 1 ? 10 : 7,
      color: cls.color,
      nodeType: 'ontology-class',
      displayOrder: cls.displayOrder,
      description: cls.description,
    })
  }

  for (const cls of classes.values()) {
    for (const parentId of cls.parentIds) {
      if (graph.hasNode(cls.id) && graph.hasNode(parentId)) {
        if (!graph.hasEdge(cls.id, parentId) && !graph.hasEdge(parentId, cls.id)) {
          graph.addEdge(cls.id, parentId, {
            label: 'subclass-of',
            color: '#6b7280',
            size: 1,
            type: 'arrow',
          })
        }
      }
    }
  }

  for (const rel of relations.values()) {
    const relNodeId = `rel:${rel.id}`
    if (!graph.hasNode(relNodeId)) {
      graph.addNode(relNodeId, {
        label: rel.name,
        size: 5,
        color: '#a78bfa',
        nodeType: 'relation',
        description: rel.description,
      })
    }
    for (const domainId of rel.domain) {
      if (graph.hasNode(domainId) && graph.hasNode(relNodeId)) {
        const edgeKey = `${domainId}->${relNodeId}`
        if (!graph.hasEdge(edgeKey)) {
          graph.addEdge(domainId, relNodeId, {
            label: 'domain',
            color: '#818cf8',
            size: 0.5,
          })
        }
      }
    }
    for (const rangeId of rel.range) {
      if (graph.hasNode(rangeId) && graph.hasNode(relNodeId)) {
        const edgeKey = `${relNodeId}->${rangeId}`
        if (!graph.hasEdge(edgeKey)) {
          graph.addEdge(relNodeId, rangeId, {
            label: 'range',
            color: '#34d399',
            size: 0.5,
          })
        }
      }
    }
  }

  return graph
}
