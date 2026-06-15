import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import type { Asset, Aircraft } from '@/types'

function isAircraft(asset: Asset): asset is Aircraft {
  return asset.type === 'fixed-wing' || asset.type === 'rotary-wing'
}

const AIRCRAFT_COLOR = Cesium.Color.fromCssColorString('#22d3ee')

export class AircraftLayer extends BaseLayer {
  constructor(viewer: Cesium.Viewer) {
    super(viewer, 'aircraft', 'Aircraft')
  }

  load(assets: Asset[]): void {
    this.clear()

    for (const asset of assets) {
      if (!isAircraft(asset)) continue

      const position = Cesium.Cartesian3.fromDegrees(
        asset.longitude,
        asset.latitude,
        asset.altitude,
      )

      const entity = this.viewer.entities.add({
        id: asset.id,
        name: asset.name,
        position,
        point: this.createPoint(AIRCRAFT_COLOR),
        label: this.createLabel(asset.name, {
          fillColor: AIRCRAFT_COLOR,
        }),
        properties: {
          type: asset.type,
          callsign: asset.callsign,
          speed: asset.speed,
          heading: asset.heading,
          altitude: asset.altitude,
          status: asset.status,
          fuelLevel: asset.fuelLevel,
        },
      })

      this.entities.push(entity)
    }
  }
}
