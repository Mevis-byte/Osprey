import type { MissionNodeProperties } from '../types'

// ─── Node CRUD ────────────────────────────────────────────────────────────────

export function mergeMission(props: MissionNodeProperties) {
  return {
    cypher: `
      MERGE (m:Mission { id: $props.id })
      SET m += $props
      RETURN m
    `,
    params: { props },
  }
}

export function findMissionById(id: string) {
  return {
    cypher: 'MATCH (m:Mission { id: $id }) RETURN m',
    params: { id },
  }
}

export function findMissionsByStatus(status: string) {
  return {
    cypher: 'MATCH (m:Mission { status: $status }) RETURN m ORDER BY m.name',
    params: { status },
  }
}

export function findActiveMissions() {
  return {
    cypher: "MATCH (m:Mission) WHERE m.status IN ['in-progress', 'pending', 'standby'] RETURN m ORDER BY m.name",
    params: {},
  }
}

export function deleteMission(id: string) {
  return {
    cypher: 'MATCH (m:Mission { id: $id }) DETACH DELETE m',
    params: { id },
  }
}

// ─── Mission Graph Queries ────────────────────────────────────────────────────

export function findMissionGraphById(id: string) {
  return {
    cypher: `
      MATCH path = (m:Mission { id: $id })-[:ASSIGNED_TO|MONITORS*]-(connected)
      RETURN path
    `,
    params: { id },
  }
}

export function findMissionAssetsDetails(missionId: string) {
  return {
    cypher: `
      MATCH (m:Mission { id: $missionId })-[:ASSIGNED_TO]->(a:Asset)
      OPTIONAL MATCH (a)-[:LOCATED_IN]->(r:Region)
      RETURN m AS mission, collect(DISTINCT { asset: a, region: r }) AS assets
    `,
    params: { missionId },
  }
}

export function findMissionsByRegion(regionId: string) {
  return {
    cypher: `
      MATCH (m:Mission)-[:MONITORS]->(r:Region { id: $regionId })
      RETURN m ORDER BY m.name
    `,
    params: { regionId },
  }
}

export function findMissionCountByStatus() {
  return {
    cypher: `
      MATCH (m:Mission)
      RETURN m.status AS status, count(m) AS count
      ORDER BY count DESC
    `,
    params: {},
  }
}

export function findMissionThreatSummary() {
  return {
    cypher: `
      MATCH (m:Mission)
      RETURN m.threatLevel AS threatLevel, count(m) AS count
      ORDER BY count DESC
    `,
    params: {},
  }
}

export function findMissionsWithHighThreatAssets() {
  return {
    cypher: `
      MATCH (m:Mission)-[:ASSIGNED_TO]->(a:Asset)
      WHERE a.status IN ['offline', 'lost', 'unknown']
      RETURN m, collect(a) AS compromisedAssets
      ORDER BY size(collect(a)) DESC
    `,
    params: {},
  }
}

// ─── Bulk ─────────────────────────────────────────────────────────────────────

export function mergeMissionsBulk(missions: MissionNodeProperties[]) {
  return {
    cypher: `
      UNWIND $missions AS props
      MERGE (m:Mission { id: props.id })
      SET m += props
      RETURN count(m) AS count
    `,
    params: { missions },
  }
}
