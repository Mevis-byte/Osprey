import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import { allAssets } from '@/mock-data'
import { createEngine, setSimulationAssets } from '@/engine'
import { EventType } from '@/engine/core/types'

export function useEngine(): void {
  const isPlaying = useAppStore((s) => s.isPlaying)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const state = useAppStore.getState()
    const engine = createEngine()

    // Seed initial assets into store
    if (state.assetData.length === 0) {
      state.setAssetData(allAssets)
    }

    // Register simulation provider after assets are available
    setSimulationAssets(allAssets)

    // Initialize and start engine
    engine.initialize()

    // Wire engine events → Zustand
    const unsubAssetUpdates = engine.bus.subscribe(
      { types: [EventType.EntityUpdated] },
      (event) => {
        const payload = event.payload as { entityId: string }
        if (!payload?.entityId) return
        const entity = engine.repo.get(payload.entityId)
        if (!entity) return

        const existing = useAppStore.getState().assetData
        const idx = existing.findIndex((a) => a.id === entity.id)
        if (idx >= 0) {
          const updated = [...existing]
          updated[idx] = {
            ...updated[idx],
            latitude: entity.position.lat,
            longitude: entity.position.lon,
            altitude: entity.position.alt,
            speed: entity.velocity.speed,
            heading: entity.velocity.heading,
            lastUpdated: new Date(entity.source.lastUpdated).toISOString(),
          }
          useAppStore.getState().setAssetData(updated)
        }
      },
    )

    // Wire correlation/analytics events → feed + alerts
    const unsubFeedEvents = engine.bus.subscribe(
      { types: [EventType.CorrelationTriggered] },
      (event) => {
        const p = event.payload as { description: string; type: string; severity: string; involvedEntities?: string[] }
        if (!p?.description) return

        const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
          info: 'low',
          warning: 'medium',
          critical: 'high',
        }
        const severity = severityMap[p.severity] ?? 'low'

        useAppStore.getState().addFeedEvent({
          type: p.type === 'geofence-breach' ? 'movement' : 'intel',
          severity,
          title: p.description.split(':')[0] || p.type,
          body: p.description,
          timestamp: new Date().toISOString(),
          source: event.source,
          assetIds: p.involvedEntities ?? [],
          threatLevel: severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'medium',
        })
      },
    )

    // Start engine if simulation is already playing
    if (isPlaying) {
      engine.start()
    }

    return () => {
      unsubAssetUpdates()
      unsubFeedEvents()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // React to play/pause — start/stopsimulation providers on play state change
  useEffect(() => {
    const engine = createEngine()
    if (isPlaying) {
      engine.start().catch(() => {})
    }
  }, [isPlaying])
}
