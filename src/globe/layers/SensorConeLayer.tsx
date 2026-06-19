import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import { useAppStore } from '@/store'
import type { Asset, Satellite } from '@/types'
import { ThemeColor } from './theme-colors'

const SCRATCH_SAT = new Cesium.Cartesian3()
const SCRATCH_EARTH = new Cesium.Cartesian3()
const SCRATCH_MID = new Cesium.Cartesian3()
const SCRATCH_MATRIX = new Cesium.Matrix4()
const SCRATCH_SCALE = new Cesium.Cartesian3()

function isSatellite(asset: Asset): asset is Satellite {
  return asset.type === 'satellite'
}

export class SensorConeLayer extends BaseLayer {
  private conePrimitive: Cesium.Primitive | null = null
  private trackedSatelliteId: string | null = null
  private removeTickListener: (() => void) | null = null

  constructor(viewer: Cesium.Viewer) {
    super(viewer, 'sensor-cone', 'Sensor Cone')
    this.buildCone()
  }

  private buildCone(): void {
    const geometry = Cesium.CylinderGeometry.createGeometry(new Cesium.CylinderGeometry({
      length: 2,
      topRadius: 0,
      bottomRadius: 1,
      slices: 64,
      vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
    }))
    if (!geometry) return

    this.conePrimitive = this.viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({ geometry }),
        appearance: new Cesium.MaterialAppearance({
          material: Cesium.Material.fromType('Color'),
          translucent: true,
          closed: false,
        }),
        asynchronous: false,
        show: false,
      }),
    )

    if (this.conePrimitive) {
      const app = this.conePrimitive.appearance as Cesium.MaterialAppearance
      app.material.uniforms.color = ThemeColor.sensorCone
    }
  }

  load(assets: Asset[]): void {
    this.clear()
  }

  setSelectedAsset(asset: Asset | null): void {
    if (!asset || !isSatellite(asset)) {
      this.hideCone()
      return
    }

    if (asset.altitude <= 0) {
      this.hideCone()
      return
    }

    this.trackedSatelliteId = asset.id
    if (this.conePrimitive) {
      this.conePrimitive.show = true
    }
    this.startTick()
  }

  destroy(): void {
    this.hideCone()
    if (this.conePrimitive) {
      this.viewer.scene.primitives.remove(this.conePrimitive)
      this.conePrimitive = null
    }
    super.destroy()
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
    if (!this.conePrimitive || !this.trackedSatelliteId) return

    const state = useAppStore.getState()
    const asset = state.assetData.find((a) => a.id === this.trackedSatelliteId)
    if (!asset) return

    const alt = asset.altitude
    const halfAngleRad = Cesium.Math.toRadians(45)
    const baseRadius = alt * Math.tan(halfAngleRad)

    Cesium.Cartesian3.fromDegrees(
      asset.longitude, asset.latitude, alt,
      Cesium.Ellipsoid.WGS84, SCRATCH_SAT,
    )
    Cesium.Cartesian3.fromDegrees(
      asset.longitude, asset.latitude, 0,
      Cesium.Ellipsoid.WGS84, SCRATCH_EARTH,
    )

    Cesium.Cartesian3.midpoint(SCRATCH_SAT, SCRATCH_EARTH, SCRATCH_MID)

    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(SCRATCH_MID)
    SCRATCH_SCALE.x = baseRadius
    SCRATCH_SCALE.y = alt / 2
    SCRATCH_SCALE.z = baseRadius
    const scale = Cesium.Matrix4.fromScale(SCRATCH_SCALE, new Cesium.Matrix4())
    Cesium.Matrix4.multiply(transform, scale, SCRATCH_MATRIX)
    this.conePrimitive.modelMatrix = SCRATCH_MATRIX.clone(this.conePrimitive.modelMatrix)
  }

  private hideCone(): void {
    this.stopTick()
    if (this.conePrimitive) {
      this.conePrimitive.show = false
    }
    this.trackedSatelliteId = null
  }
}
