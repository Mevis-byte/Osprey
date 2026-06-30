# OSPREY Architecture

## Overview

OSPREY is a real-time geospatial intelligence dashboard built on CesiumJS. It tracks satellites (via TLE ephemeris from celestrak.org), aircraft, maritime vessels, and ground stations on a 3D globe with multilayer rendering, event detection, knowledge graph integration, and investigation case management.

## Module Map

```
src/
  globe/            — CesiumJS rendering engine and all globe layers
    GlobeViewer.tsx   — Main orchestrator: viewer lifecycle, input, camera, layer coordination
    layers/           — 15+ layer implementations, each extending BaseLayer
    trails/           — TrailRenderer: asset trail/future-path visualization with Cartesian3 pooling
    heatmap/          — HeatmapLayer: canvas-based density rendering with reuse
    orbits/           — OrbitalPathRenderer: altitude-band-colored orbital tracks
    coverage/         — SatelliteCoverageRings, SatelliteCoverageGrid, SatelliteSensorCone
    grid/             — TacticalGridOverlay: pre-created entity grid with shared ColorMaterialProperty
    tooltip/          — AssetHoverCard, SatelliteTooltip: Cesium screen-space tooltips
  services/         — All non-UI logic
    simulation/       — SimulationManager, SimulationEntity, AircraftEntity, MaritimeEntity, SatelliteEntity, HistoryTracker
    alert/            — AlertManager: periodic asset checks (signal, speed, heading, contact, orbital)
    analytics/        — compute.ts: region analytics, coverage radius, orbital period, signal latency, great-circle distance
    CelesTrakService  — Singleton TLE fetcher with per-group status tracking
    ontology-reasoner — OWL-style classifier, relation inferrer, axiom validator
    ontology-graph    — Graphology metagraph builder from ontology class/relation definitions
    graph/            — Neo4j graph service (unused by UI, reserved for backend sync)
  store/            — Zustand stores
    app-store.ts      — Main store: assets, feed, alerts, missions, layerVisibility, sidebar, theme, projection
    case-store.ts     — Investigation case CRUD
    globe-store.ts    — Camera state (center, zoom, viewMode)
    ontology-store.ts — Ontology class/relation/axiom state
  types/            — All TypeScript interfaces: Asset, Satellite, Aircraft, MaritimeAsset, FeedEvent, Alert, etc.
  mock-data/        — Deterministic simulated asset data with labeled dataSource (dataQuality: 'simulated')
  components/       — Shared React components
    investigation/    — InvestigationPanel, CaseList, CaseDetail, CaseFormDialog
    ontology/         — OntologyPanel, ClassTree, PropertyTable, RelationGraph, ReasonerConsole
    ErrorBoundary.tsx — Class-component error boundary per panel
    ResizableSidebar  — Drag-resizable sidebar with pointer-capture + rAF throttling
    ThemeProvider     — 4-theme system (Tactical Blue, Black & Gold, Military Green, Monochrome)
    ViewModeSelector  — Globe/flat/space/analytics projection switcher
  layout/           — Application shell
    TopBar, LeftPanel, RightPanel, TimelinePanel, LayerControlPanel, OperationalDashboard, GlobalSearch
  hooks/            — useSimulation: app bootstrap (load assets, init sim, start alert polling)
  lib/              — constants.ts: EARTH_RADIUS, DEG2RAD, simulation parameters
  App.tsx           — Root layout: ResizableSidebar (left) | GlobeViewer | ResizableSidebar (right)
```

## Data Flow

```
celestrak.org (TLE)           mock-data/ (asset definitions)
        |                              |
  CelesTrakService               useSimulation hook
  (fetchAll, parseTLE,          (loads assets, inits
   cache, getTLE)                SimulationManager)
        |                              |
        +--------+---------------------+
                 |
          SimulationManager
          (tick: update positions
           via AircraftEntity,
           MaritimeEntity,
           SatelliteEntity with
           satellite.js TLE prop)
                 |
          Simulated asset positions
                 |
    +------------+-----------------+
    |            |                 |
  globe/       AlertManager     TrailRenderer
  layers/     (3s tick: check   (pre-created
  (pre-created  signal, speed,    entities,
  entities,     heading,          Cartesian3 pool,
  toggle show)  contact loss)     clampToGround)
    |            |                 |
    +------------+-----------------+
                 |
          useAppStore Zustand
          (assetData, feedData,
           alerts, positions)
                 |
          React UI (LeftPanel,
          RightPanel, tooltips)
```

## Layer Architecture

Every layer extends `BaseLayer` and follows the pattern:

1. **Constructor**: store viewer reference, register ID/name
2. **load(assets)**: pre-create Cesium entities, set `show: false`
3. **updatePositions(assets)**: update positions in-place via `setValue`/`positions =`
4. **setHighlight(id)** / **setSelectedAsset(asset)**: toggle visual state
5. **setVisible(bool)**: toggle all entity visibility
6. **clear()**: remove entities from viewer

Critical rule: **never call `viewer.entities.add/remove` after `load()`**. All entities are pre-created. Visual state changes use `show`/`isShowing` properties only.

## Performance Architecture

| Concern | Solution |
|---------|----------|
| Object allocation | Module-level scratch Cartesian3/Matrix4 objects, dest-parameter overloads |
| Trail positions | `reusePositions()` pool: arrays truncated/extended in-place |
| Heatmap canvas | Single pre-allocated canvas reused across updates |
| Theme switching | Cesium Color objects mutated in-place via shared `ThemeColor` refs — zero entity recreation |
| Sidebar resize | ResizeObserver on `<main>` element → rAF-throttled `viewer.resize()` |
| Camera tracking | Pre-allocated `HeadingPitchRange`, re-used every frame |
| Communication links | Module-level scratch Cartesian3 array returned from CallbackProperty |
| Event markers | Pre-parsed severity Color map, deduplicated via `seenTimestamps` Map with TTL |
