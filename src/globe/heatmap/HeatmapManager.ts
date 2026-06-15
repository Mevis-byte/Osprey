import * as Cesium from 'cesium'
import { HeatmapLayer, type HeatmapLayerKey } from './HeatmapLayer'
import type { HeatmapPoint } from './heatmap-renderer'
import type { AppStore } from '@/store'

export class HeatmapManager {
  private layers = new Map<HeatmapLayerKey, HeatmapLayer>()
  private viewer: Cesium.Viewer | null = null
  private lastRefresh = 0
  private refreshThrottleMs = 2000

  init(viewer: Cesium.Viewer): void {
    this.viewer = viewer

    const keys: HeatmapLayerKey[] = ['assetDensity', 'alertDensity', 'missionActivity']
    for (const key of keys) {
      this.layers.set(key, new HeatmapLayer(key, {}))
    }
  }

  destroy(): void {
    if (this.viewer) {
      for (const layer of this.layers.values()) {
        layer.destroy(this.viewer)
      }
    }
    this.layers.clear()
    this.viewer = null
  }

  setVisible(key: HeatmapLayerKey, visible: boolean): void {
    const layer = this.layers.get(key)
    if (!layer || !this.viewer) return
    if (visible) {
      layer.addToViewer(this.viewer)
    } else {
      layer.removeFromViewer(this.viewer)
    }
  }

  refreshAll(state: AppStore): void {
    if (!this.viewer) return

    const now = Date.now()
    if (now - this.lastRefresh < this.refreshThrottleMs) return
    this.lastRefresh = now

    const assetPoints: HeatmapPoint[] = state.assetData.map((a) => ({
      lat: a.latitude,
      lon: a.longitude,
      weight: 0.8,
    }))

    const alertPoints: HeatmapPoint[] = []
    for (const alert of state.alerts) {
      for (const id of alert.assetIds) {
        const asset = state.assetData.find((a) => a.id === id)
        if (asset) {
          const weight =
            alert.severity === 'critical' ? 1 :
            alert.severity === 'high' ? 0.7 :
            alert.severity === 'medium' ? 0.4 : 0.2
          alertPoints.push({ lat: asset.latitude, lon: asset.longitude, weight })
        }
      }
    }

    const missionPoints: HeatmapPoint[] = []
    for (const mission of state.missions) {
      if (mission.status === 'cancelled' || mission.status === 'aborted') continue
      for (const wp of mission.waypoints) {
        missionPoints.push({ lat: wp.latitude, lon: wp.longitude, weight: 0.6 })
      }
    }

    const assetLayer = this.layers.get('assetDensity')
    if (assetLayer?.visible) {
      assetLayer.update(assetPoints, this.viewer)
    }

    const alertLayer = this.layers.get('alertDensity')
    if (alertLayer?.visible) {
      alertLayer.update(alertPoints, this.viewer)
    }

    const missionLayer = this.layers.get('missionActivity')
    if (missionLayer?.visible) {
      missionLayer.update(missionPoints, this.viewer)
    }
  }
}
