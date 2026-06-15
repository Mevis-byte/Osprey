import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import type { Asset, MaritimeAsset } from '@/types'

function isMaritime(asset: Asset): asset is MaritimeAsset {
  return asset.type === 'maritime'
}

const MARITIME_COLOR = Cesium.Color.fromCssColorString('#4ade80')

export class MaritimeLayer extends BaseLayer {
  load(assets: Asset[]): void {
    this.clear()

    for (const asset of assets) {
      if (!isMaritime(asset)) continue

      const position = Cesium.Cartesian3.fromDegrees(
        asset.longitude,
        asset.latitude,
        0,
      )

      const entity = this.viewer.entities.add({
        id: asset.id,
        name: asset.name,
        position,
        point: this.createPoint(MARITIME_COLOR),
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
