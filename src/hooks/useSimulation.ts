import { useEffect, useRef } from 'react'
import { allAssets, feed } from '@/mock-data'
import { useAppStore } from '@/store'
import { getSimulationManager } from '@/services/simulation'
import { getAlertManager } from '@/services/alert'

export function useSimulation(): void {
  const isPlaying = useAppStore((s) => s.isPlaying)
  const simulationSpeed = useAppStore((s) => s.simulationSpeed)
  const alertRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const state = useAppStore.getState()
    const manager = getSimulationManager()

    if (state.assetData.length === 0) {
      state.setAssetData(allAssets)
    }

    if (state.feedData.length === 0) {
      state.setFeedData(feed)
    }

    manager.initialize(allAssets, state.timelinePosition, {
      setAssetData: state.setAssetData,
      setTimelinePosition: state.setTimelinePosition,
    })

    const alertMgr = getAlertManager()
    alertMgr.initialize(allAssets)

    if (state.isPlaying) {
      manager.start()
    }

    return () => {
      manager.stop()
      alertMgr.reset()
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
