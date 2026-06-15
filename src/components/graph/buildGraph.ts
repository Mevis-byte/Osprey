import Graph from 'graphology'
import { REGIONS, pointInRegion } from '@/services/analytics'
import type { Asset, Alert, Mission } from '@/types'

const NODE_COLORS: Record<string, string> = {
  'fixed-wing': '#22d3ee',
  'rotary-wing': '#22d3ee',
  maritime: '#4ade80',
  satellite: '#fbbf24',
  mission: '#a78bfa',
  region: '#60a5fa',
  alert: '#f87171',
}

const EDGE_COLORS: Record<string, string> = {
  'assigned-to': '#a78bfa',
  'located-in': '#60a5fa',
  triggered: '#f87171',
  monitors: '#818cf8',
}

function getAssetColor(asset: Asset): string {
  if (asset.type === 'satellite') return NODE_COLORS.satellite
  if (asset.type === 'maritime') return NODE_COLORS.maritime
  return NODE_COLORS['fixed-wing']
}

function getAlertColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ef4444'
    case 'high': return '#f97316'
    case 'medium': return '#eab308'
    default: return '#6b7280'
  }
}

function getMissionColor(idx: number): string {
  const palette = ['#a78bfa', '#818cf8', '#6366f1', '#8b5cf6', '#7c3aed']
  return palette[idx % palette.length]
}

export function buildGraph(
  assets: Asset[],
  missions: Mission[],
  alerts: Alert[],
): Graph {
  const graph = new Graph()

  const missionNodes: string[] = []
  const regionNodes: string[] = []
  const alertNodes: string[] = []

  missions.forEach((m, i) => {
    const id = `mission:${m.id}`
    missionNodes.push(id)
    graph.addNode(id, {
      label: m.name,
      size: 10,
      color: getMissionColor(i),
      nodeType: 'mission',
      entityId: m.id,
      fontWeight: 'bold',
    })
  })

  const matchedRegions = new Set<string>()
  assets.forEach((asset) => {
    for (const region of REGIONS) {
      if (pointInRegion(asset.latitude, asset.longitude, region)) {
        matchedRegions.add(region.key)
        break
      }
    }
  })
  missions.forEach((m) => {
    const region = REGIONS.find(
      (r) => m.region.toLowerCase().includes(r.name.toLowerCase()) ||
             r.name.toLowerCase().includes(m.region.toLowerCase()),
    )
    if (region) matchedRegions.add(region.key)
  })

  REGIONS.forEach((r) => {
    if (!matchedRegions.has(r.key)) return
    const id = `region:${r.key}`
    regionNodes.push(id)
    graph.addNode(id, {
      label: r.name,
      size: 9,
      color: NODE_COLORS.region,
      nodeType: 'region',
      entityId: r.key,
    })
  })

  assets.forEach((asset) => {
    const id = `asset:${asset.id}`
    graph.addNode(id, {
      label: asset.name,
      size: 7,
      color: getAssetColor(asset),
      nodeType: 'asset',
      entityId: asset.id,
    })
  })

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged)
  unacknowledgedAlerts.slice(0, 20).forEach((alert) => {
    const id = `alert:${alert.id}`
    alertNodes.push(id)
    graph.addNode(id, {
      label: alert.title.length > 25 ? alert.title.slice(0, 25) + '…' : alert.title,
      size: 5,
      color: getAlertColor(alert.severity),
      nodeType: 'alert',
      entityId: alert.id,
    })
  })

  missions.forEach((m) => {
    const missionId = `mission:${m.id}`
    m.assets.forEach((assetId) => {
      if (graph.hasNode(missionId) && graph.hasNode(`asset:${assetId}`)) {
        graph.addEdge(missionId, `asset:${assetId}`, {
          label: 'assigned to',
          color: EDGE_COLORS['assigned-to'],
          size: 1,
        })
      }
    })

    const region = REGIONS.find(
      (r) => m.region.toLowerCase().includes(r.name.toLowerCase()) ||
             r.name.toLowerCase().includes(m.region.toLowerCase()),
    )
    if (region && graph.hasNode(missionId) && graph.hasNode(`region:${region.key}`)) {
      graph.addEdge(missionId, `region:${region.key}`, {
        label: 'monitors',
        color: EDGE_COLORS.monitors,
        size: 1,
      })
    }
  })

  assets.forEach((asset) => {
    const assetId = `asset:${asset.id}`
    if (!graph.hasNode(assetId)) return

    for (const region of REGIONS) {
      if (pointInRegion(asset.latitude, asset.longitude, region)) {
        const regionId = `region:${region.key}`
        if (graph.hasNode(regionId)) {
          graph.addEdge(assetId, regionId, {
            label: 'located in',
            color: EDGE_COLORS['located-in'],
            size: 1,
          })
        }
        break
      }
    }
  })

  unacknowledgedAlerts.slice(0, 20).forEach((alert) => {
    const alertId = `alert:${alert.id}`
    if (!graph.hasNode(alertId)) return

    alert.assetIds.forEach((assetId) => {
      const assetNodeId = `asset:${assetId}`
      if (graph.hasNode(assetNodeId)) {
        graph.addEdge(alertId, assetNodeId, {
          label: 'triggered',
          color: EDGE_COLORS.triggered,
          size: 1,
          type: 'dashed',
        })
      }
    })
  })

  return graph
}
