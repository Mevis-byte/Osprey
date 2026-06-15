import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import { useAppStore } from '@/store'
import type { Asset, Region } from '@/types'

const THREAT_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

function threatColor(level: string): Cesium.Color {
  return Cesium.Color.fromCssColorString(THREAT_COLORS[level] ?? '#6b7280')
}

export class RegionOverlayLayer extends BaseLayer {
  private regionPolygons: Cesium.Entity[] = []
  private regionLabels: Cesium.Entity[] = []
  private removeTickListener: (() => void) | null = null

  constructor(viewer: Cesium.Viewer) {
    super(viewer, 'region-overlay', 'Region Overlay')
  }

  load(_assets: Asset[]): void {
    this.clear()

    const store = useAppStore.getState()
    const regions = store.regions
    if (!regions || regions.length === 0) return

    for (const r of regions) {
      this.buildRegion(r)
    }

    this.removeTickListener = this.viewer.scene.preRender.addEventListener(() => {
      this.tick()
    })
  }

  private buildRegion(r: Region): void {
    const color = threatColor(r.threatLevel)
    const [west, south, east, north] = r.bounds

    const positions: Cesium.Cartesian3[] = []
    const steps = 20
    for (let i = 0; i <= steps; i++) {
      const lon = west + (east - west) * (i / steps)
      positions.push(Cesium.Cartesian3.fromDegrees(lon, south, 0))
    }
    for (let i = 0; i <= steps; i++) {
      const lon = east - (east - west) * (i / steps)
      positions.push(Cesium.Cartesian3.fromDegrees(lon, north, 0))
    }

    const polygon = this.viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(positions),
        fill: true,
        material: color.withAlpha(0.06),
        outline: true,
        outlineColor: color.withAlpha(0.3),
        outlineWidth: 1,
        height: 0,
      },
    })
    this.regionPolygons.push(polygon)

    const centerPos = Cesium.Cartesian3.fromDegrees(
      r.center.longitude, r.center.latitude, 200000,
    )

    const label = this.viewer.entities.add({
      position: centerPos,
      label: this.createLabel(this.buildLabelText(r), {
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
      }),
    })
    this.regionLabels.push(label)
  }

  private buildLabelText(r: Region): string {
    const threat = r.threatLevel.toUpperCase()
    return `${r.name}\nAssets: ${r.assetCount}  Missions: ${r.activeMissions.length}\nThreat: ${threat}  Alerts: ${r.alertCount}`
  }

  private tick(): void {
    const store = useAppStore.getState()
    const regions = store.regions
    if (!regions || regions.length === 0) return

    const alertCounts = new Map<string, number>()
    const assetCounts = new Map<string, number>()

    for (const asset of store.assetData) {
      for (const r of regions) {
        if (this.pointInBounds(asset.longitude, asset.latitude, r.bounds)) {
          assetCounts.set(r.id, (assetCounts.get(r.id) ?? 0) + 1)
        }
      }
    }

    for (const alert of store.alerts) {
      const regionIds = new Set<string>()
      for (const assetId of alert.assetIds) {
        const asset = store.assetData.find((a) => a.id === assetId)
        if (!asset) continue
        for (const r of regions) {
          if (this.pointInBounds(asset.longitude, asset.latitude, r.bounds)) {
            regionIds.add(r.id)
          }
        }
      }
      for (const rid of regionIds) {
        alertCounts.set(rid, (alertCounts.get(rid) ?? 0) + 1)
      }
    }

    for (let i = 0; i < regions.length; i++) {
      const r = regions[i]
      const label = this.regionLabels[i]
      if (!label || !label.label) continue

      const updated = {
        ...r,
        assetCount: assetCounts.get(r.id) ?? 0,
        alertCount: alertCounts.get(r.id) ?? 0,
      }

      label.label!.text = new Cesium.ConstantProperty(this.buildLabelText(updated))
    }
  }

  private pointInBounds(
    lon: number, lat: number,
    bounds: [number, number, number, number],
  ): boolean {
    const [w, s, e, n] = bounds
    return lon >= w && lon <= e && lat >= s && lat <= n
  }

  setVisible(visible: boolean): void {
    super.setVisible(visible)
    for (const e of this.regionPolygons) e.show = visible
    for (const e of this.regionLabels) e.show = visible
  }

  clear(): void {
    if (this.removeTickListener) {
      this.removeTickListener()
      this.removeTickListener = null
    }
    for (const e of this.regionPolygons) this.viewer.entities.remove(e)
    for (const e of this.regionLabels) this.viewer.entities.remove(e)
    this.regionPolygons = []
    this.regionLabels = []
    super.clear()
  }

  destroy(): void {
    this.clear()
    super.destroy()
  }
}
