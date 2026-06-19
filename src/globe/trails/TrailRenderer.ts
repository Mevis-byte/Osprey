import * as Cesium from 'cesium'
import type { HistoryPoint } from '@/services/simulation/HistoryTracker'
import type { Waypoint } from '@/services/simulation/types'
import { ThemeColor } from '@/globe/layers/theme-colors'

export function assetTypeColor(type: string): Cesium.Color {
  if (type === 'fixed-wing' || type === 'rotary-wing') return ThemeColor.primary
  if (type === 'maritime') return ThemeColor.success
  return ThemeColor.accent
}

function assetTypeTrailColor(type: string): Cesium.Color {
  if (type === 'fixed-wing' || type === 'rotary-wing') return ThemeColor.trailAircraft
  if (type === 'maritime') return ThemeColor.trailMaritime
  return ThemeColor.trailSatellite
}

function assetTypeFutureColor(type: string): Cesium.Color {
  if (type === 'fixed-wing' || type === 'rotary-wing') return ThemeColor.futureAircraft
  if (type === 'maritime') return ThemeColor.futureMaritime
  return ThemeColor.futureSatellite
}

function reusePositions(
  pool: Cesium.Cartesian3[],
  count: number,
  fill: (i: number, dest: Cesium.Cartesian3) => Cesium.Cartesian3,
): Cesium.Cartesian3[] {
  for (let i = 0; i < count; i++) {
    if (i < pool.length) {
      fill(i, pool[i])
    } else {
      pool.push(fill(i, new Cesium.Cartesian3()))
    }
  }
  if (pool.length > count) {
    pool.length = count
  }
  return pool
}

export class TrailRenderer {
  private viewer: Cesium.Viewer
  private trailEntities = new Map<string, Cesium.Entity>()
  private futureEntities = new Map<string, Cesium.Entity>()
  private trailPools = new Map<string, Cesium.Cartesian3[]>()
  private futurePools = new Map<string, Cesium.Cartesian3[]>()
  private destroyHandles: (() => void)[] = []
  private _visible = true

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  update(
    history: Map<string, readonly HistoryPoint[]>,
    waypointData: Map<string, { currentLat: number; currentLon: number; remaining: readonly Waypoint[] }>,
  ): void {
    if (!this._visible) return

    const activeIds = new Set([...history.keys(), ...waypointData.keys()])

    for (const id of activeIds) {
      const pts = history.get(id)
      const type = pts && pts.length > 0 ? (pts[0] as any).type ?? '' : ''
      this.updateTrail(id, pts, type)

      const wpData = waypointData.get(id)
      this.updateFuture(id, wpData, type)
    }

    for (const id of this.trailEntities.keys()) {
      if (!activeIds.has(id)) this.trailEntities.get(id)!.show = false
    }
    for (const id of this.futureEntities.keys()) {
      if (!activeIds.has(id)) this.futureEntities.get(id)!.show = false
    }
  }

  private updateTrail(id: string, points: readonly HistoryPoint[] | undefined, type: string): void {
    let entity = this.trailEntities.get(id)

    if (!points || points.length < 2) {
      if (entity) entity.show = false
      return
    }

    const color = assetTypeTrailColor(type)

    let pool = this.trailPools.get(id)
    if (!pool) {
      pool = []
      this.trailPools.set(id, pool)
    }

    const positions = reusePositions(pool, points.length, (i, dest) =>
      Cesium.Cartesian3.fromDegrees(points[i].longitude, points[i].latitude, 0, undefined, dest),
    )

    if (!entity) {
      entity = this.viewer.entities.add({
        name: `${id}-trail`,
        polyline: {
          positions,
          width: 1.5,
          material: color,
          clampToGround: true,
        },
      })
      this.trailEntities.set(id, entity)
      this.destroyHandles.push(() => this.viewer.entities.remove(entity!))
    } else {
      entity.show = true
      entity.polyline!.positions = positions as unknown as Cesium.Property
    }
  }

  private updateFuture(
    id: string,
    data: { currentLat: number; currentLon: number; remaining: readonly Waypoint[] } | undefined,
    type: string,
  ): void {
    let entity = this.futureEntities.get(id)

    if (!data || data.remaining.length < 1) {
      if (entity) entity.show = false
      return
    }

    const color = assetTypeFutureColor(type)

    const count = 1 + data.remaining.length
    let pool = this.futurePools.get(id)
    if (!pool) {
      pool = []
      this.futurePools.set(id, pool)
    }

    const positions = reusePositions(pool, count, (i, dest) => {
      if (i === 0) {
        return Cesium.Cartesian3.fromDegrees(data.currentLon, data.currentLat, 0, undefined, dest)
      }
      return Cesium.Cartesian3.fromDegrees(data.remaining[i - 1].longitude, data.remaining[i - 1].latitude, 0, undefined, dest)
    })

    if (!entity) {
      entity = this.viewer.entities.add({
        name: `${id}-future`,
        polyline: {
          positions,
          width: 1,
          material: color,
          clampToGround: true,
        },
      })
      this.futureEntities.set(id, entity)
      this.destroyHandles.push(() => this.viewer.entities.remove(entity!))
    } else {
      entity.show = true
      entity.polyline!.positions = positions as unknown as Cesium.Property
    }
  }

  setVisible(visible: boolean): void {
    this._visible = visible
    for (const e of this.trailEntities.values()) e.show = visible
    for (const e of this.futureEntities.values()) e.show = visible
  }

  destroy(): void {
    for (const cleanup of this.destroyHandles) cleanup()
    this.trailEntities.clear()
    this.futureEntities.clear()
    this.trailPools.clear()
    this.futurePools.clear()
    this.destroyHandles = []
  }
}
