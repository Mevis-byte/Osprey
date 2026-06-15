import { BaseRepository } from './BaseRepository'
import * as Q from '../cypher/alerts'
import { RelationshipQueries } from '../cypher'
import type { GraphQueryResult } from '../types'
import type { Alert } from '@/types'
import { alertToNodeProps } from '../types'

export class AlertRepository extends BaseRepository {
  async upsert(alert: Alert): Promise<GraphQueryResult> {
    const props = alertToNodeProps(alert)
    const { cypher, params } = Q.mergeAlert(props)
    return this.run(cypher, params)
  }

  async upsertBatch(alerts: Alert[]): Promise<GraphQueryResult<{ count: number }>> {
    if (alerts.length === 0) return { records: [{ count: 0 }], summary: { query: '', params: {}, elapsed: 0 } }
    const propsList = alerts.map(alertToNodeProps)
    const { cypher, params } = Q.mergeAlertsBulk(propsList)
    return this.run<{ count: number }>(cypher, params)
  }

  async findById(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAlertById(id)
    return this.run(cypher, params)
  }

  async findRecent(limit?: number): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findRecentAlerts(limit)
    return this.run(cypher, params)
  }

  async findUnacknowledged(): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findUnacknowledgedAlerts()
    return this.run(cypher, params)
  }

  async findBySeverity(severity: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAlertsBySeverity(severity)
    return this.run(cypher, params)
  }

  // ─── Alert Graph ──────────────────────────────────────────────────────────

  async findGraph(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAlertGraphById(id)
    return this.run(cypher, params)
  }

  async findByAsset(assetId: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAlertsByAssetId(assetId)
    return this.run(cypher, params)
  }

  async findByMission(missionId: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAlertsByMissionId(missionId)
    return this.run(cypher, params)
  }

  async findByRegion(regionId: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAlertsInRegion(regionId)
    return this.run(cypher, params)
  }

  async findClusters(minSeverity?: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.findAlertClusters(minSeverity)
    return this.run(cypher, params)
  }

  async acknowledge(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.acknowledgeAlert(id)
    return this.run(cypher, params)
  }

  async purgeOld(beforeTimestamp: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.purgeOldAlerts(beforeTimestamp)
    return this.run(cypher, params)
  }

  async delete(id: string): Promise<GraphQueryResult> {
    const { cypher, params } = Q.deleteAlert(id)
    return this.run(cypher, params)
  }

  // ─── Relationship Helpers ────────────────────────────────────────────────

  async linkToAsset(alertId: string, assetId: string, severity: string): Promise<GraphQueryResult> {
    const { cypher, params } = RelationshipQueries.createTriggered(alertId, assetId, {
      severity,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    })
    return this.run(cypher, params)
  }
}
