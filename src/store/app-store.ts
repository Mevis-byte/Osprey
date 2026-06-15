import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Asset, Alert, FeedEvent, Mission } from '@/types'
import type { AssetType, AssetStatus, ThreatLevel } from '@/types'

const ALL_ASSET_TYPES: AssetType[] = ['fixed-wing', 'rotary-wing', 'maritime', 'satellite', 'ground-vehicle', 'stationary']
const ALL_ASSET_STATUSES: AssetStatus[] = ['active', 'standby', 'offline', 'maintenance', 'unknown', 'lost']
const ALL_THREAT_LEVELS: ThreatLevel[] = ['none', 'low', 'medium', 'high', 'critical']
const ALL_FEED_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const

type FeedSeverity = (typeof ALL_FEED_SEVERITIES)[number]

interface Filters {
  assetTypes: Record<AssetType, boolean>
  assetStatuses: Record<AssetStatus, boolean>
  threatLevels: Record<ThreatLevel, boolean>
  feedSeverities: Record<FeedSeverity, boolean>
}

export type FilterCategory = keyof Filters
export type { Filters }

export type HeatmapLayerKey = 'assetDensity' | 'alertDensity' | 'missionActivity'

function initFilterRecord<T extends string>(keys: readonly T[], defaultValue = true): Record<T, boolean> {
  return keys.reduce((acc, key) => ({ ...acc, [key]: defaultValue }), {} as Record<T, boolean>)
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export interface AppStore {
  selectedAsset: Asset | null
  selectedMission: Mission | null
  activeFilters: Filters
  feedData: FeedEvent[]
  assetData: Asset[]
  alerts: Alert[]
  missions: Mission[]
  heatmapLayers: Record<HeatmapLayerKey, boolean>
  timelinePosition: number
  simulationSpeed: number
  isPlaying: boolean
  trailsVisible: boolean
  sensorConeVisible: boolean
  gridOverlayVisible: boolean
  trackingAssetId: string | null
  focusRequestId: string | null

  setSelectedAsset: (asset: Asset | null) => void
  setSelectedMission: (mission: Mission | null) => void
  setFeedData: (data: FeedEvent[]) => void
  setAssetData: (data: Asset[]) => void
  setTimelinePosition: (position: number) => void
  setSimulationSpeed: (speed: number) => void
  setPlaying: (playing: boolean) => void
  setTrailsVisible: (visible: boolean) => void
  toggleSensorCone: () => void
  toggleGridOverlay: () => void
  setTrackingAssetId: (id: string | null) => void
  requestFocus: (id: string | null) => void
  toggleFilter: (category: FilterCategory, value: string) => void
  resetFilters: () => void
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'acknowledgedBy'>) => void
  addFeedEvent: (event: Omit<FeedEvent, 'id'>) => void
  removeAlert: (id: string) => void
  acknowledgeAlert: (id: string, user: string) => void
  setMissions: (missions: Mission[]) => void
  toggleHeatmapLayer: (key: HeatmapLayerKey) => void
  setHeatmapLayers: (layers: Record<HeatmapLayerKey, boolean>) => void
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      selectedAsset: null,
      selectedMission: null,
      activeFilters: {
        assetTypes: initFilterRecord(ALL_ASSET_TYPES),
        assetStatuses: initFilterRecord(ALL_ASSET_STATUSES),
        threatLevels: initFilterRecord(ALL_THREAT_LEVELS),
        feedSeverities: initFilterRecord(ALL_FEED_SEVERITIES),
      },
      feedData: [],
      assetData: [],
      alerts: [],
      missions: [],
      heatmapLayers: { assetDensity: false, alertDensity: false, missionActivity: false },
      timelinePosition: Date.now(),
      simulationSpeed: 1,
      isPlaying: false,
      trailsVisible: true,
      sensorConeVisible: true,
      gridOverlayVisible: true,
      trackingAssetId: null,
      focusRequestId: null,

      setSelectedAsset: (asset) => set({ selectedAsset: asset }),

      setSelectedMission: (mission) => set({ selectedMission: mission }),

      setFeedData: (data) => set({ feedData: data }),

      setAssetData: (data) => set({ assetData: data }),

      setTimelinePosition: (position) => set({ timelinePosition: position }),

      setSimulationSpeed: (speed) => set({ simulationSpeed: Math.max(0, Math.min(64, speed)) }),

      setPlaying: (playing) => set({ isPlaying: playing }),

      setTrailsVisible: (visible) => set({ trailsVisible: visible }),

      toggleSensorCone: () => set({ sensorConeVisible: !get().sensorConeVisible }),
      toggleGridOverlay: () => set({ gridOverlayVisible: !get().gridOverlayVisible }),

      setTrackingAssetId: (id) => set({ trackingAssetId: id }),

      requestFocus: (id) => set({ focusRequestId: id }),

      toggleFilter: (category, value) => {
        const filters = get().activeFilters
        const record = filters[category]
        if (!(value in record)) return
        set({
          activeFilters: {
            ...filters,
            [category]: {
              ...record,
              [value]: !record[value as keyof typeof record],
            },
          },
        })
      },

      resetFilters: () =>
        set({
          activeFilters: {
            assetTypes: initFilterRecord(ALL_ASSET_TYPES),
            assetStatuses: initFilterRecord(ALL_ASSET_STATUSES),
            threatLevels: initFilterRecord(ALL_THREAT_LEVELS),
            feedSeverities: initFilterRecord(ALL_FEED_SEVERITIES),
          },
        }),

      addAlert: (partial) => {
        const alert: Alert = {
          ...partial,
          acknowledged: false,
          id: generateId(),
          timestamp: new Date().toISOString(),
        }
        set({ alerts: [...get().alerts, alert] })
      },

      addFeedEvent: (partial) => {
        const event: FeedEvent = {
          ...partial,
          id: generateId(),
        }
        set({ feedData: [...get().feedData, event] })
      },

      removeAlert: (id) =>
        set({ alerts: get().alerts.filter((a) => a.id !== id) }),

      acknowledgeAlert: (id, user) =>
        set({
          alerts: get().alerts.map((a) =>
            a.id === id ? { ...a, acknowledged: true, acknowledgedBy: user } : a,
          ),
        }),

      setMissions: (missions) => set({ missions }),

      toggleHeatmapLayer: (key) =>
        set({
          heatmapLayers: {
            ...get().heatmapLayers,
            [key]: !get().heatmapLayers[key],
          },
        }),

      setHeatmapLayers: (layers) => set({ heatmapLayers: layers }),
    }),
    { name: 'osprey-store' },
  ),
)
