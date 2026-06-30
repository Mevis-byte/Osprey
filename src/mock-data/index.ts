import type { DataSourceInfo } from '@/types'
import { aircraft } from './aircraft'
import { maritime } from './maritime'
import { satellites } from './satellites'
import { groundStations } from './ground-stations'

function simSource(): DataSourceInfo {
  return {
    source: 'OSPREY Simulation Engine',
    lastUpdated: new Date().toISOString(),
    refreshRate: 'static (simulated)',
    confidence: 0.6,
    dataQuality: 'simulated',
  }
}

export { aircraft }
export { maritime }
export { satellites }
export { groundStations }
export { feed } from './feed'
export { missions } from './missions'
export { constellations } from './constellations'
export { regions } from './regions'
export { geofences } from './geofences'
export { ontologyClasses, relationDefs, axiomDefs } from './ontology'
export { mockCases } from './cases'

export const allAssets = [
  ...aircraft.map(a => ({ ...a, dataSource: simSource() })),
  ...maritime.map(m => ({ ...m, dataSource: simSource() })),
  ...satellites.map(s => ({ ...s, dataSource: simSource() })),
]
