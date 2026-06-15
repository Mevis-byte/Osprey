import type { RegionNodeProperties } from '../types'

// ─── Node CRUD ────────────────────────────────────────────────────────────────

export function mergeRegion(props: RegionNodeProperties) {
  return {
    cypher: `
      MERGE (r:Region { id: $props.id })
      SET r += $props
      RETURN r
    `,
    params: { props },
  }
}

export function findRegionById(id: string) {
  return {
    cypher: 'MATCH (r:Region { id: $id }) RETURN r',
    params: { id },
  }
}

export function findAllRegions() {
  return {
    cypher: 'MATCH (r:Region) RETURN r ORDER BY r.name',
    params: {},
  }
}

export function findRegionByName(name: string) {
  return {
    cypher: 'MATCH (r:Region { name: $name }) RETURN r',
    params: { name },
  }
}

// ─── Region Graph Queries ─────────────────────────────────────────────────────

export function findRegionGraphById(id: string) {
  return {
    cypher: `
      MATCH path = (r:Region { id: $id })<-[:LOCATED_IN|MONITORS*]-(connected)
      RETURN path
    `,
    params: { id },
  }
}

export function findRegionSummary() {
  return {
    cypher: `
      MATCH (r:Region)
      OPTIONAL MATCH (a:Asset)-[:LOCATED_IN]->(r)
      OPTIONAL MATCH (m:Mission)-[:MONITORS]->(r)
      OPTIONAL MATCH (alert:Alert)-[:TRIGGERED]->(asset:Asset)-[:LOCATED_IN]->(r)
      RETURN r AS region,
             count(DISTINCT a) AS assetCount,
             count(DISTINCT m) AS missionCount,
             count(DISTINCT alert) AS alertCount
      ORDER BY r.name
    `,
    params: {},
  }
}

export function findRegionThreatDensity(regionId: string) {
  return {
    cypher: `
      MATCH (r:Region { id: $regionId })<-[:LOCATED_IN]-(a:Asset)
      OPTIONAL MATCH (a)<-[:TRIGGERED]-(alert:Alert)
      RETURN r AS region,
             count(DISTINCT a) AS totalAssets,
             count(DISTINCT CASE WHEN a.status IN ['offline', 'lost', 'unknown'] THEN a END) AS threatAssets,
             count(DISTINCT alert) AS totalAlerts,
             count(DISTINCT CASE WHEN alert.severity IN ['critical', 'high'] THEN alert END) AS highSeverityAlerts
    `,
    params: { regionId },
  }
}

export function findAssetsByRegion() {
  return {
    cypher: `
      MATCH (a:Asset)-[:LOCATED_IN]->(r:Region)
      RETURN r AS region, collect(a.id) AS assetIds, count(a) AS count
      ORDER BY count DESC
    `,
    params: {},
  }
}

export function findAdjacentRegions(regionId: string) {
  return {
    cypher: `
      MATCH (r:Region { id: $regionId })
      MATCH (other:Region)
      WHERE r.id <> other.id
        AND r.minLatitude <= other.maxLatitude
        AND r.maxLatitude >= other.minLatitude
        AND r.minLongitude <= other.maxLongitude
        AND r.maxLongitude >= other.minLongitude
      RETURN other AS adjacentRegion, other.name AS name
    `,
    params: { regionId },
  }
}

// ─── Bulk ─────────────────────────────────────────────────────────────────────

export function mergeRegionsBulk(regions: RegionNodeProperties[]) {
  return {
    cypher: `
      UNWIND $regions AS props
      MERGE (r:Region { id: props.id })
      SET r += props
      RETURN count(r) AS count
    `,
    params: { regions },
  }
}
