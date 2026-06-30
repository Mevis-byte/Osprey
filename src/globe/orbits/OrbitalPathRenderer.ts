import * as Cesium from 'cesium'
import { DEG2RAD, RAD2DEG } from '@/lib/constants'
import { useAppStore } from '@/store'
import type { Satellite } from '@/types'
import { ThemeColor } from '@/globe/layers/theme-colors'
const EARTH_RATE = 7.2921159e-5
const NUM_POINTS = 360
const HALF_POINTS = NUM_POINTS / 2
const POSITION_PIXEL_SIZE = 10

const SCRATCH_CART = new Cesium.Cartesian3()

interface OrbitThemeColors {
  past: Cesium.Color
  future: Cesium.Color
  hint: Cesium.Color
  position: Cesium.Color
}

function orbitTheme(altitude: number): OrbitThemeColors {
  if (altitude < 2000000) {
    return { past: ThemeColor.orbitPast, future: ThemeColor.orbitFuture, hint: ThemeColor.orbitHint, position: ThemeColor.orbitPosition }
  }
  if (altitude < 35786000) {
    return { past: ThemeColor.orbitPastMid, future: ThemeColor.orbitFutureMid, hint: ThemeColor.orbitHintMid, position: ThemeColor.orbitPositionMid }
  }
  return { past: ThemeColor.orbitPastHigh, future: ThemeColor.orbitFutureHigh, hint: ThemeColor.orbitHintHigh, position: ThemeColor.orbitPositionHigh }
}

function computePhase(latitude: number, inclination: number): number {
  const incRad = inclination * DEG2RAD
  const latRad = latitude * DEG2RAD
  const val = Math.sin(latRad) / Math.sin(incRad)
  const phase = Math.asin(Math.max(-1, Math.min(1, val)))
  return isNaN(phase) ? 0 : phase
}

function computeAscendingNode(
  longitude: number, latitude: number, inclination: number,
): number {
  const phase = computePhase(latitude, inclination)
  const incRad = inclination * DEG2RAD
  const lonAtPhase = Math.atan2(
    Math.cos(incRad) * Math.sin(phase),
    Math.cos(phase),
  )
  return longitude * DEG2RAD - lonAtPhase
}

function generateOrbitPositions(
  inclination: number, altitude: number,
  ascendingNode: number, orbitalRate: number,
): Cesium.Cartesian3[] {
  const positions: Cesium.Cartesian3[] = []
  for (let i = 0; i < NUM_POINTS; i++) {
    const phase = (i / NUM_POINTS) * 2 * Math.PI
    const incRad = inclination * DEG2RAD
    const latRad = Math.asin(Math.sin(incRad) * Math.sin(phase))
    const lat = latRad * RAD2DEG
    const lonRad = ascendingNode + Math.atan2(
      Math.cos(incRad) * Math.sin(phase),
      Math.cos(phase),
    ) - EARTH_RATE * (phase / orbitalRate)
    const lon = ((lonRad * RAD2DEG) + 540) % 360 - 180
    positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, altitude))
  }
  return positions
}

function findClosestIndex(
  pos: Cesium.Cartesian3, orbit: Cesium.Cartesian3[],
): number {
  let minDist = Infinity
  let minIdx = 0
  for (let i = 0; i < orbit.length; i++) {
    const d = Cesium.Cartesian3.distance(pos, orbit[i])
    if (d < minDist) { minDist = d; minIdx = i }
  }
  return minIdx
}

interface SatelliteOrbitData {
  pastEntity: Cesium.Entity
  futureEntity: Cesium.Entity
  hintEntity: Cesium.Entity
  positionEntity: Cesium.Entity
  orbitPositions: Cesium.Cartesian3[]
  color: Cesium.Color
  altitude: number
  inclination: number
  ascendingNode: number
  orbitalRate: number
}

