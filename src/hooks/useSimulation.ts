import { useEffect, useRef } from 'react'
import { allAssets } from '@/mock-data'
import { useAppStore } from '@/store'
import { getSimulationManager } from '@/services/simulation'
import { getAlertManager } from '@/services/alert'
import { CelesTrakService } from '@/services/CelesTrakService'

export function useSimulation(): void {
  const isPlaying = useAppStore((s) => s.isPlaying)
  const simulationSpeed = useAppStore((s) => s.simulationSpeed)
  const alertRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const systemEventRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      const satCount = CelesTrakService.getInstance().getAllTLEs().size - 1 // exclude ISS fallback

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
