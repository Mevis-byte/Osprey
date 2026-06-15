import { getGraphService, GraphService } from '../GraphService'
import { AssetRepository, MissionRepository, AlertRepository, RegionRepository } from '../repositories'
import { REGIONS } from '@/services/analytics'
import type { AppStore } from '@/store'
import { useAppStore } from '@/store'

export class GraphSyncService {
  private graph: GraphService
  private assets: AssetRepository
  private missions: MissionRepository
  private alerts: AlertRepository
  private regions: RegionRepository
  private intervalId: ReturnType<typeof setInterval> | null = null
  private _running = false

  constructor(graph?: GraphService) {
    this.graph = graph ?? getGraphService()
    this.assets = new AssetRepository(this.graph)
    this.missions = new MissionRepository(this.graph)
    this.alerts = new AlertRepository(this.graph)
    this.regions = new RegionRepository(this.graph)
  }

  get running(): boolean {
    return this._running
  }

  async initialize(): Promise<void> {
    await this.graph.connect()
    await this.graph.createConstraints()
    await this.graph.createIndexes()
    await this.syncRegions()
  }

  start(intervalMs: number = 5000): void {
    if (this._running) return
    this._running = true
    this.intervalId = setInterval(() => {
      this.syncFromStore()
    }, intervalMs)
  }

  stop(): void {
    this._running = false
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  async destroy(): Promise<void> {
    this.stop()
    await this.graph.disconnect()
  }

  private async syncRegions(): Promise<void> {
    const regionData = REGIONS.map((r) => {
      const minLat = Math.min(...r.bounds.map((b) => b.minLat))
      const maxLat = Math.max(...r.bounds.map((b) => b.maxLat))
      const minLon = Math.min(...r.bounds.map((b) => b.minLon))
      const maxLon = Math.max(...r.bounds.map((b) => b.maxLon))
      return { id: r.key, name: r.name, bounds: { minLat, maxLat, minLon, maxLon } }
    })
    await this.regions.upsertBatch(regionData)
  }

  async syncFromStore(store?: AppStore): Promise<void> {
    const state = store ?? useAppStore.getState()

    await Promise.all([
      this.assets.upsertBatch(state.assetData),
      this.missions.upsertBatch(state.missions),
      this.alerts.upsertBatch(state.alerts),
    ])

    await this.syncRelationships(state)
  }

  private async syncRelationships(state: AppStore): Promise<void> {
    for (const mission of state.missions) {
      await this.missions.syncAssets(mission.id, mission.assets)
    }

    for (const asset of state.assetData) {
      for (const region of REGIONS) {
        const inRegion = region.bounds.some(
          (b) =>
            asset.longitude >= b.minLon &&
            asset.longitude <= b.maxLon &&
            asset.latitude >= b.minLat &&
            asset.latitude <= b.maxLat,
        )
        if (inRegion) {
          await this.graph.run(
            `
            MATCH (a:Asset { id: $assetId })
            MATCH (r:Region { id: $regionId })
            MERGE (a)-[:LOCATED_IN]->(r)
            `,
            { assetId: asset.id, regionId: region.key },
          )
          break
        }
      }
    }
  }
}

let syncInstance: GraphSyncService | null = null

export function getGraphSyncService(graph?: GraphService): GraphSyncService {
  if (!syncInstance) {
    syncInstance = new GraphSyncService(graph)
  }
  return syncInstance
}

export function resetGraphSyncService(): void {
  syncInstance = null
}
