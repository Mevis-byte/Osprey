<div align="center">

```
 ██████╗ ███████╗██████╗ ██████╗ ███████╗██╗   ██╗
██╔═══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝╚██╗ ██╔╝
██║   ██║███████╗██████╔╝██████╔╝█████╗   ╚████╔╝ 
██║   ██║╚════██║██╔═══╝ ██╔══██╗██╔══╝    ╚██╔╝  
╚██████╔╝███████║██║     ██║  ██║███████╗   ██║   
 ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚══════╝   ╚═╝  
```

**Geospatial Intelligence Command Platform**

*Real-time 3D situational awareness across air, maritime, satellite, and ground domains*

![Status](https://img.shields.io/badge/STATUS-ACTIVE%20ALPHA-gold?style=flat-square&labelColor=0a0800)
![Stack](https://img.shields.io/badge/STACK-React%20%7C%20CesiumJS%20%7C%20TypeScript-gold?style=flat-square&labelColor=0a0800)
![License](https://img.shields.io/badge/LICENSE-MIT-gold?style=flat-square&labelColor=0a0800)

</div>

---

## MISSION BRIEF

OSPREY transforms raw geospatial data into a unified 3D operational environment. It tracks and visualizes global multi-domain activity — satellites, aircraft, maritime vessels, ground stations, and [...]

Designed around the principles of defense-grade GEOINT platforms: every pixel communicates operational meaning, every layer earns its presence.

---

## SCREENSHOTS

<div align="center">

<!-- PRIMARY — Full command interface overview -->
![Command Interface](screenshots/overview.png)

<br/>

<table>
<tr>
<td align="center" width="50%">

![Asset Detail](screenshots/asset-detail.png)

**Asset Detail Panel**

</td>
<td align="center" width="50%">

![Layer Controls](screenshots/layer-controls.png)

**Layer Controls + Timeline**

</td>
</tr>
</table>

</div>

---

## DOMAINS COVERED

| Domain | Status | Data Source |
|---|---|---|
| 🛰 **Satellite** | Live | CelesTrak TLE |
| ✈ **Aircraft** | Integration-ready | OpenSky Network |
| 🚢 **Maritime** | Architecture ready | AISStream (planned) |
| 🌐 **Ground Stations** | Live | Static + configurable |
| ⚡ **Comm Links** | Live | Internal simulation |
| ⚠ **Global Events** | Live | USGS + expandable |

---

## SYSTEM ARCHITECTURE

```
OSPREY
│
├── 🌍  Globe Engine (CesiumJS)
│       ├── Satellite Layer          ← TLE-based orbital propagation
│       ├── Aircraft Layer           ← OpenSky integration
│       ├── Maritime Layer           ← AIS-ready
│       ├── Coverage & Sensor Layer  ← Rings, cones, ground projections
│       ├── Communication Layer      ← Tactical link networks
│       └── Tactical Grid Overlay
│
├── ⚙️  State Management (Zustand)
│
├── 📡  Data Services
│       ├── CelesTrak Service        ← Satellite TLE feeds
│       ├── OpenSky Service          ← Live aircraft positioning
│       ├── AIS Service              ← Maritime (planned)
│       └── Event Stream Service     ← Global intelligence feed
│
└── 🖥️  UI Layer (React + Tailwind)
        ├── Intelligence Stream Panel
        ├── Asset Detail Panel
        ├── Layer Controls
        └── Timeline + Playback System
```

---

## FEATURE SET

### 🌍 3D Globe Interface
Real-time Earth rendering powered by CesiumJS. Zoom-adaptive data scaling, multi-layer operational overlays, and click-to-select asset panels give full command-center interactivity without UI noise.

### 📡 Multi-Domain Tracking
- **Satellite orbits** — TLE propagation via CelesTrak with coverage ring and sensor cone visualization
- **Aircraft** — Live positioning via OpenSky Network (integration-ready)
- **Maritime vessels** — AIS-compatible architecture, ready for AISStream
- **Ground networks** — Configurable station mesh with communication link rendering

### ⚡ Intelligence Stream
An event-driven operational feed that surfaces aircraft detections, satellite passes, system alerts, and environmental events in real time. Expandable to any WebSocket or REST data source.

### 🎯 Asset Intelligence Cards
Hover any tracked asset for an immediate intelligence card: position, velocity, altitude, status, active network links. Full detail panel on select.

### 🕐 Timeline System
Scrubable playback with time scaling (1× to 8×). Replay historical event sequences or run simulated scenarios forward.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| 3D Engine | CesiumJS |
| State | Zustand |
| Build | Vite |
| Styling | TailwindCSS |
| Data | REST + WebSocket (planned) |

---

## GETTING STARTED

```bash
# Clone
git clone https://github.com/Mevis-byte/osprey.git
cd osprey

# Install
npm install

# Develop
npm run dev

# Build
npm run build
```

---

## DEVELOPMENT ROADMAP

### Phase 1 — Live Data Integration
- [x] CesiumJS globe engine
- [x] Satellite visualization (simulated)
- [x] Intelligence stream architecture
- [ ] OpenSky live aircraft tracking
- [ ] CelesTrak real TLE propagation
- [ ] USGS earthquake event stream

### Phase 2 — Advanced Visualization
- [ ] Day/Night terminator system
- [ ] Atmospheric scattering effects
- [ ] Animated communication links
- [ ] Sensor field visualization

### Phase 3 — Intelligence Expansion
- [ ] Mission system framework
- [ ] Threat zone overlays
- [ ] Predictive trajectory modeling
- [ ] AI-assisted anomaly detection

---

## PERFORMANCE TARGETS

| Metric | Target |
|---|---|
| Memory footprint | < 400 MB |
| Max visible aircraft | 500 |
| Cesium entity reuse | Active |
| React re-renders | Minimized via selective Zustand subscriptions |

---

## DATA SOURCES

| Feed | Provider | Docs |
|---|---|---|
| Satellite TLEs | CelesTrak | [celestrak.org](https://celestrak.org) |
| Aircraft positions | OpenSky Network | [opensky-network.org](https://opensky-network.org) |
| Seismic events | USGS | [earthquake.usgs.gov](https://earthquake.usgs.gov) |
| Maritime AIS | AISStream | [aisstream.io](https://aisstream.io) |
| Weather (optional) | OpenWeather | [openweathermap.org](https://openweathermap.org) |

---

## DESIGN PHILOSOPHY

**Situational awareness is the product.** Every UI element exists to communicate operational state, not to decorate the screen.

**Layers, not clutter.** Data density is achieved through layered visualization that the operator controls — not by forcing everything into view at once.

**Render at the speed of operations.** Real-time constraints are first-class requirements, not afterthoughts.

---

## INSPIRATION

OSPREY draws from the visual language and operational logic of:
- Modern GEOINT and ISR platforms
- Command-and-control simulation systems
- Aerospace and defense tracking dashboards
- Tactical situational awareness interfaces

---

## STATUS

```
◉ ACTIVE DEVELOPMENT   ▸  Early Alpha
  Core systems operational.
  Real-world data integration and performance optimization in progress.
```

---

## LICENSE

MIT — build freely, extend openly.

---

<div align="center">

*Built by a CSE student exploring geospatial systems, real-time visualization, and AI-assisted development.*

**OSPREY** → evolving toward a full-scale, real-time, multi-domain intelligence platform.

</div>
