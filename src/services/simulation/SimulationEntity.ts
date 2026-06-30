import type { Asset } from '@/types'
import { DEG2RAD, RAD2DEG, EARTH_RADIUS } from '@/lib/constants'
import type { Waypoint } from './types'


export abstract class SimulationEntity {
  id: string
  latitude: number
  longitude: number
  altitude: number
  speed: number
  heading: number
  protected route: Waypoint[]
  protected waypointIndex: number
  protected targetSpeed: number
  protected targetHeading: number
  protected readonly turnRate: number
  protected readonly acceleration: number
  protected readonly climbRate: number
  protected readonly arrivalThreshold: number
  protected readonly speedConversion: number

  constructor(
    asset: Asset,
    route: Waypoint[],
    turnRate: number,
    acceleration: number,
    climbRate: number,
    arrivalThreshold: number,
    speedConversion: number,
  ) {
    this.id = asset.id
    this.latitude = asset.latitude
    this.longitude = asset.longitude
    this.altitude = asset.altitude
    this.speed = asset.speed
    this.heading = asset.heading
    this.route = route
    this.waypointIndex = 0
    this.turnRate = turnRate
    this.acceleration = acceleration
    this.climbRate = climbRate
    this.arrivalThreshold = arrivalThreshold
    this.speedConversion = speedConversion
    this.targetSpeed = route[0]?.speed ?? this.speed
    this.targetHeading = route.length > 1 ? this.bearingTo(route[1]) : this.heading

    if (route.length > 1) {
      this.waypointIndex = 1
    }
  }

  abstract update(dt: number): void

  protected navigateToWaypoint(dt: number): void {
    if (this.route.length < 2) return

    if (this.hasArrivedAt(this.route[this.waypointIndex])) {
      this.waypointIndex = (this.waypointIndex + 1) % this.route.length
    }

    const wp = this.route[this.waypointIndex]
    this.targetHeading = this.bearingTo(wp)
    if (wp.speed !== undefined) this.targetSpeed = wp.speed

    this.updateHeading(dt)
    this.updateSpeed(dt)
    this.moveForward(dt)
    this.adjustAltitude(dt, wp.altitude)
  }

  private updateHeading(dt: number): void {
    let diff = this.targetHeading - this.heading
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360

    const maxDelta = this.turnRate * dt
    if (Math.abs(diff) <= maxDelta) {
      this.heading = this.targetHeading
    } else {
      this.heading += Math.sign(diff) * maxDelta
    }
    this.heading = (this.heading + 360) % 360
  }

  private updateSpeed(dt: number): void {
    const diff = this.targetSpeed - this.speed
    const maxDelta = this.acceleration * dt
    if (Math.abs(diff) <= maxDelta) {
      this.speed = this.targetSpeed
    } else {
      this.speed += Math.sign(diff) * maxDelta
    }
  }

  private moveForward(dt: number): void {
    const speedMs = this.speed * this.speedConversion
    const distance = speedMs * dt
    const angularDist = distance / EARTH_RADIUS

    const headingRad = this.heading * DEG2RAD
    const latRad = this.latitude * DEG2RAD
    const lonRad = this.longitude * DEG2RAD

    const sinLat = Math.sin(latRad)
    const cosLat = Math.cos(latRad)
    const sinAng = Math.sin(angularDist)
    const cosAng = Math.cos(angularDist)

    const newLatRad = Math.asin(
      Math.max(-1, Math.min(1, sinLat * cosAng + cosLat * sinAng * Math.cos(headingRad))),
    )

    const newLonRad = lonRad + Math.atan2(
      Math.sin(headingRad) * sinAng * cosLat,
      cosAng - sinLat * Math.sin(newLatRad),
    )

    this.latitude = newLatRad * RAD2DEG
    this.longitude = ((newLonRad * RAD2DEG) + 540) % 360 - 180
  }

  private adjustAltitude(dt: number, target: number): void {
    const diff = target - this.altitude
    const maxDelta = this.climbRate * dt
    if (Math.abs(diff) <= maxDelta) {
      this.altitude = target
    } else {
      this.altitude += Math.sign(diff) * maxDelta
    }
  }

  protected hasArrivedAt(waypoint: Waypoint): boolean {
    const dLat = (waypoint.latitude - this.latitude) * DEG2RAD
    const dLon = (waypoint.longitude - this.longitude) * DEG2RAD
    const latRad = this.latitude * DEG2RAD
    const wpLatRad = waypoint.latitude * DEG2RAD

    const a = Math.sin(dLat / 2) ** 2 + Math.cos(latRad) * Math.cos(wpLatRad) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return EARTH_RADIUS * c < this.arrivalThreshold
  }

  protected bearingTo(waypoint: Waypoint): number {
    const lat1 = this.latitude * DEG2RAD
    const lon1 = this.longitude * DEG2RAD
    const lat2 = waypoint.latitude * DEG2RAD
    const lon2 = waypoint.longitude * DEG2RAD

    const dLon = lon2 - lon1
    const y = Math.sin(dLon) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

    return (Math.atan2(y, x) * RAD2DEG + 360) % 360
  }

  getRemainingWaypoints(): Waypoint[] {
    if (this.route.length < 2) return []
    const remaining = this.route.slice(this.waypointIndex)
    const before = this.route.slice(0, this.waypointIndex)
    return [...remaining, ...before]
  }
}
