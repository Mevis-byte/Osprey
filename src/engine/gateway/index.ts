import type { EntityBase, EngineEvent } from '../core/types'

/**
 * Gateway — External API Abstraction Layer
 *
 * Provides a unified interface for REST APIs, WebSocket streams, and
 * file-based ingestion. Each gateway wraps a specific external data source
 * and converts its output to normalized entities.
 */

export interface GatewayConfig {
  id: string
  name: string
  enabled: boolean
  baseUrl?: string
  apiKey?: string
  refreshIntervalMs: number
}

export interface GatewayStatus {
  id: string
  connected: boolean
  lastContact: number
  errorCount: number
  dataRate: number
}

export abstract class BaseGateway {
  abstract readonly config: GatewayConfig
  protected status: GatewayStatus
  protected onEntity: (entity: EntityBase) => void
  protected onEvent: (event: EngineEvent) => void
  protected onError: (err: Error) => void
  protected timerId: ReturnType<typeof setInterval> | null = null

  constructor(
    onEntity: (entity: EntityBase) => void,
    onEvent: (event: EngineEvent) => void,
    onError: (err: Error) => void,
  ) {
    this.onEntity = onEntity
    this.onEvent = onEvent
    this.onError = onError
    this.status = {
      id: onEntity.name || 'unknown',
      connected: false,
      lastContact: 0,
      errorCount: 0,
      dataRate: 0,
    }
  }

  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract fetch(): Promise<void>

  getStatus(): GatewayStatus {
    return { ...this.status }
  }

  protected recordSuccess(): void {
    this.status.connected = true
    this.status.lastContact = Date.now()
  }

  protected recordError(): void {
    this.status.errorCount++
    this.status.connected = this.status.errorCount < 3
  }
}

// ── Concrete: OpenSky Network ADS-B Gateway ──

export class OpenSkyGateway extends BaseGateway {
  readonly config: GatewayConfig = {
    id: 'opensky',
    name: 'OpenSky Network',
    enabled: true,
    baseUrl: 'https://opensky-network.org/api',
    refreshIntervalMs: 10_000,
  }

  async connect(): Promise<void> {
    // OpenSky REST API is public; no auth required for basic access
    this.timerId = setInterval(() => this.fetch(), this.config.refreshIntervalMs)
  }

  async disconnect(): Promise<void> {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  async fetch(): Promise<void> {
    try {
      const res = await fetch(`${this.config.baseUrl}/states/all?lamin=20&lomin=-130&lamax=50&lomax=-60`)
      if (!res.ok) {
        this.recordError()
        return
      }
      const data = await res.json()
      const states = data.states as unknown[][] | undefined
      if (!states) {
        this.recordSuccess()
        return
      }
      for (const s of states) {
        const icao24 = s[0] as string
        const flight = (s[1] as string ?? '').trim()
        const lat = s[6] as number
        const lon = s[5] as number
        const altitude = s[7] as number
        const velocity = s[9] as number
        const heading = s[3] as number
        const verticalRate = s[11] as number
        if (lat == null || lon == null) continue
        this.onEntity({
          id: `ac-${icao24}`,
          type: 'aircraft',
          name: flight || `Aircraft ${icao24}`,
          position: { lat, lon, alt: altitude || 0 },
          velocity: { speed: velocity || 0, heading: heading || 0, verticalSpeed: verticalRate || 0 },
          status: altitude > 0 ? 'airborne' : 'grounded',
          source: {
            provider: 'opensky',
            lastUpdated: Date.now(),
            refreshInterval: 10,
            quality: 'live',
            confidence: 0.95,
          },
          metadata: { icao24, squawk: s[14] as string },
        })
      }
      this.recordSuccess()
    } catch {
      this.recordError()
    }
  }
}
