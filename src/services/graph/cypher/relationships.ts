import type { AssignedToProps, LocatedInProperties, TriggeredProperties, MonitorsProperties } from '../types'

// ─── ASSIGNED_TO: Mission ──→ Asset ──────────────────────────────────────────

export function createAssignedTo(missionId: string, assetId: string, props?: AssignedToProps) {
  return {
    cypher: `
      MATCH (m:Mission { id: $missionId })
      MATCH (a:Asset { id: $assetId })
      MERGE (m)-[r:ASSIGNED_TO]->(a)
      SET r += $props
      RETURN r
    `,
    params: { missionId, assetId, props: props ?? {} },
  }
}

export function removeAssignedTo(missionId: string, assetId: string) {
  return {
    cypher: `
      MATCH (m:Mission { id: $missionId })-[r:ASSIGNED_TO]->(a:Asset { id: $assetId })
      DELETE r
    `,
    params: { missionId, assetId },
  }
}

export function removeAllAssignedTo(missionId: string) {
  return {
    cypher: `
      MATCH (m:Mission { id: $missionId })-[r:ASSIGNED_TO]->()
      DELETE r
    `,
    params: { missionId },
  }
}

// ─── LOCATED_IN: Asset ──→ Region ────────────────────────────────────────────

export function createLocatedIn(assetId: string, regionId: string, props?: LocatedInProperties) {
  return {
    cypher: `
      MATCH (a:Asset { id: $assetId })
      MATCH (r:Region { id: $regionId })
      MERGE (a)-[rel:LOCATED_IN]->(r)
      SET rel += $props
      RETURN rel
    `,
    params: { assetId, regionId, props: props ?? {} },
  }
}

export function removeLocatedIn(assetId: string) {
  return {
    cypher: 'MATCH (a:Asset { id: $assetId })-[r:LOCATED_IN]->() DELETE r',
    params: { assetId },
  }
}

export function replaceLocatedIn(assetId: string, newRegionId: string, props?: LocatedInProperties) {
  return {
    cypher: `
      MATCH (a:Asset { id: $assetId })
      OPTIONAL MATCH (a)-[old:LOCATED_IN]->()
      DELETE old
      WITH a
      MATCH (r:Region { id: $newRegionId })
      MERGE (a)-[rel:LOCATED_IN]->(r)
      SET rel += $props
      RETURN rel
    `,
    params: { assetId, newRegionId, props: props ?? {} },
  }
}

// ─── TRIGGERED: Alert ──→ Asset ──────────────────────────────────────────────

export function createTriggered(alertId: string, assetId: string, props?: TriggeredProperties) {
  return {
    cypher: `
      MATCH (a:Alert { id: $alertId })
      MATCH (asset:Asset { id: $assetId })
      MERGE (a)-[r:TRIGGERED]->(asset)
      SET r += $props
      RETURN r
    `,
    params: { alertId, assetId, props: props ?? {} },
  }
}

export function removeTriggeredForAlert(alertId: string) {
  return {
    cypher: 'MATCH (a:Alert { id: $alertId })-[r:TRIGGERED]->() DELETE r',
    params: { alertId },
  }
}

// ─── MONITORS: Mission ──→ Region ────────────────────────────────────────────

export function createMonitors(missionId: string, regionId: string, props?: MonitorsProperties) {
  return {
    cypher: `
      MATCH (m:Mission { id: $missionId })
      MATCH (r:Region { id: $regionId })
      MERGE (m)-[rel:MONITORS]->(r)
      SET rel += $props
      RETURN rel
    `,
    params: { missionId, regionId, props: props ?? {} },
  }
}

export function removeMonitors(missionId: string, regionId: string) {
  return {
    cypher: `
      MATCH (m:Mission { id: $missionId })-[r:MONITORS]->(r:Region { id: $regionId })
      DELETE r
    `,
    params: { missionId, regionId },
  }
}

export function removeAllMonitors(missionId: string) {
  return {
    cypher: 'MATCH (m:Mission { id: $missionId })-[r:MONITORS]->() DELETE r',
    params: { missionId },
  }
}

// ─── Bulk Relationship Sync ──────────────────────────────────────────────────

export function syncMissionAssignments(missionId: string, assetIds: string[]) {
  return {
    cypher: `
      MATCH (m:Mission { id: $missionId })
      OPTIONAL MATCH (m)-[r:ASSIGNED_TO]->(a:Asset)
      WITH m, collect(CASE WHEN r IS NOT NULL THEN a.id END) AS existingIds
      UNWIND $assetIds AS targetId
      CALL {
        WITH m, targetId
        OPTIONAL MATCH (a:Asset { id: targetId })
        WITH m, a WHERE a IS NOT NULL
        MERGE (m)-[:ASSIGNED_TO]->(a)
      }
      WITH m, existingIds
      UNWIND existingIds AS eid
      WHERE eid IS NOT NULL AND NOT eid IN $assetIds
      OPTIONAL MATCH (m)-[r:ASSIGNED_TO]->(a:Asset { id: eid })
      DELETE r
    `,
    params: { missionId, assetIds },
  }
}
