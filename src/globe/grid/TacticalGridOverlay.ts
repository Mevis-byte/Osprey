import * as Cesium from 'cesium'

const LINE_SPACING_DEG = 10
const LABEL_SPACING_DEG = 30
const MAJOR_SPACING_DEG = 30

const LINE_BASE_ALPHA = 0.35
const MAJOR_LINE_ALPHA = 0.45
const LABEL_ALPHA = 0.70

const FADE_ALT_MAX = 300000
const FADE_ALT_MIN = 50000

const NUM_LAT_SEGMENTS = 360
const NUM_LON_SEGMENTS = 180

function letter(i: number): string {
  return String.fromCharCode(65 + i)
}

export class TacticalGridOverlay {
  private viewer: Cesium.Viewer
  private entities: Cesium.Entity[] = []
  private entityAlphas: number[] = []
  private removeListener: (() => void) | null = null
  private visible = false
  private currentFade = 0

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  show(): void {
    if (this.visible) return
    this.visible = true
    this.buildGrid()
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
      this.viewer.entities.remove(entity)
    }
    this.entities = []
    this.entityAlphas = []
    this.currentFade = 0
  }

  destroy(): void {
    this.hide()
  }

  private buildGrid(): void {
    this.buildLatLines()
    this.buildLonLines()
    this.buildLabels()
  }

  private buildLatLines(): void {
    for (let lat = -80; lat <= 80; lat += LINE_SPACING_DEG) {
      const isMajor = lat % MAJOR_SPACING_DEG === 0
      const alpha = isMajor ? MAJOR_LINE_ALPHA : LINE_BASE_ALPHA

      const positions: Cesium.Cartesian3[] = []
      for (let j = 0; j <= NUM_LAT_SEGMENTS; j++) {
        const lon = -180 + (j / NUM_LAT_SEGMENTS) * 360
        positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, 0))
      }

      const entity = this.viewer.entities.add({
        polyline: {
          positions,
          width: isMajor ? 1.5 : 1,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.LIMEGREEN.withAlpha(alpha),
          ),
        },
      })
      this.entities.push(entity)
      this.entityAlphas.push(alpha)
    }
  }

  private buildLonLines(): void {
    for (let lon = -180; lon < 180; lon += LINE_SPACING_DEG) {
      const isMajor = lon % MAJOR_SPACING_DEG === 0
      const alpha = isMajor ? MAJOR_LINE_ALPHA : LINE_BASE_ALPHA

      const positions: Cesium.Cartesian3[] = []
      for (let j = 0; j <= NUM_LON_SEGMENTS; j++) {
        const lat = -90 + (j / NUM_LON_SEGMENTS) * 180
        positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, 0))
      }

      const entity = this.viewer.entities.add({
        polyline: {
          positions,
          width: isMajor ? 1.5 : 1,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.LIMEGREEN.withAlpha(alpha),
          ),
        },
      })
      this.entities.push(entity)
      this.entityAlphas.push(alpha)
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

        const entity = this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
          label: {
            text: `${colLetter}${rowLetter}`,
            font: '9px monospace',
            fillColor: Cesium.Color.LIMEGREEN.withAlpha(LABEL_ALPHA),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground: false,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        })
        this.entities.push(entity)
        this.entityAlphas.push(LABEL_ALPHA)
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

    const n = this.entities.length
    for (let i = 0; i < n; i++) {
      const entity = this.entities[i]
      const baseAlpha = this.entityAlphas[i]
      const fadeAlpha = baseAlpha * newFade

      if (entity.polyline) {
        entity.polyline!.material = new Cesium.ColorMaterialProperty(
          Cesium.Color.LIMEGREEN.withAlpha(fadeAlpha),
        )
      } else if (entity.label) {
        entity.label!.fillColor = Cesium.Color.LIMEGREEN.withAlpha(fadeAlpha) as unknown as Cesium.Property
      }
    }

    this.viewer.scene.requestRender()
  }
}
