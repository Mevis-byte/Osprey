import * as Cesium from 'cesium'
import { TacticalGridOverlay } from '../grid/TacticalGridOverlay'
import type { Asset } from '@/types'
import type { Layer } from './BaseLayer'

export class TacticalGridLayer implements Layer {
  readonly id = 'tactical-grid'
  readonly name = 'Tactical Grid'
  private overlay: TacticalGridOverlay
  private _visible = false

  constructor(viewer: Cesium.Viewer) {
    this.overlay = new TacticalGridOverlay(viewer)
  }

  get visible(): boolean {
    return this._visible
  }

  load(_assets: Asset[]): void {}

  updatePositions(_assets: Asset[]): void {}

  clear(): void {
    this.overlay.hide()
    this._visible = false
  }

  setVisible(visible: boolean): void {
    this._visible = visible
    if (visible) {
      this.overlay.show()
    } else {
      this.overlay.hide()
    }
  }

  setHighlight(_entityId: string | null): void {}

  destroy(): void {
    this.overlay.destroy()
  }
}
