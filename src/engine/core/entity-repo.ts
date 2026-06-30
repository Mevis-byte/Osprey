import { EventType, type EntityBase, type EntityType } from './types'
import type { EventBus } from './event-bus'

export interface EntityChange {
  id: string
  type: EntityType
  prev?: EntityBase
  curr: EntityBase
}

export class EntityRepository {
  private entities = new Map<string, EntityBase>()
  private byType = new Map<EntityType, Set<string>>()
  private byProvider = new Map<string, Set<string>>()

  constructor(private bus: EventBus) {}

  upsert(entity: EntityBase): void {
    const prev = this.entities.get(entity.id)
    this.entities.set(entity.id, entity)

    if (!prev) {
      this.addIndex(this.byType, entity.type, entity.id)
      this.addIndex(this.byProvider, entity.source.provider, entity.id)
      this.bus.emit({
        type: EventType.EntityCreated,
        timestamp: Date.now(),
        payload: { entityId: entity.id, entityType: entity.type, position: entity.position },
        source: 'entity-repo',
      })
    } else {
      this.bus.emit({
        type: EventType.EntityUpdated,
        timestamp: Date.now(),
        payload: { entityId: entity.id, entityType: entity.type, position: entity.position, changes: entity },
        source: 'entity-repo',
      })
    }
  }

  remove(id: string): void {
    const entity = this.entities.get(id)
    if (!entity) return
    this.entities.delete(id)
    this.removeIndex(this.byType, entity.type, id)
    this.removeIndex(this.byProvider, entity.source.provider, id)
    this.bus.emit({
      type: EventType.EntityRemoved,
      timestamp: Date.now(),
      payload: { entityId: id, entityType: entity.type },
      source: 'entity-repo',
    })
  }

  get(id: string): EntityBase | undefined {
    return this.entities.get(id)
  }

  getAll(): EntityBase[] {
    return Array.from(this.entities.values())
  }

  getByType(type: EntityType): EntityBase[] {
    const ids = this.byType.get(type)
    if (!ids) return []
    return Array.from(ids).map(id => this.entities.get(id)!).filter(Boolean)
  }

  getByProvider(provider: string): EntityBase[] {
    const ids = this.byProvider.get(provider)
    if (!ids) return []
    return Array.from(ids).map(id => this.entities.get(id)!).filter(Boolean)
  }

  getInRegion(north: number, south: number, east: number, west: number): EntityBase[] {
    const result: EntityBase[] = []
    for (const entity of this.entities.values()) {
      const { lat, lon } = entity.position
      if (lat >= south && lat <= north && lon >= west && lon <= east) {
        result.push(entity)
      }
    }
    return result
  }

  queryPosition(lat: number, lon: number, radiusKm: number): EntityBase[] {
    const result: EntityBase[] = []
    for (const entity of this.entities.values()) {
      const d = this.haversineKm(lat, lon, entity.position.lat, entity.position.lon)
      if (d <= radiusKm) result.push(entity)
    }
    return result
  }

  count(): number {
    return this.entities.size
  }

  clear(): void {
    this.entities.clear()
    this.byType.clear()
    this.byProvider.clear()
  }

  private addIndex(map: Map<string, Set<string>>, key: string, id: string): void {
    let s = map.get(key)
    if (!s) {
      s = new Set()
      map.set(key, s)
    }
    s.add(id)
  }

  private removeIndex(map: Map<string, Set<string>>, key: string, id: string): void {
    const s = map.get(key)
    if (!s) return
    s.delete(id)
    if (s.size === 0) map.delete(key)
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
}
