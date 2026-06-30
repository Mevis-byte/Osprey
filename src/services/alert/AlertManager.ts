import type { Asset, Alert, FeedEvent } from '@/types'
import type { AppStore } from '@/store'

const COOLDOWN_MS: Record<string, number> = {
  'low-signal': 60000,
  'route-deviation': 45000,
  'high-speed': 60000,
  'lost-contact': 180000,
  'orbital-anomaly': 120000,
}

type AlertType = string

interface SystemEvent {
  type: FeedEvent['type']
  title: string
  body: string
}

export class AlertManager {
  private cooldowns = new Map<string, number>()
  private signalStrengths = new Map<string, number>()
  private prevHeadings = new Map<string, number>()
  private prevPositions = new Map<string, { lat: number; lon: number }>()

  initialize(assets: Asset[]): void {
    for (const asset of assets) {
      this.signalStrengths.set(asset.id, 70 + Math.random() * 28)
      this.prevHeadings.set(asset.id, asset.heading)
      this.prevPositions.set(asset.id, { lat: asset.latitude, lon: asset.longitude })
    }
  }

  reset(): void {
    this.cooldowns.clear()
    this.signalStrengths.clear()
    this.prevHeadings.clear()
    this.prevPositions.clear()
  }

  tick(now: number, assets: Asset[], dispatch: (fn: (store: AppStore) => void) => void): void {
    for (const asset of assets) {
      this.checkLowSignal(asset, now, dispatch)
      this.checkRouteDeviation(asset, now, dispatch)
      this.checkHighSpeed(asset, now, dispatch)
      this.checkLostContact(asset, now, dispatch)
      this.checkOrbitalAnomaly(asset, now, dispatch)
    }
  }

  private canFire(type: AlertType, assetId: string, now: number): boolean {
    const key = `${type}:${assetId}`
    const last = this.cooldowns.get(key) ?? 0
    const cd = COOLDOWN_MS[type]
    if (cd === undefined) return false
    if (now - last < cd) return false
    this.cooldowns.set(key, now)
    return true
  }

  private dispatch(
    asset: Asset,
    severity: Alert['severity'],
    event: SystemEvent,
    _alertType: string,
    dispatch: (fn: (store: AppStore) => void) => void,
  ): void {
    dispatch((store) => {
      store.addAlert({
        title: event.title,
        message: event.body,
        severity,
        assetIds: [asset.id],
      })
      store.addFeedEvent({
        type: event.type,
        severity,
        title: event.title,
        body: event.body,
        timestamp: new Date().toISOString(),
        source: asset.dataSource?.source ?? 'simulation-engine',
        assetIds: [asset.id],
        threatLevel: severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'medium',
      })
    })
  }

  private dist(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3
    const toRad = (d: number) => (d * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  private checkLowSignal(
    asset: Asset,
    now: number,
    dispatch: (fn: (store: AppStore) => void) => void,
  ): void {
    let signal = this.signalStrengths.get(asset.id) ?? 100
    signal += (Math.random() - 0.5) * 8
    if (asset.type === 'satellite') signal += (Math.random() - 0.5) * 4
    signal = Math.max(0, Math.min(100, signal))
    this.signalStrengths.set(asset.id, signal)

    if (signal < 25 && this.canFire('low-signal', asset.id, now)) {
      this.dispatch(asset, 'high', {
        type: 'status',
        title: `Signal degraded: ${asset.name}`,
        body: `Telemetry signal dropped to ${signal.toFixed(0)}% — ${asset.name} (${asset.id}). Source: ${asset.dataSource?.source ?? 'unknown'}.`,
      }, 'low-signal', dispatch)
    }
  }

  private checkRouteDeviation(
    asset: Asset,
    now: number,
    dispatch: (fn: (store: AppStore) => void) => void,
  ): void {
    if (asset.type === 'satellite') return

    const prev = this.prevHeadings.get(asset.id)
    if (prev === undefined) return

    const delta = Math.abs(asset.heading - prev)
    const normalized = delta > 180 ? 360 - delta : delta

    this.prevHeadings.set(asset.id, asset.heading)

    const threshold = asset.type === 'maritime' ? 30 : 20
    if (normalized > threshold && this.canFire('route-deviation', asset.id, now)) {
      const dir = asset.heading > prev ? 'starboard' : 'port'
      this.dispatch(asset, 'medium', {
        type: 'movement',
        title: `Route deviation: ${asset.name}`,
        body: `${asset.name} (${asset.id}) turned ${dir} ${normalized.toFixed(0)}° from previous heading ${prev.toFixed(0)}° → ${asset.heading.toFixed(0)}°.`,
      }, 'route-deviation', dispatch)
    }
  }

  private checkHighSpeed(
    asset: Asset,
    now: number,
    dispatch: (fn: (store: AppStore) => void) => void,
  ): void {
    const limits: Record<string, number> = {
      'fixed-wing': 700,
      'rotary-wing': 200,
      maritime: 30,
    }
    const limit = limits[asset.type]
    if (!limit) return

    if (asset.speed > limit && this.canFire('high-speed', asset.id, now)) {
      const pct = ((asset.speed / limit) * 100).toFixed(0)
      this.dispatch(asset, 'high', {
        type: 'movement',
        title: `Speed anomaly: ${asset.name}`,
        body: `${asset.name} (${asset.id}) at ${asset.speed.toFixed(0)} kts — ${pct}% of ${limit} kts threshold.`,
      }, 'high-speed', dispatch)
    }
  }

  private checkLostContact(
    asset: Asset,
    now: number,
    dispatch: (fn: (store: AppStore) => void) => void,
  ): void {
    if (asset.type === 'satellite') return

    const pos = this.prevPositions.get(asset.id)
    if (!pos) return

    const d = this.dist(pos.lat, pos.lon, asset.latitude, asset.longitude)

    const prob = d / 50000
    if (prob > Math.random() && this.canFire('lost-contact', asset.id, now)) {
      this.dispatch(asset, 'critical', {
        type: 'status',
        title: `Contact lost: ${asset.name}`,
        body: `Telemetry from ${asset.name} (${asset.id}) interrupted. Last position: ${asset.latitude.toFixed(2)}°, ${asset.longitude.toFixed(2)}°. Gap: ${(d / 1000).toFixed(1)} km.`,
      }, 'lost-contact', dispatch)
    }

    this.prevPositions.set(asset.id, { lat: asset.latitude, lon: asset.longitude })
  }

  private checkOrbitalAnomaly(
    asset: Asset,
    now: number,
    dispatch: (fn: (store: AppStore) => void) => void,
  ): void {
    if (asset.type !== 'satellite') return

    if (Math.random() > 0.008 || !this.canFire('orbital-anomaly', asset.id, now)) return

    const anomalies = [
      'attitude adjustment',
      'thermal fluctuation',
      'orbital decay rate deviation',
      'reaction wheel RPM spike',
      'star tracker interference',
    ]
    const detail = anomalies[Math.floor(Math.random() * anomalies.length)]

    this.dispatch(asset, 'high', {
      type: 'report',
      title: `Orbital event: ${asset.name}`,
      body: `${asset.name} (NORAD ${asset.noradId}): ${detail}. Altitude ${(asset.altitude / 1000).toFixed(0)} km, inclination ${asset.inclination.toFixed(1)}°.`,
    }, 'orbital-anomaly', dispatch)
  }

  getSignalStrength(assetId: string): number {
    return this.signalStrengths.get(assetId) ?? 100
  }
}

let instance: AlertManager | null = null

export function getAlertManager(): AlertManager {
  if (!instance) {
    instance = new AlertManager()
  }
  return instance
}
