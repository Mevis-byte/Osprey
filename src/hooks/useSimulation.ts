import { useEffect, useRef } from 'react'
import { allAssets } from '@/mock-data'
import { useAppStore } from '@/store'
import { getSimulationManager } from '@/services/simulation'
import { getAlertManager } from '@/services/alert'
import { CelesTrakService } from '@/services/CelesTrakService'

function seedFeedEvents(): void {
  const assetData = useAppStore.getState().assetData
  if (assetData.length === 0) return

  const aircraft = assetData.filter(a => a.type === 'fixed-wing' || a.type === 'rotary-wing')
  const maritime = assetData.filter(a => a.type === 'maritime')
  const satellites = assetData.filter(a => a.type === 'satellite')

  const now = Date.now()
  const store = useAppStore.getState()

  const add = (
    type: 'intel' | 'status' | 'movement' | 'report',
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    body: string,
    assetIds: string[],
    offsetMinutes: number,
    threatLevel: 'low' | 'medium' | 'high' | 'critical',
  ): void => {
    store.addFeedEvent({
      type,
      severity,
      title,
      body,
      timestamp: new Date(now - offsetMinutes * 60000).toISOString(),
      source: 'OSPREY Simulation Engine',
      assetIds,
      threatLevel,
    })
  }

  // ── Aircraft (25 events) ──
  for (let i = 0; i < 25; i++) {
    const a = aircraft[i % aircraft.length]
    const sev: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'low', 'low', 'medium']
    add(
      'movement',
      sev[i % sev.length],
      `Position update: ${a.name}`,
      `${a.name} (${a.id}) — ${a.latitude.toFixed(2)}°N, ${a.longitude.toFixed(2)}°W, FL${(a.altitude / 100).toFixed(0)}, ${a.speed} kts, HDG ${a.heading}°`,
      [a.id],
      i * 0.3,
      'low',
    )
  }

  // ── Maritime (25 events) ──
  for (let i = 0; i < 25; i++) {
    const m = maritime[i % maritime.length]
    const sev: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'low', 'medium']
    add(
      'movement',
      sev[i % sev.length],
      `Vessel report: ${m.name}`,
      `${m.name} (${m.id}) — ${m.latitude.toFixed(2)}°N, ${m.longitude.toFixed(2)}°W, ${m.speed} kts, HDG ${m.heading}°, draft ${(m as any).draft ?? 'N/A'}m`,
      [m.id],
      i * 0.3,
      'low',
    )
  }

  // ── Satellite (25 events) ──
  for (let i = 0; i < 25; i++) {
    const s = satellites[i % satellites.length]
    const passTypes: ('status' | 'report')[] = ['status', 'report', 'status']
    add(
      passTypes[i % passTypes.length],
      'low',
      `Orbital pass: ${s.name}`,
      `${s.name} (${s.id}) — alt ${(s.altitude / 1000).toFixed(0)} km, inclination ${(s as any).inclination ?? 'N/A'}°, period ${(s as any).period ?? 'N/A'} min`,
      [s.id],
      i * 0.3,
      'low',
    )
  }

  // ── Signals / Intel (25 events) ──
  const intelTemplates = [
    { title: 'SIGINT intercept: HF band activity', body: 'Increased HF radio activity detected across sector 7. Possible coordinated communications.' },
    { title: 'ELINT: Radar emission profile', body: 'Surface search radar emission logged at 3.2 GHz. Classification: naval surveillance.' },
    { title: 'COMINT: Encrypted burst transmission', body: 'Short-duration encrypted burst on military UHF band. Origin triangulation in progress.' },
    { title: 'SIGINT: AIS transponder gap', body: 'AIS transponder间歇 detected for 14 min on vessel track. Possible dark transit.' },
    { title: 'ELINT: Emissions spike', body: 'Unusual electromagnetic emission spike in L-band. Potential jammer or radar test.' },
    { title: 'COMINT: Voice comms intercepted', body: 'Voice communications intercepted on known military freq. Language: unidentified.' },
    { title: 'SIGINT: Data link handshake', body: 'Link-16 style data link handshake detected. Possible fighter patrol area.' },
    { title: 'ELINT: Passive sensor detection', body: 'Passive RF sensor detected emitter sweep. Classified as fire-control radar.' },
    { title: 'COMINT: Coordinated net activity', body: 'Multiple nodes synchronizing on secure net. Possible exercise or op.' },
    { title: 'SIGINT: Satcom uplink', body: 'Burst satcom uplink detected on Ku-band. Short duration, high bandwidth.' },
  ]

  for (let i = 0; i < 25; i++) {
    const tpl = intelTemplates[i % intelTemplates.length]
    const sev: ('low' | 'medium' | 'high')[] = ['low', 'low', 'medium']
    const source = ['COMINT', 'SIGINT', 'ELINT'][i % 3]
    add(
      'intel',
      sev[i % sev.length],
      tpl.title,
      `${tpl.body} [${source}] — assessed confidence ${(70 + Math.random() * 20).toFixed(0)}%`,
      [],
      i * 0.3,
      'medium',
    )
  }
}

