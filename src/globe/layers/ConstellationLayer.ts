import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import { useAppStore } from '@/store'
import type { Asset, ConstellationInfo } from '@/types'

const EARTH_RADIUS = 6371000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(a)) / 1000
}

function islRange(constellationType: string): number {
  if (constellationType === 'leo') return 2500
  if (constellationType === 'meo') return 6000
  return 10000
}

const WIDTH_SELECTED = new Cesium.ConstantProperty(2)
const WIDTH_UNSELECTED = new Cesium.ConstantProperty(1)

interface ConstellationRenderState {
  info: ConstellationInfo
  islEntities: Cesium.Entity[]
  islMaterials: Cesium.ColorMaterialProperty[]
  memberHighlightEntities: Cesium.Entity[]
  coverageEntity: Cesium.Entity | null
  color: Cesium.Color
}

export class ConstellationLayer extends BaseLayer {
  private constStates: ConstellationRenderState[] = []
  private removeTickListener: (() => void) | null = null

  constructor(viewer: Cesium.Viewer) {
    super(viewer, 'constellation', 'Constellation')
  }

  load(assets: Asset[]): void {
    this.clear()

    const store = useAppStore.getState()
    const constInfos = store.constellations
    if (!constInfos || constInfos.length === 0) return

    const assetMap = new Map(assets.map((a) => [a.id, a]))

    for (const info of constInfos) {
      const memberSats = info.satelliteIds.map((id) => assetMap.get(id)).filter(Boolean) as Asset[]
      const color = Cesium.Color.fromCssColorString(info.color)

      const isls: Cesium.Entity[] = []
      const islMaterials: Cesium.ColorMaterialProperty[] = []
      for (let i = 0; i < info.satelliteIds.length; i++) {
        for (let j = i + 1; j < info.satelliteIds.length; j++) {
          const mat = new Cesium.ColorMaterialProperty(color.withAlpha(0.15))
          const entity = this.viewer.entities.add({
            polyline: {
              positions: [],
              width: 1,
              material: mat,
            },
            show: false,
          })
          isls.push(entity)
          islMaterials.push(mat)
        }
      }

      const highlightEntities: Cesium.Entity[] = []
      for (const sat of memberSats) {
        const entity = this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(sat.longitude, sat.latitude, sat.altitude),
          point: {
            pixelSize: 14,
            color: color.withAlpha(0.6),
            outlineColor: color,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          show: false,
        })
        highlightEntities.push(entity)
      }

      const centroid = this.computeCentroid(memberSats)
      let coverageEntity: Cesium.Entity | null = null
      if (centroid) {
        const radius = info.coverageRadius * 1000
        coverageEntity = this.viewer.entities.add({
          position: new Cesium.CallbackPositionProperty(() => {
            const sats = useAppStore.getState().assetData
            const c = this.computeCentroid(
              info.satelliteIds.map((id) => sats.find((a) => a.id === id)).filter(Boolean) as Asset[],
            )
            return c ?? Cesium.Cartesian3.ZERO
          }, false),
          ellipse: {
            semiMinorAxis: radius,
            semiMajorAxis: radius,
            height: 0,
            fill: true,
            material: color.withAlpha(0.04),
            outline: true,
            outlineColor: color.withAlpha(0.15),
            outlineWidth: 1,
          },
          show: false,
        })
      }

      this.constStates.push({ info, islEntities: isls, islMaterials, memberHighlightEntities: highlightEntities, coverageEntity, color })
    }

    this.removeTickListener = this.viewer.scene.preRender.addEventListener(() => {
      this.tick()
    })
  }

  private tick(): void {
    const store = useAppStore.getState()
    const selectedId = store.selectedConstellationId
    const assets = store.assetData
    const assetMap = new Map(assets.map((a) => [a.id, a]))

    for (const cs of this.constStates) {
      const isSelected = cs.info.id === selectedId
      const members = cs.info.satelliteIds.map((id) => assetMap.get(id)).filter(Boolean) as Asset[]

      const range = islRange(cs.info.type)
      const alpha = isSelected ? 0.7 : 0.15
      const width = isSelected ? WIDTH_SELECTED : WIDTH_UNSELECTED

      let linkIdx = 0
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const entity = cs.islEntities[linkIdx]
          if (!entity) continue
          const a = members[i]; const b = members[j]
          const d = haversineKm(a.latitude, a.longitude, b.latitude, b.longitude)

          if (d <= range) {
            const srcPos = Cesium.Cartesian3.fromDegrees(a.longitude, a.latitude, a.altitude)
            const tgtPos = Cesium.Cartesian3.fromDegrees(b.longitude, b.latitude, b.altitude)
            entity.polyline!.positions = [srcPos, tgtPos] as unknown as Cesium.Property
            entity.polyline!.width = width
            cs.islMaterials[linkIdx].color = cs.color.withAlpha(alpha) as unknown as Cesium.Property
            entity.show = true
          } else {
            entity.show = false
          }
          linkIdx++
        }
      }

      for (const h of cs.memberHighlightEntities) h.show = isSelected

      if (cs.coverageEntity) {
        cs.coverageEntity.show = isSelected
      }
    }
  }

  private computeCentroid(sats: Asset[]): Cesium.Cartesian3 | null {
    if (sats.length === 0) return null
    let x = 0; let y = 0; let z = 0
    for (const sat of sats) {
      const pos = Cesium.Cartesian3.fromDegrees(sat.longitude, sat.latitude, sat.altitude)
      x += pos.x; y += pos.y; z += pos.z
    }
    return new Cesium.Cartesian3(x / sats.length, y / sats.length, z / sats.length)
  }

  setVisible(visible: boolean): void {
    super.setVisible(visible)
    for (const cs of this.constStates) {
      for (const e of cs.islEntities) e.show = visible
      for (const e of cs.memberHighlightEntities) e.show = false
      if (cs.coverageEntity) cs.coverageEntity.show = false
    }
  }

  clear(): void {
    if (this.removeTickListener) {
      this.removeTickListener()
      this.removeTickListener = null
    }
    for (const cs of this.constStates) {
      for (const e of cs.islEntities) this.viewer.entities.remove(e)
      for (const e of cs.memberHighlightEntities) this.viewer.entities.remove(e)
      if (cs.coverageEntity) this.viewer.entities.remove(cs.coverageEntity)
    }
    this.constStates = []
    super.clear()
  }

  destroy(): void {
    this.clear()
    super.destroy()
  }
}
