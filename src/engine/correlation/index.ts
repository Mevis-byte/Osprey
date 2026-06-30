import { EventType, type CorrelationEventPayload, type EngineEvent, type EntityBase } from '../core/types'
import type { EventBus } from '../core/event-bus'
import type { EntityRepository } from '../core/entity-repo'
import { greatCircleKm, pointInCircle } from '../spatial'

interface CorrelationRule {
  id: string
  name: string
  description: string
  check: (
    entity: EntityBase,
    repo: EntityRepository,
  ) => CorrelationEventPayload | null
}

/**
 * Correlation Engine
 *
 * Automatically cross-references entities from different providers to detect
 * spatiotemporal relationships. Each rule is independent and runs against
 * the unified entity repository.
 *
 * Rules are evaluated on entity creation/update. Results are emitted as
 * correlation events on the event bus.
 */
export class CorrelationEngine {
  private rules: CorrelationRule[] = []
  private unsubscribers: (() => void)[] = []

  constructor(
    private bus: EventBus,
    private repo: EntityRepository,
  ) {
    this.registerDefaultRules()
  }

  start(): void {
    // Subscribe to entity updates to trigger correlation checks
    this.unsubscribers.push(
      this.bus.subscribe(
        { types: [EventType.EntityCreated, EventType.EntityUpdated] },
        (event: EngineEvent) => {
          const payload = event.payload as { entityId: string }
          if (!payload?.entityId) return
          const entity = this.repo.get(payload.entityId)
          if (!entity) return
          this.evaluate(entity)
        },
      ),
    )
  }

  stop(): void {
    for (const unsub of this.unsubscribers) {
      unsub()
    }
    this.unsubscribers = []
  }

  addRule(rule: CorrelationRule): void {
    this.rules.push(rule)
  }

  private evaluate(entity: EntityBase): void {
    for (const rule of this.rules) {
      try {
        const result = rule.check(entity, this.repo)
        if (result) {
          this.bus.emit({
            type: EventType.CorrelationTriggered,
            timestamp: Date.now(),
            payload: result,
            source: `correlation:${rule.id}`,
          })
        }
      } catch {
        // rule error — never crash the engine
      }
    }
  }

  private registerDefaultRules(): void {
    this.rules = [
      // Aircraft near ground station
      {
        id: 'aircraft-near-station',
        name: 'Aircraft near Ground Station',
        description: 'Detects aircraft within 50 km of a ground station',
        check: (entity, repo) => {
          if (entity.type !== 'aircraft') return null
          for (const gs of repo.getByType('ground-station')) {
            const d = greatCircleKm(
              entity.position.lat, entity.position.lon,
              gs.position.lat, gs.position.lon,
            )
            if (d < 50) {
              return {
                correlationId: `ac-gs-${entity.id}-${gs.id}`,
                type: 'proximity',
                description: `${entity.name} ${d.toFixed(1)} km from ground station ${gs.name}`,
                involvedEntities: [entity.id, gs.id],
                severity: 'info',
              }
            }
          }
          return null
        },
      },

      // Ship in geofence
      {
        id: 'ship-in-geofence',
        name: 'Ship in Geofence',
        description: 'Detects ships inside circular geofences',
        check: (entity, repo) => {
          if (entity.type !== 'maritime') return null
          for (const gf of repo.getByType('geofence')) {
            const radiusKm = (gf.metadata?.radiusKm as number) ?? 100
            if (pointInCircle(
              entity.position.lat, entity.position.lon,
              gf.position.lat, gf.position.lon,
              radiusKm,
            )) {
              return {
                correlationId: `ship-gf-${entity.id}-${gf.id}`,
                type: 'geofence-breach',
                description: `${entity.name} entered geofence ${gf.name}`,
                involvedEntities: [entity.id, gf.id],
                severity: 'warning',
              }
            }
          }
          return null
        },
      },

      // Satellite over wildfire (metadata-based lat/lon for now)
      {
        id: 'satellite-over-wildfire',
        name: 'Satellite Passes Over Wildfire',
        description: 'Detects satellites passing within 200 km of a wildfire',
        check: (entity, repo) => {
          if (entity.type !== 'satellite') return null
          const coverage = coverageRadiusKm(entity.position.alt)
          for (const fire of repo.getByType('wildfire')) {
            const d = greatCircleKm(
              entity.position.lat, entity.position.lon,
              fire.position.lat, fire.position.lon,
            )
            if (d < coverage) {
              return {
                correlationId: `sat-fire-${entity.id}-${fire.id}`,
                type: 'coverage-pass',
                description: `${entity.name} passing over wildfire zone (${d.toFixed(0)} km)`,
                involvedEntities: [entity.id, fire.id],
                severity: 'info',
              }
            }
          }
          return null
        },
      },

      // Aircraft near severe weather
      {
        id: 'aircraft-near-weather',
        name: 'Aircraft near Weather',
        description: 'Detects aircraft within 100 km of a weather cell',
        check: (entity, repo) => {
          if (entity.type !== 'aircraft') return null
          for (const wc of repo.getByType('weather-cell')) {
            const d = greatCircleKm(
              entity.position.lat, entity.position.lon,
              wc.position.lat, wc.position.lon,
            )
            if (d < 100) {
              return {
                correlationId: `ac-wx-${entity.id}-${wc.id}`,
                type: 'weather-proximity',
                description: `${entity.name} ${d.toFixed(0)} km from weather system`,
                involvedEntities: [entity.id, wc.id],
                severity: 'warning',
              }
            }
          }
          return null
        },
      },
    ]
  }
}

// Needed by satellite-over-wildfire rule
function coverageRadiusKm(altM: number): number {
  const R = 6371
  const h = altM / 1000
  if (h <= 0) return 0
  return R * Math.acos(R / (R + h))
}
