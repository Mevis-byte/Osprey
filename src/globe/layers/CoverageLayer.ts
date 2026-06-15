import * as Cesium from 'cesium'
import { SatelliteCoverageGrid } from '../coverage/SatelliteCoverageGrid'
import { SatelliteCoverageRings } from '../coverage/SatelliteCoverageRings'
import type { Asset } from '@/types'
import type { Layer } from './BaseLayer'

export class CoverageLayer implements Layer {
  readonly id = 'coverage'
  readonly name = 'Coverage'
  private rings: SatelliteCoverageRings
  private grid: SatelliteCoverageGrid
  private _visible = true
  private selectedAsset: Asset | null = null

  constructor(viewer: Cesium.Viewer) {
    this.rings = new SatelliteCoverageRings(viewer)
    this.grid = new SatelliteCoverageGrid(viewer)
  }

  get visible(): boolean {
    return this._visible
  }

  load(_assets: Asset[]): void {}

  updatePositions(_assets: Asset[]): void {}

  clear(): void {
    this.rings.hide()
    this.grid.hide()
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
    this.rings.destroy()
    this.grid.destroy()
  }

  private sync(): void {
    if (this._visible && this.selectedAsset?.type === 'satellite') {
      this.rings.show(this.selectedAsset.id)
      this.grid.show(this.selectedAsset.id)
    } else {
      this.rings.hide()
      this.grid.hide()
    }
  }
}
