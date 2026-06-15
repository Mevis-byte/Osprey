import type { Asset, Alert } from '@/types'
import type { AppStore } from '@/store'

const SOURCES = {
  'low-signal': ['SIGMON-ALPHA', 'COMM-FWD', 'SIGINT-FWD'],
  'route-deviation': ['FMP-TRACK', 'NAV-CONTROL', 'CRC-TABOR'],
  'high-speed': ['SPEED-GATE', 'RADAR-2', 'FMP-SHARE'],
  'lost-contact': ['COMM-LINK', 'SATCOM-1', 'EWS-DELTA'],
  'orbital-anomaly': ['ORB-SENSOR', 'SSC-SPACE', 'NRO-DSO'],
} as const

const COOLDOWN_MS: Record<string, number> = {
  'low-signal': 60000,
  'route-deviation': 45000,
  'high-speed': 60000,
  'lost-contact': 180000,
  'orbital-anomaly': 120000,
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

type AlertType = keyof typeof SOURCES

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
    if (now - last < cd) return false
    this.cooldowns.set(key, now)
    return true
  }

  private dispatchAlert(
    asset: Asset,
    severity: Alert['severity'],
    title: string,
    message: string,
    feedType: 'intel' | 'status' | 'movement' | 'report',
    feedTitle: string,
    feedBody: string,
    threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical',
    sourceKey: AlertType,
    dispatch: (fn: (store: AppStore) => void) => void,
  ): void {
    dispatch((store) => {
      store.addAlert({ title, message, severity, assetIds: [asset.id] })
      store.addFeedEvent({
        type: feedType,
        severity,
        title: feedTitle,
        body: feedBody,
        timestamp: new Date().toISOString(),
        source: pick(SOURCES[sourceKey]),
        assetIds: [asset.id],
        threatLevel,
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
      this.dispatchAlert(
        asset,
        'high',
        `Low Signal — ${asset.name}`,
        `Telemetry signal dropped to ${signal.toFixed(0)}%. Data latency increasing.`,
        'status',
        `Signal Degraded: ${asset.name}`,
        `${asset.name} signal strength critically low at ${signal.toFixed(0)}%. Possible jamming or atmospheric interference.`,
        'medium',
        'low-signal',
        dispatch,
      )
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
      this.dispatchAlert(
        asset,
        'medium',
        `Course Change — ${asset.name}`,
        `${asset.name} turned ${dir} ${normalized.toFixed(0)}° off projected track.`,
        'movement',
        `Route Deviation: ${asset.name}`,
        `${asset.name} deviated ${normalized.toFixed(0)}° ${dir} from expected heading. Possible diversion or evasion.`,
        'medium',
        'route-deviation',
        dispatch,
      )
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
      this.dispatchAlert(
        asset,
        'high',
        `Excessive Speed — ${asset.name}`,
        `${asset.name} at ${asset.speed.toFixed(0)} kts (${pct}% of threshold). Notify command.`,
        'movement',
        `High Speed Alert: ${asset.name}`,
        `${asset.name} recorded at ${asset.speed.toFixed(0)} kts, exceeding standard limits. Possible emergency or pursuit.`,
        'high',
        'high-speed',
        dispatch,
      )
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
      this.dispatchAlert(
        asset,
        'critical',
        `Contact Lost — ${asset.name}`,
        `All communications with ${asset.name} ceased. Last known position: ${asset.latitude.toFixed(2)}, ${asset.longitude.toFixed(2)}.`,
        'status',
        `Lost Contact: ${asset.name}`,
        `Communications with ${asset.name} lost. Search and recovery procedures initiated. Last telemetry indicated normal operations.`,
        'critical',
        'lost-contact',
        dispatch,
      )
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
      'unexpected attitude adjustment detected',
      'thermal fluctuation in panel array',
      'orbital decay rate above nominal',
      'reaction wheel RPM spike',
      'star tracker interference',
    ]
    const detail = pick(anomalies)

    this.dispatchAlert(
      asset,
      'high',
      `Orbital Anomaly — ${asset.name}`,
      `${asset.name}: ${detail}. Diagnostics requested.`,
      'report',
      `Orbital Anomaly: ${asset.name}`,
      `Satellite ${asset.name} (NORAD ${asset.noradId}): ${detail}. Ground control notified.`,
      'high',
      'orbital-anomaly',
      dispatch,
    )
  }
}

let instance: AlertManager | null = null

export function getAlertManager(): AlertManager {
  if (!instance) {
    instance = new AlertManager()
  }
  return instance
}
