import * as Cesium from 'cesium'
import { getSimulationManager } from '@/services/simulation'
import { TrailRenderer } from '../trails/TrailRenderer'
import type { Asset } from '@/types'
import type { Layer } from './BaseLayer'

export class GroundTrackLayer implements Layer {
  readonly id = 'ground-track'
  readonly name = 'Ground Track'
  private renderer: TrailRenderer
  private _visible = true

  constructor(viewer: Cesium.Viewer) {
    this.renderer = new TrailRenderer(viewer)
  }

  get visible(): boolean {
    return this._visible
  }

  load(_assets: Asset[]): void {}

  updatePositions(assets: Asset[]): void {
    if (!this._visible || assets.length === 0) return

    const mgr = getSimulationManager()
    const history = mgr.getAllHistory()
    const waypoints = mgr.getRemainingWaypointsMap()
    this.renderer.update(history, waypoints)
  }

  clear(): void {
    this.renderer.destroy()
  }

  setVisible(visible: boolean): void {
    this._visible = visible
    this.renderer.setVisible(visible)
  }

  setHighlight(_entityId: string | null): void {}

  destroy(): void {
    this.renderer.destroy()
  }
}
