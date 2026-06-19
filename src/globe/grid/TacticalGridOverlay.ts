import * as Cesium from 'cesium'
import { createLabelGraphics } from '../layers/label-styles'
import { ThemeColor } from '../layers/theme-colors'

const LINE_SPACING_DEG = 10
const LABEL_SPACING_DEG = 30
const MAJOR_SPACING_DEG = 30

const LINE_BASE_ALPHA = 0.20
const MAJOR_LINE_ALPHA = 0.30
const LABEL_ALPHA = 0.55

const FADE_ALT_MAX = 300000
const FADE_ALT_MIN = 50000

const NUM_LAT_SEGMENTS = 360
const NUM_LON_SEGMENTS = 180

function letter(i: number): string {
  return String.fromCharCode(65 + i)
}

const _scratchLineColor = ThemeColor.tacticalGrid.clone()
const _scratchMajorColor = ThemeColor.tacticalGrid.clone()
const _scratchLabelColor = ThemeColor.tacticalGrid.clone()
const _sharedLineMat = new Cesium.ColorMaterialProperty(_scratchLineColor)
const _sharedMajorMat = new Cesium.ColorMaterialProperty(_scratchMajorColor)
ThemeColor.tacticalGrid.withAlpha(LABEL_ALPHA, _scratchLabelColor)

export class TacticalGridOverlay {
  private viewer: Cesium.Viewer
  private entities: Cesium.Entity[] = []
  private removeListener: (() => void) | null = null
  private visible = false
  private currentFade = 0

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
    this.buildGrid()
  }

  show(): void {
    if (this.visible) return
    this.visible = true
    for (const entity of this.entities) {
      entity.show = true
    }
    this.removeListener = this.viewer.scene.preRender.addEventListener(() => {
      this.tick()
    })
    this.viewer.scene.requestRender()
  }

  hide(): void {
    this.visible = false
    if (this.removeListener) {
      this.removeListener()
      this.removeListener = null
    }
    for (const entity of this.entities) {
      entity.show = false
    }
    this.currentFade = 0
  }

  destroy(): void {
    this.hide()
    for (const entity of this.entities) {
      this.viewer.entities.remove(entity)
    }
    this.entities = []
  }

  private buildGrid(): void {
    this.buildLatLines()
    this.buildLonLines()
    this.buildLabels()
  }

  private buildLatLines(): void {
    for (let lat = -80; lat <= 80; lat += LINE_SPACING_DEG) {
      const isMajor = lat % MAJOR_SPACING_DEG === 0

      const positions: Cesium.Cartesian3[] = []
      for (let j = 0; j <= NUM_LAT_SEGMENTS; j++) {
        const lon = -180 + (j / NUM_LAT_SEGMENTS) * 360
        positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, 0))
      }

      this.entities.push(this.viewer.entities.add({
        show: false,
        polyline: {
          positions,
          width: isMajor ? 1.5 : 1,
          material: isMajor ? _sharedMajorMat : _sharedLineMat,
        },
      }))
    }
  }

  private buildLonLines(): void {
    for (let lon = -180; lon < 180; lon += LINE_SPACING_DEG) {
      const isMajor = lon % MAJOR_SPACING_DEG === 0

      const positions: Cesium.Cartesian3[] = []
      for (let j = 0; j <= NUM_LON_SEGMENTS; j++) {
        const lat = -90 + (j / NUM_LON_SEGMENTS) * 180
        positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, 0))
      }

      this.entities.push(this.viewer.entities.add({
        show: false,
        polyline: {
          positions,
          width: isMajor ? 1.5 : 1,
          material: isMajor ? _sharedMajorMat : _sharedLineMat,
        },
      }))
    }
  }

  private buildLabels(): void {
    const labelOffset = LABEL_SPACING_DEG / 2

    for (let lon = -180 + labelOffset; lon < 180; lon += LABEL_SPACING_DEG) {
      const colIdx = Math.round((lon + 180 - labelOffset) / LABEL_SPACING_DEG) % 12
      const colLetter = letter(colIdx)

      for (let lat = -90 + labelOffset; lat <= 90 - labelOffset; lat += LABEL_SPACING_DEG) {
        const rowIdx = Math.round((lat + 90 - labelOffset) / LABEL_SPACING_DEG)
        const rowLetter = letter(rowIdx)

        this.entities.push(this.viewer.entities.add({
          show: false,
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
          label: createLabelGraphics({
            text: `${colLetter}${rowLetter}`,
            fillColor: _scratchLabelColor,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            pixelOffset: new Cesium.Cartesian2(0, 0),
          }),
        }))
      }
    }
  }

  private tick(): void {
    if (!this.visible) return

    const camera = this.viewer.camera
    const carto = camera.positionCartographic
    if (!carto) return

    const alt = carto.height
    const rawFade = (alt - FADE_ALT_MIN) / (FADE_ALT_MAX - FADE_ALT_MIN)
    const newFade = Math.max(0, Math.min(1, rawFade))

    if (Math.abs(newFade - this.currentFade) < 0.015) return
    this.currentFade = newFade

    const lineFade = LINE_BASE_ALPHA * newFade
    const majorFade = MAJOR_LINE_ALPHA * newFade
    const labelFade = LABEL_ALPHA * newFade

    ;(_sharedLineMat.color as unknown as { setValue: (c: Cesium.Color) => void }).setValue(
      ThemeColor.tacticalGrid.withAlpha(lineFade, _scratchLineColor),
    )
    ;(_sharedMajorMat.color as unknown as { setValue: (c: Cesium.Color) => void }).setValue(
      ThemeColor.tacticalGrid.withAlpha(majorFade, _scratchMajorColor),
    )
    ThemeColor.tacticalGrid.withAlpha(labelFade, _scratchLabelColor)

    this.viewer.scene.requestRender()
  }
}
