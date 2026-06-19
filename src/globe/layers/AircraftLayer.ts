import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import type { Asset, Aircraft } from '@/types'
import { MARKER_ICONS, AIRCRAFT_LABEL_DISTANCE } from './label-styles'
import { ThemeColor } from './theme-colors'

function isAircraft(asset: Asset): asset is Aircraft {
  return asset.type === 'fixed-wing' || asset.type === 'rotary-wing'
}

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

      const labelText = new Cesium.CallbackProperty(() => {
        const isHovered = this.hoveredId === asset.id
        const isSelected = this.highlightedId === asset.id
        if (isHovered || isSelected) {
          return `[ ${asset.callsign.toUpperCase()} ]\nALT: ${asset.altitude.toLocaleString()} FT\nSPD: ${asset.speed.toFixed(0)} KTS`
        }
        return asset.callsign || asset.name
      }, false)

      const entity = this.viewer.entities.add({
        id: asset.id,
        name: asset.name,
        position,
        billboard: this.createMarker(MARKER_ICONS.aircraft),
        label: this.createLabel(labelText, {
          fillColor: ThemeColor.accent,
          distanceDisplayCondition: AIRCRAFT_LABEL_DISTANCE,
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
