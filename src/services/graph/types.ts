import type { Asset, Mission, Alert } from '@/types'

// ─── Node Labels ──────────────────────────────────────────────────────────────

export type GraphNodeLabel = 'Asset' | 'Mission' | 'Alert' | 'Region'

// ─── Relationship Types ───────────────────────────────────────────────────────

export type GraphRelationshipType =
  | 'ASSIGNED_TO'
  | 'LOCATED_IN'
  | 'TRIGGERED'
  | 'MONITORS'

// ─── Node Property Maps ───────────────────────────────────────────────────────

export interface AssetNodeProperties {
  id: string
  name: string
  type: string
  latitude: number
  longitude: number
  altitude: number
  speed: number
  heading: number
  status: string
  lastUpdated: string
  // Aircraft
  callsign?: string
  range?: number
  fuelLevel?: number
  // Maritime
  mmsi?: string
  destination?: string
  draft?: number
  length?: number
  // Satellite
  noradId?: string
  inclination?: number
  period?: number
}

export interface MissionNodeProperties {
  id: string
  name: string
  status: string
  objective: string
  region: string
  startTime: string
  endTime?: string
  threatLevel: string
}

export interface AlertNodeProperties {
  id: string
  title: string
  message: string
  severity: string
  timestamp: string
  acknowledged: boolean
  threatLevel?: string
}

export interface RegionNodeProperties {
  id: string
  name: string
  minLatitude: number
  maxLatitude: number
  minLongitude: number
  maxLongitude: number
}

// ─── Relationship Property Maps ───────────────────────────────────────────────

export interface AssignedToProps {
  since: string
}

export interface LocatedInProperties {
  detectedAt: string
}

export interface TriggeredProperties {
  severity: string
  timestamp: string
  acknowledged: boolean
}

export interface MonitorsProperties {
  since: string
  priority: string
}

// ─── Graph Query Result ───────────────────────────────────────────────────────

export interface GraphQueryResult<T = Record<string, unknown>> {
  records: T[]
  summary: {
    query: string
    params: Record<string, unknown>
    elapsed: number
  }
}

// ─── Entity Mapping ───────────────────────────────────────────────────────────

export function assetToNodeProps(asset: Asset): AssetNodeProperties {
  const base: AssetNodeProperties = {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    latitude: asset.latitude,
    longitude: asset.longitude,
    altitude: asset.altitude,
    speed: asset.speed,
    heading: asset.heading,
    status: asset.status,
    lastUpdated: asset.lastUpdated,
  }
  if ('callsign' in asset) {
    base.callsign = asset.callsign
    base.range = asset.range
    base.fuelLevel = asset.fuelLevel
  }
  if ('mmsi' in asset) {
    base.mmsi = asset.mmsi
    base.destination = asset.destination
    base.draft = asset.draft
    base.length = asset.length
  }
  if ('noradId' in asset) {
    base.noradId = asset.noradId
    base.inclination = asset.inclination
    base.period = asset.period
  }
  return base
}

export function missionToNodeProps(mission: Mission): MissionNodeProperties {
  return {
    id: mission.id,
    name: mission.name,
    status: mission.status,
    objective: mission.objective,
    region: mission.region,
    startTime: mission.startTime,
    endTime: mission.endTime,
    threatLevel: mission.threatLevel,
  }
}

export function alertToNodeProps(alert: Alert): AlertNodeProperties {
  return {
    id: alert.id,
    title: alert.title,
    message: alert.message,
    severity: alert.severity,
    timestamp: alert.timestamp,
    acknowledged: alert.acknowledged,
  }
}
