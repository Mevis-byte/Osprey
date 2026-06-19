import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import type { Asset, MaritimeAsset } from '@/types'
import { MARKER_ICONS, MARITIME_LABEL_DISTANCE } from './label-styles'
import { ThemeColor } from './theme-colors'

function isMaritime(asset: Asset): asset is MaritimeAsset {
  return asset.type === 'maritime'
}

export class MaritimeLayer extends BaseLayer {
  constructor(viewer: Cesium.Viewer) {
    super(viewer, 'maritime', 'Maritime')
  }

  load(assets: Asset[]): void {
    this.clear()

    for (const asset of assets) {
      if (!isMaritime(asset)) continue

      const position = Cesium.Cartesian3.fromDegrees(
        asset.longitude,
        asset.latitude,
        0,
      )

      const labelText = new Cesium.CallbackProperty(() => {
        const isHovered = this.hoveredId === asset.id
        const isSelected = this.highlightedId === asset.id
        if (isHovered || isSelected) {
          return `[ ${asset.name.toUpperCase()} ]\nSPD: ${asset.speed.toFixed(1)} KTS\nDEST: ${asset.destination || 'UNKNOWN'}`
        }
        return asset.name
      }, false)

      const entity = this.viewer.entities.add({
        id: asset.id,
        name: asset.name,
        position,
        billboard: this.createMarker(MARKER_ICONS.maritime),
        label: this.createLabel(labelText, {
          fillColor: ThemeColor.success,
          distanceDisplayCondition: MARITIME_LABEL_DISTANCE,
        }),
        properties: {
          type: asset.type,
          mmsi: asset.mmsi,
          speed: asset.speed,
          heading: asset.heading,
          draft: asset.draft,
          destination: asset.destination,
        },
      })

      this.entities.push(entity)
    }
  }
}
