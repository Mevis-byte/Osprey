import { BaseRepository } from './BaseRepository'
import * as Q from '../cypher/missions'
import { RelationshipQueries } from '../cypher'
import type { GraphQueryResult } from '../types'
import type { Mission } from '@/types'
import { missionToNodeProps } from '../types'

export class MissionRepository extends BaseRepository {
  async upsert(mission: Mission): Promise<GraphQueryResult> {
    const props = missionToNodeProps(mission)
    const { cypher, params } = Q.mergeMission(props)
    return this.run(cypher, params)
  }

  async upsertBatch(missions: Mission[]): Promise<GraphQueryResult<{ count: number }>> {
    if (missions.length === 0) return { records: [{ count: 0 }], summary: { query: '', params: {}, elapsed: 0 } }
    const propsList = missions.map(missionToNodeProps)
    const { cypher, params } = Q.mergeMissionsBulk(propsList)
    return this.run<{ count: number }>(cypher, params)
  }

  async findById(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findMissionById(id)
    return this.run(cypher, params)
  }

  async findActive(): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findActiveMissions()
    return this.run(cypher, params)
  }

  async findByStatus(status: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findMissionsByStatus(status)
    return this.run(cypher, params)
  }

  // ─── Mission Graph ───────────────────────────────────────────────────────

  async findGraph(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findMissionGraphById(id)
    return this.run(cypher, params)
  }

  async findWithAssets(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findMissionAssetsDetails(id)
    return this.run(cypher, params)
  }

  async findByRegion(regionId: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findMissionsByRegion(regionId)
    return this.run(cypher, params)
  }

  async countByStatus(): Promise<GraphQueryResult<{ status: string; count: number }>> {
    const { cypher, params } = Q.findMissionCountByStatus()
    return this.run<{ status: string; count: number }>(cypher, params)
  }

  async threatSummary(): Promise<GraphQueryResult<{ threatLevel: string; count: number }>> {
    const { cypher, params } = Q.findMissionThreatSummary()
    return this.run<{ threatLevel: string; count: number }>(cypher, params)
  }

  async findWithCompromisedAssets(): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findMissionsWithHighThreatAssets()
    return this.run(cypher, params)
  }

  async delete(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.deleteMission(id)
    return this.run(cypher, params)
  }

  // ─── Relationship Helpers ────────────────────────────────────────────────

  async assignAsset(missionId: string, assetId: string): Promise<GraphQueryResult> {
    const { cypher, params } = RelationshipQueries.createAssignedTo(missionId, assetId, { since: new Date().toISOString() })
    return this.run(cypher, params)
  }

  async unassignAsset(missionId: string, assetId: string): Promise<GraphQueryResult> {
    const { cypher, params } = RelationshipQueries.removeAssignedTo(missionId, assetId)
    return this.run(cypher, params)
  }

  async syncAssets(missionId: string, assetIds: string[]): Promise<GraphQueryResult> {
    const { cypher, params } = RelationshipQueries.syncMissionAssignments(missionId, assetIds)
    return this.run(cypher, params)
  }

  async setMonitors(missionId: string, regionId: string): Promise<GraphQueryResult> {
    const { cypher, params } = RelationshipQueries.createMonitors(missionId, regionId, {
      since: new Date().toISOString(),
      priority: 'standard',
    })
    return this.run(cypher, params)
  }
}