export class OrbitalPathRenderer {
  private viewer: Cesium.Viewer
  private orbits = new Map<string, SatelliteOrbitData>()
  private removeListener: (() => void) | null = null

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer
  }

  init(): void {
    const state = useAppStore.getState()
    for (const asset of state.assetData) {
      if (asset.type !== 'satellite') continue
      const sat = asset as Satellite
      this.addSatellite(sat)
    }
    this.removeListener = this.viewer.scene.preRender.addEventListener(() => {
      this.tick()
    })
  }

  setSelected(id: string | null): void {
    for (const [satId, data] of this.orbits) {
      const isSelected = satId === id
      data.pastEntity.show = isSelected
      data.futureEntity.show = isSelected
      data.hintEntity.show = !isSelected
      data.positionEntity.show = isSelected
    }
    this.viewer.scene.requestRender()
  }

  destroy(): void {
    if (this.removeListener) {
      this.removeListener()
      this.removeListener = null
    }
    for (const data of this.orbits.values()) {
      this.viewer.entities.remove(data.pastEntity)
      this.viewer.entities.remove(data.futureEntity)
      this.viewer.entities.remove(data.hintEntity)
      this.viewer.entities.remove(data.positionEntity)
    }
    this.orbits.clear()
  }

  private addSatellite(sat: Satellite): void {
    const theme = orbitTheme(sat.altitude)
    const ascendingNode = computeAscendingNode(sat.longitude, sat.latitude, sat.inclination)
    const orbitalRate = (2 * Math.PI) / (sat.period * 60)
    const orbitPositions = generateOrbitPositions(
      sat.inclination, sat.altitude, ascendingNode, orbitalRate,
    )

    const pastEntity = this.viewer.entities.add({
      polyline: {
        positions: [],
        width: 1.5,
        material: new Cesium.ColorMaterialProperty(theme.past),
      },
      show: false,
    })

    const futureEntity = this.viewer.entities.add({
      polyline: {
        positions: [],
        width: 2,
        material: new Cesium.ColorMaterialProperty(theme.future),
      },
      show: false,
    })

    const hintEntity = this.viewer.entities.add({
      polyline: {
        positions: orbitPositions,
        width: 1,
        material: new Cesium.ColorMaterialProperty(theme.hint),
      },
      show: true,
    })

    const basePos = Cesium.Cartesian3.fromDegrees(sat.longitude, sat.latitude, sat.altitude)
    const positionEntity = this.viewer.entities.add({
      position: basePos,
      point: {
        pixelSize: POSITION_PIXEL_SIZE,
        color: theme.position,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      show: false,
    })

    this.orbits.set(sat.id, {
      pastEntity, futureEntity, hintEntity, positionEntity,
      orbitPositions, color: theme.position, altitude: sat.altitude,
      inclination: sat.inclination, ascendingNode, orbitalRate,
    })
  }

  private tick(): void {
    const state = useAppStore.getState()
    for (const [satId, data] of this.orbits) {
      const asset = state.assetData.find((a) => a.id === satId) as Satellite | undefined
      if (!asset) continue

      const pos = Cesium.Cartesian3.fromDegrees(
        asset.longitude, asset.latitude, asset.altitude,
        Cesium.Ellipsoid.WGS84, SCRATCH_CART,
      )

      if (data.positionEntity.show) {
        ;(data.positionEntity.position as Cesium.ConstantPositionProperty).setValue(pos)
      }

      if (!data.pastEntity.show && !data.futureEntity.show) continue

      const idx = findClosestIndex(pos, data.orbitPositions)
      const pastPositions: Cesium.Cartesian3[] = []
      const futurePositions: Cesium.Cartesian3[] = []

      for (let i = 0; i <= HALF_POINTS; i++) {
        const pi = (idx - HALF_POINTS + i + NUM_POINTS) % NUM_POINTS
        pastPositions.push(data.orbitPositions[pi])
      }
      for (let i = 0; i <= HALF_POINTS; i++) {
        const fi = (idx + i) % NUM_POINTS
        futurePositions.push(data.orbitPositions[fi])
      }

      data.pastEntity.polyline!.positions = pastPositions as unknown as Cesium.Property
      data.futureEntity.polyline!.positions = futurePositions as unknown as Cesium.Property
    }
  }
}
