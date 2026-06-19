import * as Cesium from 'cesium'
import { useAppStore } from '@/store'
import { ThemeColor } from '@/globe/layers/theme-colors'

const EARTH_RADIUS = 6371000
const GRID_COLOR = ThemeColor.success
const NUM_SEGMENTS = 60
const UPDATE_THRESHOLD = 0.02
const NUM_LINES = 7

const TOTAL_LINES = (NUM_LINES + 1) * 2

export class SatelliteCoverageGrid {
  private viewer: Cesium.Viewer
  private entities: Cesium.Entity[] = []
  private removeListener: (() => void) | null = null
  private satelliteId: string | null = null
  private lastLat: number | null = null
  private lastLon: number | null = null
  private coverageAngleDeg = 0

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
    this.createEntities()
  }

  private createEntities(): void {
    for (let i = 0; i < TOTAL_LINES; i++) {
      const entity = this.viewer.entities.add({
        polyline: {
          positions: [],
          width: 1,
          material: new Cesium.ColorMaterialProperty(GRID_COLOR),
        },
        show: false,
      })
      this.entities.push(entity)
    }
  }

  show(satelliteId: string): void {
    this.satelliteId = satelliteId
    this.lastLat = null
    this.lastLon = null
    this.updateCoverage(satelliteId)
    this.removeListener = this.viewer.scene.preRender.addEventListener(() => {
      this.tick()
    })
    this.viewer.scene.requestRender()
  }

  private updateCoverage(satelliteId: string): void {
    const state = useAppStore.getState()
    const asset = state.assetData.find((a) => a.id === satelliteId)
    if (!asset || asset.altitude <= 0) return

    const altitude = asset.altitude
    const coverageAngle = Math.acos(EARTH_RADIUS / (EARTH_RADIUS + altitude))
    this.coverageAngleDeg = Cesium.Math.toDegrees(coverageAngle)

    for (const entity of this.entities) {
      entity.show = true
    }

    this.updatePositions(asset.latitude, asset.longitude)
  }

  hide(): void {
    if (this.removeListener) {
      this.removeListener()
      this.removeListener = null
    }
    for (const entity of this.entities) {
      entity.show = false
    }
    this.satelliteId = null
    this.lastLat = null
    this.lastLon = null
  }

  destroy(): void {
    this.hide()
    for (const entity of this.entities) {
      this.viewer.entities.remove(entity)
    }
    this.entities = []
  }

  private tick(): void {
    if (!this.satelliteId) return
    const state = useAppStore.getState()
    const asset = state.assetData.find((a) => a.id === this.satelliteId)
    if (!asset) return

    if (this.lastLat !== null && this.lastLon !== null) {
      const dLat = Math.abs(asset.latitude - this.lastLat)
      const dLon = Math.abs(asset.longitude - this.lastLon)
      if (dLat < UPDATE_THRESHOLD && dLon < UPDATE_THRESHOLD) return
    }

    this.lastLat = asset.latitude
    this.lastLon = asset.longitude
    this.updatePositions(asset.latitude, asset.longitude)
  }

  private updatePositions(centerLat: number, centerLon: number): void {
    const coverageRad = Cesium.Math.toRadians(this.coverageAngleDeg)
    const clatRad = Cesium.Math.toRadians(centerLat)
    const clonRad = Cesium.Math.toRadians(centerLon)
    const rangeDeg = this.coverageAngleDeg * 2
    const spacingDeg = rangeDeg / NUM_LINES
    const halfLines = Math.floor(NUM_LINES / 2)

    let idx = 0

    for (let i = -halfLines; i <= halfLines; i++) {
      const lat = centerLat + i * spacingDeg
      if (lat <= -90 || lat >= 90) {
        if (idx < this.entities.length) {
          this.entities[idx].polyline!.positions = [] as unknown as Cesium.Property
        }
        idx++
        continue
      }

      const latRad = Cesium.Math.toRadians(lat)
      const numerator = Math.cos(coverageRad) - Math.sin(latRad) * Math.sin(clatRad)
      const denominator = Math.cos(latRad) * Math.cos(clatRad)
      const ratio = numerator / denominator

      let deltaLonRad: number
      if (ratio > 1) {
        if (idx < this.entities.length) {
          this.entities[idx].polyline!.positions = [] as unknown as Cesium.Property
        }
        idx++
        continue
      } else if (ratio < -1) {
        deltaLonRad = Math.PI
      } else {
        deltaLonRad = Math.acos(ratio)
      }

      const positions: Cesium.Cartesian3[] = []
      for (let j = 0; j <= NUM_SEGMENTS; j++) {
        const t = j / NUM_SEGMENTS
        const lonRad = clonRad - deltaLonRad + t * 2 * deltaLonRad
        positions.push(Cesium.Cartesian3.fromDegrees(
          Cesium.Math.toDegrees(lonRad), lat, 0,
        ))
      }
      if (idx < this.entities.length) {
        this.entities[idx].polyline!.positions = positions as unknown as Cesium.Property
      }
      idx++
    }

    for (let i = -halfLines; i <= halfLines; i++) {
      const lon = centerLon + i * spacingDeg
      const latStartRad = Math.max(
        Cesium.Math.toRadians(-90),
        clatRad - coverageRad,
      )
      const latEndRad = Math.min(
        Cesium.Math.toRadians(90),
        clatRad + coverageRad,
      )

      const positions: Cesium.Cartesian3[] = []
      for (let j = 0; j <= NUM_SEGMENTS; j++) {
        const t = j / NUM_SEGMENTS
        const latRad = latStartRad + t * (latEndRad - latStartRad)
        positions.push(Cesium.Cartesian3.fromDegrees(
          lon, Cesium.Math.toDegrees(latRad), 0,
        ))
      }
      if (idx < this.entities.length) {
        this.entities[idx].polyline!.positions = positions as unknown as Cesium.Property
      }
      idx++
    }
  }
}
