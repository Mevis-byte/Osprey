# Design Decisions

## 1. Pre-Create Entity Pattern (not destroy+recreate)

**Decision**: Every Cesium layer pre-creates all entities in `load()` and never calls `viewer.entities.add/remove` afterwards. Visual changes use `show = true/false`.

**Rationale**: Cesium's entity collection is not optimized for frequent add/remove. Each add triggers internal spatial index rebuilding and GPU resource allocation. Toggling `show` is a single property write.

**Alternatives rejected**: Creating entities on-demand (e.g., in `updatePositions()` or `tick()`) leads to per-frame allocation and GC pressure.

## 2. In-Place Color Mutation for Theme Switching

**Decision**: `ThemeColor` objects are shared `Cesium.Color` instances referenced by all entity properties. `applyTheme()` mutates `.red/.green/.blue/.alpha` directly. Pre-mutated alpha variants (`primary055`, `trailAircraft`, etc.) avoid `.withAlpha()` creating disconnected copies.

**Rationale**: Cesium entity properties hold references, not copies. Mutating the shared Color object updates all entities on the next render frame without iterating or recreating anything.

**Alternatives rejected**: Recreating all entity materials on theme switch would cause a visible 1-2 frame flash. Re-parsing CSS color strings would allocate 40+ Color objects per switch.

## 3. Zustand over Redux

**Decision**: Zustand with granular selectors (`useAppStore(s => s.assetData)`) instead of Redux or React Context.

**Rationale**: Zustand has zero boilerplate, supports selector-based subscriptions (no unnecessary re-renders), works outside React (for simulation/alert services), and has a simple API.

**Alternatives rejected**: Redux Toolkit adds ~30 lines of setup per slice. React Context would re-render all consumers on any change.

## 4. Separate Stores per Domain

**Decision**: `useAppStore` (main app state, persisted), `useCaseStore` (investigations, transient), `useOntologyStore` (ontology, transient), `useGlobeStore` (camera, transient).

**Rationale**: Orthogonal concerns should not share a single store. Cases and ontology have different update frequencies and don't need to trigger re-renders in the main UI.

## 5. Singleton Services (not React-managed)

**Decision**: `CelesTrakService`, `SimulationManager`, `AlertManager` are singleton class instances, not React components or hooks.

**Rationale**: These services manage long-lived state (TLE cache, simulation clock, alert cooldowns) that must persist across component mount/unmount cycles. React hooks would lose state on remount.

## 6. ResizeObserver for Cesium Viewer Resize

**Decision**: ResizeObserver on the globe container triggers `viewer.resize()` via rAF throttle, replacing a custom `sidebar-resize` CustomEvent.

**Rationale**: ResizeObserver fires on actual layout changes regardless of what caused them (sidebar drag, keyboard shortcut, Framer Motion animation). The custom event required manual dispatch from every resize trigger point.

## 7. CallbackProperty with Scratch Objects

**Decision**: Communication link positions use `CallbackProperty` returning a module-level reusable array of 3 scratch `Cartesian3` objects, with `false` (non-constant) for Cesium to re-evaluate every frame.

**Rationale**: Links follow moving satellites and must update every frame. The callback returns the same array instance with overwritten values, avoiding the 150+ `Cartesian3` allocations per frame that `new Cartesian3()` in the callback would cause.

**Alternatives rejected**: Pre-computing positions in the simulation tick would require manual position pushing to each entity. `CallbackProperty` is Cesium's lazy evaluation — it only recomputes when the scene renders.

## 8. DataSourceInfo for Data Transparency

**Decision**: Every asset carries a `dataSource: DataSourceInfo` field with `source`, `lastUpdated`, `refreshRate`, `confidence`, and `dataQuality`.

**Rationale**: Users must always know where displayed information originated. This field is set once at asset creation and never changes. `dataQuality` distinguishes 'live' (real-time API), 'cached' (stale live data), 'simulated' (deterministic mock), and 'fallback' (hardcoded defaults).

## 9. System-Derived Events (not fictional narratives)

**Decision**: The AlertManager generates event text from actual sensor readings ("Signal dropped to 18%") rather than fictional military narratives ("Possible jamming detected").

**Rationale**: Every visible event should be traceable to a real system condition. The event `source` uses `asset.dataSource.source` instead of fake unit designators.

## 10. rAF-Throttled Pointer Resize

**Decision**: Sidebar drag uses `requestAnimationFrame` throttling for `pointermove`, with pointer capture, and commits the final width on `pointerup`.

**Rationale**: Raw pointer events fire at 120Hz+ on high-refresh displays. Writing to React state on every event causes 120+ re-renders per second. rAF limits to display refresh rate (typically 60Hz) and prevents stale closure issues via ref-based width tracking.

## 11. Error Boundaries per Panel

**Decision**: Individual `ErrorBoundary` components wrap left sidebar, globe, and right sidebar separately.

**Rationale**: A crash in one panel (e.g., a Cesium layer throwing during pick) should never blank the entire application. Each panel's error boundary isolates failures and shows a minimal inline fallback.

## 12. No Entity Destruction on Mode Switch

**Decision**: Projection mode changes (globe/flat/space/analytics) apply layer visibility presets and Cesium `morphTo2D/morphTo3D` without destroying or recreating any entities.

**Rationale**: `viewer.entities.removeAll()` would destroy GPU resources that must be re-allocated on return to globe mode. Entity reuse across modes eliminates allocation jank.
