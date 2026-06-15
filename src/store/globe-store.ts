import { create } from 'zustand'
import type { Coordinates, GlobeViewMode } from '@/types'

interface GlobeStore {
  center: Coordinates
  zoom: number
  viewMode: GlobeViewMode
  setCenter: (coords: Coordinates) => void
  setZoom: (zoom: number) => void
  setViewMode: (mode: GlobeViewMode) => void
}

export const useGlobeStore = create<GlobeStore>((set) => ({
  center: { latitude: 0, longitude: 0, altitude: 10000000 },
  zoom: 1,
  viewMode: '3D',
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setViewMode: (viewMode) => set({ viewMode }),
}))
