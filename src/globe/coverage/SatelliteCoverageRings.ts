import * as Cesium from 'cesium'
import { useAppStore } from '@/store'

const EARTH_RADIUS = 6371000

const RING_CONFIGS = [
  { pct: 0.25, alpha: 0.45 },
  { pct: 0.50, alpha: 0.32 },
  { pct: 0.75, alpha: 0.20 },
  { pct: 1.00, alpha: 0.12 },
]

const RING_COLOR = Cesium.Color.fromCssColorString('#22d3ee')

export class SatelliteCoverageRings {
  private viewer: Cesium.Viewer
  private entities: Cesium.Entity[] = []
  private currentSatelliteId: string | null = null

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  show(satelliteId: string): void {
    if (this.currentSatelliteId === satelliteId) return
    this.hide()

    const state = useAppStore.getState()
    const asset = state.assetData.find((a) => a.id === satelliteId)
    if (!asset) return

    const altitude = asset.altitude
    const coverageAngle = Math.acos(EARTH_RADIUS / (EARTH_RADIUS + altitude))
    const coverageRadius = EARTH_RADIUS * coverageAngle

    for (const { pct, alpha } of RING_CONFIGS) {
      const radius = coverageRadius * pct
      const entity = this.viewer.entities.add({
        position: new Cesium.CallbackPositionProperty(() => {
          const s = useAppStore.getState()
          const a = s.assetData.find((x) => x.id === satelliteId)
          if (a) {
            return Cesium.Cartesian3.fromDegrees(a.longitude, a.latitude, 0)
          }
          return Cesium.Cartesian3.ZERO
        }, false),
        ellipse: {
          semiMinorAxis: radius,
          semiMajorAxis: radius,
          height: 0,
          fill: false,
          outline: true,
          outlineColor: RING_COLOR.withAlpha(alpha),
        },
      })
      this.entities.push(entity)
    }

    this.currentSatelliteId = satelliteId
    this.viewer.scene.requestRender()
  }

  hide(): void {
    for (const entity of this.entities) {
      this.viewer.entities.remove(entity)
    }
    this.entities = []
    this.currentSatelliteId = null
    this.viewer.scene.requestRender()
  }

  destroy(): void {
    this.hide()
  }
}
