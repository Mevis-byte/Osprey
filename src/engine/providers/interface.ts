import { EventType, type DataProvider, type EngineEvent, type EntityBase, type ProviderStatus } from '../core/types'

export interface ProviderLifecycle extends DataProvider {
  readonly id: string
  readonly displayName: string
  status: ProviderStatus
  errorCount: number
  lastRunAt: number

  tick(now: number): Promise<void> | void
}

export class ProviderRegistry {
  private providers = new Map<string, ProviderLifecycle>()

  register(provider: ProviderLifecycle): void {
    if (this.providers.has(provider.id)) {
      console.warn(`[ProviderRegistry] Overwriting existing provider: ${provider.id}`)
    }
    this.providers.set(provider.id, provider)
  }

  get(id: string): ProviderLifecycle | undefined {
    return this.providers.get(id)
  }

  getAll(): ProviderLifecycle[] {
    return Array.from(this.providers.values())
  }

  async initializeAll(): Promise<void> {
    const providers = Array.from(this.providers.values())
    const results = await Promise.allSettled(
      providers.map(async (p) => {
        try {
          await p.initialize()
          console.log(`[Provider] ${p.id} initialized`)
        } catch (err) {
          p.status = 'error'
          console.error(`[Provider] ${p.id} init failed:`, err)
        }
      }),
    )
    const failed = results.filter(r => r.status === 'rejected')
    if (failed.length > 0) {
      console.warn(`[ProviderRegistry] ${failed.length}/${this.providers.size} providers failed to initialize`)
    }
  }

  async startAll(): Promise<void> {
    for (const p of this.providers.values()) {
      if (p.status === 'idle') {
        try {
          await p.start()
        } catch (err) {
          p.status = 'error'
          console.error(`[Provider] ${p.id} start failed:`, err)
        }
      }
    }
  }

  async stopAll(): Promise<void> {
    for (const p of this.providers.values()) {
      if (p.status === 'running') {
        try {
          await p.stop()
        } catch { /* ignore stop errors */ }
      }
    }
  }

  async shutdownAll(): Promise<void> {
    for (const p of this.providers.values()) {
      try {
        await p.shutdown()
      } catch { /* ignore shutdown errors */ }
    }
    this.providers.clear()
  }

  getStatusReport(): { id: string; status: ProviderStatus; errorCount: number; lastRunAt: number }[] {
    return Array.from(this.providers.values()).map(p => ({
      id: p.id,
      status: p.status,
      errorCount: p.errorCount,
      lastRunAt: p.lastRunAt,
    }))
  }
}

// ── Base provider with common lifecycle ──

export abstract class BaseProvider implements ProviderLifecycle {
  abstract readonly id: string
  abstract readonly displayName: string
  status: ProviderStatus = 'idle'
  errorCount = 0
  lastRunAt = 0
  protected intervalMs = 30000
  private timerId: ReturnType<typeof setInterval> | null = null
  protected emit: (event: EngineEvent) => void
  protected upsertEntity: (entity: EntityBase) => void

  constructor(
    emitFn: (event: EngineEvent) => void,
    upsertFn: (entity: EntityBase) => void,
  ) {
    this.emit = emitFn
    this.upsertEntity = upsertFn
  }

  abstract initialize(): Promise<void>
  abstract tick(now: number): Promise<void> | void

  async start(): Promise<void> {
    if (this.status === 'running') return
    this.status = 'running'
    this.emit({
      type: EventType.ProviderStatusChanged,
      timestamp: Date.now(),
      payload: { providerId: this.id, status: 'running' },
      source: this.id,
    })
    this.timerId = setInterval(() => {
      this.runTick()
    }, this.intervalMs)
    // Run first tick immediately
    await this.runTick()
  }

  async stop(): Promise<void> {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.status = 'stopped'
    this.emit({
      type: EventType.ProviderStatusChanged,
      timestamp: Date.now(),
      payload: { providerId: this.id, status: 'stopped' },
      source: this.id,
    })
  }

  async shutdown(): Promise<void> {
    await this.stop()
  }

  private async runTick(): Promise<void> {
    try {
      await this.tick(Date.now())
      this.lastRunAt = Date.now()
    } catch (err) {
      this.errorCount++
      this.emit({
        type: EventType.ProviderError,
        timestamp: Date.now(),
        payload: { providerId: this.id, error: String(err) },
        source: this.id,
      })
      console.error(`[Provider:${this.id}] tick error:`, err)
    }
  }
}
