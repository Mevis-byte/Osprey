import * as Cesium from 'cesium'
import { OrbitalPathRenderer } from '../orbits/OrbitalPathRenderer'
import type { Asset } from '@/types'
import type { Layer } from './BaseLayer'

export class SatelliteOrbitLayer implements Layer {
  readonly id = 'satellite-orbit'
  readonly name = 'Satellite Orbit'
  private renderer: OrbitalPathRenderer
  private _visible = true
  private selectedAsset: Asset | null = null

  constructor(viewer: Cesium.Viewer) {
    this.renderer = new OrbitalPathRenderer(viewer)
  }

  get visible(): boolean {
    return this._visible
  }

  initialize(): void {
    this.renderer.init()
  }

  load(_assets: Asset[]): void {}

  updatePositions(_assets: Asset[]): void {}

  clear(): void {
    this.renderer.setSelected(null)
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
    this.renderer.destroy()
  }

  private sync(): void {
    if (this._visible && this.selectedAsset?.type === 'satellite') {
      this.renderer.setSelected(this.selectedAsset.id)
    } else {
      this.renderer.setSelected(null)
    }
  }
}