export function useSimulation(): void {
  const isPlaying = useAppStore((s) => s.isPlaying)
  const simulationSpeed = useAppStore((s) => s.simulationSpeed)
  const alertRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const systemEventRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const seededRef = useRef(false)

  function addSystemEvent(type: 'intel' | 'status' | 'movement' | 'report', title: string, body: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const store = useAppStore.getState()
    store.addFeedEvent({
      type,
      severity,
      title,
      body,
      timestamp: new Date().toISOString(),
      source: 'system',
      assetIds: [],
      threatLevel: severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'medium',
    })
  }

  useEffect(() => {
    const state = useAppStore.getState()
    const manager = getSimulationManager()
    const alertMgr = getAlertManager()

    const init = async () => {
      if (state.assetData.length === 0) {
        state.setAssetData(allAssets)
      }

      await manager.initialize(allAssets, state.timelinePosition, {
        setAssetData: state.setAssetData,
        setTimelinePosition: state.setTimelinePosition,
      })
      const results = CelesTrakService.getInstance().getFetchResults()

      if (results.length > 0) {
        const ok = results.filter(r => r.ok).length
        const failed = results.filter(r => !r.ok)
        const newCount = CelesTrakService.getInstance().getAllTLEs().size
        addSystemEvent(
          failed.length > 0 ? 'report' : 'status',
          failed.length > 0
            ? `TLE data partially updated`
            : `TLE data refreshed`,
          failed.length > 0
            ? `${newCount} satellite ephemerides cached from celestrak.org (${ok}/${results.length} groups OK; failed: ${failed.map(r => `${r.group} (HTTP ${r.status ?? 'timeout'})`).join(', ')})`
            : `${newCount - 1} satellite ephemerides updated from celestrak.org (${ok} groups). Next refresh in 24h.`,
          failed.length > 0 ? 'high' : 'low',
        )
      }

      alertMgr.initialize(allAssets)

      // Seed 25 feed events per category using actual asset data
      if (!seededRef.current) {
        seededRef.current = true
        seedFeedEvents()
      }

      if (state.isPlaying) {
        manager.start()
      }
    }

    init()

    return () => {
      manager.stop()
      alertMgr.reset()
    }
  }, [])

  // System activity heartbeat — periodic status events
  useEffect(() => {
    systemEventRef.current = setInterval(() => {
      const store = useAppStore.getState()
      const assetCount = store.assetData.length
      const feedCount = store.feedData.length
      const satCount = CelesTrakService.getInstance().getAllTLEs().size - 1

      addSystemEvent(
        'status',
        `Simulation tick: ${assetCount} assets active`,
        `${assetCount} tracked assets (${satCount} with TLE ephemeris). ${feedCount} feed events in buffer.`,
        'low',
      )
    }, 60000)

    return () => {
      if (systemEventRef.current) {
        clearInterval(systemEventRef.current)
        systemEventRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const manager = getSimulationManager()
    if (isPlaying) {
      manager.start()
    } else {
      manager.stop()
    }
  }, [isPlaying])

  useEffect(() => {
    getSimulationManager().setSpeed(simulationSpeed)
  }, [simulationSpeed])

  useEffect(() => {
    if (alertRef.current) {
      clearInterval(alertRef.current)
      alertRef.current = null
    }

    if (!isPlaying) return

    alertRef.current = setInterval(() => {
      const state = useAppStore.getState()
      getAlertManager().tick(Date.now(), state.assetData, (fn) => fn(useAppStore.getState()))
    }, 3000)

    return () => {
      if (alertRef.current) {
        clearInterval(alertRef.current)
        alertRef.current = null
      }
    }
  }, [isPlaying])
}
