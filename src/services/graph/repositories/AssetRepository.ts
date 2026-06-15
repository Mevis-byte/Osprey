import { BaseRepository } from './BaseRepository'
import * as Q from '../cypher/assets'
import type { GraphQueryResult } from '../types'
import type { Asset } from '@/types'
import { assetToNodeProps } from '../types'

export class AssetRepository extends BaseRepository {
  async upsert(asset: Asset): Promise<GraphQueryResult> {
    const props = assetToNodeProps(asset)
    const { cypher, params } = Q.mergeAsset(props)
    return this.run(cypher, params)
  }

  async upsertBatch(assets: Asset[]): Promise<GraphQueryResult<{ count: number }>> {
    if (assets.length === 0) return { records: [{ count: 0 }], summary: { query: '', params: {}, elapsed: 0 } }
    const propsList = assets.map(assetToNodeProps)
    const { cypher, params } = Q.mergeAssetsBulk(propsList)
    return this.run<{ count: number }>(cypher, params)
  }

  async findById(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAssetById(id)
    return this.run(cypher, params)
  }

  async findByType(type: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAssetsByType(type)
    return this.run(cypher, params)
  }

  async findByStatus(status: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAssetsByStatus(status)
    return this.run(cypher, params)
  }

  async findByRegion(regionId: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAssetsInRegion(regionId)
    return this.run(cypher, params)
  }

  async findByMission(missionId: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAssetsAssignedToMission(missionId)
    return this.run(cypher, params)
  }

  async delete(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.deleteAsset(id)
    return this.run(cypher, params)
  }

  async syncAll(assets: Asset[]): Promise<void> {
    const ids = assets.map((a) => a.id)
    await this.upsertBatch(assets)
    const { cypher, params } = Q.removeAssetsNotIn(ids)
    await this.run(cypher, params)
  }
}
