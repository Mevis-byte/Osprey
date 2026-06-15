import * as Cesium from 'cesium'
import { useAppStore } from '@/store'
import { groundStations } from '@/mock-data'
import type { Asset } from '@/types'
import { BaseLayer } from './BaseLayer'

const LINK_COLOR = Cesium.Color.fromCssColorString('#38bdf8')
const LINK_SELECTED_COLOR = Cesium.Color.fromCssColorString('#fbbf24')

function findSatellite(assetId: string): Asset | undefined {
  return useAppStore.getState().assetData.find((asset) => asset.id === assetId)
}

export class CommunicationLayer extends BaseLayer {
  private linkEntities: Cesium.Entity[] = []

  constructor(viewer: Cesium.Viewer) {
    super(viewer, 'communications', 'Communications')
  }

  load(_assets: Asset[]): void {
    this.clear()

    for (const station of groundStations) {
      for (const satelliteId of station.connectedSatelliteIds) {
        const entity = this.viewer.entities.add({
          name: `${station.id}-${satelliteId}`,
          polyline: {
            positions: new Cesium.CallbackProperty(() => {
              const asset = findSatellite(satelliteId)
              if (!asset) return []

              const stationPos = Cesium.Cartesian3.fromDegrees(
                station.longitude,
                station.latitude,
                station.altitude,
              )
              const satellitePos = Cesium.Cartesian3.fromDegrees(
                asset.longitude,
                asset.latitude,
                asset.altitude,
              )
              const mid = Cesium.Cartesian3.midpoint(
                stationPos,
                satellitePos,
                new Cesium.Cartesian3(),
              )
              mid.z += Math.max(asset.altitude * 0.18, 1000000)
              return [stationPos, mid, satellitePos]
            }, false),
            width: 1.8,
            material: new Cesium.PolylineGlowMaterialProperty({
              color: LINK_COLOR.withAlpha(0.55),
              glowPower: 0.12,
            }),
            clampToGround: false,
          },
          show: true,
        })
        this.linkEntities.push(entity)
      }
    }
  }

  updatePositions(_assets: Asset[]): void {}

  clear(): void {
    for (const entity of this.linkEntities) {
      this.viewer.entities.remove(entity)
    }
    this.linkEntities = []
  }

  setVisible(visible: boolean): void {
    this._visible = visible
    for (const entity of this.linkEntities) {
      entity.show = visible
    }
  }

  setHighlight(entityId: string | null): void {
    const selectedStationId = entityId && entityId.startsWith('GS-') ? entityId : null
    for (const entity of this.linkEntities) {
      const isSelected = selectedStationId !== null && entity.name?.startsWith(selectedStationId)
      const polyline = entity.polyline
      if (polyline) {
        polyline.material = new Cesium.PolylineGlowMaterialProperty({
          color: (isSelected ? LINK_SELECTED_COLOR : LINK_COLOR).withAlpha(isSelected ? 0.95 : 0.55),
          glowPower: isSelected ? 0.2 : 0.12,
        })
        polyline.width = new Cesium.ConstantProperty(isSelected ? 2.6 : 1.8)
      }
    }
  }
}
