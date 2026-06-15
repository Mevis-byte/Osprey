import { useEffect, useRef, useMemo, useState } from 'react'
import Sigma from 'sigma'
import Graph from 'graphology'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { useAppStore } from '@/store'
import { buildGraph } from './buildGraph'

function randomPositions(g: Graph): void {
  g.forEachNode((node) => {
    if (g.getNodeAttribute(node, 'x') === undefined) {
      g.setNodeAttribute(node, 'x', (Math.random() - 0.5) * 200)
      g.setNodeAttribute(node, 'y', (Math.random() - 0.5) * 200)
    }
  })
}

const sigmaSettings = {
  renderLabels: true,
  labelRenderedSizeThreshold: 0,
  labelDensity: 0.07,
  labelFont: 'JetBrains Mono, monospace',
  labelSize: 8,
  labelColor: { color: '#e2e8f0' },
  defaultNodeColor: '#6b7280',
  defaultEdgeColor: '#374151',
  edgeLabelSize: 6,
  minCameraRatio: 0.1,
  maxCameraRatio: 20,
  labelBackground: { color: '#0f1219', opacity: 0.7, size: 0.5 },
  labelStroke: '#0f1219',
  labelStrokeWidth: 2,
}

function GraphWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const [ready, setReady] = useState(false)

  const assets = useAppStore((s) => s.assetData)
  const missions = useAppStore((s) => s.missions)
  const alerts = useAppStore((s) => s.alerts)
  const selectedAsset = useAppStore((s) => s.selectedAsset)
  const selectedMission = useAppStore((s) => s.selectedMission)
  const setSelectedAsset = useAppStore((s) => s.setSelectedAsset)
  const setSelectedMission = useAppStore((s) => s.setSelectedMission)
  const requestFocus = useAppStore((s) => s.requestFocus)

  const graph = useMemo(() => buildGraph(assets, missions, alerts), [assets, missions, alerts])

  const selectedNodeId = useMemo(() => {
    if (selectedAsset) return `asset:${selectedAsset.id}`
    if (selectedMission) return `mission:${selectedMission.id}`
    return null
  }, [selectedAsset, selectedMission])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (graph.order === 0) return

    randomPositions(graph)

    forceAtlas2.assign(graph, {
      iterations: 120,
      settings: {
        gravity: 0.2,
        scalingRatio: 4,
        slowDown: 10,
        edgeWeightInfluence: 0.5,
        strongGravityMode: true,
      },
    })

    const sigma = new Sigma(graph, container, sigmaSettings)
    sigmaRef.current = sigma
    graphRef.current = graph
    setReady(true)

    return () => {
      sigma.kill()
      sigmaRef.current = null
      graphRef.current = null
      setReady(false)
    }
  }, [graph])

  useEffect(() => {
    if (!ready) return
    const sigma = sigmaRef.current
    const g = graphRef.current
    if (!sigma || !g) return

    const onEnterNode = ({ node }: { node: string }) => {
      if (!g.hasNode(node)) return
      const size = g.getNodeAttribute(node, 'size') as number
      g.setNodeAttribute(node, 'size', size * 1.8)
    }

    const onLeaveNode = ({ node }: { node: string }) => {
      if (!g.hasNode(node)) return
      const size = g.getNodeAttribute(node, 'size') as number
      g.setNodeAttribute(node, 'size', Math.max(size / 1.8, 5))
    }

    const onClickNode = ({ node }: { node: string }) => {
      if (!g.hasNode(node)) return
      const nodeType = g.getNodeAttribute(node, 'nodeType')
      const entityId = g.getNodeAttribute(node, 'entityId')

      if (nodeType === 'asset') {
        const asset = assets.find((a) => a.id === entityId)
        if (asset) {
          setSelectedMission(null)
          setSelectedAsset(asset)
          requestFocus(entityId)
        }
      } else if (nodeType === 'mission') {
        const mission = missions.find((m) => m.id === entityId)
        if (mission) {
          setSelectedAsset(null)
          setSelectedMission(mission)
        }
      }
    }

    sigma.on('enterNode', onEnterNode)
    sigma.on('leaveNode', onLeaveNode)
    sigma.on('clickNode', onClickNode)

    return () => {
      sigma.removeListener('enterNode', onEnterNode)
      sigma.removeListener('leaveNode', onLeaveNode)
      sigma.removeListener('clickNode', onClickNode)
    }
  }, [ready, assets, missions, setSelectedAsset, setSelectedMission, requestFocus])

  useEffect(() => {
    const sigma = sigmaRef.current
    const g = graphRef.current
    if (!sigma || !g || !ready) return

    if (selectedNodeId && g.hasNode(selectedNodeId)) {
      sigma.getCamera().animate(
        {
          x: g.getNodeAttribute(selectedNodeId, 'x') as number,
          y: g.getNodeAttribute(selectedNodeId, 'y') as number,
          ratio: 0.6,
        },
        { duration: 300 },
      )
    }
  }, [selectedNodeId, ready])

  if (graph.order === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-[10px] text-muted-foreground/50">No graph data available</p>
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

export default GraphWorkspace
