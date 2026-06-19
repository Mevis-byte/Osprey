import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import { groundStations } from '@/mock-data'
import type { Asset } from '@/types'
import { MARKER_ICONS, STATION_LABEL_DISTANCE } from './label-styles'
import { ThemeColor } from './theme-colors'

export class GroundStationLayer extends BaseLayer {
  constructor(viewer: Cesium.Viewer) {
    super(viewer, 'ground-stations', 'Ground Stations')
  }

  load(_assets: Asset[]): void {
    this.clear()

    for (const station of groundStations) {
      const position = Cesium.Cartesian3.fromDegrees(
        station.longitude,
        station.latitude,
        station.altitude,
      )

      const labelText = new Cesium.CallbackProperty(() => {
        const isHovered = this.hoveredId === station.id
        const isSelected = this.highlightedId === station.id
        if (isHovered || isSelected) {
          return `[ ${station.name.toUpperCase()} ]\nNODE: ${station.id}\nOP: ${station.operator}`
        }
        return station.name
      }, false)

      const entity = this.viewer.entities.add({
        id: station.id,
        name: station.name,
        position,
        billboard: this.createMarker(MARKER_ICONS.groundStation),
        label: this.createLabel(labelText, {
          fillColor: ThemeColor.warning,
          distanceDisplayCondition: STATION_LABEL_DISTANCE,
        }),
        properties: {
          type: 'ground-station',
          status: station.status,
          operator: station.operator,
          country: station.country,
        },
      })

      this.entities.push(entity)
    }
  }

  updatePositions(_assets: Asset[]): void {
    // Ground stations are stationary
  }
}
