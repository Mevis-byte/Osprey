// ── Engine-wide type definitions ──

export type EntityType =
  | 'satellite' | 'aircraft' | 'maritime' | 'ground-station'
  | 'weather-cell' | 'earthquake' | 'wildfire'
  | 'mission' | 'geofence' | 'radar' | 'sensor'
  | 'notam' | 'news-event'

export type DataQuality = 'live' | 'cached' | 'simulated' | 'fallback'

export interface EntitySource {
  provider: string
  lastUpdated: number
  refreshInterval: number
  quality: DataQuality
  confidence: number
}

export interface GeoPosition {
  lat: number
  lon: number
  alt: number
}

export interface GeoVelocity {
  speed: number
  heading: number
  verticalSpeed: number
}

export interface EntityBase {
  id: string
  type: EntityType
  name: string
  position: GeoPosition
  velocity: GeoVelocity
  status: string
  source: EntitySource
  metadata: Record<string, unknown>
}

// ── Event types ──

export enum EventType {
  EntityCreated = 'entity:created',
  EntityUpdated = 'entity:updated',
  EntityRemoved = 'entity:removed',
  EntityEnteredRegion = 'entity:entered-region',
  EntityLeftRegion = 'entity:left-region',
  ProviderStatusChanged = 'provider:status-changed',
  ProviderError = 'provider:error',
  CorrelationTriggered = 'correlation:triggered',
  GeofenceEntered = 'geofence:entered',
  GeofenceExited = 'geofence:exited',
  TelemetryReceived = 'telemetry:received',
  SourceRefreshed = 'source:refreshed',
}

export interface EngineEvent<T = unknown> {
  type: EventType
  timestamp: number
  payload: T
  source: string
}

export interface EntityEventPayload {
  entityId: string
  entityType: EntityType
  position?: GeoPosition
  changes?: Partial<EntityBase>
}

export interface CorrelationEventPayload {
  correlationId: string
  type: string
  description: string
  involvedEntities: string[]
  severity: 'info' | 'warning' | 'critical'
}

export type EventFilter = {
  types?: EventType[]
  entityTypes?: EntityType[]
  region?: { north: number; south: number; east: number; west: number }
  source?: string
}

// ── Provider interface ──

export type ProviderStatus = 'idle' | 'running' | 'error' | 'stopped'

export interface DataProvider {
  readonly id: string
  readonly displayName: string
  readonly status: ProviderStatus

  initialize(): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  shutdown(): Promise<void>
}

// ── Subscription types ──

export interface Subscription {
  id: string
  filter: EventFilter
  callback: (event: EngineEvent) => void
}

// ── Normalization types ──

export interface NormalizedEntity<T = Record<string, unknown>> {
  entity: EntityBase
  raw: T
  normalizedAt: number
}
