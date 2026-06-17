export type OperationalMode =
  | 'global-surveillance'
  | 'space-operations'
  | 'maritime-operations'
  | 'tactical-operations'

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

export type GroundStationStatus = 'active' | 'standby' | 'maintenance' | 'offline'

export interface GroundStation {
  id: string
  name: string
  type: 'ground-station'
  latitude: number
  longitude: number
  altitude: number
  status: GroundStationStatus
  lastUpdated: string
  coverageRadiusKm: number
  connectedSatelliteIds: string[]
  country: string
  operator: string
}

export interface GroundStationLink {
  id: string
  groundStationId: string
  satelliteId: string
  active: boolean
}

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
  alertCount: number
}

export type GlobeViewMode = '3D' | '2D' | 'Columbus'
export type ProjectionMode = 'globe' | 'flat' | 'space' | 'analytics'

export interface ConstellationInfo {
  id: string
  name: string
  type: 'leo' | 'meo' | 'geo' | 'heo'
  satelliteIds: string[]
  color: string
  coverageRadius: number
  healthStatus: 'healthy' | 'degraded' | 'critical'
  operator: string
}

export interface GlobeState {
  center: Coordinates
  zoom: number
  viewMode: GlobeViewMode
}

export type GeofenceCategory =
  | 'restricted-area'
  | 'military-base'
  | 'airbase'
  | 'naval-facility'
  | 'radar-installation'
  | 'mission-zone'
  | 'surveillance-area'

export type GeofenceShape = 'circle'

export type GeofencePriority = 'critical' | 'high' | 'medium' | 'low'

export type GeofenceStatus = 'active' | 'inactive' | 'warning' | 'breached'

export interface Geofence {
  id: string
  name: string
  category: GeofenceCategory
  shape: GeofenceShape
  priority: GeofencePriority
  status: GeofenceStatus
  description: string
  latitude: number
  longitude: number
  radiusKm: number
}

// ── Ontology Types ────────────────────────────────────────────────

export type OntologyClassId = string

export interface PropertyDef {
  name: string
  type: 'string' | 'number' | 'boolean' | 'enum' | 'date' | 'reference'
  description: string
  required: boolean
  defaultValue?: unknown
  enumValues?: string[]
  range?: [number, number]
  unit?: string
}

export interface RelationDef {
  id: string
  name: string
  description: string
  domain: OntologyClassId[]
  range: OntologyClassId[]
  inverse?: string
  isFunctional: boolean
  isTransitive: boolean
  isSymmetric: boolean
}

export interface Axiom {
  id: string
  type: 'subclass' | 'disjoint' | 'equivalent' | 'property-domain' | 'property-range' |
         'cardinality' | 'value-restriction' | 'instance-relation'
  description: string
  params: Record<string, unknown>
}

export interface OntologyClass {
  id: OntologyClassId
  name: string
  description: string
  parentIds: OntologyClassId[]
  properties: PropertyDef[]
  color: string
  icon: string
  displayOrder: number
}

export interface OntologyInstanceLink {
  ontologyClassId: OntologyClassId
  entityType: 'asset' | 'mission' | 'alert' | 'region' | 'ground-station' | 'constellation'
  entityId: string
  confidence: number
}

export interface ReasonerResult {
  classifications: { instanceId: string; className: OntologyClassId; confidence: number }[]
  inferredRelations: { sourceId: string; relation: string; targetId: string }[]
  violations: { axiomId: string; message: string; entityId: string }[]
  timestamp: number
}

// ── Investigation & Case Management ────────────────────────────────

export type CasePriority = 'low' | 'medium' | 'high' | 'critical'
export type CaseStatus = 'open' | 'in-progress' | 'pending-review' | 'closed' | 'archived'

export interface CaseEntityRef {
  entityType: 'asset' | 'mission' | 'alert' | 'region' | 'ground-station'
  entityId: string
  entityName: string
  addedAt: string
}

export interface CaseEventRef {
  eventId: string
  title: string
  timestamp: string
}

export interface CaseAlertRef {
  alertId: string
  title: string
  severity: string
}

export interface CaseNote {
  id: string
  author: string
  content: string
  createdAt: string
}

export interface CaseAttachment {
  id: string
  name: string
  type: string
  url: string
  size: number
}

export interface CaseScreenshot {
  id: string
  name: string
  dataUrl: string
  capturedAt: string
}

export interface InvestigationCase {
  id: string
  title: string
  description: string
  priority: CasePriority
  status: CaseStatus
  owner: string
  createdAt: string
  updatedAt: string
  entities: CaseEntityRef[]
  events: CaseEventRef[]
  alerts: CaseAlertRef[]
  screenshots: CaseScreenshot[]
  notes: CaseNote[]
  attachments: CaseAttachment[]
}
