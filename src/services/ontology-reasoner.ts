import type {
  OntologyClass, RelationDef, Axiom,
  OntologyClassId, OntologyInstanceLink, ReasonerResult,
  Asset, Mission, Alert, Region, GroundStation, ConstellationInfo,
} from '@/types'

interface EntityMap {
  assets: Asset[]
  missions: Mission[]
  alerts: Alert[]
  regions: Region[]
  groundStations: GroundStation[]
  constellations: ConstellationInfo[]
}

function* walkParents(
  classId: OntologyClassId,
  classes: Map<OntologyClassId, OntologyClass>,
): Generator<OntologyClass> {
  const seen = new Set<OntologyClassId>()
  const stack = [classId]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (seen.has(current)) continue
    seen.add(current)
    const cls = classes.get(current)
    if (!cls) continue
    yield cls
    stack.push(...cls.parentIds)
  }
}

function getAncestors(
  classId: OntologyClassId,
  classes: Map<OntologyClassId, OntologyClass>,
): OntologyClassId[] {
  const result: OntologyClassId[] = []
  for (const cls of walkParents(classId, classes)) {
    if (cls.id !== classId) result.push(cls.id)
  }
  return result
}

function getSubclasses(
  classId: OntologyClassId,
  classes: Map<OntologyClassId, OntologyClass>,
): OntologyClassId[] {
  return [...classes.values()]
    .filter((c) => c.parentIds.includes(classId))
    .map((c) => c.id)
}

function hasClass(
  entity: Record<string, unknown>,
  classId: OntologyClassId,
  classes: Map<OntologyClassId, OntologyClass>,
): boolean {
  const cls = classes.get(classId)
  if (!cls) return false

  for (const prop of cls.properties) {
    if (prop.required && entity[prop.name] === undefined) return false
  }

  return true
}

function inferAssetClass(asset: Asset, classes: Map<OntologyClassId, OntologyClass>): OntologyClassId[] {
  const matches: OntologyClassId[] = []

  const entity = asset as unknown as Record<string, unknown>

  for (const cls of classes.values()) {
    if (cls.id === 'Thing' || cls.id === 'Asset') continue
    const ancestors = getAncestors(cls.id, classes)
    if (!ancestors.includes('Asset') && cls.id !== 'Asset') continue

    if (hasClass(entity, cls.id, classes)) {
      matches.push(cls.id)
    }
  }

  const specificTypes: Record<string, OntologyClassId> = {
    'fixed-wing': 'FixedWing',
    'rotary-wing': 'RotaryWing',
    maritime: 'Maritime',
    satellite: 'Satellite',
  }

  const specificId = specificTypes[asset.type]
  if (specificId && classes.has(specificId)) {
    return [specificId, ...matches.filter((m) => m !== specificId)]
  }

  if (matches.length === 0) return ['Asset']
  return matches
}

function inferMissionClass(
  mission: Mission,
  _classes: Map<OntologyClassId, OntologyClass>,
): OntologyClassId[] {
  const objective = mission.objective.toLowerCase()
  if (objective.includes('intel') || objective.includes('sigint') || objective.includes('recon')) {
    return ['IntelMission', 'Mission']
  }
  if (objective.includes('strike') || objective.includes('combat') || objective.includes('intercept')) {
    return ['CombatMission', 'Mission']
  }
  return ['Mission']
}

function inferRegionClass(_region: Region): OntologyClassId[] {
  return ['Region']
}

function inferSatelliteSubclass(
  satellite: Asset & { type: 'satellite'; apogee: number },
): OntologyClassId[] {
  const classes: OntologyClassId[] = ['Satellite']
  if (satellite.apogee < 2000) classes.push('LEOSatellite')
  else if (satellite.apogee > 35000 && satellite.apogee < 40000) classes.push('GEOSatellite')
  return classes
}

