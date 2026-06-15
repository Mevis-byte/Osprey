import * as Cesium from 'cesium'
import type { HistoryPoint } from '@/services/simulation/HistoryTracker'
import type { Waypoint } from '@/services/simulation/types'

const AIRCRAFT_COLOR = Cesium.Color.fromCssColorString('#22d3ee')
const MARITIME_COLOR = Cesium.Color.fromCssColorString('#4ade80')
const SATELLITE_COLOR = Cesium.Color.fromCssColorString('#fbbf24')

export function assetTypeColor(type: string): Cesium.Color {
  if (type === 'fixed-wing' || type === 'rotary-wing') return AIRCRAFT_COLOR
  if (type === 'maritime') return MARITIME_COLOR
  return SATELLITE_COLOR
}

export class TrailRenderer {
  private viewer: Cesium.Viewer
  private trailEntities = new Map<string, Cesium.Entity>()
  private futureEntities = new Map<string, Cesium.Entity>()
  private destroyHandles: (() => void)[] = []
  private _visible = true

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  update(
    history: Map<string, readonly HistoryPoint[]>,
    waypointData: Map<string, { currentLat: number; currentLon: number; remaining: readonly Waypoint[] }>,
    colors: Map<string, Cesium.Color>,
  ): void {
    if (!this._visible) return

    const activeIds = new Set([...history.keys(), ...waypointData.keys()])

    for (const id of activeIds) {
      const color = colors.get(id) ?? Cesium.Color.WHITE
      const pts = history.get(id)
      this.updateTrail(id, pts, color)

      const wpData = waypointData.get(id)
      this.updateFuture(id, wpData, color)
    }

    for (const id of this.trailEntities.keys()) {
      if (!activeIds.has(id)) this.trailEntities.get(id)!.show = false
    }
    for (const id of this.futureEntities.keys()) {
      if (!activeIds.has(id)) this.futureEntities.get(id)!.show = false
    }
  }

  private updateTrail(id: string, points: readonly HistoryPoint[] | undefined, color: Cesium.Color): void {
    let entity = this.trailEntities.get(id)

    if (!points || points.length < 2) {
      if (entity) entity.show = false
      return
    }

    const positions = points.map((p) =>
      Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, 0),
    )

    if (!entity) {
      entity = this.viewer.entities.add({
        name: `${id}-trail`,
        polyline: {
          positions,
          width: 2,
          material: color.withAlpha(0.55),
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
    color: Cesium.Color,
  ): void {
    let entity = this.futureEntities.get(id)

    if (!data || data.remaining.length < 1) {
      if (entity) entity.show = false
      return
    }

    const positions = [
      Cesium.Cartesian3.fromDegrees(data.currentLon, data.currentLat, 0),
      ...data.remaining.map((w) => Cesium.Cartesian3.fromDegrees(w.longitude, w.latitude, 0)),
    ]

    if (!entity) {
      entity = this.viewer.entities.add({
        name: `${id}-future`,
        polyline: {
          positions,
          width: 1,
          material: color.withAlpha(0.3),
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
    this.destroyHandles = []
  }
}
