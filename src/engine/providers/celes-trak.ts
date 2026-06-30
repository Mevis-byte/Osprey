import { EventType, type EngineEvent, type EntityBase } from '../core/types'
import { BaseProvider } from './interface'

interface CelesTrakTLEData {
  name: string
  line1: string
  line2: string
}

interface FetchResult {
  group: string
  ok: boolean
  status: number | null
  error: string | null
}

/**
 * Celestrak.org TLE provider.
 *
 * Fetches Two-Line Element sets for 4 satellite groups (stations, starlink,
 * gps-ops, galileo) and emits them as normalized entities.
 *
 * Groups are fetched in parallel. Per-group failures are tracked and reported
 * but never crash the provider.
 */

const GROUPS = ['stations', 'starlink', 'gps-ops', 'galileo'] as const

const FALLBACK_TLES: Record<string, CelesTrakTLEData> = {
  '25544': {
    name: 'ISS (ZARYA)',
    line1: '1 25544U 98067A   24167.54483863  .00017103  00000+0  31105-3 0  9990',
    line2: '2 25544  51.6406 186.1362 0004505  44.1578  54.3418 15.49896707458421',
  },
}

export class CelesTrakProvider extends BaseProvider {
  readonly id = 'celestrak'
  readonly displayName = 'CelesTrak TLE'
  protected intervalMs = 24 * 60 * 60 * 1000

  private tleCache = new Map<string, CelesTrakTLEData>()
  private fetchResults: FetchResult[] = []

  constructor(
    emitFn: (event: EngineEvent) => void,
    upsertFn: (entity: EntityBase) => void,
  ) {
    super(emitFn, upsertFn)
    // Seed fallback TLEs
    for (const [id, tle] of Object.entries(FALLBACK_TLES)) {
      this.tleCache.set(id, tle)
    }
  }

  async initialize(): Promise<void> {
    // TLE cache is pre-populated with fallbacks
  }

  async tick(now: number): Promise<void> {
    this.fetchResults = []
    this.emit({
      type: EventType.SourceRefreshed,
      timestamp: now,
      payload: { providerId: this.id, action: 'fetch-starting', groups: GROUPS },
      source: this.id,
    })

    await Promise.all(GROUPS.map(group => this.fetchGroup(group)))

    const ok = this.fetchResults.filter(r => r.ok).length
    const failed = this.fetchResults.filter(r => !r.ok)

    this.emit({
      type: EventType.SourceRefreshed,
      timestamp: Date.now(),
      payload: {
        providerId: this.id,
        action: 'fetch-complete',
        groupsAttempted: GROUPS.length,
        groupsOk: ok,
        groupsFailed: failed.length,
        results: this.fetchResults,
        totalCached: this.tleCache.size,
      },
      source: this.id,
    })

    if (failed.length > 0) {
      console.warn(
        `[CelesTrak] ${failed.length}/${GROUPS.length} groups failed:`,
        failed.map(r => `${r.group} (${r.status ?? 'timeout'})`).join(', '),
      )
    }
  }

  getTLE(noradId: string): CelesTrakTLEData | undefined {
    return this.tleCache.get(noradId)
  }

  getAllTLEs(): Map<string, CelesTrakTLEData> {
    return new Map(this.tleCache)
  }

  getFetchResults(): readonly FetchResult[] {
    return this.fetchResults
  }

  private async fetchGroup(group: string): Promise<void> {
    try {
      const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`
      const response = await fetch(url)

      if (!response.ok) {
        this.fetchResults.push({ group, ok: false, status: response.status, error: `HTTP ${response.status}` })
        return
      }

      const text = await response.text()
      this.parseTLE(text)
      this.fetchResults.push({ group, ok: true, status: response.status, error: null })
    } catch (err) {
      this.fetchResults.push({ group, ok: false, status: null, error: String(err) })
    }
  }

  private parseTLE(text: string): void {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 >= lines.length) break
      const name = lines[i]
      const line1 = lines[i + 1]
      const line2 = lines[i + 2]
      const noradId = line2.substring(2, 7).trim()
      this.tleCache.set(noradId, { name, line1, line2 })
    }
  }
}
