import { REGIONS, pointInRegion } from './region-defs'
import type { Asset, Alert, Mission } from '@/types'

export interface RegionAnalytics {
  key: string
  name: string
  assetCount: number
  threatCount: number
  missionCount: number
  alertCount: number
}

export function computeAnalytics(
  assets: Asset[],
  alerts: Alert[],
  missions: Mission[],
): RegionAnalytics[] {
  const assetCounts = new Map<string, number>()
  const threatCounts = new Map<string, number>()
  const alertCounts = new Map<string, number>()
  const missionCounts = new Map<string, number>()

  for (const region of REGIONS) {
    assetCounts.set(region.key, 0)
    threatCounts.set(region.key, 0)
    alertCounts.set(region.key, 0)
    missionCounts.set(region.key, 0)
  }

  for (const asset of assets) {
    if (asset.type === 'satellite') continue
    for (const region of REGIONS) {
      if (pointInRegion(asset.latitude, asset.longitude, region)) {
        assetCounts.set(region.key, (assetCounts.get(region.key) ?? 0) + 1)
        if (
          asset.status === 'offline' ||
          asset.status === 'lost' ||
          asset.status === 'unknown'
        ) {
          threatCounts.set(region.key, (threatCounts.get(region.key) ?? 0) + 1)
        }
        break
      }
    }
  }

  for (const alert of alerts) {
    if (alert.acknowledged) continue
    for (const assetId of alert.assetIds) {
      const asset = assets.find((a) => a.id === assetId)
      if (!asset || asset.type === 'satellite') continue
      for (const region of REGIONS) {
        if (pointInRegion(asset.latitude, asset.longitude, region)) {
          alertCounts.set(region.key, (alertCounts.get(region.key) ?? 0) + 1)
          break
        }
      }
    }
  }

  for (const mission of missions) {
    if (mission.status === 'cancelled' || mission.status === 'completed') continue
    for (const region of REGIONS) {
      const waypointInRegion = mission.waypoints.some((wp) =>
        pointInRegion(wp.latitude, wp.longitude, region),
      )
      if (waypointInRegion) {
        missionCounts.set(region.key, (missionCounts.get(region.key) ?? 0) + 1)
        break
      }
    }
  }

  return REGIONS.map((region) => ({
    key: region.key,
    name: region.name,
    assetCount: assetCounts.get(region.key) ?? 0,
    threatCount: threatCounts.get(region.key) ?? 0,
    missionCount: missionCounts.get(region.key) ?? 0,
    alertCount: alertCounts.get(region.key) ?? 0,
  }))
}
