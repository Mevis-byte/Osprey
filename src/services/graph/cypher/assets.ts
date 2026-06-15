import type { AssetNodeProperties } from '../types'

// ─── Node CRUD ────────────────────────────────────────────────────────────────

export function mergeAsset(props: AssetNodeProperties) {
  return {
    cypher: `
      MERGE (a:Asset { id: $props.id })
      SET a += $props
      RETURN a
    `,
    params: { props },
  }
}

export function findAssetById(id: string) {
  return {
    cypher: 'MATCH (a:Asset { id: $id }) RETURN a',
    params: { id },
  }
}

export function findAssetsByType(type: string) {
  return {
    cypher: 'MATCH (a:Asset { type: $type }) RETURN a ORDER BY a.name',
    params: { type },
  }
}

export function findAssetsByStatus(status: string) {
  return {
    cypher: 'MATCH (a:Asset { status: $status }) RETURN a ORDER BY a.name',
    params: { status },
  }
}

export function findAssetsInRegion(regionId: string) {
  return {
    cypher: `
      MATCH (a:Asset)-[:LOCATED_IN]->(r:Region { id: $regionId })
      RETURN a ORDER BY a.name
    `,
    params: { regionId },
  }
}

export function findAssetsAssignedToMission(missionId: string) {
  return {
    cypher: `
      MATCH (a:Asset)<-[:ASSIGNED_TO]-(m:Mission { id: $missionId })
      RETURN a ORDER BY a.name
    `,
    params: { missionId },
  }
}

export function deleteAsset(id: string) {
  return {
    cypher: 'MATCH (a:Asset { id: $id }) DETACH DELETE a',
    params: { id },
  }
}

// ─── Bulk ─────────────────────────────────────────────────────────────────────

export function mergeAssetsBulk(assets: AssetNodeProperties[]) {
  return {
    cypher: `
      UNWIND $assets AS props
      MERGE (a:Asset { id: props.id })
      SET a += props
      RETURN count(a) AS count
    `,
    params: { assets },
  }
}

export function removeAssetsNotIn(ids: string[]) {
  return {
    cypher: `
      MATCH (a:Asset)
      WHERE NOT a.id IN $ids
      DETACH DELETE a
    `,
    params: { ids },
  }
}
