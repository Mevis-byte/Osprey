import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { EARTH_RADIUS } from '@/lib/constants'
import * as Cesium from 'cesium'
import { AnimatePresence } from 'framer-motion'
import { allAssets, missions, groundStations } from '@/mock-data'
import { useAppStore } from '@/store'
import { 
  AircraftLayer, 
  MaritimeLayer, 
  SatelliteLayer, 
  GroundStationLayer,
  SensorConeLayer, 
  ConstellationLayer, 
  TrajectoryLayer, 
  RegionOverlayLayer, 
  EventMarkerLayer,
  CommunicationLayer,
  GeofenceLayer
} from './layers'
import { TrailRenderer } from './trails/TrailRenderer'
import { HeatmapManager } from './heatmap'
import { AssetHoverCard } from './tooltip/AssetHoverCard'
import { SatelliteCoverageRings } from './coverage/SatelliteCoverageRings'
import { SatelliteSensorCone } from './coverage/SatelliteSensorCone'
import { SatelliteCoverageGrid } from './coverage/SatelliteCoverageGrid'
import { OrbitalPathRenderer } from './orbits/OrbitalPathRenderer'
import { TacticalGridOverlay } from './grid/TacticalGridOverlay'

import { getSimulationManager } from '@/services/simulation'
import type { Layer } from './layers'
import type { Asset } from '@/types'

const CESIUM_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN

if (CESIUM_TOKEN) {
  Cesium.Ion.defaultAccessToken = CESIUM_TOKEN
}

const DARK_BACKGROUND = Cesium.Color.fromCssColorString('#000000')
const GLOBE_BASE_COLOR = Cesium.Color.fromCssColorString('#000000')

function createStarCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const starCount = 300
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const radius = Math.random() * 1.0 + 0.4
    const alpha = Math.random() * 0.5 + 0.3

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.fill()
  }

  return canvas
}

const _starCanvas = createStarCanvas()
const _starUrl = _starCanvas.toDataURL()

const CARTO_DARK_PROVIDER = new Cesium.UrlTemplateImageryProvider({
  url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{@2x}.png',
  credit: 'CartoDB',
  maximumLevel: 19,
})

