export interface Waypoint {
  latitude: number
  longitude: number
  altitude: number
  speed?: number
}

export interface Route {
  id: string
  waypoints: Waypoint[]
}

export interface HistoryPoint {
  latitude: number
  longitude: number
  altitude: number
  timestamp: number
}
