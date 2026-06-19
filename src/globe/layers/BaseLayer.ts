import * as Cesium from 'cesium'
import type { Asset } from '@/types'
import { createLabelGraphics } from './label-styles'
import { ThemeColor } from './theme-colors'

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
  setHover?(entityId: string | null): void
  setSelectedAsset?(asset: Asset | null): void
  destroy?(): void
}

export abstract class BaseLayer implements Layer {
  protected viewer: Cesium.Viewer
  protected entities: Cesium.Entity[] = []
  protected _visible = true
  protected highlightedId: string | null = null
  protected hoveredId: string | null = null

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

  private _scratchPosition = new Cesium.Cartesian3()

  updatePositions(assets: Asset[]): void {
    const map = new Map(assets.map((a) => [a.id, a]))
    for (const entity of this.entities) {
      const asset = map.get(entity.id!)
      if (asset) {
        const pos = Cesium.Cartesian3.fromDegrees(asset.longitude, asset.latitude, asset.altitude, undefined, this._scratchPosition)
        if (entity.position instanceof Cesium.ConstantPositionProperty) {
          entity.position.setValue(pos)
        } else {
          entity.position = new Cesium.ConstantPositionProperty(pos.clone())
        }
        if (entity.billboard) {
          if ('heading' in asset) {
            entity.billboard.rotation = Cesium.Math.toRadians(360 - asset.heading) as unknown as Cesium.Property
          }
        }
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
      if (prev?.billboard) {
        const b = prev.billboard as unknown as Record<string, unknown>
        b.scale = 0.5
        b.color = Cesium.Color.WHITE
      }
      if (prev?.label) {
        prev.label.scale = 1.0 as unknown as Cesium.Property
      }
    }

    this.highlightedId = entityId

    if (entityId) {
      const next = this.entities.find((e) => e.id === entityId)
      if (next?.billboard) {
        const b = next.billboard as unknown as Record<string, unknown>
        b.scale = 0.65
        b.color = ThemeColor.primary
      }
      if (next?.label) {
        next.label.scale = 1.05 as unknown as Cesium.Property
      }
    }
  }

  setHover(entityId: string | null): void {
    if (this.hoveredId === entityId) return

    if (this.hoveredId) {
      const prev = this.entities.find((e) => e.id === this.hoveredId)
      if (prev?.label && this.highlightedId !== this.hoveredId) {
        prev.label.scale = 1.0 as unknown as Cesium.Property
      }
    }

    this.hoveredId = entityId

    if (entityId) {
      const next = this.entities.find((e) => e.id === entityId)
      if (next?.label) {
        next.label.scale = 1.08 as unknown as Cesium.Property
      }
    }
  }

  protected createPoint(color: Cesium.Color, distanceCondition?: Cesium.DistanceDisplayCondition): Cesium.PointGraphics {
    return new Cesium.PointGraphics({
      pixelSize: 8,
      color,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 1.5,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scaleByDistance: new Cesium.NearFarScalar(1.0e6, 1.0, 2.5e7, 0.5),
      distanceDisplayCondition: distanceCondition,
    })
  }

  protected createMarker(image: string, distanceCondition?: Cesium.DistanceDisplayCondition): Cesium.BillboardGraphics {
    return new Cesium.BillboardGraphics({
      image,
      scale: 0.55,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scaleByDistance: new Cesium.NearFarScalar(1.0e6, 1.0, 2.5e7, 0.5),
      heightReference: Cesium.HeightReference.NONE,
      rotation: 0,
      alignedAxis: Cesium.Cartesian3.UNIT_Z,
      distanceDisplayCondition: distanceCondition,
    })
  }

  protected createLabel(text: string | Cesium.Property, options: Partial<Parameters<typeof createLabelGraphics>[0]> = {}): Cesium.LabelGraphics {
    return createLabelGraphics({
      text,
      showBackground: true,
      ...options
    })
  }

  destroy(): void {
    this.clear()
  }
}
