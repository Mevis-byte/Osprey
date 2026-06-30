/**
 * OSPREY Engine
 *
 * Unified event-driven architecture that consolidates all data sources,
 * normalization, correlation, and analytics into a single pipeline.
 *
 * ```
 * Providers ──► Normalization ──► EntityRepository ──► CorrelationEngine
 *                                          │                  │
 *                                          ▼                  ▼
 *                                     EventBus ◄───── AnalyticsEngine
 *                                          │
 *                                          ▼
 *                                     Zustand Stores (UI)
 * ```
 *
 * Usage:
 *   const engine = createEngine()
 *   await engine.initialize()
 *   engine.start()
 */

import { EventBus } from './core/event-bus'
import { EntityRepository } from './core/entity-repo'
import { CorrelationEngine } from './correlation'
import { AnalyticsEngine } from './analytics'
import { ProviderRegistry } from './providers/interface'
import { CelesTrakProvider } from './providers/celes-trak'
import { SimulationProvider } from './providers/simulation'

export interface EngineInstance {
  bus: EventBus
  repo: EntityRepository
  correlation: CorrelationEngine
  analytics: AnalyticsEngine
  providers: ProviderRegistry

  initialize(): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
}

let instance: EngineInstance | null = null

export function createEngine(): EngineInstance {
  if (instance) return instance

  const bus = new EventBus()
  const repo = new EntityRepository(bus)
  const correlation = new CorrelationEngine(bus, repo)
  const analytics = new AnalyticsEngine(bus, repo)
  const providers = new ProviderRegistry()

  const celesTrak = new CelesTrakProvider(
    (event) => bus.emit(event),
    (entity) => repo.upsert(entity),
  )
  providers.register(celesTrak)

  // Simulation provider is registered later after asset data is loaded
  // Call setSimulationAssets() after useSimulation initializes

  const engine: EngineInstance = {
    bus,
    repo,
    correlation,
    analytics,
    providers,

    async initialize(): Promise<void> {
      correlation.start()
      analytics.start()
      await providers.initializeAll()
    },

    async start(): Promise<void> {
      await providers.startAll()
    },

    async stop(): Promise<void> {
      await providers.stopAll()
      analytics.stop()
      correlation.stop()
      bus.clear()
      repo.clear()
    },
  }

  instance = engine
  return engine
}

export function setSimulationAssets(assets: import('@/types').Asset[]): void {
  if (!instance) return
  const existing = instance.providers.get('simulation-engine')
  if (existing && existing instanceof SimulationProvider) {
    existing.setAssets(assets)
  } else {
    const sim = new SimulationProvider(
      (event) => instance!.bus.emit(event),
      (entity) => instance!.repo.upsert(entity),
    )
    sim.setAssets(assets)
    instance.providers.register(sim)
  }
}

export function getEngine(): EngineInstance | null {
  return instance
}

export function destroyEngine(): void {
  if (instance) {
    instance.stop()
    instance = null
  }
}
