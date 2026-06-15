import * as Cesium from 'cesium'
import { HeatmapManager } from '../heatmap'
import type { AppStore, HeatmapLayerKey } from '@/store'
import type { Asset } from '@/types'
import type { Layer } from './BaseLayer'

export class HeatmapLayer implements Layer {
  readonly id = 'heatmap'
  readonly name = 'Heatmap'
  private manager = new HeatmapManager()
  private _visible = false
  private layerVisibility: Record<HeatmapLayerKey, boolean> = {
    assetDensity: false,
    alertDensity: false,
    missionActivity: false,
  }

  constructor(private viewer: Cesium.Viewer) {}

  get visible(): boolean {
    return this._visible
  }

  initialize(): void {
    this.manager.init(this.viewer)
  }

  load(_assets: Asset[]): void {}

  updatePositions(_assets: Asset[]): void {}

  clear(): void {
    this.setVisible(false)
  }

  setVisible(visible: boolean): void {
    this._visible = visible
    for (const key of Object.keys(this.layerVisibility) as HeatmapLayerKey[]) {
      this.manager.setVisible(key, visible && this.layerVisibility[key])
    }
  }

  setHeatmapVisibility(layers: Record<HeatmapLayerKey, boolean>): void {
    this.layerVisibility = layers
    this._visible = Object.values(layers).some(Boolean)
    for (const key of Object.keys(layers) as HeatmapLayerKey[]) {
      this.manager.setVisible(key, layers[key])
    }
  }

  refresh(state: AppStore): void {
    if (this._visible) {
      this.manager.refreshAll(state)
    }
  }

  setHighlight(_entityId: string | null): void {}

  destroy(): void {
    this.manager.destroy()
  }
}
