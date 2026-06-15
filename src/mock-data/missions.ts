import type { Mission } from '@/types'

const now = new Date()
const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

function t(hours: number): string {
  return new Date(day + hours * 3_600_000).toISOString()
}

export const missions: Mission[] = [
  {
    id: 'OP-001',
    name: 'Operation Eclipse',
    status: 'in-progress',
    objective: 'Conduct persistent surveillance and interdiction of hostile surface action groups operating in the South China Sea transit corridors. Secondary tasking includes ASW screening for carrier strike group.',
    assets: ['AC-001', 'AC-005', 'MV-002', 'MV-006', 'SV-001', 'SV-004'],
    region: 'Pacific',
    startTime: t(5),
    threatLevel: 'high',
    waypoints: [
      { latitude: 12.0, longitude: 116.0, altitude: 0 },
      { latitude: 10.5, longitude: 118.0, altitude: 0 },
      { latitude: 8.0, longitude: 115.0, altitude: 0 },
      { latitude: 11.0, longitude: 114.0, altitude: 0 },
      { latitude: 14.0, longitude: 117.0, altitude: 0 },
    ],
  },
  {
    id: 'OP-002',
    name: 'Operation Sea Watch',
    status: 'in-progress',
    objective: 'Maritime domain awareness and counter-piracy patrol across the Indian Ocean. Monitor SLOC chokepoints including Bab el-Mandeb and the Mozambique Channel. Provide convoy escort as required.',
    assets: ['MV-001', 'MV-004', 'MV-010', 'AC-003', 'SV-002'],
    region: 'Indian Ocean',
    startTime: t(4),
    threatLevel: 'high',
    waypoints: [
      { latitude: 12.5, longitude: 50.5, altitude: 0 },
      { latitude: 10.0, longitude: 55.0, altitude: 0 },
      { latitude: -5.0, longitude: 60.0, altitude: 0 },
      { latitude: -10.0, longitude: 55.0, altitude: 0 },
      { latitude: 5.0, longitude: 50.0, altitude: 0 },
    ],
  },
  {
    id: 'OP-003',
    name: 'Operation Northern Sky',
    status: 'in-progress',
    objective: 'NATO enhanced air policing and maritime patrol in the North Atlantic and Norwegian Sea. Monitor Russian naval activity in the GIUK gap. Conduct ASW patrols and MPA coverage.',
    assets: ['AC-002', 'AC-008', 'MV-006', 'SV-003'],
    region: 'North Atlantic',
    startTime: t(6),
    threatLevel: 'medium',
    waypoints: [
      { latitude: 62.0, longitude: -5.0, altitude: 0 },
      { latitude: 65.0, longitude: -10.0, altitude: 0 },
      { latitude: 60.0, longitude: -15.0, altitude: 0 },
      { latitude: 58.0, longitude: -8.0, altitude: 0 },
    ],
  },
  {
    id: 'OP-004',
    name: 'Operation Mediterranean Shield',
    status: 'in-progress',
    objective: 'Naval presence and maritime security operations in the Eastern Mediterranean. Support NATO deterrence posture and monitor maritime traffic near contested EEZs.',
    assets: ['MV-002', 'AC-007', 'AC-009', 'SV-004'],
    region: 'Mediterranean',
    startTime: t(7),
    threatLevel: 'medium',
    waypoints: [
      { latitude: 35.5, longitude: 24.0, altitude: 0 },
      { latitude: 36.0, longitude: 26.0, altitude: 0 },
      { latitude: 34.5, longitude: 28.0, altitude: 0 },
      { latitude: 33.0, longitude: 26.5, altitude: 0 },
    ],
  },
  {
    id: 'OP-005',
    name: 'Operation Desert Vigil',
    status: 'standby',
    objective: 'Standby quick-reaction force for Persian Gulf and Strait of Hormuz contingency operations. Maintain overwatch of Iranian IRGC-N patrol craft activity and ensure free navigation.',
    assets: ['MV-009', 'AC-003', 'AC-010', 'SV-005'],
    region: 'Persian Gulf',
    startTime: t(3),
    threatLevel: 'critical',
    waypoints: [
      { latitude: 26.5, longitude: 56.0, altitude: 0 },
      { latitude: 25.5, longitude: 55.5, altitude: 0 },
      { latitude: 26.0, longitude: 54.0, altitude: 0 },
      { latitude: 27.0, longitude: 55.0, altitude: 0 },
    ],
  },
]
