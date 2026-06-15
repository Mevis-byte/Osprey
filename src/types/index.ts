export type AssetType =
  | 'fixed-wing'
  | 'rotary-wing'
  | 'maritime'
  | 'satellite'
  | 'ground-vehicle'
  | 'stationary'

export type AssetStatus =
  | 'active'
  | 'standby'
  | 'offline'
  | 'maintenance'
  | 'unknown'
  | 'lost'

export type ThreatLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export type MissionStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'aborted'
  | 'standby'
  | 'cancelled'

export interface Coordinates {
  latitude: number
  longitude: number
  altitude: number
}

interface AssetBase {
  id: string
  name: string
  latitude: number
  longitude: number
  altitude: number
  speed: number
  heading: number
  status: AssetStatus
  lastUpdated: string
}

export interface Aircraft extends AssetBase {
  type: Extract<AssetType, 'fixed-wing' | 'rotary-wing'>
  callsign: string
  icao?: string
  range: number
  fuelLevel: number
  pilot?: string
}

export interface MaritimeAsset extends AssetBase {
  type: Extract<AssetType, 'maritime'>
  mmsi: string
  imo?: string
  destination?: string
  draft: number
  length: number
  beam: number
}

export interface Satellite extends AssetBase {
  type: Extract<AssetType, 'satellite'>
  noradId: string
  inclination: number
  apogee: number
  perigee: number
  period: number
  launchDate: string
}

export type Asset = Aircraft | MaritimeAsset | Satellite

export interface TelemetryData {
  id: string
  assetId: string
  timestamp: string
  latitude: number
  longitude: number
  altitude: number
  heading: number
  pitch: number
  roll: number
  speed: number
  verticalSpeed: number
}

export interface FeedEvent {
  id: string
  type: 'intel' | 'status' | 'movement' | 'report'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  body: string
  timestamp: string
  source: string
  assetIds: string[]
  threatLevel: ThreatLevel
}

export interface Alert {
  id: string
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  acknowledged: boolean
  acknowledgedBy?: string
  assetIds: string[]
  expiresAt?: string
}

export interface Mission {
  id: string
  name: string
  status: MissionStatus
  objective: string
  assets: string[]
  region: string
  startTime: string
  endTime?: string
  threatLevel: ThreatLevel
  waypoints: Coordinates[]
}

export interface Region {
  id: string
  name: string
  bounds: [number, number, number, number]
  center: Coordinates
  threatLevel: ThreatLevel
  activeMissions: string[]
  assetCount: number
}

export type GlobeViewMode = '3D' | '2D' | 'Columbus'

export interface GlobeState {
  center: Coordinates
  zoom: number
  viewMode: GlobeViewMode
}
