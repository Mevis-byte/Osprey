import * as Cesium from 'cesium'
import { useAppStore } from '@/store'
import { ThemeColor } from '@/globe/layers/theme-colors'

const EARTH_RADIUS = 6371000

const RING_CONFIGS = [
  { pct: 0.25, alpha: 0.20 },
  { pct: 0.50, alpha: 0.14 },
  { pct: 0.75, alpha: 0.09 },
  { pct: 1.00, alpha: 0.05 },
]

const RING_COLOR = ThemeColor.primary

export class SatelliteCoverageRings {
  private viewer: Cesium.Viewer
  private entities: Cesium.Entity[] = []
  private currentSatelliteId: string | null = null

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
    this.createRings()
  }

  private createRings(): void {
    for (const { alpha } of RING_CONFIGS) {
      const entity = this.viewer.entities.add({
        position: new Cesium.CallbackPositionProperty(() => {
          const id = this.currentSatelliteId
          if (!id) return Cesium.Cartesian3.ZERO
          const s = useAppStore.getState()
          const a = s.assetData.find((x) => x.id === id)
          if (a) {
            return Cesium.Cartesian3.fromDegrees(a.longitude, a.latitude, 0)
          }
          return Cesium.Cartesian3.ZERO
        }, false),
        ellipse: {
          semiMinorAxis: 0,
          semiMajorAxis: 0,
          height: 0,
          fill: false,
          outline: true,
          outlineColor: RING_COLOR.withAlpha(alpha),
          outlineWidth: 1,
        },
        show: false,
      })
      this.entities.push(entity)
    }
  }

  show(satelliteId: string): void {
    if (this.currentSatelliteId === satelliteId) return

    const state = useAppStore.getState()
    const asset = state.assetData.find((a) => a.id === satelliteId)
    if (!asset) return

    const altitude = asset.altitude
    const coverageAngle = Math.acos(EARTH_RADIUS / (EARTH_RADIUS + altitude))
    const coverageRadius = EARTH_RADIUS * coverageAngle

    for (let i = 0; i < this.entities.length; i++) {
      const { pct } = RING_CONFIGS[i]
      const radius = coverageRadius * pct
      const ellipse = this.entities[i].ellipse!
      ellipse.semiMinorAxis = new Cesium.ConstantProperty(radius)
      ellipse.semiMajorAxis = new Cesium.ConstantProperty(radius)
      this.entities[i].show = true
    }

    this.currentSatelliteId = satelliteId
    this.viewer.scene.requestRender()
  }

  hide(): void {
    for (const entity of this.entities) {
      entity.show = false
    }
    this.currentSatelliteId = null
    this.viewer.scene.requestRender()
  }

  destroy(): void {
    for (const entity of this.entities) {
      this.viewer.entities.remove(entity)
    }
    this.entities = []
    this.currentSatelliteId = null
  }
}
