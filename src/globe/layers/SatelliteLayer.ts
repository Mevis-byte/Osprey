import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import type { Asset, Satellite } from '@/types'
import { SATELLITE_LABEL_DISTANCE } from './label-styles'
import { ThemeColor } from './theme-colors'

function isSatellite(asset: Asset): asset is Satellite {
  return asset.type === 'satellite'
}

export class SatelliteLayer extends BaseLayer {
  constructor(viewer: Cesium.Viewer) {
    super(viewer, 'satellite', 'Satellite')
  }

  load(assets: Asset[]): void {
    this.clear()

    for (const asset of assets) {
      if (!isSatellite(asset)) continue

      const position = Cesium.Cartesian3.fromDegrees(
        asset.longitude,
        asset.latitude,
        asset.altitude,
      )

      const labelText = new Cesium.CallbackProperty(() => {
        const isHovered = this.hoveredId === asset.id
        const isSelected = this.highlightedId === asset.id
        if (isHovered || isSelected) {
          return `[ ${asset.name.toUpperCase()} ]\nALT: ${(asset.altitude / 1000).toFixed(0)} KM\nSPD: ${asset.speed.toFixed(1)} KM/S`
        }
        return ''
      }, false)

      const entity = this.viewer.entities.add({
        id: asset.id,
        name: asset.name,
        position,
        point: new Cesium.PointGraphics({
          pixelSize: 14,
          color: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          scaleByDistance: new Cesium.NearFarScalar(1.0e6, 1.3, 3.0e7, 0.3),
          disableDepthTestDistance: 0,
        }),
        label: this.createLabel(labelText, {
          fillColor: Cesium.Color.WHITE,
          showBackground: false,
          distanceDisplayCondition: SATELLITE_LABEL_DISTANCE,
        }),
        properties: {
          type: asset.type,
          noradId: asset.noradId,
          inclination: asset.inclination,
          period: asset.period,
          apogee: asset.apogee,
          perigee: asset.perigee,
        },
      })

      this.entities.push(entity)
    }
  }

  setHighlight(entityId: string | null): void {
    if (this.highlightedId === entityId) return

    if (this.highlightedId) {
      const prev = this.entities.find((e) => e.id === this.highlightedId)
      if (prev?.point) {
        prev.point.color = Cesium.Color.WHITE as unknown as Cesium.Property
        prev.point.outlineColor = Cesium.Color.BLACK as unknown as Cesium.Property
      }
    }

    this.highlightedId = entityId

    if (entityId) {
      const next = this.entities.find((e) => e.id === entityId)
      if (next?.point) {
        next.point.color = Cesium.Color.WHITE as unknown as Cesium.Property
        next.point.outlineColor = ThemeColor.success as unknown as Cesium.Property
      }
    }
  }
}
