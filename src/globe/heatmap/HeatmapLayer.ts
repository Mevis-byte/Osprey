import * as Cesium from 'cesium'
import { createHeatmapCanvas, renderHeatmapToCanvas, type HeatmapPoint, type RenderOptions } from './heatmap-renderer'

const MAP_RECT = Cesium.Rectangle.fromDegrees(-180, -85.0511, 180, 85.0511)

export type HeatmapLayerKey = 'assetDensity' | 'alertDensity' | 'missionActivity'

export class HeatmapLayer {
  private entity: Cesium.Entity | null = null
  private _visible = false
  private _canvas: HTMLCanvasElement | null = null
  private _material: Cesium.ImageMaterialProperty | null = null

  constructor(
    public readonly key: HeatmapLayerKey,
    private options: Partial<RenderOptions>,
  ) {}

  get visible(): boolean {
    return this._visible
  }

  addToViewer(viewer: Cesium.Viewer): void {
    if (this.entity) return
    this._canvas = createHeatmapCanvas(this.options)
    this._material = new Cesium.ImageMaterialProperty({
      image: this._canvas,
      transparent: true,
    })
    this.entity = viewer.entities.add({
      rectangle: {
        coordinates: MAP_RECT,
        material: this._material,
      },
    })
    this._visible = true
  }

  removeFromViewer(viewer: Cesium.Viewer): void {
    if (this.entity) {
      viewer.entities.remove(this.entity)
      this.entity = null
      this._material = null
      this._canvas = null
    }
    this._visible = false
  }

  update(points: HeatmapPoint[], _viewer: Cesium.Viewer): void {
    if (!this._visible || !this._canvas || !this._material) return
    renderHeatmapToCanvas(this._canvas, points, this.options)
    this._material.image = new Cesium.ConstantProperty(this._canvas)
  }

  destroy(viewer: Cesium.Viewer): void {
    this.removeFromViewer(viewer)
  }
}
