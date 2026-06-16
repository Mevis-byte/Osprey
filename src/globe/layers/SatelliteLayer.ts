import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import type { Asset, Satellite } from '@/types'
import { MARKER_ICONS } from './label-styles'

function isSatellite(asset: Asset): asset is Satellite {
  return asset.type === 'satellite'
}

const SATELLITE_COLOR = Cesium.Color.fromCssColorString('#fbbf24')

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
        return asset.name
      }, false)

      const entity = this.viewer.entities.add({
        id: asset.id,
        name: asset.name,
        position,
        billboard: this.createMarker(MARKER_ICONS.satellite),
        label: this.createLabel(labelText, {
          fillColor: SATELLITE_COLOR,
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
}
