import * as Cesium from 'cesium'
import { SatelliteSensorCone } from '../coverage/SatelliteSensorCone'
import type { Asset } from '@/types'
import type { Layer } from './BaseLayer'

export class SensorConeLayer implements Layer {
  readonly id = 'sensor-cone'
  readonly name = 'Sensor Cone'
  private cone: SatelliteSensorCone
  private _visible = true
  private selectedAsset: Asset | null = null

  constructor(viewer: Cesium.Viewer) {
    this.cone = new SatelliteSensorCone(viewer)
  }

  get visible(): boolean {
    return this._visible
  }

  load(_assets: Asset[]): void {}

  updatePositions(_assets: Asset[]): void {}

  clear(): void {
    this.cone.hide()
  }

  setVisible(visible: boolean): void {
    this._visible = visible
    this.sync()
  }

  setHighlight(_entityId: string | null): void {}

  setSelectedAsset(asset: Asset | null): void {
    this.selectedAsset = asset
    this.sync()
  }

  destroy(): void {
    this.cone.destroy()
  }

  private sync(): void {
    if (this._visible && this.selectedAsset?.type === 'satellite') {
      this.cone.show(this.selectedAsset.id)
    } else {
      this.cone.hide()
    }
  }
}
