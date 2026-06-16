# Session Summary — OSPREY

>>

## Goal

Build and polish a real‑time geospatial Cesium dashboard with satellite/maritime/aircraft tracking, a feed/intel pipeline, knowledge graph, and multi‑layer Cesium rendering.

## Constraints & Preferences

- React + TypeScript + Vite + Cesium (cesium-navigation-es6, resium)
- Zustand for state (no broad subscriptions — selectors only)
- Framer Motion for UI animation
- Tailwind CSS v4 (use `@apply` / utility classes; no `@layer` directives, avoid `config` export pattern)
- **DO NOT** commit, push, or create PRs unless explicitly told
- Never create README/docs files unless asked
- Keep Cesium entity/primitive reuse as #1 priority — avoid destroy+recreate cycles
- Every entity/primitive must be created once and toggled via `show`/`isShowing`

## Progress

### Done
1. **Zustand audit** — Verified all `useAppStore()` calls use granular selectors; zero broad subscriptions found. No changes required.
2. **Cesium overlay optimization** — Refactored 6 layers to reuse entities/primitives:
   - `SatelliteCoverageRings.ts` — 4 pre‑created rings, toggle `show`
   - `SatelliteCoverageGrid.ts` — Pre‑created entities, reuse on selection
   - `SatelliteSensorCone.ts` — Unit cone + modelMatrix scaling
   - `SensorConeLayer.tsx` — Same unit‑cone pattern
   - `TrajectoryLayer.ts` — 8 pre‑created entities, only update positions each tick
   - `ConstellationLayer.ts` — Pre‑created singleton MaterialProperty objects
3. **Memory audit** — Identified leaks:
   - `feedData` / `alerts` unbounded growth in Zustand → capped at 200
   - `EventMarkerLayer.seenIds` Set unbounded → changed to `Map<string, number>` with TTL pruning
   - `TacticalGridOverlay` destroy+recreate on hide/show → missing fix (needs pre‑creation)
   - `HeatmapLayer` 3MB canvas allocation per update → needs canvas reuse
   - `TrailRenderer` 20k allocations per render → needs pooling
4. **Build‑error triage** — Identified all TS errors across 12+ half‑implemented feature files (`GlobeViewer.tsx`, `LeftPanel.tsx`, `CommunicationLayer.ts`, `GroundStationLayer.ts`, `AssetHoverCard.tsx`, `LayerControlPanel.tsx`, `OperationalDashboard.tsx`, `TimelinePanel.tsx`, `RightPanel.tsx`).
5. **Advanced Tactical Geofencing & Range Ring System** — Implemented:
   - `Geofence` type in `src/types/index.ts`
   - 10 mock geofences at strategic military installations worldwide (`src/mock-data/geofences.ts`)
   - Store integration: `selectedGeofenceId`, `setSelectedGeofenceId`, `setGeofences` actions; `geofences: true` in `LayerVisibility`
   - `GeofenceLayer.ts` — 10 concentric rings (zone‑colored: red/orange/yellow/green), 12 radial spokes, 4 cardinal markers (N/E/S/W), per‑ring distance labels (SW quadrant), center point with name label, geodesic circle computation using local ENU frame and Gaussian radius of curvature, WGS84 ellipsoid surface projection
   - Layer toggle in `LayerControlPanel.tsx` (Shield icon)
   - Click interaction in `GlobeViewer.tsx` — picks geofence entities via `properties.geofenceId`

### In Progress
- Fixing remaining memory leaks:
  - TacticalGridOverlay: pre‑create and toggle
  - HeatmapLayer: reuse canvas
  - TrailRenderer: pool allocations
- Implementing feature areas (Label System Overhaul, Asset Type Differentiation, Atmosphere, Day/Night Terminator, Hover Cards, etc.)

### Blocked
- `CommunicationLayer.ts` — `dashOffset` property doesn't exist on Cesium `PolylineGraphics`. Need alternative approach for animated dashed lines (removed dashOffset, keeping static dashed lines).

## Key Decisions

- Use `Map<string, number>` with 60‑second TTL instead of unbounded `Set<string>` for seenIds
- Cap feedData/alerts at 200 entries (FIFO shift)
- Pre‑create Cesium entities/primitives in constructors, never in render/show
- `unitCone` pattern (unit geometry + modelMatrix scaling) for reusable sensor cones
- Label system extracted to `label-styles.ts` for consistent per‑asset-type styling
- `AppStore` flattened: `layerVisibility` object replaces individual booleans; `operationalMode` added

## Next Steps

1. Fix remaining memory leaks:
   - TacticalGridOverlay: pre‑create and toggle
   - HeatmapLayer: reuse canvas
   - TrailRenderer: pool allocations
3. Verify with `npm run build` and `npm run lint`
4. Implement feature areas (Label System Overhaul, Asset Type Differentiation, Atmosphere, Day/Night Terminator, Hover Cards, etc.)

## Critical Context

- The codebase has extensive **half‑implemented features** — someone already added GroundStationLayer, AssetHoverCard, LayerControlPanel, OperationalDashboard, TimelinePanel but left them with broken imports, missing types, and unused code.
- The store (`src/store/`) has already been updated with `layerVisibility`, `hoveredAsset`, `operationalMode` but old files still reference the old boolean properties.
- Cesium API is strict — not all entity properties support arbitrary custom properties (e.g., `dashOffset` on PolylineGraphics).
- `label-styles.ts` already exists with shared label configs and marker SVGs.

## Relevant Files / Key Locations

| Area | Path |
|---|---|
| Layout | `src/layout/` — LeftPanel, RightPanel, TimelinePanel, LayerControlPanel, OperationalDashboard |
| Globe layers | `src/globe/layers/` — per‑asset‑type layers + BaseLayer, label-styles |
| Globe | `src/globe/GlobeViewer.tsx` — main Cesium viewer orchestration |
| Store | `src/store/` — Zustand app‑store + slices |
| Types | `src/types/` — shared TypeScript types |
| Graph | `src/components/graph/` — knowledge‑graph workspace |
| Tooltip | `src/globe/tooltip/` — AssetHoverCard |
