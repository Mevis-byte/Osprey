import type { AlertNodeProperties } from '../types'

// ─── Node CRUD ────────────────────────────────────────────────────────────────

export function mergeAlert(props: AlertNodeProperties) {
  return {
    cypher: `
      MERGE (a:Alert { id: $props.id })
      SET a += $props
      RETURN a
    `,
    params: { props },
  }
}

export function findAlertById(id: string) {
  return {
    cypher: 'MATCH (a:Alert { id: $id }) RETURN a',
    params: { id },
  }
}

export function findUnacknowledgedAlerts() {
  return {
    cypher: 'MATCH (a:Alert { acknowledged: false }) RETURN a ORDER BY a.timestamp DESC',
    params: {},
  }
}

export function findAlertsBySeverity(severity: string) {
  return {
    cypher: 'MATCH (a:Alert { severity: $severity }) RETURN a ORDER BY a.timestamp DESC',
    params: { severity },
  }
}

export function findRecentAlerts(limit: number = 50) {
  return {
    cypher: 'MATCH (a:Alert) RETURN a ORDER BY a.timestamp DESC LIMIT $limit',
    params: { limit: Math.max(1, limit) },
  }
}

// ─── Alert Graph Queries ──────────────────────────────────────────────────────

export function findAlertGraphById(id: string) {
  return {
    cypher: `
      MATCH path = (a:Alert { id: $id })-[:TRIGGERED]->(asset:Asset)
      OPTIONAL MATCH (asset)-[:LOCATED_IN]->(r:Region)
      OPTIONAL MATCH (asset)<-[:ASSIGNED_TO]-(m:Mission)
      RETURN a AS alert, collect(DISTINCT asset) AS assets,
             collect(DISTINCT r) AS regions, collect(DISTINCT m) AS missions
    `,
    params: { id },
  }
}

export function findAlertsByAssetId(assetId: string) {
  return {
    cypher: `
      MATCH (a:Alert)-[:TRIGGERED]->(asset:Asset { id: $assetId })
      RETURN a ORDER BY a.timestamp DESC
    `,
    params: { assetId },
  }
}

export function findAlertsByMissionId(missionId: string) {
  return {
    cypher: `
      MATCH (a:Alert)-[:TRIGGERED]->(asset:Asset)<-[:ASSIGNED_TO]-(m:Mission { id: $missionId })
      RETURN a, asset ORDER BY a.timestamp DESC
    `,
    params: { missionId },
  }
}

export function findAlertsInRegion(regionId: string) {
  return {
    cypher: `
      MATCH (a:Alert)-[:TRIGGERED]->(asset:Asset)-[:LOCATED_IN]->(r:Region { id: $regionId })
      RETURN a, asset ORDER BY a.timestamp DESC
    `,
    params: { regionId },
  }
}

export function findAlertClusters(minSeverity: string = 'high') {
  const severities = ['critical', 'high', 'medium', 'low']
  const threshold = severities.indexOf(minSeverity)
  const allowed = severities.slice(0, threshold + 1)

  return {
    cypher: `
      MATCH (a:Alert)-[:TRIGGERED]->(asset:Asset)-[:LOCATED_IN]->(r:Region)
      WHERE a.severity IN $severities AND a.acknowledged = false
      RETURN r AS region, a.severity AS severity, count(a) AS alertCount,
             collect(DISTINCT a.title) AS titles
      ORDER BY alertCount DESC
    `,
    params: { severities: allowed },
  }
}

export function acknowledgeAlert(id: string) {
  return {
    cypher: 'MATCH (a:Alert { id: $id }) SET a.acknowledged = true RETURN a',
    params: { id },
  }
}

export function deleteAlert(id: string) {
  return {
    cypher: 'MATCH (a:Alert { id: $id }) DETACH DELETE a',
    params: { id },
  }
}

export function purgeOldAlerts(beforeTimestamp: string) {
  return {
    cypher: 'MATCH (a:Alert) WHERE a.timestamp < $before DETACH DELETE a',
    params: { before: beforeTimestamp },
  }
}

// ─── Bulk ─────────────────────────────────────────────────────────────────────

export function mergeAlertsBulk(alerts: AlertNodeProperties[]) {
  return {
    cypher: `
      UNWIND $alerts AS props
      MERGE (a:Alert { id: props.id })
      SET a += props
      RETURN count(a) AS count
    `,
    params: { alerts },
  }
}