function inferRelations(
  entityId: string,
  entityType: string,
  entities: EntityMap,
  _classes: Map<OntologyClassId, OntologyClass>,
): { sourceId: string; relation: string; targetId: string }[] {
  const relations: { sourceId: string; relation: string; targetId: string }[] = []

  if (entityType === 'asset') {
    const asset = entities.assets.find((a) => a.id === entityId)
    if (!asset) return relations

    for (const mission of entities.missions) {
      if (mission.assets.includes(asset.id)) {
        relations.push({ sourceId: asset.id, relation: 'assigned-to', targetId: mission.id })
        relations.push({ sourceId: mission.id, relation: 'has-asset', targetId: asset.id })
      }
    }

    for (const region of entities.regions) {
      const [n, s, e, w] = region.bounds
      if (asset.latitude <= n && asset.latitude >= s && asset.longitude <= e && asset.longitude >= w) {
        relations.push({ sourceId: asset.id, relation: 'located-in', targetId: region.id })
        relations.push({ sourceId: region.id, relation: 'contains', targetId: asset.id })
        break
      }
    }

    for (const alert of entities.alerts) {
      if (alert.assetIds.includes(asset.id)) {
        relations.push({ sourceId: alert.id, relation: 'triggers', targetId: asset.id })
        relations.push({ sourceId: asset.id, relation: 'triggers-alert', targetId: alert.id })
      }
    }
  }

  if (entityType === 'mission') {
    const mission = entities.missions.find((m) => m.id === entityId)
    if (!mission) return relations

    for (const region of entities.regions) {
      if (region.id === mission.region || region.name.toLowerCase().includes(mission.region.toLowerCase())) {
        relations.push({ sourceId: mission.id, relation: 'monitors', targetId: region.id })
        relations.push({ sourceId: region.id, relation: 'monitored-by', targetId: mission.id })
        break
      }
    }
  }

  if (entityType === 'satellite') {
    const sat = entities.assets.find((a): a is Asset & { type: 'satellite' } => a.id === entityId && a.type === 'satellite')
    if (!sat) return relations

    for (const gs of entities.groundStations) {
      if (gs.connectedSatelliteIds.includes(sat.id)) {
        relations.push({ sourceId: sat.id, relation: 'communicates-with', targetId: gs.id })
        relations.push({ sourceId: gs.id, relation: 'communicates-with', targetId: sat.id })
      }
    }

    for (const constel of entities.constellations) {
      if (constel.satelliteIds.includes(sat.id)) {
        relations.push({ sourceId: sat.id, relation: 'part-of', targetId: constel.id })
        relations.push({ sourceId: constel.id, relation: 'has-member', targetId: sat.id })
      }
    }
  }

  return relations
}

function validateAxioms(
  entityId: string,
  _entityType: string,
  classes: Map<OntologyClassId, OntologyClass>,
  axioms: Axiom[],
  entities: EntityMap,
): { axiomId: string; message: string; entityId: string }[] {
  const violations: { axiomId: string; message: string; entityId: string }[] = []

  const asset = entities.assets.find((a) => a.id === entityId)
  if (!asset) return violations

  for (const axiom of axioms) {
    if (axiom.type === 'value-restriction') {
      const params = axiom.params as Record<string, unknown>
      const className = params.className as string
      const property = params.property as string

      const ancestors = getAncestors(className, classes)
      const applicable = className === 'Asset' || ancestors.includes('Asset') ||
                         [className, ...ancestors].includes(className)
      if (!applicable && className !== 'Asset') continue

      const val = (asset as unknown as Record<string, unknown>)[property]
      if (val === undefined) continue

      if (typeof val === 'number' && params.min !== undefined && val < (params.min as number)) {
        violations.push({ axiomId: axiom.id, message: `${asset.name}: ${property}=${val} < min=${params.min}`, entityId })
      }
      if (typeof val === 'number' && params.max !== undefined && val > (params.max as number)) {
        violations.push({ axiomId: axiom.id, message: `${asset.name}: ${property}=${val} > max=${params.max}`, entityId })
      }
    }

    if (axiom.type === 'disjoint') {
      const params = axiom.params as Record<string, unknown>
      const classA = params.classA as string
      const classB = params.classB as string

      const ancestorsA = getAncestors(classA, classes)
      const ancestorsB = getAncestors(classB, classes)

      const isA = classA === 'Asset' || ancestorsA.includes('Asset') ||
                  getSubclasses(classA, classes).some((s) => s === asset.type || s.toLowerCase().includes(asset.type))
      const isB = classB === 'Asset' || ancestorsB.includes('Asset') ||
                  getSubclasses(classB, classes).some((s) => s === asset.type || s.toLowerCase().includes(asset.type))

      if (isA && isB) {
        violations.push({ axiomId: axiom.id, message: `${asset.name} violates disjoint: ${classA} vs ${classB}`, entityId })
      }
    }
  }

  return violations
}

