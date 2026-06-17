import * as Cesium from 'cesium'
import type { Layer } from './BaseLayer'
import type { Geofence } from '@/types'
import { geofences as gfData } from '@/mock-data'

const RING_RADII_KM = [5, 10, 20, 35, 50, 75, 100, 150, 200, 300]
const SPOKE_COUNT = 12
const SEGMENTS_PER_RING = 96

const ZONE_COLORS = [
  '#ef4444', '#ef4444', '#ef4444',
  '#f59e0b', '#f59e0b', '#f59e0b',
  '#eab308', '#eab308',
  '#22c55e', '#22c55e',
]

const ZONE_ALPHAS = [
  0.55, 0.45, 0.38,
  0.38, 0.30, 0.25,
  0.25, 0.18,
  0.18, 0.12,
]

const SPOKE_COLOR = Cesium.Color.fromCssColorString('rgba(255,255,255,0.15)')

const CARDINAL_LABELS = ['N', 'E', 'S', 'W']

function computeRingPositions(
  lon: number,
  lat: number,
  radiusKm: number,
  segments: number,
): Cesium.Cartesian3[] {
  const ellipsoid = Cesium.Ellipsoid.WGS84
  const centerCarto = new Cesium.Cartographic(
    Cesium.Math.toRadians(lon),
    Cesium.Math.toRadians(lat),
    0,
  )
  const center = ellipsoid.cartographicToCartesian(centerCarto)
  const up = ellipsoid.geodeticSurfaceNormal(center, new Cesium.Cartesian3())

  const east = new Cesium.Cartesian3()
  if (Math.abs(lat) < 89.5) {
    Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_Z, up, east)
  } else {
    east.x = 1
  }
  Cesium.Cartesian3.normalize(east, east)
  const north = new Cesium.Cartesian3()
  Cesium.Cartesian3.cross(up, east, north)
  Cesium.Cartesian3.normalize(north, north)

  const latRad = Cesium.Math.toRadians(lat)
  const sinLat = Math.sin(latRad)
  const e2 = 0.00669437999014
  const N = ellipsoid.maximumRadius / Math.sqrt(1 - e2 * sinLat * sinLat)
  const M = (ellipsoid.maximumRadius * (1 - e2)) / Math.pow(1 - e2 * sinLat * sinLat, 1.5)
  const R = Math.sqrt(M * N)
  const angularRadius = (radiusKm * 1000) / R

  const result: Cesium.Cartesian3[] = []

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Cesium.Math.TWO_PI
    const dx = Math.sin(angularRadius) * Math.cos(theta) * R
    const dy = Math.sin(angularRadius) * Math.sin(theta) * R
    const dz = (Math.cos(angularRadius) - 1) * R
    const world = new Cesium.Cartesian3()
    Cesium.Cartesian3.add(
      Cesium.Cartesian3.multiplyByScalar(east, dx, new Cesium.Cartesian3()),
      Cesium.Cartesian3.add(
        Cesium.Cartesian3.multiplyByScalar(north, dy, new Cesium.Cartesian3()),
        Cesium.Cartesian3.multiplyByScalar(up, dz, new Cesium.Cartesian3()),
        world,
      ),
      world,
    )
    Cesium.Cartesian3.add(center, world, world)
    const carto = ellipsoid.cartesianToCartographic(world)
    if (carto) {
      result.push(ellipsoid.cartographicToCartesian(carto))
    } else {
      result.push(world)
    }
  }

  return result
}

