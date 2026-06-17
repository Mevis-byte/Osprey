import * as Cesium from 'cesium'
import { BaseLayer } from './BaseLayer'
import { useAppStore } from '@/store'
import type { Asset, FeedEvent, Alert } from '@/types'
import { EVENT_LABEL_DISTANCE } from './label-styles'

const EVENT_LIFETIME_MS = 10000
const FADE_IN_MS = 400
const FADE_OUT_MS = 600

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

const EVENT_LABEL: Record<string, string> = {
  intel: 'Signal Acquired',
  status: 'Route Change',
  movement: 'Satellite Pass',
  report: 'Mission Started',
  alert: 'Alert Triggered',
}

interface ActiveMarker {
  id: string
  entityId: string
  assetId: string
  createdAt: number
  point: Cesium.Entity
  label: Cesium.Entity
  ring: Cesium.Entity
  animatingOut: boolean
}

const SEEN_IDS_RETENTION_MS = EVENT_LIFETIME_MS * 3

export class EventMarkerLayer extends BaseLayer {
  private markers: ActiveMarker[] = []
  private seenTimestamps = new Map<string, number>()
  private removeTickListener: (() => void) | null = null

  constructor(viewer: Cesium.Viewer) {
    super(viewer, 'event-marker', 'Event Marker')
  }

  load(_assets: Asset[]): void {
    this.removeTickListener = this.viewer.scene.preRender.addEventListener(() => {
      this.tick()
    })
  }

  private tick(): void {
    const now = performance.now()
    const store = useAppStore.getState()

    for (const ev of store.feedData) {
      this.ingestEvent(ev, now, store)
    }

    for (const alert of store.alerts) {
      this.ingestAlert(alert, now, store)
    }

    const pruneBefore = now - SEEN_IDS_RETENTION_MS
    for (const [id, ts] of this.seenTimestamps) {
      if (ts < pruneBefore) this.seenTimestamps.delete(id)
    }

    for (let i = this.markers.length - 1; i >= 0; i--) {
      const m = this.markers[i]
      const age = now - m.createdAt

      if (age > EVENT_LIFETIME_MS) {
        this.removeMarker(i)
        continue
      }

      this.updateMarker(m, age, now)
    }
  }

  private ingestEvent(ev: FeedEvent, now: number, _store: any): void {
    if (this.seenTimestamps.has(ev.id)) return
    this.seenTimestamps.set(ev.id, now)

    const store = useAppStore.getState()
    const asset = this.findAsset(ev.assetIds, store)
    if (!asset) return

    const severity = ev.severity
    const title = EVENT_LABEL[ev.type] ?? ev.type

    this.spawnMarker(`event-${ev.id}`, asset, severity, title, now)
  }

  private ingestAlert(alert: Alert, now: number, store: any): void {
    const markerId = `alert-${alert.id}`
    if (this.seenTimestamps.has(markerId)) return
    this.seenTimestamps.set(markerId, now)

    const asset = this.findAsset(alert.assetIds, store)
    if (!asset) return

    this.spawnMarker(markerId, asset, alert.severity, alert.title, now)
  }

  private findAsset(assetIds: string[], store: any): Asset | undefined {
    for (const id of assetIds) {
      const a = store.assetData.find((x: Asset) => x.id === id)
      if (a) return a
    }
    return undefined
  }

  private spawnMarker(
    entityId: string,
    asset: Asset,
    severity: string,
    title: string,
    now: number,
  ): void {
    const color = Cesium.Color.fromCssColorString(SEVERITY_COLORS[severity] ?? '#6b7280')
    const pos = Cesium.Cartesian3.fromDegrees(asset.longitude, asset.latitude, asset.altitude)

    const point = this.viewer.entities.add({
      id: entityId,
      position: pos,
      point: {
        pixelSize: 0,
        color: color,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
        outlineWidth: 1.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })

    const label = this.viewer.entities.add({
      position: pos,
      label: this.createLabel(title, {
        fillColor: color,
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(10, 0),
        distanceDisplayCondition: EVENT_LABEL_DISTANCE,
      }),
    })

    const ring = this.viewer.entities.add({
      position: pos,
      ellipse: {
        semiMinorAxis: 1500,
        semiMajorAxis: 1500,
        height: 0,
        fill: true,
        material: color.withAlpha(0.10),
        outline: true,
        outlineColor: color.withAlpha(0.25),
        outlineWidth: 1,
      },
    })

    this.markers.push({
      id: entityId,
      entityId,
      assetId: asset.id,
      createdAt: now,
      point,
      label,
      ring,
      animatingOut: false,
    })
  }

  private updateMarker(m: ActiveMarker, age: number, _now: number): void {
    const remaining = EVENT_LIFETIME_MS - age

    if (age < FADE_IN_MS) {
      const t = age / FADE_IN_MS
      const ease = 1 - (1 - t) ** 2
      m.point.point!.pixelSize = new Cesium.ConstantProperty(ease * 8)
      m.label.label!.showBackground = new Cesium.ConstantProperty(true)
      const bg = Cesium.Color.fromCssColorString('#0a0c12').withAlpha(0.65 * ease)
      m.label.label!.backgroundColor = bg as unknown as Cesium.Property
    }
 else if (remaining < FADE_OUT_MS) {
      const t = remaining / FADE_OUT_MS
      const ease = t * t
      m.point.point!.pixelSize = new Cesium.ConstantProperty(ease * 8)
      if (ease < 0.05) {
        m.point.show = false
        m.label.show = false
        m.ring.show = false
      }
    } else {
      m.point.point!.pixelSize = new Cesium.ConstantProperty(8)
    }
  }

  private removeMarker(index: number): void {
    const m = this.markers[index]
    this.viewer.entities.remove(m.point)
    this.viewer.entities.remove(m.label)
    this.viewer.entities.remove(m.ring)
    this.markers.splice(index, 1)
  }

  getAssetIdForEntity(entityId: string): string | null {
    for (const m of this.markers) {
      if (m.entityId === entityId) return m.assetId
    }
    return null
  }

  clear(): void {
    if (this.removeTickListener) {
      this.removeTickListener()
      this.removeTickListener = null
    }
    for (const m of this.markers) {
      this.viewer.entities.remove(m.point)
      this.viewer.entities.remove(m.label)
      this.viewer.entities.remove(m.ring)
    }
    this.markers = []
    this.seenTimestamps.clear()
    super.clear()
  }

  destroy(): void {
    this.clear()
    super.destroy()
  }
}