const assetMap = new Map<string, Asset>([
  ...allAssets.map((a): [string, Asset] => [a.id, a]),
  ...groundStations.map((gs): [string, Asset] => [gs.id, gs as unknown as Asset]),
])

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
  const setHoveredAsset = useAppStore((s) => s.setHoveredAsset)
  const selectedAsset = useAppStore((s) => s.selectedAsset)
  const layerVisibility = useAppStore((s) => s.layerVisibility)
  const assetData = useAppStore((s) => s.assetData)
  const trailsVisible = useAppStore((s) => s.layerVisibility.trails)
  const sensorConesVisible = useAppStore((s) => s.layerVisibility.sensorCones)
  const gridOverlayVisible = useAppStore((s) => s.layerVisibility.tacticalGrid)
  const trackingAssetId = useAppStore((s) => s.trackingAssetId)
  const setTrackingAssetId = useAppStore((s) => s.setTrackingAssetId)
  const focusRequestId = useAppStore((s) => s.focusRequestId)
  const requestFocus = useAppStore((s) => s.requestFocus)
  const selectedConstellationId = useAppStore((s) => s.selectedConstellationId)
  const setSelectedConstellationId = useAppStore((s) => s.setSelectedConstellationId)
  const setSelectedGeofenceId = useAppStore((s) => s.setSelectedGeofenceId)
  const constellations = useAppStore((s) => s.constellations)
  const projectionMode = useAppStore((s) => s.projectionMode)

  const selectedId = useMemo(() => selectedAsset?.id ?? null, [selectedAsset])

  useEffect(() => {
    layersRef.current.forEach((l) => {
      const isVisible = layerVisibility[l.id as keyof typeof layerVisibility] ?? true
      l.setVisible(isVisible)
    })
  }, [layerVisibility])

  const flyToSatellite = useCallback((asset: Asset, onComplete?: () => void) => {
    const viewer = viewerRef.current
    if (!viewer) {
      onComplete?.()
      return
    }

    const R = EARTH_RADIUS
    const coverageAngle = Math.acos(R / (R + asset.altitude))
    const coverageRadius = R * coverageAngle

    const groundPos = Cesium.Cartesian3.fromDegrees(asset.longitude, asset.latitude, 0)
    const satPos = Cesium.Cartesian3.fromDegrees(asset.longitude, asset.latitude, asset.altitude)
    const center = new Cesium.Cartesian3()
    Cesium.Cartesian3.lerp(groundPos, satPos, 0.3, center)

    const radius = Math.min(coverageRadius * 0.6, 2500000)
    const range = Math.max(Math.min(asset.altitude * 2.5, 3000000), 1500000)

    viewer.camera.flyToBoundingSphere(
      new Cesium.BoundingSphere(center, radius),
      {
        offset: new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(asset.heading + 180),
          Cesium.Math.toRadians(-35),
          range,
        ),
        duration: 1.5,
        complete: onComplete,
      },
    )
  }, [])

  const flyToAsset = useCallback((asset: Asset, onComplete?: () => void) => {
    const viewer = viewerRef.current
    if (!viewer) {
      onComplete?.()
      return
    }

    if (asset.type === 'satellite') {
      flyToSatellite(asset, onComplete)
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
  }, [flyToSatellite])

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
      skyAtmosphere: new Cesium.SkyAtmosphere(),
      creditContainer: document.createElement('div'),
    })

    window.__cesiumViewer = viewer

    viewer.imageryLayers.removeAll()
    viewer.imageryLayers.addImageryProvider(CARTO_DARK_PROVIDER)

    viewer.scene.globe.baseColor = GLOBE_BASE_COLOR
    viewer.scene.backgroundColor = DARK_BACKGROUND
    viewer.scene.globe.enableLighting = true
    viewer.scene.globe.showGroundAtmosphere = false
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = false
    }

    viewer.scene.postProcessStages.bloom.enabled = false

    viewer.scene.fog.enabled = true
    viewer.scene.fog.density = 0.00002
    viewer.scene.fog.screenSpaceErrorFactor = 1.5

    viewer.scene.skyBox?.destroy()
    viewer.scene.skyBox = new Cesium.SkyBox({
      sources: {
        positiveX: _starUrl,
        negativeX: _starUrl,
        positiveY: _starUrl,
        negativeY: _starUrl,
        positiveZ: _starUrl,
        negativeZ: _starUrl,
      },
    })
    if (viewer.scene.moon) viewer.scene.moon.show = false

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
    controller.inertiaSpin = 0.5
    controller.inertiaTranslate = 0.5
    controller.inertiaZoom = 0.4

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
      new GroundStationLayer(viewer),
      new SensorConeLayer(viewer),
      new ConstellationLayer(viewer),
      new TrajectoryLayer(viewer),
      new RegionOverlayLayer(viewer),
      new EventMarkerLayer(viewer),
      new CommunicationLayer(viewer),
      new GeofenceLayer(viewer),
    ]

    const evLayer = layers.find(l => l.id === 'event-marker') as EventMarkerLayer

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
    if (useAppStore.getState().layerVisibility.tacticalGrid) {
      gridOverlayRef.current.show()
    }

    const state = useAppStore.getState()
    if (state.missions.length === 0) {
      state.setMissions(missions)
    }

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      if (!movement?.position) return

      const pick = viewer.scene.pick(movement.position)
      const entity = pick?.id instanceof Cesium.Entity ? pick.id : null
      const entityId = entity?.id ?? null
      const hoverAsset = entityId ? (assetMap.get(entityId) ?? null) : null

      setHoveredAsset(hoverAsset as Asset | null)
      layers.forEach(l => l.setHover?.(entityId))

      setTooltip({
        visible: hoverAsset !== null,
        x: movement.position.x,
        y: movement.position.y,
        asset: hoverAsset as Asset | null,
      })

      if (viewer.scene?.canvas?.style) {
        viewer.scene.canvas.style.cursor = hoverAsset ? 'pointer' : 'default'
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    let clickTimer: ReturnType<typeof setTimeout> | null = null

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      if (!movement?.position) return

      const pick = viewer.scene.pick(movement.position)
      const entity = pick?.id instanceof Cesium.Entity ? pick.id : null
      const entityId = entity?.id ?? null
      const asset = entityId ? (assetMap.get(entityId) ?? null) : null

      const geofenceId = entity?.properties?.geofenceId?.getValue() ?? null
      if (geofenceId && !asset) {
        if (clickTimer) clearTimeout(clickTimer)
        const gfLayer = layers.find(l => l.id === 'geofences') as GeofenceLayer | undefined
        if (gfLayer) {
          gfLayer.setSelectedGeofence(geofenceId)
          setSelectedGeofenceId(geofenceId)
        }
        return
      }

      if (clickTimer) clearTimeout(clickTimer)

      clickTimer = setTimeout(() => {
        if (asset) {
          selectedIdRef.current = entityId
          layers.forEach((l) => l.setHighlight(entityId))
          layers.forEach((l) => l.setSelectedAsset?.(asset))
          setSelectedAsset(asset)
          setSelectedConstellationId(null)
          setSelectedGeofenceId(null)
          setTrackingAssetId(null)
          setTooltip((prev) => ({ ...prev, visible: false }))
        } else if (entityId && (entityId.startsWith('event-') || entityId.startsWith('alert-'))) {
          const targetAssetId = evLayer.getAssetIdForEntity(entityId)
          if (targetAssetId) {
            const targetAsset = assetMap.get(targetAssetId)
            if (targetAsset) {
              selectedIdRef.current = targetAssetId
              layers.forEach((l) => l.setHighlight(targetAssetId))
              layers.forEach((l) => l.setSelectedAsset?.(targetAsset))
              setSelectedAsset(targetAsset)
              setSelectedConstellationId(null)
              setSelectedGeofenceId(null)
              setTrackingAssetId(null)
              setTooltip((prev) => ({ ...prev, visible: false }))
            }
          }
        } else if (selectedIdRef.current !== null) {
          selectedIdRef.current = null
          layers.forEach((l) => l.setHighlight(null))
          layers.forEach((l) => l.setSelectedAsset?.(null))
          setSelectedAsset(null)
          setSelectedConstellationId(null)
          setSelectedGeofenceId(null)
          setTrackingAssetId(null)
        }
        clickTimer = null
      }, 250)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      if (!movement?.position) return

      if (clickTimer) {
        clearTimeout(clickTimer)
        clickTimer = null
      }

      const pick = viewer.scene.pick(movement.position)
      const entity = pick?.id instanceof Cesium.Entity ? pick.id : null
      const entityId = entity?.id ?? null
      const asset = entityId ? (assetMap.get(entityId) ?? null) : null

      if (asset) {
        selectedIdRef.current = entityId
        layers.forEach((l) => l.setHighlight(entityId))
        layers.forEach((l) => l.setSelectedAsset?.(asset))
        setSelectedAsset(asset)
        setSelectedConstellationId(null)
        setSelectedGeofenceId(null)
        setTrackingAssetId(null)
        setTooltip((prev) => ({ ...prev, visible: false }))
        flyToAsset(asset, () => {
          setTrackingAssetId(asset.id)
        })
      } else if (entityId && (entityId.startsWith('event-') || entityId.startsWith('alert-'))) {
        const targetAssetId = evLayer.getAssetIdForEntity(entityId)
        if (targetAssetId) {
          const targetAsset = assetMap.get(targetAssetId)
          if (targetAsset) {
            selectedIdRef.current = targetAssetId
            layers.forEach((l) => l.setHighlight(targetAssetId))
            layers.forEach((l) => l.setSelectedAsset?.(targetAsset))
            setSelectedAsset(targetAsset)
            setSelectedConstellationId(null)
            setSelectedGeofenceId(null)
            setTrackingAssetId(null)
            setTooltip((prev) => ({ ...prev, visible: false }))
            flyToAsset(targetAsset, () => {
              setTrackingAssetId(targetAsset.id)
            })
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

    viewer.scene.requestRender()

    return () => {
      if (clickTimer !== null) {
        clearTimeout(clickTimer)
        clickTimer = null
      }
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
      window.__cesiumViewer = null
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
    if (selectedAsset && selectedAsset.type === 'satellite' && sensorConesVisible) {
      cone.show(selectedAsset.id)
    } else {
      cone.hide()
    }
  }, [selectedAsset, sensorConesVisible])

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

    trailRendererRef.current.update(history, waypoints)
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
    let smoothHeading = 0
    const SMOOTHING = 3.0
    const SCRATCH_RAW = new Cesium.Cartesian3()
    const SCRATCH_LERP = new Cesium.Cartesian3()
    const SCRATCH_HPR = new Cesium.HeadingPitchRange()

    const removeListener = viewer.scene.preRender.addEventListener(() => {
      const assets = useAppStore.getState().assetData
      const asset = assets.find((a) => a.id === trackingAssetId)
      if (!asset) return

      Cesium.Cartesian3.fromDegrees(
        asset.longitude, asset.latitude, asset.altitude * 0.4,
        Cesium.Ellipsoid.WGS84, SCRATCH_RAW,
      )
      const range = Math.max(Math.min(asset.altitude * 2.5, 3000000), 1500000)

      if (!smoothTarget) {
        smoothTarget = Cesium.Cartesian3.clone(SCRATCH_RAW)
        smoothHeading = asset.heading
        return
      }

      const dt = 1 / 60
      const t = 1 - Math.exp(-SMOOTHING * dt)

      Cesium.Cartesian3.lerp(smoothTarget, SCRATCH_RAW, t, SCRATCH_LERP)
      Cesium.Cartesian3.clone(SCRATCH_LERP, smoothTarget)

      const targetHeadingRad = Cesium.Math.toRadians(asset.heading)
      const currentHeadingRad = Cesium.Math.toRadians(smoothHeading)
      let headingDiff = targetHeadingRad - currentHeadingRad
      if (headingDiff > Math.PI) headingDiff -= 2 * Math.PI
      if (headingDiff < -Math.PI) headingDiff += 2 * Math.PI
      smoothHeading = Cesium.Math.toDegrees(currentHeadingRad + headingDiff * t)

      SCRATCH_HPR.heading = Cesium.Math.toRadians(smoothHeading + 180)
      SCRATCH_HPR.pitch = Cesium.Math.toRadians(-35)
      SCRATCH_HPR.range = range
      viewer.camera.lookAt(smoothTarget, SCRATCH_HPR)
    })

    return () => {
      removeListener()
      viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
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

  const modeVisibility: Record<string, Partial<Record<string, boolean>>> = {
    globe: {},
    flat: { satellites: false, groundStations: false, coverageRings: false, sensorCones: false, commLinks: false, dayNight: false, weather: false },
    space: { aircraft: false, maritime: false, trails: false, regions: false, weather: false, geofences: false, dayNight: false },
    analytics: { aircraft: false, maritime: false, satellites: false, groundStations: false, coverageRings: false, sensorCones: false, commLinks: false, tacticalGrid: false, dayNight: false, weather: false, trails: false, geofences: false },
  }

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    const scene = viewer.scene
    const overrides = modeVisibility[projectionMode]

    if (projectionMode === 'flat') {
      if (scene.mode !== Cesium.SceneMode.SCENE2D) {
        scene.morphTo2D(1.5)
      }
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000
    } else {
      if (scene.mode !== Cesium.SceneMode.SCENE3D) {
        scene.morphTo3D(1.5)
      }
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000
    }

    if (projectionMode === 'space') {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 40000000),
        orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
        duration: 1.5,
      })
    }

    if (projectionMode === 'analytics') {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0, 20, 35000000),
        orientation: { heading: 0, pitch: -Math.PI / 3, roll: 0 },
        duration: 1.5,
      })
    }

    if (projectionMode === 'globe') {
      if (!trackingAssetId) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000),
          duration: 1.5,
        })
      }
    }

    for (const [layerId, visible] of Object.entries(overrides)) {
      const layer = layersRef.current.find((l) => l.id === layerId)
      if (layer) layer.setVisible(visible ?? true)
    }

    const heatmapMgr = heatmapManagerRef.current
    if (heatmapMgr) {
      if (projectionMode === 'analytics') {
        heatmapMgr.setVisible('assetDensity', true)
        heatmapMgr.setVisible('alertDensity', true)
        heatmapMgr.setVisible('missionActivity', true)
        const state = useAppStore.getState()
        heatmapMgr.refreshAll(state)
      } else {
        const state = useAppStore.getState()
        for (const key of ['assetDensity', 'alertDensity', 'missionActivity'] as const) {
          heatmapMgr.setVisible(key, state.heatmapLayers[key])
        }
      }
    }

    viewer.scene.requestRender()
  }, [projectionMode, trackingAssetId])

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden" style={{ background: '#000000' }}>
      <div className="absolute left-4 top-4 z-40 w-56 space-y-1">
        <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Constellations</div>
        {constellations.map((c) => {
          const isSelected = selectedConstellationId === c.id
          return (
            <button
              key={c.id}
              onClick={() => {
                if (isSelected) {
                  setSelectedConstellationId(null)
                } else {
                  setSelectedConstellationId(c.id)
                  setSelectedAsset(null)
                  setTrackingAssetId(null)
                  selectedIdRef.current = null
                  layersRef.current.forEach((l) => l.setHighlight(null))
                }
              }}
              className={`w-full rounded border px-3 py-2 text-left text-[11px] transition-all ${
                isSelected
                  ? 'border-white/20 bg-card/80'
                  : 'border-border/40 bg-card/60 hover:border-border/70'
              }`}
              style={isSelected ? { borderColor: 'var(--theme-primary, #00BFFF)' } : {}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  <span className="font-medium text-foreground/80">{c.name}</span>
                </div>
                <span className={`rounded px-1 py-0.5 text-[8px] uppercase ${
                  c.healthStatus === 'healthy' ? 'bg-green-500/15 text-green-400' :
                  c.healthStatus === 'degraded' ? 'bg-yellow-500/15 text-yellow-400' :
                  'bg-red-500/15 text-red-400'
                }`}>{c.healthStatus}</span>
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-muted-foreground/50">
                <span>{c.satelliteIds.length} satellites</span>
                <span>{c.coverageRadius} km</span>
              </div>
            </button>
          )
        })}
      </div>
      <AnimatePresence>
        {tooltip.visible && tooltip.asset && (
          <AssetHoverCard
            key="asset-hover-card"
            asset={tooltip.asset}
            x={tooltip.x}
            y={tooltip.y}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default GlobeViewer
