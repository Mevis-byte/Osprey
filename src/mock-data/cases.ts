import type { InvestigationCase } from '@/types'

export const mockCases: InvestigationCase[] = [
  {
    id: 'CASE-001',
    title: 'Suspected Iranian UAV Activity',
    description: 'Analysis of unidentified drone incursions near the Strait of Hormuz. Correlating radar returns with known Iranian UAV flight profiles and telemetry gaps.',
    priority: 'critical',
    status: 'in-progress',
    owner: 'LT Johnson',
    createdAt: '2026-06-10T08:30:00Z',
    updatedAt: '2026-06-15T14:22:00Z',
    entities: [
      { entityType: 'asset', entityId: 'AC-003', entityName: 'GLOBAL HAWK 4', addedAt: '2026-06-10T09:00:00Z' },
      { entityType: 'asset', entityId: 'SV-001', entityName: 'KEYHOLE-12', addedAt: '2026-06-10T09:15:00Z' },
      { entityType: 'region', entityId: 'R-ME', entityName: 'Middle East', addedAt: '2026-06-10T10:00:00Z' },
      { entityType: 'mission', entityId: 'MS-002', entityName: 'Operation Sentinel Horizon', addedAt: '2026-06-11T06:00:00Z' },
    ],
    events: [
      { eventId: 'EVT-001', title: 'Radar contact detected at 27°N 56°E', timestamp: '2026-06-10T08:45:00Z' },
      { eventId: 'EVT-002', title: 'COMINT intercept — Farsi language comms', timestamp: '2026-06-10T11:30:00Z' },
      { eventId: 'EVT-003', title: 'GH4 optical confirm — positive ID', timestamp: '2026-06-11T03:20:00Z' },
    ],
    alerts: [
      { alertId: 'A-001', title: 'Unidentified track in restricted airspace', severity: 'high' },
      { alertId: 'A-003', title: 'Signal anomaly — possible spoofing', severity: 'critical' },
    ],
    screenshots: [],
    notes: [
      { id: 'N-001', author: 'LT Johnson', content: 'Initial assessment: likely Mohajer-6 variant based on flight profile and IR signature.', createdAt: '2026-06-10T14:00:00Z' },
      { id: 'N-002', author: 'CPT Rivera', content: 'Requesting additional ELINT tasking from NSA. Need to confirm datalink frequency.', createdAt: '2026-06-11T09:30:00Z' },
      { id: 'N-003', author: 'LT Johnson', content: 'GH4 captured high-res imagery. Confirms Iranian markings. Case elevated to critical.', createdAt: '2026-06-11T16:45:00Z' },
    ],
    attachments: [
      { id: 'ATT-001', name: 'radar_tracks_10jun.csv', type: 'text/csv', url: '#', size: 245000 },
      { id: 'ATT-002', name: 'comint_transcript.pdf', type: 'application/pdf', url: '#', size: 1200000 },
    ],
  },
  {
    id: 'CASE-002',
    title: 'South China Sea Freight Anomalies',
    description: 'Multiple cargo vessels deviating from standard shipping lanes near the Spratly Islands. Possible sanctions evasion or dual-use material transport.',
    priority: 'high',
    status: 'open',
    owner: 'CPT Rivera',
    createdAt: '2026-06-12T06:00:00Z',
    updatedAt: '2026-06-14T10:15:00Z',
    entities: [
      { entityType: 'asset', entityId: 'MV-002', entityName: 'EVER FORTUNE', addedAt: '2026-06-12T06:30:00Z' },
      { entityType: 'asset', entityId: 'MV-003', entityName: 'SEA GUARDIAN', addedAt: '2026-06-12T07:00:00Z' },
      { entityType: 'region', entityId: 'R-SCS', entityName: 'South China Sea', addedAt: '2026-06-12T08:00:00Z' },
    ],
    events: [
      { eventId: 'EVT-004', title: 'EVER FORTUNE AIS gap — 4 hours dark', timestamp: '2026-06-12T03:00:00Z' },
      { eventId: 'EVT-005', title: 'Inter-ship communication detected', timestamp: '2026-06-13T22:15:00Z' },
    ],
    alerts: [
      { alertId: 'A-004', title: 'AIS spoofing detected in SCS corridor', severity: 'high' },
    ],
    screenshots: [],
    notes: [
      { id: 'N-004', author: 'CPT Rivera', content: 'EVER FORTUNE registered to shell company in Valletta. Beneficial owner unclear.', createdAt: '2026-06-12T14:00:00Z' },
    ],
    attachments: [
      { id: 'ATT-003', name: 'vessel_registry_extract.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', url: '#', size: 89000 },
    ],
  },
  {
    id: 'CASE-003',
    title: 'Satellite Communication Intercept',
    description: 'Analysis of anomalous signal patterns detected on military comms satellites. Possible SIGINT collection by adversarial ground stations.',
    priority: 'high',
    status: 'in-progress',
    owner: 'LT Johnson',
    createdAt: '2026-06-13T11:00:00Z',
    updatedAt: '2026-06-15T08:30:00Z',
    entities: [
      { entityType: 'asset', entityId: 'SV-004', entityName: 'MILSTAR-6', addedAt: '2026-06-13T11:30:00Z' },
      { entityType: 'asset', entityId: 'SV-002', entityName: 'WORLDVIEW-5', addedAt: '2026-06-13T12:00:00Z' },
      { entityType: 'ground-station', entityId: 'GS-002', entityName: 'Ascension Island', addedAt: '2026-06-13T14:00:00Z' },
    ],
    events: [
      { eventId: 'EVT-006', title: 'Uplink interference on X-band', timestamp: '2026-06-13T10:30:00Z' },
      { eventId: 'EVT-007', title: 'Beam profile matches Chinese ground radar', timestamp: '2026-06-14T01:00:00Z' },
    ],
    alerts: [
      { alertId: 'A-005', title: 'SIGINT alert — MILSTAR-6 anomalous', severity: 'high' },
    ],
    screenshots: [],
    notes: [
      { id: 'N-005', author: 'LT Johnson', content: 'Signal analysis shows 5ms timing offset consistent with phased-array tracking from Hainan facility.', createdAt: '2026-06-13T18:00:00Z' },
    ],
    attachments: [],
  },
  {
    id: 'CASE-004',
    title: 'Maritime Piracy Threat Assessment',
    description: 'Intelligence preparation for potential piracy operations in the Gulf of Aden. Monitoring known pirate mother ships and skiff activity patterns.',
    priority: 'medium',
    status: 'pending-review',
    owner: 'CPT Rivera',
    createdAt: '2026-06-08T04:00:00Z',
    updatedAt: '2026-06-14T16:00:00Z',
    entities: [
      { entityType: 'asset', entityId: 'MV-001', entityName: 'AL SHAMAL', addedAt: '2026-06-08T04:30:00Z' },
      { entityType: 'region', entityId: 'R-EA', entityName: 'East Africa', addedAt: '2026-06-08T05:00:00Z' },
    ],
    events: [
      { eventId: 'EVT-008', title: 'AL SHAMAL loitering 60nm off Bossaso', timestamp: '2026-06-08T09:00:00Z' },
    ],
    alerts: [],
    screenshots: [],
    notes: [
      { id: 'N-006', author: 'CPT Rivera', content: 'AL SHAMAL flagged to Panama, owned by front company. Known to support pirate logistics.', createdAt: '2026-06-08T12:00:00Z' },
      { id: 'N-007', author: 'LT Johnson', content: 'Reviewed past 6 months: AL SHAMAL loiter pattern correlates with 3 hijacking attempts. Recommend alerting CTF-151.', createdAt: '2026-06-09T08:00:00Z' },
    ],
    attachments: [],
  },
  {
    id: 'CASE-005',
    title: 'GPS Spoofing Event — Eastern Med',
    description: 'Investigation into GPS spoofing affecting civilian airliners and naval assets in the Eastern Mediterranean. Coordinating with FAA and NATO.',
    priority: 'critical',
    status: 'closed',
    owner: 'CPT Rivera',
    createdAt: '2026-06-01T22:00:00Z',
    updatedAt: '2026-06-07T18:00:00Z',
    entities: [
      { entityType: 'asset', entityId: 'AC-002', entityName: 'E-3 SENTRY', addedAt: '2026-06-01T22:30:00Z' },
      { entityType: 'region', entityId: 'R-ME', entityName: 'Middle East', addedAt: '2026-06-01T23:00:00Z' },
    ],
    events: [
      { eventId: 'EVT-009', title: 'Multiple aircraft report GPS anomalies', timestamp: '2026-06-01T20:00:00Z' },
      { eventId: 'EVT-010', title: 'NATO E-3 confirms spoofing source near Tartus', timestamp: '2026-06-02T03:00:00Z' },
    ],
    alerts: [
      { alertId: 'A-006', title: 'GPS spoofing — 12 aircraft affected', severity: 'critical' },
    ],
    screenshots: [],
    notes: [
      { id: 'N-008', author: 'CPT Rivera', content: 'Spoofing source geolocated to 34.7°N 35.9°E. Russian jamming system known as R-330Zh Zhitel.', createdAt: '2026-06-02T06:00:00Z' },
      { id: 'N-009', author: 'LT Johnson', content: 'Case closed. Findings forwarded to CENTCOM and FAA. NOTAM issued for Eastern Med waypoints.', createdAt: '2026-06-07T18:00:00Z' },
    ],
    attachments: [
      { id: 'ATT-004', name: 'spoofing_analysis_final.pdf', type: 'application/pdf', url: '#', size: 3400000 },
    ],
  },
]
