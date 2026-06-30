# Data Pipeline

Every external data source follows the same pipeline pattern.

## Pipeline Stages

```
External Source → Validation → Normalization → Caching → Processing → Derived Calculations → Rendering → UI
```

## TLE Satellite Pipeline

| Stage | Implementation | File |
|-------|---------------|------|
| External Source | `fetch()` from celestrak.org (`gp.php?GROUP=...&FORMAT=tle`) | `services/CelesTrakService.ts:71` |
| Validation | `response.ok` check; per-group HTTP status tracked via `FetchGroupStatus` | `services/CelesTrakService.ts:74-82` |
| Normalization | Line 1/2 parsing → `TLEData { name, line1, line2 }` | `services/CelesTrakService.ts:95-106` |
| Caching | `Map<string, TLEData>` keyed by NORAD ID; 24h TTL | `services/CelesTrakService.ts:16-17` |
| Processing | `satellite.twoline2satrec()` propagation → current lat/lon/alt | `services/simulation/SatelliteEntity.ts:44` |
| Derived Calculations | `coverageRadiusKm(h)`, `orbitalPeriodMin(h)`, `orbitClass(h)` | `services/analytics/compute.ts:25-60` |
| Rendering | Pre-created Cesium entities; positions via `Cartesian3.fromDegrees` with scratch pool | `globe/layers/SatelliteLayer.ts` |
| UI | LeftPanel satellite list; RightPanel detail; tooltip hover card | `layout/LeftPanel.tsx`, `layout/RightPanel.tsx` |

## Aircraft Simulation Pipeline

| Stage | Implementation |
|-------|---------------|
| Source | Static mock data (`mock-data/aircraft.ts`) with `dataQuality: 'simulated'` |
| Processing | `AircraftEntity.update(dt)`: waypoint-based navigation, speed/heading interpolation |
| Rendering | `AircraftLayer`: pre-created Cesium point entities, label with `AIRCRAFT_LABEL_DISTANCE` |
| Derived | `AlertManager.checkHighSpeed/checkRouteDeviation` on every 3s tick |

## Maritime Simulation Pipeline

| Stage | Implementation |
|-------|---------------|
| Source | Static mock data (`mock-data/maritime.ts`) with `dataQuality: 'simulated'` |
| Processing | `MaritimeEntity.update(dt)`: waypoint-based navigation |
| Rendering | `MaritimeLayer`: pre-created Cesium point entities |
| Derived | `AlertManager.checkLostContact` via haversine distance threshold |

## Event Pipeline

| Stage | Implementation |
|-------|---------------|
| Source | `AlertManager.tick()` → `dispatchAlert()` on every 3s interval |
| Validation | Cooldown check per asset per alert type (`canFire()`) |
| Normalization | Both `Alert` and `FeedEvent` created per trigger |
| Caching | Zustand store `feedData`/`alerts` capped at 200 entries (FIFO) |
| Rendering | `EventMarkerLayer.tick()`: preRender listener parses new events, spawns animated point+label+ring markers (10s lifetime) |
| UI | `LeftPanel` "Stream" tab with severity color coding, type filters, text search |

## Data Source Labeling

Every asset carries `dataSource: DataSourceInfo`:

```typescript
interface DataSourceInfo {
  source: string           // "CelesTrak", "OSPREY Simulation Engine", "OpenSky" (future)
  lastUpdated: string      // ISO 8601
  refreshRate: string      // "24h", "realtime", "static (simulated)"
  confidence: number       // 0-1
  dataQuality: DataQuality // 'live' | 'cached' | 'simulated' | 'fallback'
}
```

- **Live**: Real-time data from external API (future: OpenSky, AIS)
- **Cached**: Previously fetched live data (stale but known-good)
- **Simulated**: Deterministic simulation engine (current mock data)
- **Fallback**: Hardcoded defaults (ISS TLE in `CelesTrakService.FALLBACK_TLES`)
