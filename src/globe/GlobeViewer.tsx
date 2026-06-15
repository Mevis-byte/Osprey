import { useEffect, useRef, useState, useCallback } from 'react'
import * as Cesium from 'cesium'
import { motion, AnimatePresence } from 'framer-motion'
import { allAssets } from '@/mock-data'
import { useAppStore } from '@/store'
import { AircraftLayer, MaritimeLayer, SatelliteLayer } from './layers'
import type { Layer } from './layers'
import type { Asset } from '@/types'

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

  const flyToAsset = useCallback((asset: Asset) => {
    const viewer = viewerRef.current
    if (!viewer) return

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
        flyToAsset(asset)
        setTooltip((prev) => ({ ...prev, visible: false }))
      } else if (selectedIdRef.current !== null) {
        selectedIdRef.current = null
        layers.forEach((l) => l.setHighlight(null))
        setSelectedAsset(null)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    viewer.scene.requestRender()

    return () => {
      handler.destroy()
      viewer.destroy()
      viewerRef.current = null
      layersRef.current = []
    }
  }, [setSelectedAsset, flyToAsset])

  useEffect(() => {
    layersRef.current.forEach((l) => l.setHighlight(selectedId))
  }, [selectedId])

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden" style={{ background: '#0a0c12' }}>
      <AnimatePresence>
        {tooltip.visible && tooltip.asset && (
          <motion.div
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
