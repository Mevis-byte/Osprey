import type { Asset } from '@/types'
import type { AppStore } from '@/store'
import type { Layer } from './layers'

export class GlobeLayerManager {
  private layers = new Map<string, Layer>()
  private layerOrder: string[] = []

  register(layer: Layer, options: { visible?: boolean; assets?: Asset[] } = {}): Layer {
    if (this.layers.has(layer.id)) {
      throw new Error(`Globe layer already registered: ${layer.id}`)
    }

    this.layers.set(layer.id, layer)
    this.layerOrder.push(layer.id)

    layer.initialize?.()
    if (options.assets) {
      layer.load(options.assets)
    }
    if (options.visible !== undefined) {
      layer.setVisible(options.visible)
    }

    return layer
  }

  get<T extends Layer = Layer>(id: string): T | null {
    return (this.layers.get(id) as T | undefined) ?? null
  }

  entries(): Layer[] {
    return this.layerOrder
      .map((id) => this.layers.get(id))
      .filter((layer): layer is Layer => layer !== undefined)
  }

  setVisible(id: string, visible: boolean): void {
    this.layers.get(id)?.setVisible(visible)
  }

  setHighlight(entityId: string | null): void {
    for (const layer of this.layers.values()) {
      layer.setHighlight(entityId)
    }
  }

  setSelectedAsset(asset: Asset | null): void {
    for (const layer of this.layers.values()) {
      layer.setSelectedAsset?.(asset)
    }
  }

  load(assets: Asset[]): void {
    for (const layer of this.layers.values()) {
      layer.load(assets)
    }
  }

  updatePositions(assets: Asset[]): void {
    for (const layer of this.layers.values()) {
      layer.updatePositions(assets)
    }
  }

  refresh(state: AppStore): void {
    for (const layer of this.layers.values()) {
      if ('refresh' in layer && typeof layer.refresh === 'function') {
        layer.refresh(state)
      }
    }
  }

  destroy(): void {
    for (const id of [...this.layerOrder].reverse()) {
      const layer = this.layers.get(id)
      layer?.destroy?.()
      if (!layer?.destroy) {
        layer?.clear()
      }
    }
    this.layers.clear()
    this.layerOrder = []
  }
}
