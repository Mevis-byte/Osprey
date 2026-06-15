import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import type { Asset, Satellite } from '@/types'

function isSatellite(asset: Asset): asset is Satellite {
  return asset.type === 'satellite'
}

const SATELLITE_COLOR = Cesium.Color.fromCssColorString('#fbbf24')

export class SatelliteLayer extends BaseLayer {
  load(assets: Asset[]): void {
    this.clear()

    for (const asset of assets) {
      if (!isSatellite(asset)) continue

      const position = Cesium.Cartesian3.fromDegrees(
        asset.longitude,
        asset.latitude,
        asset.altitude,
      )

      const entity = this.viewer.entities.add({
        id: asset.id,
        name: asset.name,
        position,
        point: this.createPoint(SATELLITE_COLOR),
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
