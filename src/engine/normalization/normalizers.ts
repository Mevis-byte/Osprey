import { type DataQuality, type EntityBase, type EntityType, type GeoPosition, type GeoVelocity } from '../core/types'

// ── TLE → EntityBase ──

export interface TLEEntry {
  name: string
  line1: string
  line2: string
}

function tleToPosition(line2: string): GeoPosition {
  const inclination = parseFloat(line2.substring(8, 16))
  const raan = parseFloat(line2.substring(17, 25))
  const argPerigee = parseFloat(line2.substring(34, 42))
  const meanAnomaly = parseFloat(line2.substring(43, 51))
  const meanMotion = parseFloat(line2.substring(52, 63))

  const mu = 3.986004418e14
  const earthRadius = 6_371_000
  const n = meanMotion * 2 * Math.PI / 86400
  const a = Math.cbrt(mu / (n * n))
  const alt = a - earthRadius

  return {
    lat: inclination * 0.5,
    lon: (raan + argPerigee + meanAnomaly) % 360,
    alt,
  }
}

function tleToVelocity(line1: string): GeoVelocity {
  const bstar = parseFloat('0.' + line1.substring(53, 59)) * Math.pow(10, parseInt(line1.substring(59, 61)))
  return {
    speed: Math.abs(bstar) * 1000,
    heading: 0,
    verticalSpeed: 0,
  }
}

export function normalizeTLE(noradId: string, tle: TLEEntry, quality: DataQuality = 'cached'): EntityBase {
  const epochStr = tle.line1.substring(18, 32)
  const epoch = parseTLEEpoch(epochStr)
  const typeMap: Record<string, EntityType> = {
    'ISS': 'satellite',
    'STARLINK': 'satellite',
    'GPS': 'satellite',
    'GALILEO': 'satellite',
  }
  const prefix = tle.name.trim().split(' ')[0].toUpperCase()
  const entityType = typeMap[prefix] ?? 'satellite'

  return {
    id: `sat-${noradId}`,
    type: entityType,
    name: tle.name.trim(),
    position: tleToPosition(tle.line2),
    velocity: tleToVelocity(tle.line1),
    status: 'active',
    source: {
      provider: 'celestrak',
      lastUpdated: epoch,
      refreshInterval: 86400,
      quality,
      confidence: 0.85,
    },
    metadata: {
      noradId,
      epoch,
      inclination: parseFloat(tle.line2.substring(8, 16)),
      raan: parseFloat(tle.line2.substring(17, 25)),
      eccentricity: parseFloat('0.' + tle.line1.substring(26, 33)),
      argPerigee: parseFloat(tle.line2.substring(34, 42)),
      meanAnomaly: parseFloat(tle.line2.substring(43, 51)),
      meanMotion: parseFloat(tle.line2.substring(52, 63)),
      bstar: parseFloat('0.' + tle.line1.substring(53, 59)) * Math.pow(10, parseInt(tle.line1.substring(59, 61))),
      orbitClass: altToOrbitClass(tleToPosition(tle.line2).alt),
    },
  }
}

function parseTLEEpoch(epoch: string): number {
  const year = parseInt('20' + epoch.substring(0, 2))
  const dayOfYear = parseFloat(epoch.substring(2))
  const date = new Date(year, 0)
  date.setDate(date.getDate() + Math.floor(dayOfYear))
  return date.getTime()
}

function altToOrbitClass(altM: number): string {
  const h = altM / 1000
  if (h < 200) return 'unknown'
  if (h < 2000) return 'LEO'
  if (h < 20000) return 'MEO'
  if (h < 40000) return 'GEO'
  return 'HEO'
}

// ── AIS → EntityBase ──

export interface AISEntry {
  mmsi: string
  name: string
  lat: number
  lon: number
  speed: number
  heading: number
  cog: number
  sog: number
  destination?: string
}

export function normalizeAIS(entry: AISEntry): EntityBase {
  return {
    id: `mar-${entry.mmsi}`,
    type: 'maritime',
    name: entry.name || `Vessel ${entry.mmsi}`,
    position: { lat: entry.lat, lon: entry.lon, alt: 0 },
    velocity: { speed: entry.sog, heading: entry.cog, verticalSpeed: 0 },
    status: entry.sog > 0.5 ? 'under-way' : 'moored',
    source: {
      provider: 'ais-stream',
      lastUpdated: Date.now(),
      refreshInterval: 60,
      quality: 'live',
      confidence: 0.9,
    },
    metadata: {
      mmsi: entry.mmsi,
      cog: entry.cog,
      sog: entry.sog,
      destination: entry.destination,
    },
  }
}

// ── ADS-B → EntityBase ──

export interface ADSBEntry {
  icao24: string
  flight: string
  lat: number
  lon: number
  altitude: number
  velocity: number
  heading: number
  verticalRate: number
  squawk?: string
}

export function normalizeADSB(entry: ADSBEntry): EntityBase {
  return {
    id: `ac-${entry.icao24}`,
    type: 'aircraft',
    name: entry.flight || `Aircraft ${entry.icao24}`,
    position: { lat: entry.lat, lon: entry.lon, alt: entry.altitude },
    velocity: { speed: entry.velocity, heading: entry.heading, verticalSpeed: entry.verticalRate },
    status: entry.altitude > 0 ? 'airborne' : 'grounded',
    source: {
      provider: 'adsb-exchange',
      lastUpdated: Date.now(),
      refreshInterval: 5,
      quality: 'live',
      confidence: 0.95,
    },
    metadata: {
      icao24: entry.icao24,
      squawk: entry.squawk,
    },
  }
}