function computeSpokePositions(
  lon: number,
  lat: number,
  maxRadiusKm: number,
): Cesium.Cartesian3[][] {
  const ellipsoid = Cesium.Ellipsoid.WGS84
  const centerCarto = new Cesium.Cartographic(
    Cesium.Math.toRadians(lon),
    Cesium.Math.toRadians(lat),
    0,
  )
  const center = ellipsoid.cartographicToCartesian(centerCarto)
  const up = ellipsoid.geodeticSurfaceNormal(center, new Cesium.Cartesian3())

  const east = new Cesium.Cartesian3()
  if (Math.abs(lat) < 89.5) {
    Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_Z, up, east)
  } else {
    east.x = 1
  }
  Cesium.Cartesian3.normalize(east, east)
  const north = new Cesium.Cartesian3()
  Cesium.Cartesian3.cross(up, east, north)
  Cesium.Cartesian3.normalize(north, north)

  const latRad = Cesium.Math.toRadians(lat)
  const sinLat = Math.sin(latRad)
  const e2 = 0.00669437999014
  const N = ellipsoid.maximumRadius / Math.sqrt(1 - e2 * sinLat * sinLat)
  const M = (ellipsoid.maximumRadius * (1 - e2)) / Math.pow(1 - e2 * sinLat * sinLat, 1.5)
  const R = Math.sqrt(M * N)
  const angularRadius = (maxRadiusKm * 1000) / R

  const spokes: Cesium.Cartesian3[][] = []

  for (let s = 0; s < SPOKE_COUNT; s++) {
    const theta = (s / SPOKE_COUNT) * Cesium.Math.TWO_PI
    const dx = Math.sin(angularRadius) * Math.cos(theta) * R
    const dy = Math.sin(angularRadius) * Math.sin(theta) * R
    const dz = (Math.cos(angularRadius) - 1) * R
    const edge = new Cesium.Cartesian3()
    Cesium.Cartesian3.add(
      Cesium.Cartesian3.multiplyByScalar(east, dx, new Cesium.Cartesian3()),
      Cesium.Cartesian3.add(
        Cesium.Cartesian3.multiplyByScalar(north, dy, new Cesium.Cartesian3()),
        Cesium.Cartesian3.multiplyByScalar(up, dz, new Cesium.Cartesian3()),
        edge,
      ),
      edge,
    )
    Cesium.Cartesian3.add(center, edge, edge)
    const carto = ellipsoid.cartesianToCartographic(edge)
    let edgePt = edge
    if (carto) {
      edgePt = ellipsoid.cartographicToCartesian(carto)
    }
    spokes.push([center, edgePt])
  }

  return spokes
}

function computeCardinalPositions(
  lon: number,
  lat: number,
  radiusKm: number,
): Cesium.Cartesian3[] {
  const positions = computeRingPositions(lon, lat, radiusKm, 4)
  return [positions[1], positions[0], positions[3], positions[2]]
}

export class GeofenceLayer implements Layer {
  readonly id = 'geofences'
  readonly name = 'Geofences'

  private viewer: Cesium.Viewer
  private _visible = true
  private _highlightedId: string | null = null
  private _hoveredId: string | null = null

  private ringEntities: Map<string, Cesium.Entity[]> = new Map()
  private spokeEntities: Map<string, Cesium.Entity[]> = new Map()
  private cardinalEntities: Map<string, Cesium.Entity[]> = new Map()
  private distanceLabelEntities: Map<string, Cesium.Entity[]> = new Map()
  private centerEntities: Map<string, Cesium.Entity> = new Map()
  private allEntities: Cesium.Entity[] = []

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  get visible(): boolean {
    return this._visible
  }

  load(): void {
    for (const gf of gfData) {
      this.createGeofence(gf)
    }
  }

