import { EventType, type EngineEvent, type EventFilter, type Subscription } from './types'

let nextSubId = 0
function subId(): string {
  return `sub-${++nextSubId}`
}

export class EventBus {
  private subscriptions: Map<string, Subscription> = new Map()

  subscribe(
    filter: EventFilter,
    callback: (event: EngineEvent) => void,
  ): () => void {
    const id = subId()
    this.subscriptions.set(id, { id, filter, callback })
    return () => {
      this.subscriptions.delete(id)
    }
  }

  subscribeToType<T>(
    type: EventType,
    callback: (event: EngineEvent<T>) => void,
  ): () => void {
    return this.subscribe({ types: [type] }, callback as (event: EngineEvent) => void)
  }

  emit(event: EngineEvent): void {
    for (const sub of this.subscriptions.values()) {
      if (this.matches(event, sub.filter)) {
        try {
          sub.callback(event)
        } catch {
          // subscriber error — never crash the bus
        }
      }
    }
  }

  private matches(event: EngineEvent, filter: EventFilter): boolean {
    if (filter.types && !filter.types.includes(event.type)) return false
    if (filter.source && filter.source !== event.source) return false
    const payload = event.payload as Record<string, unknown> | undefined
    if (filter.entityTypes && payload?.entityType) {
      if (!filter.entityTypes.includes(payload.entityType as never)) return false
    }
    if (filter.region && payload?.position) {
      const pos = payload.position as { lat: number; lon: number }
      if (pos.lat < filter.region.south || pos.lat > filter.region.north) return false
      if (pos.lon < filter.region.west || pos.lon > filter.region.east) return false
    }
    return true
  }

  clear(): void {
    this.subscriptions.clear()
  }

  get subscriberCount(): number {
    return this.subscriptions.size
  }
}
