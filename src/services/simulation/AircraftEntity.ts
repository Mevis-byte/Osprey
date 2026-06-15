import { SimulationEntity } from './SimulationEntity'
import type { Waypoint } from './types'
import type { Asset } from '@/types'
import type { Aircraft } from '@/types'

const KNOTS_TO_MS = 0.514444

function isAircraft(asset: Asset): asset is Aircraft {
  return asset.type === 'fixed-wing' || asset.type === 'rotary-wing'
}

export class AircraftEntity extends SimulationEntity {
  constructor(asset: Asset, route: Waypoint[]) {
    super(asset, route, 3, 2, 60, 5000, KNOTS_TO_MS)
  }

  update(dt: number): void {
    this.navigateToWaypoint(dt)
  }

  static isAircraft = isAircraft
}
