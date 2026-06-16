import { aircraft } from './aircraft'
import { maritime } from './maritime'
import { satellites } from './satellites'
import { groundStations } from './ground-stations'

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
export const allAssets = [...aircraft, ...maritime, ...satellites]
