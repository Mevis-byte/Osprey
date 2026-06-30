/**
 * Spatial Engine
 *
 * Central module for all geospatial calculations. No other module should
 * implement coordinate math, distance, coverage, or line-of-sight.
 *
 * All functions operate on simple numeric lat/lon/alt values.
 */

export const EARTH_RADIUS_KM = 6371
export const EARTH_RADIUS_M = 6_371_000
export const DEG2RAD = Math.PI / 180
export const RAD2DEG = 180 / Math.PI
export const SPEED_OF_LIGHT_KMS = 299_792

function toRad(d: number): number {
  return d * DEG2RAD
}

/** Great-circle distance between two points (km) */
export function greatCircleKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Haversine distance in meters */
export function greatCircleM(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  return greatCircleKm(lat1, lon1, lat2, lon2) * 1000
}

/** Initial bearing from point A to point B */
export function bearing(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLon = toRad(lon2 - lon1)
  const y = Math.sin(dLon) * Math.cos(toRad(lat2))
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon)
  return (Math.atan2(y, x) * RAD2DEG + 360) % 360
}

/** Destination point given start, bearing (deg), and distance (km) */
export function destination(
  lat: number, lon: number,
  bearingDeg: number,
  distKm: number,
): { lat: number; lon: number } {
  const brng = toRad(bearingDeg)
  const d = distKm / EARTH_RADIUS_KM
  const lat1 = toRad(lat)
  const lon1 = toRad(lon)
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
  )
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
  )
  return { lat: lat2 * RAD2DEG, lon: lon2 * RAD2DEG }
}

/** Ground coverage radius (km) from satellite altitude (m) */
export function coverageRadiusKm(altitudeMeters: number): number {
  const h = altitudeMeters / 1000
  if (h <= 0) return 0
  return EARTH_RADIUS_KM * Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + h))
}

/** Orbital period (minutes) for circular orbit */
export function orbitalPeriodMin(altitudeMeters: number): number {
  const h = altitudeMeters / 1000
  const a = (EARTH_RADIUS_KM + h) * 1000
  const mu = 3.986004418e14
  return 2 * Math.PI * Math.sqrt(a ** 3 / mu) / 60
}

/** Orbital velocity (m/s) for circular orbit */
export function orbitalVelocity(altitudeMeters: number): number {
  const r = EARTH_RADIUS_M + altitudeMeters
  const mu = 3.986004418e14
  return Math.sqrt(mu / r)
}

/** Orbit class based on altitude */
export function orbitClass(altitudeMeters: number): 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'unknown' {
  const h = altitudeMeters / 1000
  if (h < 200) return 'unknown'
  if (h < 2000) return 'LEO'
  if (h < 20000) return 'MEO'
  if (h < 40000) return 'GEO'
  return 'HEO'
}

/** One-way signal latency (ms) via satellite relay */
export function signalLatencyMs(
  gsLat: number, gsLon: number,
  satLat: number, satLon: number, satAlt: number,
  destLat: number, destLon: number,
): number {
  const up = greatCircleKm(gsLat, gsLon, satLat, satLon)
  const down = greatCircleKm(satLat, satLon, destLat, destLon)
  const totalKm = Math.sqrt(up ** 2 + (satAlt / 1000) ** 2) +
    Math.sqrt(down ** 2 + (satAlt / 1000) ** 2)
  return (totalKm / SPEED_OF_LIGHT_KMS) * 1000
}

/** Point-in-region check */
export function pointInBounds(
  lon: number, lat: number,
  bounds: [west: number, south: number, east: number, north: number],
): boolean {
  return lon >= bounds[0] && lon <= bounds[2] && lat >= bounds[1] && lat <= bounds[3]
}

/** Point inside a circular geofence */
export function pointInCircle(
  lat: number, lon: number,
  centerLat: number, centerLon: number,
  radiusKm: number,
): boolean {
  return greatCircleKm(lat, lon, centerLat, centerLon) <= radiusKm
}
