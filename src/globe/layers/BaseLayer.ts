import * as Cesium from 'cesium'
import type { Asset } from '@/types'

export interface Layer {
  readonly id: string
  readonly name: string
  readonly visible: boolean
  initialize?(): void
  load(assets: Asset[]): void
  updatePositions(assets: Asset[]): void
  clear(): void
  setVisible(visible: boolean): void
  setHighlight(entityId: string | null): void
  setSelectedAsset?(asset: Asset | null): void
  destroy?(): void
}

export abstract class BaseLayer implements Layer {
  protected viewer: Cesium.Viewer
  protected entities: Cesium.Entity[] = []
  protected _visible = true
  protected highlightedId: string | null = null

  constructor(
    viewer: Cesium.Viewer,
    public readonly id: string,
    public readonly name: string,
  ) {
    this.viewer = viewer
  }

  get visible(): boolean {
    return this._visible
  }

  abstract load(assets: Asset[]): void

  updatePositions(assets: Asset[]): void {
    const map = new Map(assets.map((a) => [a.id, a]))
    for (const entity of this.entities) {
      const asset = map.get(entity.id!)
      if (asset) {
        entity.position = new Cesium.ConstantPositionProperty(
          Cesium.Cartesian3.fromDegrees(asset.longitude, asset.latitude, asset.altitude),
        )
      }
    }
  }

  clear(): void {
    this.entities.forEach((entity) => this.viewer.entities.remove(entity))
    this.entities = []
  }

  setVisible(visible: boolean): void {
    this._visible = visible
    this.entities.forEach((entity) => {
      entity.show = visible
    })
  }

  setHighlight(entityId: string | null): void {
    if (this.highlightedId === entityId) return

    if (this.highlightedId) {
      const prev = this.entities.find((e) => e.id === this.highlightedId)
      if (prev?.point) {
        const p = prev.point as unknown as Record<string, unknown>
        p.pixelSize = 8
        p.outlineWidth = 1.5
        p.outlineColor = Cesium.Color.WHITE
      }
    }

    this.highlightedId = entityId

    if (entityId) {
      const next = this.entities.find((e) => e.id === entityId)
      if (next?.point) {
        const p = next.point as unknown as Record<string, unknown>
        p.pixelSize = 12
        p.outlineWidth = 3
        p.outlineColor = Cesium.Color.fromCssColorString('#60a5fa')
      }
    }
  }

  protected createPoint(color: Cesium.Color): Cesium.PointGraphics {
    return new Cesium.PointGraphics({
      pixelSize: 8,
      color,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 1.5,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scaleByDistance: new Cesium.NearFarScalar(1.5e7, 1, 1.5e8, 0.5),
    })
  }

  destroy(): void {
    this.clear()
  }
}