  private createGeofence(gf: Geofence): void {
    const lon = gf.longitude
    const lat = gf.latitude
    const maxRadius = gf.radiusKm
    const prefix = `geofence-${gf.id}`

    const ringEntities: Cesium.Entity[] = []
    for (let i = 0; i < RING_RADII_KM.length; i++) {
      const radius = RING_RADII_KM[i]
      if (radius > maxRadius) continue

      const positions = computeRingPositions(lon, lat, radius, SEGMENTS_PER_RING)
      const colorStr = ZONE_COLORS[i]
      const alpha = ZONE_ALPHAS[i]

      const entity = new Cesium.Entity({
        id: `${prefix}-ring-${i}`,
        polyline: {
          positions,
          width: 1,
          material: Cesium.Color.fromCssColorString(colorStr).withAlpha(alpha),
          clampToGround: false,
          depthFailMaterial: Cesium.Color.fromCssColorString(colorStr).withAlpha(alpha * 0.4),
        },
        show: false,
      })
      this.viewer.entities.add(entity)
      ringEntities.push(entity)
      this.allEntities.push(entity)
    }

    const spokePositions = computeSpokePositions(lon, lat, Math.min(maxRadius, 300))
    const spokeEntities: Cesium.Entity[] = []
    for (let s = 0; s < spokePositions.length; s++) {
      const entity = new Cesium.Entity({
        id: `${prefix}-spoke-${s}`,
        polyline: {
          positions: spokePositions[s],
          width: 1,
          material: SPOKE_COLOR,
          clampToGround: false,
        },
        show: false,
      })
      this.viewer.entities.add(entity)
      spokeEntities.push(entity)
      this.allEntities.push(entity)
    }

    const cardinalPositions = computeCardinalPositions(lon, lat, Math.min(maxRadius, 300))
    const cardinalEntities: Cesium.Entity[] = []
    for (let c = 0; c < cardinalPositions.length; c++) {
      const entity = new Cesium.Entity({
        id: `${prefix}-cardinal-${c}`,
        position: cardinalPositions[c],
        label: {
          text: CARDINAL_LABELS[c],
          font: '11px Inter, system-ui, sans-serif',
          fillColor: Cesium.Color.fromCssColorString('rgba(255,255,255,0.55)'),
          style: Cesium.LabelStyle.FILL,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#0a0c12').withAlpha(0.6),
          backgroundPadding: new Cesium.Cartesian2(3, 1),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5.0e6),
        },
        show: false,
      })
      this.viewer.entities.add(entity)
      cardinalEntities.push(entity)
      this.allEntities.push(entity)
    }

    const distanceLabelEntities: Cesium.Entity[] = []
    for (let i = 0; i < RING_RADII_KM.length; i++) {
      const radius = RING_RADII_KM[i]
      if (radius > maxRadius) continue

      const midAngle = Cesium.Math.toRadians(225)
      const ellipsoid = Cesium.Ellipsoid.WGS84
      const centerCarto = new Cesium.Cartographic(
        Cesium.Math.toRadians(lon),
        Cesium.Math.toRadians(lat),
        0,
      )
      const center = ellipsoid.cartographicToCartesian(centerCarto)
      const up = ellipsoid.geodeticSurfaceNormal(center, new Cesium.Cartesian3())
      const east = new Cesium.Cartesian3()
      if (Math.abs(lat) < 89.5) {
        Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_Z, up, east)
      } else {
        east.x = 1
      }
      Cesium.Cartesian3.normalize(east, east)
      const north = new Cesium.Cartesian3()
      Cesium.Cartesian3.cross(up, east, north)
      Cesium.Cartesian3.normalize(north, north)

      const latRad = Cesium.Math.toRadians(lat)
      const sinLat = Math.sin(latRad)
      const e2 = 0.00669437999014
      const N = ellipsoid.maximumRadius / Math.sqrt(1 - e2 * sinLat * sinLat)
      const M = (ellipsoid.maximumRadius * (1 - e2)) / Math.pow(1 - e2 * sinLat * sinLat, 1.5)
      const R = Math.sqrt(M * N)
      const angularRadius = (radius * 1000) / R

      const dx = Math.sin(angularRadius) * Math.cos(midAngle) * R
      const dy = Math.sin(angularRadius) * Math.sin(midAngle) * R
      const dz = (Math.cos(angularRadius) - 1) * R

      const scratch = new Cesium.Cartesian3(dx, dy, dz)
      const world = new Cesium.Cartesian3()
      Cesium.Cartesian3.add(center,
        Cesium.Cartesian3.add(
          Cesium.Cartesian3.multiplyByScalar(east, scratch.x, new Cesium.Cartesian3()),
          Cesium.Cartesian3.add(
            Cesium.Cartesian3.multiplyByScalar(north, scratch.y, new Cesium.Cartesian3()),
            Cesium.Cartesian3.multiplyByScalar(up, scratch.z, new Cesium.Cartesian3()),
            world,
          ),
          world,
        ),
        world,
      )

