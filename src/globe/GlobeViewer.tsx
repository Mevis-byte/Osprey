import { useEffect, useRef, useState, useCallback } from 'react'
import * as Cesium from 'cesium'
import { motion, AnimatePresence } from 'framer-motion'
import { allAssets, missions } from '@/mock-data'
import { useAppStore } from '@/store'
import { AircraftLayer, MaritimeLayer, SatelliteLayer } from './layers'
import { TrailRenderer, assetTypeColor } from './trails/TrailRenderer'
import { HeatmapManager } from './heatmap'
import { SatelliteTooltip } from './tooltip/SatelliteTooltip'
import { SatelliteCoverageRings } from './coverage/SatelliteCoverageRings'
import { SatelliteSensorCone } from './coverage/SatelliteSensorCone'
import { SatelliteCoverageGrid } from './coverage/SatelliteCoverageGrid'
import { OrbitalPathRenderer } from './orbits/OrbitalPathRenderer'
import { TacticalGridOverlay } from './grid/TacticalGridOverlay'

import { getSimulationManager } from '@/services/simulation'
import type { Layer } from './layers'
import type { Asset, Satellite } from '@/types'

const CESIUM_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN

if (CESIUM_TOKEN) {
  Cesium.Ion.defaultAccessToken = CESIUM_TOKEN
}

const DARK_BACKGROUND = Cesium.Color.fromCssColorString('#0a0c12')
const GLOBE_BASE_COLOR = Cesium.Color.fromCssColorString('#0f1219')

const CARTO_DARK_PROVIDER = new Cesium.UrlTemplateImageryProvider({
  url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{@2x}.png',
  credit: 'CartoDB',
  maximumLevel: 19,
})

const assetMap = new Map<string, Asset>(allAssets.map((a) => [a.id, a]))

async function initTerrain(): Promise<Cesium.TerrainProvider> {
  try {
    return await Cesium.createWorldTerrainAsync()
  } catch {
    return new Cesium.EllipsoidTerrainProvider()
  }
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  asset: Asset | null
}

function GlobeViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const layersRef = useRef<Layer[]>([])
  const trailRendererRef = useRef<TrailRenderer | null>(null)
  const heatmapManagerRef = useRef<HeatmapManager | null>(null)
  const coverageRingsRef = useRef<SatelliteCoverageRings | null>(null)
  const sensorConeRef = useRef<SatelliteSensorCone | null>(null)
  const coverageGridRef = useRef<SatelliteCoverageGrid | null>(null)
  const orbitalPathRef = useRef<OrbitalPathRenderer | null>(null)
  const gridOverlayRef = useRef<TacticalGridOverlay | null>(null)
  const selectedIdRef = useRef<string | null>(null)

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    asset: null,
  })

  const setSelectedAsset = useAppStore((s) => s.setSelectedAsset)
  const selectedAsset = useAppStore((s) => s.selectedAsset)
  const selectedId = selectedAsset?.id ?? null
  const assetData = useAppStore((s) => s.assetData)
  const trailsVisible = useAppStore((s) => s.trailsVisible)
  const sensorConeVisible = useAppStore((s) => s.sensorConeVisible)
  const gridOverlayVisible = useAppStore((s) => s.gridOverlayVisible)
  const trackingAssetId = useAppStore((s) => s.trackingAssetId)
  const setTrackingAssetId = useAppStore((s) => s.setTrackingAssetId)
  const focusRequestId = useAppStore((s) => s.focusRequestId)
  const requestFocus = useAppStore((s) => s.requestFocus)

  const flyToAsset = useCallback((asset: Asset, onComplete?: () => void) => {
    const viewer = viewerRef.current
    if (!viewer) {
      onComplete?.()
      return
    }

    const offset = Math.max(asset.altitude * 0.15, 10000)
    const destination = Cesium.Cartesian3.fromDegrees(
      asset.longitude,
      asset.latitude,
      asset.altitude + offset,
    )

    viewer.camera.flyTo({
      destination,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 1.2,
      complete: onComplete,
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || viewerRef.current) return

    const viewer = new Cesium.Viewer(container, {
      baseLayerPicker: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      selectionIndicator: false,
      skyAtmosphere: false,
      creditContainer: document.createElement('div'),
    })

    viewer.imageryLayers.removeAll()
    viewer.imageryLayers.addImageryProvider(CARTO_DARK_PROVIDER)

    viewer.scene.globe.baseColor = GLOBE_BASE_COLOR
    viewer.scene.backgroundColor = DARK_BACKGROUND

    viewer.scene.skyBox?.destroy()
    viewer.scene.skyBox = undefined as unknown as Cesium.SkyBox

    const controller = viewer.scene.screenSpaceCameraController
    controller.minimumZoomDistance = 1000
    controller.maximumZoomDistance = 50000000
    controller.zoomEventTypes = [
      Cesium.CameraEventType.WHEEL,
      Cesium.CameraEventType.PINCH,
    ]
    controller.tiltEventTypes = [
      Cesium.CameraEventType.MIDDLE_DRAG,
      Cesium.CameraEventType.PINCH,
      { eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL },
    ]
    controller.enableCollisionDetection = true

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000),
    })

    initTerrain().then((provider) => {
      viewer.terrainProvider = provider
    })

    const layers: Layer[] = [
      new AircraftLayer(viewer),
      new MaritimeLayer(viewer),
      new SatelliteLayer(viewer),
    ]

    layers.forEach((layer) => layer.load(allAssets))
    layersRef.current = layers
    viewerRef.current = viewer

    trailRendererRef.current = new TrailRenderer(viewer)

    const heatmapMgr = new HeatmapManager()
    heatmapMgr.init(viewer)
    heatmapManagerRef.current = heatmapMgr

    coverageRingsRef.current = new SatelliteCoverageRings(viewer)
    sensorConeRef.current = new SatelliteSensorCone(viewer)
    coverageGridRef.current = new SatelliteCoverageGrid(viewer)

    const orbits = new OrbitalPathRenderer(viewer)
    orbits.init()
    orbitalPathRef.current = orbits

    gridOverlayRef.current = new TacticalGridOverlay(viewer)
    if (useAppStore.getState().gridOverlayVisible) {
      gridOverlayRef.current.show()
    }

    const state = useAppStore.getState()
    if (state.missions.length === 0) {
      state.setMissions(missions)
    }

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const pick = viewer.scene.pick(movement.position)
      const entity = pick?.id instanceof Cesium.Entity ? pick.id : null
      const entityId = entity?.id ?? null
      const hoverAsset = entityId ? (assetMap.get(entityId) ?? null) : null

      setTooltip({
        visible: hoverAsset !== null,
        x: movement.position.x + 12,
        y: movement.position.y - 8,
        asset: hoverAsset,
      })

      viewer.scene.canvas.style.cursor = hoverAsset ? 'pointer' : 'default'
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const pick = viewer.scene.pick(movement.position)
      const entity = pick?.id instanceof Cesium.Entity ? pick.id : null
      const entityId = entity?.id ?? null
      const asset = entityId ? (assetMap.get(entityId) ?? null) : null

      if (asset) {
        selectedIdRef.current = entityId
        layers.forEach((l) => l.setHighlight(entityId))
        setSelectedAsset(asset)
        setTrackingAssetId(null)
        flyToAsset(asset, () => {
          setTrackingAssetId(asset.id)
        })
        setTooltip((prev) => ({ ...prev, visible: false }))
      } else if (selectedIdRef.current !== null) {
        selectedIdRef.current = null
        layers.forEach((l) => l.setHighlight(null))
        setSelectedAsset(null)
        setTrackingAssetId(null)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    viewer.scene.requestRender()

    return () => {
      handler.destroy()
      trailRendererRef.current?.destroy()
      trailRendererRef.current = null
      heatmapManagerRef.current?.destroy()
      heatmapManagerRef.current = null
      coverageRingsRef.current?.destroy()
      coverageRingsRef.current = null
      sensorConeRef.current?.destroy()
      sensorConeRef.current = null
      coverageGridRef.current?.destroy()
      coverageGridRef.current = null
      orbitalPathRef.current?.destroy()
      orbitalPathRef.current = null
      gridOverlayRef.current?.destroy()
      gridOverlayRef.current = null
      viewer.destroy()
      viewerRef.current = null
      layersRef.current = []
    }
  }, [setSelectedAsset, flyToAsset])

  useEffect(() => {
    layersRef.current.forEach((l) => l.setHighlight(selectedId))
  }, [selectedId])

  useEffect(() => {
    const rings = coverageRingsRef.current
    if (!rings) return
    if (selectedAsset && selectedAsset.type === 'satellite') {
      rings.show(selectedAsset.id)
    } else {
      rings.hide()
    }
  }, [selectedAsset])

  useEffect(() => {
    const cone = sensorConeRef.current
    if (!cone) return
    if (selectedAsset && selectedAsset.type === 'satellite' && sensorConeVisible) {
      cone.show(selectedAsset.id)
    } else {
      cone.hide()
    }
  }, [selectedAsset, sensorConeVisible])

  useEffect(() => {
    const grid = coverageGridRef.current
    if (!grid) return
    if (selectedAsset && selectedAsset.type === 'satellite') {
      grid.show(selectedAsset.id)
    } else {
      grid.hide()
    }
  }, [selectedAsset])

  useEffect(() => {
    orbitalPathRef.current?.setSelected(
      selectedAsset?.type === 'satellite' ? selectedAsset.id : null,
    )
  }, [selectedAsset])

  useEffect(() => {
    if (assetData.length === 0 || layersRef.current.length === 0) return
    for (const layer of layersRef.current) {
      layer.updatePositions(assetData)
    }
  }, [assetData])

  useEffect(() => {
    if (assetData.length === 0 || !trailRendererRef.current) return
    const mgr = getSimulationManager()
    const history = mgr.getAllHistory()
    const waypoints = mgr.getRemainingWaypointsMap()

    const colors = new Map<string, Cesium.Color>()
    for (const asset of assetData) {
      colors.set(asset.id, assetTypeColor(asset.type))
    }

    trailRendererRef.current.update(history, waypoints, colors)
  }, [assetData])

  useEffect(() => {
    trailRendererRef.current?.setVisible(trailsVisible)
  }, [trailsVisible])

  useEffect(() => {
    const grid = gridOverlayRef.current
    if (!grid) return
    if (gridOverlayVisible) {
      grid.show()
    } else {
      grid.hide()
    }
  }, [gridOverlayVisible])

  useEffect(() => {
    const mgr = heatmapManagerRef.current
    if (!mgr) return
    const state = useAppStore.getState()
    for (const key of ['assetDensity', 'alertDensity', 'missionActivity'] as const) {
      mgr.setVisible(key, state.heatmapLayers[key])
    }
  }, [useAppStore((s) => s.heatmapLayers)])

  useEffect(() => {
    const mgr = heatmapManagerRef.current
    if (!mgr) return
    const state = useAppStore.getState()
    const anyVisible = Object.values(state.heatmapLayers).some(Boolean)
    if (anyVisible) {
      mgr.refreshAll(state)
    }
  }, [assetData, useAppStore((s) => s.alerts), useAppStore((s) => s.missions), useAppStore((s) => s.heatmapLayers)])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !trackingAssetId) return

    let smoothTarget: Cesium.Cartesian3 | null = null
    let smoothHeight = 15000
    const SMOOTHING = 3.0

    const removeListener = viewer.scene.preRender.addEventListener(() => {
      const assets = useAppStore.getState().assetData
      const asset = assets.find((a) => a.id === trackingAssetId)
      if (!asset) return

      const rawTarget = Cesium.Cartesian3.fromDegrees(asset.longitude, asset.latitude, 0)
      const targetHeight = Math.max(asset.altitude * 0.4, 15000)

      if (!smoothTarget) {
        smoothTarget = rawTarget.clone()
        smoothHeight = targetHeight
        return
      }

      const dt = 1 / 60
      const t = 1 - Math.exp(-SMOOTHING * dt)

      const lerped = new Cesium.Cartesian3()
      Cesium.Cartesian3.lerp(smoothTarget, rawTarget, t, lerped)
      smoothTarget = lerped.clone()
      smoothHeight += (targetHeight - smoothHeight) * t

      viewer.camera.lookAt(smoothTarget, new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-35),
        smoothHeight,
      ))
    })

    return () => {
      removeListener()
      smoothTarget = null
    }
  }, [trackingAssetId])

  useEffect(() => {
    if (!focusRequestId) return
    const asset = assetData.find((a) => a.id === focusRequestId)
    if (asset) {
      setTrackingAssetId(null)
      flyToAsset(asset, () => {
        setTrackingAssetId(focusRequestId)
      })
    }
    requestFocus(null)
  }, [focusRequestId, assetData, flyToAsset, setTrackingAssetId, requestFocus])

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden" style={{ background: '#0a0c12' }}>
      <AnimatePresence>
        {tooltip.visible && tooltip.asset && tooltip.asset.type === 'satellite' && (
          <SatelliteTooltip
            key="satellite-tooltip"
            asset={tooltip.asset as Satellite}
            x={tooltip.x}
            y={tooltip.y}
          />
        )}
        {tooltip.visible && tooltip.asset && tooltip.asset.type !== 'satellite' && (
          <motion.div
            key="asset-tooltip"
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.1 }}
            className="pointer-events-none absolute z-50 rounded-[2px] border border-border/60 bg-[#0d1117]/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p className="whitespace-nowrap text-[11px] font-medium text-foreground/90">
              {tooltip.asset.name}
            </p>
            <p className="whitespace-nowrap text-[9px] uppercase tracking-wider text-muted-foreground/60">
              {tooltip.asset.type.replace('-', ' ')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GlobeViewer
