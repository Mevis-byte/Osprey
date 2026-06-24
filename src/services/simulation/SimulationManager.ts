import type { Asset } from '@/types'
import type { Waypoint } from './types'
import { SimulationEntity } from './SimulationEntity'
import { AircraftEntity } from './AircraftEntity'
import { MaritimeEntity } from './MaritimeEntity'
import { SatelliteEntity } from './SatelliteEntity'
import { HistoryTracker } from './HistoryTracker'
import type { HistoryPoint } from './HistoryTracker'
import { aircraftRoutes, maritimeRoutes } from './routes'
import { CelesTrakService } from '../CelesTrakService'

export interface PositionData {
  latitude: number
  longitude: number
  altitude: number
  speed: number
  heading: number
}

interface StoreUpdaters {
  setAssetData: (data: Asset[]) => void
  setTimelinePosition: (position: number) => void
}

export class SimulationManager {
  private entities: SimulationEntity[] = []
  private satellites: SatelliteEntity[] = []
  private lastTimestamp: number = 0
  private animFrameId: number | null = null
  private running = false
  private speed = 1
  private timelinePosition: number = Date.now()
  private storeUpdaters: StoreUpdaters | null = null
  private lastStoreUpdate = 0
  private readonly STORE_INTERVAL = 100
  private originalAssets: Map<string, Asset> = new Map()
  private positions: Map<string, PositionData> = new Map()
  private history: Map<string, HistoryTracker> = new Map()

  async initialize(assets: Asset[], timelinePosition: number, updaters: StoreUpdaters): Promise<void> {
    this.storeUpdaters = updaters
    this.timelinePosition = timelinePosition

    // Fetch TLE data before initializing satellites
    try {
      await CelesTrakService.getInstance().fetchAll()
    } catch {
      console.warn('[Simulation] TLE fetch failed — satellites will use fallback ephemeris')
    }

    this.originalAssets.clear()
    for (const asset of assets) {
      this.originalAssets.set(asset.id, { ...asset })
    }

    this.entities = []
    this.satellites = []

    for (const asset of assets) {
      if (AircraftEntity.isAircraft(asset)) {
        const route = aircraftRoutes.find((r) => r.id === asset.id)
        const waypoints: Waypoint[] = route?.waypoints ?? [
          { latitude: asset.latitude, longitude: asset.longitude, altitude: asset.altitude },
        ]
        this.entities.push(new AircraftEntity(asset, waypoints))
      } else if (MaritimeEntity.isMaritime(asset)) {
        const route = maritimeRoutes.find((r) => r.id === asset.id)
        const waypoints: Waypoint[] = route?.waypoints ?? [
          { latitude: asset.latitude, longitude: asset.longitude, altitude: 0 },
        ]
        this.entities.push(new MaritimeEntity(asset, waypoints))
      } else if (SatelliteEntity.isSatellite(asset)) {
        const sat = new SatelliteEntity(asset)
        sat.update(0, this.timelinePosition)
        this.satellites.push(sat)
      }
    }

    this.positions.clear()
    for (const entity of this.entities) {
      this.positions.set(entity.id, {
        latitude: entity.latitude,
        longitude: entity.longitude,
        altitude: entity.altitude,
        speed: entity.speed,
        heading: entity.heading,
      })
    }
    for (const sat of this.satellites) {
      this.positions.set(sat.id, {
        latitude: sat.latitude,
        longitude: sat.longitude,
        altitude: sat.altitude,
        speed: sat.speed,
        heading: sat.heading,
      })
    }

    this.history.clear()
    for (const asset of assets) {
      this.history.set(asset.id, new HistoryTracker())
    }
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTimestamp = performance.now()
    this.animFrameId = requestAnimationFrame(this.tick)
  }

  stop(): void {
    this.running = false
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  setSpeed(speed: number): void {
    this.speed = speed
  }

  getPositions(): Map<string, PositionData> {
    return this.positions
  }

  getAllHistory(): Map<string, readonly HistoryPoint[]> {
    const result = new Map<string, readonly HistoryPoint[]>()
    for (const [id, tracker] of this.history) {
      result.set(id, tracker.getPoints())
    }
    return result
  }

  getRemainingWaypointsMap(): Map<string, { currentLat: number; currentLon: number; remaining: readonly Waypoint[] }> {
    const result = new Map<string, { currentLat: number; currentLon: number; remaining: readonly Waypoint[] }>()
    for (const entity of this.entities) {
      const pos = this.positions.get(entity.id)
      if (pos) {
        result.set(entity.id, {
          currentLat: pos.latitude,
          currentLon: pos.longitude,
          remaining: entity.getRemainingWaypoints(),
        })
      }
    }
    return result
  }

  private tick = (timestamp: number): void => {
    if (!this.running) return

    const rawDt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1)
    this.lastTimestamp = timestamp

    const dt = rawDt * this.speed
    this.timelinePosition += rawDt * 1000 * this.speed

    for (const entity of this.entities) {
      entity.update(dt)
      this.positions.set(entity.id, {
        latitude: entity.latitude,
        longitude: entity.longitude,
        altitude: entity.altitude,
        speed: entity.speed,
        heading: entity.heading,
      })
      const tracker = this.history.get(entity.id)
      if (tracker) {
        tracker.update(rawDt, entity.latitude, entity.longitude, entity.altitude)
      }
    }

    for (const sat of this.satellites) {
      sat.update(dt, this.timelinePosition)
      this.positions.set(sat.id, {
        latitude: sat.latitude,
        longitude: sat.longitude,
        altitude: sat.altitude,
        speed: sat.speed,
        heading: sat.heading,
      })
      const tracker = this.history.get(sat.id)
      if (tracker) {
        tracker.update(rawDt, sat.latitude, sat.longitude, sat.altitude)
      }
    }

    if (timestamp - this.lastStoreUpdate >= this.STORE_INTERVAL) {
      this.lastStoreUpdate = timestamp
      this.pushToStore()
    }

    this.animFrameId = requestAnimationFrame(this.tick)
  }

  private pushToStore(): void {
    if (!this.storeUpdaters) return

    const updatedAssets: Asset[] = []

    for (const [id, original] of this.originalAssets) {
      const pos = this.positions.get(id)
      if (!pos) {
        updatedAssets.push(original)
        continue
      }

      const updated = {
        ...original,
        latitude: pos.latitude,
        longitude: pos.longitude,
        altitude: pos.altitude,
        speed: Math.round(pos.speed * 10) / 10,
        heading: Math.round(pos.heading * 10) / 10,
        lastUpdated: new Date().toISOString(),
      } as Asset

      updatedAssets.push(updated)
    }

    this.storeUpdaters.setAssetData(updatedAssets)
    this.storeUpdaters.setTimelinePosition(this.timelinePosition)
  }
}

let instance: SimulationManager | null = null

export function getSimulationManager(): SimulationManager {
  if (!instance) {
    instance = new SimulationManager()
  }
  return instance
}
