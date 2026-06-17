import * as Cesium from 'cesium'
import { useAppStore } from '@/store'
import { groundStations } from '@/mock-data'
import type { Asset } from '@/types'
import { BaseLayer } from './BaseLayer'

const LINK_COLOR = Cesium.Color.fromCssColorString('#10b981')
const LINK_SELECTED_COLOR = Cesium.Color.fromCssColorString('#fbbf24')

function findSatellite(assetId: string): Asset | undefined {
  return useAppStore.getState().assetData.find((asset) => asset.id === assetId)
}

export class CommunicationLayer extends BaseLayer {
  private linkEntities: Cesium.Entity[] = []
  private selectedAssetId: string | null = null

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
            width: new Cesium.CallbackProperty(() => {
              return this.isPathActive(station.id, satelliteId) ? 1.5 : 1
            }, false),
              material: new Cesium.PolylineDashMaterialProperty({
                color: new Cesium.CallbackProperty(() => {
                  const isSelected = this.isPathActive(station.id, satelliteId)
                  const baseColor = isSelected ? LINK_SELECTED_COLOR : LINK_COLOR
                  return baseColor.withAlpha(isSelected ? 0.7 : 0.18)
                }, false),
                dashLength: 12,
                dashPattern: 255,
              }),
          },
          show: true,
        })
        
        this.linkEntities.push(entity)
      }
    }
  }

  private isPathActive(stationId: string, satelliteId: string): boolean {
    if (!this.selectedAssetId) return false
    return this.selectedAssetId === stationId || this.selectedAssetId === satelliteId
  }

  setSelectedAsset(asset: Asset | null): void {
    this.selectedAssetId = asset?.id ?? null
  }

  setHighlight(_entityId: string | null): void {
    // Handling selection via setSelectedAsset for network highlighting
  }

  clear(): void {
    for (const entity of this.linkEntities) {
      this.viewer.entities.remove(entity)
    }
    this.linkEntities = []
  }
}
