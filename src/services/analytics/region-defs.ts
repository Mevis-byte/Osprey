export interface RegionBounds {
  minLon: number
  minLat: number
  maxLon: number
  maxLat: number
}

export interface RegionDef {
  key: string
  name: string
  bounds: RegionBounds[]
}

export const REGIONS: RegionDef[] = [
  {
    key: 'north-atlantic',
    name: 'North Atlantic',
    bounds: [
      { minLon: -80, minLat: 25, maxLon: -10, maxLat: 72 },
    ],
  },
  {
    key: 'indian-ocean',
    name: 'Indian Ocean',
    bounds: [
      { minLon: 25, minLat: -60, maxLon: 120, maxLat: 30 },
    ],
  },
  {
    key: 'pacific',
    name: 'Pacific',
    bounds: [
      { minLon: 105, minLat: -60, maxLon: 180, maxLat: 65 },
      { minLon: -180, minLat: -60, maxLon: -100, maxLat: 65 },
    ],
  },
  {
    key: 'mediterranean',
    name: 'Mediterranean',
    bounds: [
      { minLon: -5, minLat: 30, maxLon: 37, maxLat: 48 },
    ],
  },
]

export function pointInRegion(lat: number, lon: number, region: RegionDef): boolean {
  for (const b of region.bounds) {
    if (lon >= b.minLon && lon <= b.maxLon && lat >= b.minLat && lat <= b.maxLat) {
      return true
    }
  }
  return false
}

export function getRegionForPoint(lat: number, lon: number, type?: string): string | null {
  if (type === 'satellite') return null
  for (const region of REGIONS) {
    if (pointInRegion(lat, lon, region)) {
      return region.key
    }
  }
  return null
}
