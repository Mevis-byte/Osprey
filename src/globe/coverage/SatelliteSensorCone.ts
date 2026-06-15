import * as Cesium from 'cesium'
import { useAppStore } from '@/store'

const SCRATCH_SAT = new Cesium.Cartesian3()
const SCRATCH_EARTH = new Cesium.Cartesian3()
const SCRATCH_MID = new Cesium.Cartesian3()
const SCRATCH_MATRIX = new Cesium.Matrix4()

const COLOR = Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.12)

export class SatelliteSensorCone {
  private viewer: Cesium.Viewer
  private primitive: Cesium.Primitive | null = null
  private removeListener: (() => void) | null = null
  private satelliteId: string | null = null
  private halfAngle: number

  constructor(viewer: Cesium.Viewer, halfAngleDeg: number = 45) {
    this.viewer = viewer
    this.halfAngle = Cesium.Math.toRadians(halfAngleDeg)
  }

  show(satelliteId: string): void {
    this.hide()
    this.satelliteId = satelliteId
    this.createCone()
    if (this.primitive) {
      this.removeListener = this.viewer.scene.preRender.addEventListener(() => {
        this.updatePosition()
      })
      this.viewer.scene.requestRender()
    }
  }

  hide(): void {
    if (this.removeListener) {
      this.removeListener()
      this.removeListener = null
    }
    if (this.primitive) {
      this.viewer.scene.primitives.remove(this.primitive)
      this.primitive = null
    }
    this.satelliteId = null
  }

  destroy(): void {
    this.hide()
  }

  private createCone(): void {
    if (!this.satelliteId) return
    const state = useAppStore.getState()
    const asset = state.assetData.find((a) => a.id === this.satelliteId)
    if (!asset || asset.altitude <= 0) return

    const alt = asset.altitude
    const baseRadius = alt * Math.tan(this.halfAngle)

    const geometry = Cesium.CylinderGeometry.createGeometry(new Cesium.CylinderGeometry({
      length: alt,
      topRadius: 0,
      bottomRadius: baseRadius,
      slices: 64,
      vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
    }))
    if (!geometry) return

    this.primitive = this.viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({ geometry }),
        appearance: new Cesium.MaterialAppearance({
          material: Cesium.Material.fromType('Color'),
          translucent: true,
          closed: false,
        }),
        asynchronous: false,
        show: true,
      }),
    )

    if (this.primitive) {
      const app = this.primitive.appearance as Cesium.MaterialAppearance
      app.material.uniforms.color = COLOR
    }
  }

  private updatePosition(): void {
    if (!this.primitive || !this.satelliteId) return

    const state = useAppStore.getState()
    const asset = state.assetData.find((a) => a.id === this.satelliteId)
    if (!asset) return

    Cesium.Cartesian3.fromDegrees(
      asset.longitude, asset.latitude, asset.altitude,
      Cesium.Ellipsoid.WGS84, SCRATCH_SAT,
    )
    Cesium.Cartesian3.fromDegrees(
      asset.longitude, asset.latitude, 0,
      Cesium.Ellipsoid.WGS84, SCRATCH_EARTH,
    )

    Cesium.Cartesian3.midpoint(SCRATCH_SAT, SCRATCH_EARTH, SCRATCH_MID)

    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(SCRATCH_MID)
    this.primitive.modelMatrix = Cesium.Matrix4.clone(transform, SCRATCH_MATRIX)
  }
}
