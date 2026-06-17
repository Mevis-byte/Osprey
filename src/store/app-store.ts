import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Asset, Alert, FeedEvent, Geofence, GroundStation, Mission, ConstellationInfo, Region, OperationalMode, ProjectionMode } from '@/types'
import type { AssetType, AssetStatus, ThreatLevel } from '@/types'
import { constellations as constData } from '@/mock-data'
import { geofences as gfData } from '@/mock-data'
import { regions as regionData } from '@/mock-data'

const MAX_STORE_ENTRIES = 200

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

export interface LayerVisibility {
  satellites: boolean
  aircraft: boolean
  maritime: boolean
  groundStations: boolean
  coverageRings: boolean
  sensorCones: boolean
  commLinks: boolean
  tacticalGrid: boolean
  dayNight: boolean
  weather: boolean
  regions: boolean
  trails: boolean
  geofences: boolean
}

function initFilterRecord<T extends string>(keys: readonly T[], defaultValue = true): Record<T, boolean> {
  return keys.reduce((acc, key) => ({ ...acc, [key]: defaultValue }), {} as Record<T, boolean>)
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export interface AppStore {
  selectedAsset: Asset | null
  hoveredAsset: Asset | null
  selectedGroundStation: GroundStation | null
  selectedMission: Mission | null
  selectedConstellationId: string | null
  selectedGeofenceId: string | null
  operationalMode: OperationalMode
  constellations: ConstellationInfo[]
  regions: Region[]
  geofences: Geofence[]
  activeFilters: Filters
  feedData: FeedEvent[]
  assetData: Asset[]
  alerts: Alert[]
  missions: Mission[]
  heatmapLayers: Record<HeatmapLayerKey, boolean>
  layerVisibility: LayerVisibility
  timelinePosition: number
  simulationSpeed: number
  isPlaying: boolean
  trackingAssetId: string | null
  focusRequestId: string | null

  setSelectedAsset: (asset: Asset | null) => void
  setHoveredAsset: (asset: Asset | null) => void
  setSelectedGroundStation: (station: GroundStation | null) => void
  setSelectedMission: (mission: Mission | null) => void
  setSelectedConstellationId: (id: string | null) => void
  setSelectedGeofenceId: (id: string | null) => void
  setOperationalMode: (mode: OperationalMode) => void
  setConstellations: (data: ConstellationInfo[]) => void
  setRegions: (data: Region[]) => void
  setGeofences: (data: Geofence[]) => void
  setFeedData: (data: FeedEvent[]) => void
  setAssetData: (data: Asset[]) => void
  setTimelinePosition: (position: number) => void
  setSimulationSpeed: (speed: number) => void
  setPlaying: (playing: boolean) => void
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
  setLayerVisibility: (visibility: Partial<LayerVisibility>) => void
  toggleLayer: (key: keyof LayerVisibility) => void

  projectionMode: ProjectionMode
  setProjectionMode: (mode: ProjectionMode) => void

  sidebarLeft: { width: number; mode: 'expanded' | 'compact' | 'hidden' }
  sidebarRight: { width: number; mode: 'expanded' | 'compact' | 'hidden' }
  setSidebarLeftWidth: (width: number) => void
  setSidebarRightWidth: (width: number) => void
  setSidebarLeftMode: (mode: 'expanded' | 'compact' | 'hidden') => void
  setSidebarRightMode: (mode: 'expanded' | 'compact' | 'hidden') => void
  toggleSidebarLeft: () => void
  toggleSidebarRight: () => void
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        selectedAsset: null,
        hoveredAsset: null,
        selectedGroundStation: null,
        selectedMission: null,
        selectedConstellationId: null,
        selectedGeofenceId: null,
        operationalMode: 'global-surveillance',
        constellations: constData,
        regions: regionData,
        geofences: gfData,
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
        layerVisibility: {
          satellites: true,
          aircraft: true,
          maritime: true,
          groundStations: true,
          coverageRings: true,
          sensorCones: true,
          commLinks: true,
          tacticalGrid: true,
          dayNight: false,
          weather: false,
          regions: true,
          trails: true,
          geofences: true,
        },
        timelinePosition: Date.now(),
        simulationSpeed: 1,
        isPlaying: false,
        trackingAssetId: null,
        focusRequestId: null,
        sidebarLeft: { width: 360, mode: 'expanded' },
        sidebarRight: { width: 320, mode: 'expanded' },
        projectionMode: 'globe',

        setSelectedAsset: (asset) => set({ selectedAsset: asset }),
        setHoveredAsset: (asset) => set({ hoveredAsset: asset }),
        setSelectedGroundStation: (station) => set({ selectedGroundStation: station }),
        setSelectedMission: (mission) => set({ selectedMission: mission }),
        setSelectedConstellationId: (id) => set({ selectedConstellationId: id }),
        setSelectedGeofenceId: (id) => set({ selectedGeofenceId: id }),
        setOperationalMode: (mode) => set({ operationalMode: mode }),
        setConstellations: (data) => set({ constellations: data }),
        setRegions: (data) => set({ regions: data }),
        setGeofences: (data) => set({ geofences: data }),
        setFeedData: (data) => set({ feedData: data }),
        setAssetData: (data) => set({ assetData: data }),
        setTimelinePosition: (position) => set({ timelinePosition: position }),
        setSimulationSpeed: (speed) => set({ simulationSpeed: Math.max(0, Math.min(64, speed)) }),
        setPlaying: (playing) => set({ isPlaying: playing }),
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
          const alerts = [...get().alerts, alert]
          if (alerts.length > MAX_STORE_ENTRIES) alerts.splice(0, alerts.length - MAX_STORE_ENTRIES)
          set({ alerts })
        },

        addFeedEvent: (partial) => {
          const event: FeedEvent = {
            ...partial,
            id: generateId(),
          }
          const feedData = [...get().feedData, event]
          if (feedData.length > MAX_STORE_ENTRIES) feedData.splice(0, feedData.length - MAX_STORE_ENTRIES)
          set({ feedData })
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

        setLayerVisibility: (visibility) => 
          set({ layerVisibility: { ...get().layerVisibility, ...visibility } }),
        
        toggleLayer: (key) => 
          set({ layerVisibility: { ...get().layerVisibility, [key]: !get().layerVisibility[key] } }),

        setSidebarLeftWidth: (width) =>
          set({ sidebarLeft: { ...get().sidebarLeft, width: Math.max(280, Math.min(700, width)) } }),
        setSidebarRightWidth: (width) =>
          set({ sidebarRight: { ...get().sidebarRight, width: Math.max(280, Math.min(700, width)) } }),
        setSidebarLeftMode: (mode) =>
          set({ sidebarLeft: { ...get().sidebarLeft, mode } }),
        setSidebarRightMode: (mode) =>
          set({ sidebarRight: { ...get().sidebarRight, mode } }),
        toggleSidebarLeft: () => {
          const current = get().sidebarLeft
          const next: 'expanded' | 'compact' | 'hidden' =
            current.mode === 'expanded' ? 'compact' :
            current.mode === 'compact' ? 'hidden' : 'expanded'
          set({ sidebarLeft: { ...current, mode: next } })
        },
        toggleSidebarRight: () => {
          const current = get().sidebarRight
          const next: 'expanded' | 'compact' | 'hidden' =
            current.mode === 'expanded' ? 'compact' :
            current.mode === 'compact' ? 'hidden' : 'expanded'
          set({ sidebarRight: { ...current, mode: next } })
        },

        setProjectionMode: (mode) => set({ projectionMode: mode }),
      }),
      { 
        name: 'osprey-store',
        partialize: (state) => ({ 
          layerVisibility: state.layerVisibility,
          operationalMode: state.operationalMode,
          simulationSpeed: state.simulationSpeed,
          sidebarLeft: state.sidebarLeft,
          sidebarRight: state.sidebarRight,
          projectionMode: state.projectionMode,
        }),
      },
    ),
  ),
)