      const carto = ellipsoid.cartesianToCartographic(world)
      let labelPos = world
      if (carto) {
        labelPos = ellipsoid.cartographicToCartesian(carto)
      }

      const entity = new Cesium.Entity({
        id: `${prefix}-dist-${i}`,
        position: labelPos,
        label: {
          text: `${radius} km`,
          font: '10px Inter, system-ui, sans-serif',
          fillColor: Cesium.Color.fromCssColorString(ZONE_COLORS[i]).withAlpha(0.55),
          style: Cesium.LabelStyle.FILL,
          pixelOffset: new Cesium.Cartesian2(6, -6),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#0a0c12').withAlpha(0.55),
          backgroundPadding: new Cesium.Cartesian2(3, 1),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5.0e6),
        },
        show: false,
      })
      this.viewer.entities.add(entity)
      distanceLabelEntities.push(entity)
      this.allEntities.push(entity)
    }

    const centerEntity = new Cesium.Entity({
      id: `${prefix}-center`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      point: {
        pixelSize: 6,
        color: Cesium.Color.fromCssColorString('#60a5fa'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(1.0e6, 1.0, 2.5e7, 0.5),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5.0e6),
      },
      label: {
        text: gf.name,
        font: '12px Inter, system-ui, sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('rgba(0,0,0,0.6)'),
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#0a0c12').withAlpha(0.7),
        backgroundPadding: new Cesium.Cartesian2(4, 2),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5.0e6),
      },
      properties: {
        geofenceId: gf.id,
        geofenceCategory: gf.category,
        geofencePriority: gf.priority,
        geofenceStatus: gf.status,
      },
      show: false,
    })
    this.viewer.entities.add(centerEntity)
    this.centerEntities.set(gf.id, centerEntity)
    this.allEntities.push(centerEntity)

    this.ringEntities.set(gf.id, ringEntities)
    this.spokeEntities.set(gf.id, spokeEntities)
    this.cardinalEntities.set(gf.id, cardinalEntities)
    this.distanceLabelEntities.set(gf.id, distanceLabelEntities)
  }

  updatePositions(): void {
  }

  setVisible(visible: boolean): void {
    this._visible = visible
    for (const entity of this.allEntities) {
      entity.show = visible
    }
  }

  setHighlight(entityId: string | null): void {
    if (this._highlightedId === entityId) return

    if (this._highlightedId) {
      const center = this.centerEntities.get(this._highlightedId)
      if (center) {
        const pt = center.point
        if (pt) {
          pt.pixelSize = 6 as unknown as Cesium.Property
          pt.color = Cesium.Color.fromCssColorString('#60a5fa') as unknown as Cesium.Property
        }
      }
    }

    this._highlightedId = entityId

    if (entityId) {
      const center = this.centerEntities.get(entityId)
      if (center) {
        const pt = center.point
        if (pt) {
          pt.pixelSize = 8 as unknown as Cesium.Property
          pt.color = Cesium.Color.fromCssColorString('#93c5fd') as unknown as Cesium.Property
        }
      }
    }
  }

  setSelectedGeofence(id: string | null): void {
    if (id) {
      this.setVisible(true)
    }
  }

  setHover(entityId: string | null): void {
    if (this._hoveredId === entityId) return

    if (this._hoveredId) {
      const center = this.centerEntities.get(this._hoveredId)
      if (center?.label && this._highlightedId !== this._hoveredId) {
        center.label.scale = 1.0 as unknown as Cesium.Property
      }
    }

    this._hoveredId = entityId

    if (entityId) {
      const center = this.centerEntities.get(entityId)
      if (center?.label) {
        center.label.scale = 1.15 as unknown as Cesium.Property
      }
    }
  }

  clear(): void {
    for (const entity of this.allEntities) {
      this.viewer.entities.remove(entity)
    }
    this.allEntities = []
    this.ringEntities.clear()
    this.spokeEntities.clear()
    this.cardinalEntities.clear()
    this.distanceLabelEntities.clear()
    this.centerEntities.clear()
  }

  destroy(): void {
    this.clear()
  }
}
