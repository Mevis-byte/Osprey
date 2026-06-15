import { BaseRepository } from './BaseRepository'
import * as Q from '../cypher/regions'
import type { GraphQueryResult } from '../types'

export class RegionRepository extends BaseRepository {
  async upsert(
    id: string,
    name: string,
    bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
  ): Promise<GraphQueryResult> {
    const { cypher, params } = Q.mergeRegion({
      id,
      name,
      minLatitude: bounds.minLat,
      maxLatitude: bounds.maxLat,
      minLongitude: bounds.minLon,
      maxLongitude: bounds.maxLon,
    })
    return this.run(cypher, params)
  }

  async upsertBatch(regions: { id: string; name: string; bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number } }[]): Promise<GraphQueryResult<{ count: number }>> {
    if (regions.length === 0) return { records: [{ count: 0 }], summary: { query: '', params: {}, elapsed: 0 } }
    const propsList = regions.map((r) => ({
      id: r.id,
      name: r.name,
      minLatitude: r.bounds.minLat,
      maxLatitude: r.bounds.maxLat,
      minLongitude: r.bounds.minLon,
      maxLongitude: r.bounds.maxLon,
    }))
    const { cypher, params } = Q.mergeRegionsBulk(propsList)
    return this.run<{ count: number }>(cypher, params)
  }

  async findById(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findRegionById(id)
    return this.run(cypher, params)
  }

  async findAll(): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAllRegions()
    return this.run(cypher, params)
  }

  // ─── Region Graph ────────────────────────────────────────────────────────

  async findGraph(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findRegionGraphById(id)
    return this.run(cypher, params)
  }

  async findSummary(): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findRegionSummary()
    return this.run(cypher, params)
  }

  async findThreatDensity(regionId: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findRegionThreatDensity(regionId)
    return this.run(cypher, params)
  }

  async findAssetDistribution(): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAssetsByRegion()
    return this.run(cypher, params)
  }

  async findAdjacent(regionId: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAdjacentRegions(regionId)
    return this.run(cypher, params)
  }
}
