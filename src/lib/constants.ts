/**
 * Shared constants for the OSPREY application.
 * Centralized to avoid duplication across the codebase.
 */

/** WGS84 Earth equatorial radius in meters */
export const EARTH_RADIUS = 6_371_000

/** WGS84 Earth equatorial radius in kilometers */
export const EARTH_RADIUS_KM = 6_371

/** WGS84 Earth semi-major axis in meters (ellipsoid equatorial radius) */
export const EARTH_SEMI_MAJOR = 6_378_137

/** Degrees to radians conversion factor */
export const DEG2RAD = Math.PI / 180

/** Radians to degrees conversion factor */
export const RAD2DEG = 180 / Math.PI

/** Seconds in a day for orbital period calculations */
export const SECONDS_PER_DAY = 86_400

/** Default simulation tick interval in seconds */
export const SIMULATION_DT = 0.016

/** Maximum number of history points per asset trail */
export const MAX_TRAIL_POINTS = 500

/** History recording interval in seconds */
export const HISTORY_INTERVAL = 0.5

/** Maximum items in feed data / alerts (FIFO cap) */
export const MAX_FEED_ITEMS = 200

/** Seen-IDs TTL in milliseconds for event deduplication */
export const SEEN_IDS_TTL = 60_000

/** Default sensor half-angle in degrees */
export const SENSOR_HALF_ANGLE_DEG = 45
