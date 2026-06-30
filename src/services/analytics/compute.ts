import { REGIONS, pointInRegion } from './region-defs'
import type { Asset, Alert, Mission, Satellite } from '@/types'

export const EARTH_RADIUS_KM = 6371
export const SPEED_OF_LIGHT_KMS = 299792

export interface RegionAnalytics {
  key: string
  name: string
  assetCount: number
  threatCount: number
  missionCount: number
  alertCount: number
}

/** Coverage radius (km) from satellite altitude */
export function coverageRadiusKm(altitudeMeters: number): number {
  const h = altitudeMeters / 1000
  if (h <= 0) return 0
  return EARTH_RADIUS_KM * Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + h))
}

/** Orbital period (minutes) for a circular orbit at given altitude */
export function orbitalPeriodMin(altitudeMeters: number): number {
  const h = altitudeMeters / 1000
  const a = (EARTH_RADIUS_KM + h) * 1000
  const mu = 3.986004418e14
  return 2 * Math.PI * Math.sqrt(a ** 3 / mu) / 60
}

/** Orbital velocity (m/s) for a circular orbit */
export function orbitalVelocity(altitudeMeters: number): number {
  const r = (EARTH_RADIUS_KM * 1000) + altitudeMeters
  const mu = 3.986004418e14
  return Math.sqrt(mu / r)
}

/** Great-circle distance (km) between two points */
export function greatCircleKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** One-way signal latency (ms) between two points via a satellite relay */
export function signalLatencyMs(
  gsLat: number, gsLon: number,
  sat: Satellite,
  destLat: number, destLon: number,
): number {
  const up = greatCircleKm(gsLat, gsLon, sat.latitude, sat.longitude)
  const down = greatCircleKm(sat.latitude, sat.longitude, destLat, destLon)
  const totalKm = Math.sqrt(up ** 2 + (sat.altitude / 1000) ** 2) +
    Math.sqrt(down ** 2 + (sat.altitude / 1000) ** 2)
  return (totalKm / SPEED_OF_LIGHT_KMS) * 1000
}

/** Estimated satellite orbital class based on altitude */
export function orbitClass(altitudeMeters: number): 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'unknown' {
  const h = altitudeMeters / 1000
  if (h < 200) return 'unknown'
  if (h < 2000) return 'LEO'
  if (h < 20000) return 'MEO'
  if (h < 40000) return 'GEO'
  return 'HEO'
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
