import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import { useAppStore } from '@/store'
import type { Asset } from '@/types'
import { ThemeColor } from './theme-colors'

const EARTH_R = 6371000
const PREDICTION_MARKS = [5, 15, 30, 60] as const
const SEGMENT_COLORS = [
  ThemeColor.primary,
  ThemeColor.success,
  ThemeColor.warning,
  ThemeColor.danger,
] as const

const SCRATCH_PREV = new Cesium.Cartesian3()
const SCRATCH_CURR = new Cesium.Cartesian3()

function toRad(d: number): number { return d * Math.PI / 180 }

function predict(
  lat: number, lon: number, alt: number,
  headingDeg: number, speedMs: number, minutes: number,
): { lat: number; lon: number; alt: number } {
  const dist = speedMs * minutes * 60
  const angular = dist / (EARTH_R + alt)
  const hdg = toRad(headingDeg)
  const lat1 = toRad(lat)
  const lon1 = toRad(lon)

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
    Math.cos(lat1) * Math.sin(angular) * Math.cos(hdg),
  )
  const lon2 = lon1 + Math.atan2(
    Math.sin(hdg) * Math.sin(angular) * Math.cos(lat1),
    Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
  )

  return { lat: lat2 * 180 / Math.PI, lon: lon2 * 180 / Math.PI, alt }
}

export class TrajectoryLayer extends BaseLayer {
  private segmentEntities: Cesium.Entity[] = []
  private waypointEntities: Cesium.Entity[] = []
  private trackedAssetId: string | null = null
  private removeTickListener: (() => void) | null = null

  constructor(viewer: Cesium.Viewer) {
    super(viewer, 'trajectory', 'Trajectory')
    this.createEntities()
  }

  private createEntities(): void {
    for (let i = 0; i < PREDICTION_MARKS.length; i++) {
      const segment = this.viewer.entities.add({
        polyline: {
          positions: [],
          width: 2,
          material: new Cesium.PolylineDashMaterialProperty({
            color: i === 0 ? ThemeColor.primary08 : SEGMENT_COLORS[i],
            dashLength: 16,
          }),
        },
        show: false,
      })
      this.segmentEntities.push(segment)

      const waypoint = this.viewer.entities.add({
        position: Cesium.Cartesian3.ZERO,
        point: {
          pixelSize: 6,
          color: SEGMENT_COLORS[i],
          outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: this.createLabel(`+${PREDICTION_MARKS[i]}m`, {
          fillColor: SEGMENT_COLORS[i],
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -8),
        }),
        show: false,
      })
      this.waypointEntities.push(waypoint)
    }
  }

  load(_assets: Asset[]): void {
  }

  setSelectedAsset(asset: Asset | null): void {
    if (!asset || (asset.type !== 'fixed-wing' && asset.type !== 'rotary-wing' && asset.type !== 'maritime' && asset.type !== 'satellite')) {
      this.hideTrajectory()
      return
    }
    this.trackedAssetId = asset.id
    this.updateTrajectory(asset)
    this.startTick()
  }

  destroy(): void {
    this.hideTrajectory()
    super.destroy()
  }

  private updateTrajectory(asset: Asset): void {
    for (let i = 0; i < PREDICTION_MARKS.length; i++) {
      const pos = predict(
        asset.latitude, asset.longitude, asset.altitude,
        asset.heading, asset.speed, PREDICTION_MARKS[i],
      )

      const prev = i === 0
        ? { lat: asset.latitude, lon: asset.longitude, alt: asset.altitude }
        : predict(
            asset.latitude, asset.longitude, asset.altitude,
            asset.heading, asset.speed, PREDICTION_MARKS[i - 1],
          )

      const prevPos = Cesium.Cartesian3.fromDegrees(prev.lon, prev.lat, prev.alt, Cesium.Ellipsoid.WGS84, SCRATCH_PREV)
      const currPos = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt, Cesium.Ellipsoid.WGS84, SCRATCH_CURR)

      const segment = this.segmentEntities[i]
      segment.polyline!.positions = [prevPos.clone(), currPos.clone()] as unknown as Cesium.Property
      segment.show = true

      const waypoint = this.waypointEntities[i]
      waypoint.position = new Cesium.ConstantPositionProperty(currPos.clone())
      waypoint.show = true
    }
  }

  private startTick(): void {
    this.stopTick()
    this.removeTickListener = this.viewer.scene.preRender.addEventListener(() => {
      this.tick()
    })
  }

  private stopTick(): void {
    if (this.removeTickListener) {
      this.removeTickListener()
      this.removeTickListener = null
    }
  }

  private tick(): void {
    if (!this.trackedAssetId) return

    const state = useAppStore.getState()
    const asset = state.assetData.find((a) => a.id === this.trackedAssetId)
    if (!asset) return

    this.updateTrajectory(asset)
  }

  private hideTrajectory(): void {
    this.stopTick()
    for (const e of this.segmentEntities) e.show = false
    for (const e of this.waypointEntities) e.show = false
    this.trackedAssetId = null
  }
}
