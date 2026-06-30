import * as satellite from 'satellite.js'
import { DEG2RAD, RAD2DEG, EARTH_RADIUS } from '@/lib/constants'
import type { Asset, Satellite } from '@/types'
import { CelesTrakService } from '../CelesTrakService'

const EARTH_RATE = 7.2921159e-5
const GM = 3.986004418e14

function isSatellite(asset: Asset): asset is Satellite {
  return asset.type === 'satellite'
}

export class SatelliteEntity {
  id: string
  latitude: number
  longitude: number
  altitude: number
  speed: number
  heading: number
  private inclination: number
  private orbitalRate: number
  private phase: number
  private ascendingNode: number
  private prevLatitude: number
  private prevLongitude: number
  private satrec: satellite.SatRec | null = null

  constructor(asset: Asset) {
    const sat = asset as Satellite
    this.id = sat.id
    this.latitude = sat.latitude
    this.longitude = sat.longitude
    this.altitude = sat.altitude
    this.speed = sat.speed
    this.heading = sat.heading
    this.inclination = sat.inclination
    this.orbitalRate = (2 * Math.PI) / (sat.period * 60)
    this.ascendingNode = 0

    // Try to get TLE from CelesTrakService
    const tle = CelesTrakService.getInstance().getTLE(sat.noradId)
    if (tle) {
      this.satrec = satellite.twoline2satrec(tle.line1, tle.line2)
    }

    const incRad = sat.inclination * DEG2RAD
    const latRad = sat.latitude * DEG2RAD
    const phaseVal = Math.asin(Math.max(-1, Math.min(1, Math.sin(latRad) / Math.sin(incRad))))
    this.phase = isNaN(phaseVal) ? 0 : phaseVal

    const lonAtPhase = Math.atan2(Math.cos(incRad) * Math.sin(this.phase), Math.cos(this.phase))
    if (!isNaN(lonAtPhase)) {
      this.ascendingNode = sat.longitude * DEG2RAD - lonAtPhase
    }

    this.prevLatitude = sat.latitude
    this.prevLongitude = sat.longitude
  }

  update(dt: number, currentTime?: number): void {
    this.prevLatitude = this.latitude
    this.prevLongitude = this.longitude

    if (this.satrec) {
      const date = currentTime ? new Date(currentTime) : new Date()
      const positionAndVelocity = satellite.propagate(this.satrec, date)
      
      if (positionAndVelocity && 
          typeof positionAndVelocity.position !== 'boolean' && 
          typeof positionAndVelocity.velocity !== 'boolean') {
        
        const positionEci = positionAndVelocity.position
        const velocityEci = positionAndVelocity.velocity
        const gmst = satellite.gstime(date)
        const positionGd = satellite.eciToGeodetic(positionEci, gmst)

        this.longitude = satellite.degreesLong(positionGd.longitude)
        this.latitude = satellite.degreesLat(positionGd.latitude)
        this.altitude = positionGd.height * 1000 // Convert km to meters
        
        // Calculate speed from velocity vector
        const vx = velocityEci.x
        const vy = velocityEci.y
        const vz = velocityEci.z
        const speedKmS = Math.sqrt(vx * vx + vy * vy + vz * vz)
        this.speed = Math.round(speedKmS * 10) / 10 // km/s
      }
    } else {
      // Fallback to mock simulation
      this.phase += this.orbitalRate * dt
      if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI

      const incRad = this.inclination * DEG2RAD
      const latRad = Math.asin(Math.max(-1, Math.min(1, Math.sin(incRad) * Math.sin(this.phase))))
      this.latitude = latRad * RAD2DEG

      const lonRad = this.ascendingNode + Math.atan2(
        Math.cos(incRad) * Math.sin(this.phase),
        Math.cos(this.phase),
      ) - EARTH_RATE * (this.phase / this.orbitalRate)
      this.longitude = ((lonRad * RAD2DEG) + 540) % 360 - 180

      const r = (this.altitude + EARTH_RADIUS)
      const orbitalSpeed = Math.sqrt(GM / r)
      this.speed = Math.round(orbitalSpeed / 100) / 10
    }

    const bearing = this.bearingBetween(
      this.prevLatitude, this.prevLongitude,
      this.latitude, this.longitude,
    )
    if (!isNaN(bearing)) {
      this.heading = bearing
    }
  }

  private bearingBetween(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
  ): number {
    const dLon = (lon2 - lon1) * DEG2RAD
    const rLat1 = lat1 * DEG2RAD
    const rLat2 = lat2 * DEG2RAD

    const y = Math.sin(dLon) * Math.cos(rLat2)
    const x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon)

    return (Math.atan2(y, x) * RAD2DEG + 360) % 360
  }

  static isSatellite = isSatellite
}
