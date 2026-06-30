import { type EntityBase, type EntityType } from '../core/types'
import { BaseProvider } from './interface'
import { getSimulationManager } from '@/services/simulation'
import type { Asset } from '@/types'

function assetToEntity(asset: Asset): EntityBase {
  const typeMap: Record<string, EntityType> = {
    'fixed-wing': 'aircraft',
    'rotary-wing': 'aircraft',
    maritime: 'maritime',
    satellite: 'satellite',
  }
  return {
    id: asset.id,
    type: typeMap[asset.type] ?? 'satellite',
    name: asset.name,
    position: { lat: asset.latitude, lon: asset.longitude, alt: asset.altitude },
    velocity: { speed: asset.speed, heading: asset.heading, verticalSpeed: 0 },
    status: asset.status,
    source: {
      provider: 'simulation-engine',
      lastUpdated: Date.parse(asset.lastUpdated) || Date.now(),
      refreshInterval: 1000,
      quality: 'simulated',
      confidence: 0.6,
    },
    metadata: {},
  }
}

/**
 * Simulation Engine Provider.
 *
 * Wraps the existing SimulationManager as a provider. Converts internal Asset
 * objects to unified EntityBase and emits position updates on each tick.
 */
export class SimulationProvider extends BaseProvider {
  readonly id = 'simulation-engine'
  readonly displayName = 'Simulation Engine'
  protected intervalMs = 1000

  private assets: Asset[] = []
  private initialized = false

  async initialize(): Promise<void> {
    // SimulationManager is initialized externally via useSimulation
  }

  async tick(_now: number): Promise<void> {
    if (!this.initialized) return

    const mgr = getSimulationManager()
    const positions = mgr.getPositions()

    for (const asset of this.assets) {
      const pos = positions.get(asset.id)
      if (!pos) continue

      const entity = assetToEntity({
        ...asset,
        latitude: pos.latitude,
        longitude: pos.longitude,
        altitude: pos.altitude,
        speed: pos.speed,
        heading: pos.heading,
      })

      this.upsertEntity(entity)
    }
  }

  setAssets(assets: Asset[]): void {
    this.assets = assets
    this.initialized = true
  }
}