export function runReasoner(
  classes: Map<OntologyClassId, OntologyClass>,
  _relations: Map<string, RelationDef>,
  axioms: Axiom[],
  entities: EntityMap,
  log: (msg: string) => void,
): ReasonerResult {
  const classifications: ReasonerResult['classifications'] = []
  const inferredRelations: ReasonerResult['inferredRelations'] = []
  const violations: ReasonerResult['violations'] = []

  log('=== Ontology Reasoner Run ===')
  log(`Entities: ${entities.assets.length} assets, ${entities.missions.length} missions, ${entities.alerts.length} alerts`)

  for (const asset of entities.assets) {
    const matchedClasses = inferAssetClass(asset, classes)
    let specificClasses: OntologyClassId[] = []
    if (asset.type === 'satellite') {
      specificClasses = inferSatelliteSubclass(asset as Asset & { type: 'satellite'; apogee: number })
    }
    const allClasses = [...new Set([...specificClasses, ...matchedClasses])]

    for (const clsId of allClasses) {
      classifications.push({ instanceId: asset.id, className: clsId, confidence: clsId === 'Asset' ? 0.6 : 0.9 })
    }

    const entityRelations = inferRelations(asset.id, 'asset', entities, classes)
    inferredRelations.push(...entityRelations)

    const entityViolations = validateAxioms(asset.id, 'asset', classes, axioms, entities)
    violations.push(...entityViolations)
  }

  for (const mission of entities.missions) {
    const matchedClasses = inferMissionClass(mission, classes)
    for (const clsId of matchedClasses) {
      classifications.push({ instanceId: mission.id, className: clsId, confidence: 0.85 })
    }
    const entityRelations = inferRelations(mission.id, 'mission', entities, classes)
    inferredRelations.push(...entityRelations)
  }

  for (const region of entities.regions) {
    const matchedClasses = inferRegionClass(region)
    for (const clsId of matchedClasses) {
      classifications.push({ instanceId: region.id, className: clsId, confidence: 1.0 })
    }
  }

  for (const satellite of entities.assets.filter((a): a is Asset & { type: 'satellite' } => a.type === 'satellite')) {
    const entityRelations = inferRelations(satellite.id, 'satellite', entities, classes)
    inferredRelations.push(...entityRelations)
  }

  log(`Classifications: ${classifications.length}, Relations: ${inferredRelations.length}, Violations: ${violations.length}`)

  return {
    classifications,
    inferredRelations,
    violations,
    timestamp: Date.now(),
  }
}

export function getOntologyInstanceLinks(
  result: ReasonerResult,
): OntologyInstanceLink[] {
  const links: OntologyInstanceLink[] = []
  const seen = new Set<string>()

  for (const c of result.classifications) {
    const key = `${c.instanceId}:${c.className}`
    if (seen.has(key)) continue
    seen.add(key)

    let entityType: OntologyInstanceLink['entityType'] = 'asset'
    if (c.instanceId.startsWith('M-') || c.instanceId.startsWith('MS-') || c.instanceId.startsWith('mission:')) {
      entityType = 'mission'
    } else if (c.instanceId.startsWith('R-') || c.instanceId.startsWith('region:')) {
      entityType = 'region'
    } else if (c.instanceId.startsWith('A-') || c.instanceId.startsWith('alert:')) {
      entityType = 'alert'
    }

    links.push({
      ontologyClassId: c.className,
      entityType,
      entityId: c.instanceId,
      confidence: c.confidence,
    })
  }

  return links
}
