import * as Cesium from 'cesium'
import { renderHeatmap, type HeatmapPoint, type RenderOptions } from './heatmap-renderer'

const MAP_RECT = Cesium.Rectangle.fromDegrees(-180, -85.0511, 180, 85.0511)

export type HeatmapLayerKey = 'assetDensity' | 'alertDensity' | 'missionActivity'

export class HeatmapLayer {
  private entity: Cesium.Entity | null = null
  private _visible = false

  constructor(
    public readonly key: HeatmapLayerKey,
    private options: Partial<RenderOptions>,
  ) {}

  get visible(): boolean {
    return this._visible
  }

  addToViewer(viewer: Cesium.Viewer): void {
    if (this.entity) return
    const canvas = renderHeatmap([], this.options)
    this.entity = viewer.entities.add({
      rectangle: {
        coordinates: MAP_RECT,
        material: new Cesium.ImageMaterialProperty({
          image: canvas,
          transparent: true,
        }),
      },
    })
    this._visible = true
  }

  removeFromViewer(viewer: Cesium.Viewer): void {
    if (this.entity) {
      viewer.entities.remove(this.entity)
      this.entity = null
    }
    this._visible = false
  }

  update(points: HeatmapPoint[], _viewer: Cesium.Viewer): void {
    if (!this._visible) return
    const canvas = renderHeatmap(points, this.options)
    if (this.entity) {
      this.entity.rectangle!.material = new Cesium.ImageMaterialProperty({
        image: canvas,
        transparent: true,
      })
    }
  }

  destroy(viewer: Cesium.Viewer): void {
    this.removeFromViewer(viewer)
  }
}
