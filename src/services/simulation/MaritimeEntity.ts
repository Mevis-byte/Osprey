import { SimulationEntity } from './SimulationEntity'
import type { Waypoint } from './types'
import type { Asset, MaritimeAsset } from '@/types'

const KNOTS_TO_MS = 0.514444

function isMaritime(asset: Asset): asset is MaritimeAsset {
  return asset.type === 'maritime'
}

export class MaritimeEntity extends SimulationEntity {
  constructor(asset: Asset, route: Waypoint[]) {
    super(asset, route, 1, 0.3, 0, 1000, KNOTS_TO_MS)
  }

  update(dt: number): void {
    this.navigateToWaypoint(dt)
  }

  static isMaritime = isMaritime
}
