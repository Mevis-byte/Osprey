import { EventType, type EngineEvent, type EntityBase } from '../core/types'
import type { EventBus } from '../core/event-bus'
import type { EntityRepository } from '../core/entity-repo'

interface PositionSample {
  timestamp: number
  lat: number
  lon: number
  alt: number
}

interface TrackedEntity {
  id: string
  type: string
  positions: PositionSample[]
  lastSpeed: number
  lastHeading: number
}

const MAX_SAMPLES = 120
const SPEED_THRESHOLD_RATIO = 1.5
const HEADING_CHANGE_THRESHOLD_DEG = 45

/**
 * Analytics Engine
 *
 * Tracks entity positions over time and emits derived intelligence:
 * - Speed anomalies (entity moving significantly faster than its sustained average)
 * - Heading changes exceeding threshold
 * - Consecutive position sample gaps (data dropout detection)
 * - Stationary detection (maritime/aircraft with no movement over N samples)
 *
 * Each entity's position history is retained up to MAX_SAMPLES (2 min at 1 Hz).
 */
export class AnalyticsEngine {
  private tracked = new Map<string, TrackedEntity>()
  private unsubscribers: (() => void)[] = []

  constructor(
    private bus: EventBus,
    private repo: EntityRepository,
  ) {}

  start(): void {
    this.unsubscribers.push(
      this.bus.subscribe(
        { types: [EventType.EntityUpdated] },
        (event: EngineEvent) => {
          const payload = event.payload as { entityId: string }
          if (!payload?.entityId) return
          const entity = this.repo.get(payload.entityId)
          if (!entity) return
          this.analyze(entity)
        },
      ),
    )
  }

  stop(): void {
    for (const unsub of this.unsubscribers) unsub()
    this.unsubscribers = []
    this.tracked.clear()
  }

  private analyze(entity: EntityBase): void {
    let track = this.tracked.get(entity.id)
    if (!track) {
      track = {
        id: entity.id,
        type: entity.type,
        positions: [],
        lastSpeed: 0,
        lastHeading: 0,
      }
      this.tracked.set(entity.id, track)
    }

    const prev = track.positions[track.positions.length - 1]
    track.positions.push({
      timestamp: Date.now(),
      lat: entity.position.lat,
      lon: entity.position.lon,
      alt: entity.position.alt,
    })
    if (track.positions.length > MAX_SAMPLES) {
      track.positions.shift()
    }

    const headingDelta = Math.abs(entity.velocity.heading - track.lastHeading)
    const adjustedDelta = Math.min(headingDelta, 360 - headingDelta)

    // Speed anomaly
    if (track.lastSpeed > 0 && track.positions.length >= 5) {
      const sustained = this.sustainedSpeed(track)
      if (sustained > 0 && entity.velocity.speed > sustained * SPEED_THRESHOLD_RATIO) {
        this.bus.emit({
          type: EventType.CorrelationTriggered,
          timestamp: Date.now(),
          payload: {
            correlationId: `speed-anomaly-${entity.id}`,
            type: 'speed-anomaly',
            description: `${entity.name} speed anomaly: ${entity.velocity.speed.toFixed(0)} ${entity.type === 'maritime' ? 'kts' : 'm/s'} at ${(entity.velocity.speed / sustained * 100).toFixed(0)}% of sustained average`,
            involvedEntities: [entity.id],
            severity: entity.type === 'aircraft' ? 'warning' : 'info',
          },
          source: 'analytics',
        })
      }
    }

    // Heading change
    if (track.lastHeading > 0 && adjustedDelta > HEADING_CHANGE_THRESHOLD_DEG) {
      const dir = entity.velocity.heading - track.lastHeading > 0 ? 'right' : 'left'
      this.bus.emit({
        type: EventType.CorrelationTriggered,
        timestamp: Date.now(),
        payload: {
          correlationId: `heading-change-${entity.id}`,
          type: 'heading-change',
          description: `${entity.name} turned ${dir} ${adjustedDelta.toFixed(0)}° (${track.lastHeading.toFixed(0)}° → ${entity.velocity.heading.toFixed(0)}°)`,
          involvedEntities: [entity.id],
          severity: 'info',
        },
        source: 'analytics',
      })
    }

    // Consecutive position gap detection
    if (prev) {
      const dt = Date.now() - prev.timestamp
      if (entity.type === 'aircraft' && dt > 60000) {
        this.bus.emit({
          type: EventType.CorrelationTriggered,
          timestamp: Date.now(),
          payload: {
            correlationId: `contact-gap-${entity.id}`,
            type: 'contact-gap',
            description: `${entity.name} contact gap: ${(dt / 1000).toFixed(0)}s since last position`,
            involvedEntities: [entity.id],
            severity: 'warning',
          },
          source: 'analytics',
        })
      }
    }

    // Stationary detection for maritime
    if (entity.type === 'maritime' && track.positions.length >= 10) {
      const recent = track.positions.slice(-10)
      const moved = recent.some((p, i) => {
        if (i === 0) return false
        return Math.abs(p.lat - recent[i - 1].lat) > 0.001 || Math.abs(p.lon - recent[i - 1].lon) > 0.001
      })
      if (!moved && entity.velocity.speed < 0.5) {
        this.bus.emit({
          type: EventType.CorrelationTriggered,
          timestamp: Date.now(),
          payload: {
            correlationId: `stationary-${entity.id}`,
            type: 'stationary',
            description: `${entity.name} stationary at ${entity.position.lat.toFixed(4)}°, ${entity.position.lon.toFixed(4)}°`,
            involvedEntities: [entity.id],
            severity: 'info',
          },
          source: 'analytics',
        })
      }
    }

    track.lastSpeed = entity.velocity.speed
    track.lastHeading = entity.velocity.heading
  }

  private sustainedSpeed(track: TrackedEntity): number {
    const samples = track.positions
    if (samples.length < 5) return 0
    const half = Math.floor(samples.length / 2)
    const recent = samples.slice(half)
    let total = 0
    for (let i = 1; i < recent.length; i++) {
      const dt = (recent[i].timestamp - recent[i - 1].timestamp) / 1000
      const dlat = (recent[i].lat - recent[i - 1].lat) * 111320
      const dlon = (recent[i].lon - recent[i - 1].lon) * 111320 * Math.cos(recent[i].lat * Math.PI / 180)
      total += Math.sqrt(dlat ** 2 + dlon ** 2) / dt
    }
    return total / (recent.length - 1)
  }
}
