export interface HeatmapPoint {
  lat: number
  lon: number
  weight?: number
}

export interface RenderOptions {
  width: number
  height: number
  radius: number
  maxIntensity: number
}

const DEFAULT_OPTIONS: RenderOptions = {
  width: 1024,
  height: 512,
  radius: 30,
  maxIntensity: 5,
}

function latLonToPixel(
  lat: number,
  lon: number,
  cw: number,
  ch: number,
): [number, number] {
  const x = ((lon + 180) / 360) * cw
  const latRad = (lat * Math.PI) / 180
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
  const y = ch / 2 - (ch * mercN) / (2 * Math.PI)
  return [x, y]
}

const COLOR_STOPS: [number, number, number, number, number][] = [
  [0.0, 0, 0, 255, 0],
  [0.20, 0, 60, 220, 35],
  [0.40, 0, 160, 220, 90],
  [0.60, 0, 220, 60, 140],
  [0.80, 200, 200, 0, 170],
  [1.0, 200, 30, 0, 190],
]

function heatmapColor(value: number): [number, number, number, number] {
  if (value <= 0) return [0, 0, 0, 0]
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [t0, r0, g0, b0, a0] = COLOR_STOPS[i]
    const [t1, r1, g1, b1, a1] = COLOR_STOPS[i + 1]
    if (value >= t0 && value <= t1) {
      const t = (value - t0) / (t1 - t0)
      return [
        Math.round(r0 + (r1 - r0) * t),
        Math.round(g0 + (g1 - g0) * t),
        Math.round(b0 + (b1 - b0) * t),
        Math.round(a0 + (a1 - a0) * t),
      ]
    }
  }
  return [255, 30, 0, 255]
}

export function renderHeatmap(
  points: HeatmapPoint[],
  options?: Partial<RenderOptions>,
): HTMLCanvasElement {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const canvas = document.createElement('canvas')
  canvas.width = opts.width
  canvas.height = opts.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!

  ctx.globalCompositeOperation = 'lighter'

  for (const point of points) {
    const [x, y] = latLonToPixel(point.lat, point.lon, opts.width, opts.height)
    const weight = Math.min(1, point.weight ?? 1)
    if (
      x < -opts.radius || x > opts.width + opts.radius ||
      y < -opts.radius || y > opts.height + opts.radius
    ) continue

    const g = ctx.createRadialGradient(x, y, 0, x, y, opts.radius)
    g.addColorStop(0, `rgba(255,255,255,${weight * 0.7})`)
    g.addColorStop(0.4, `rgba(255,255,255,${weight * 0.35})`)
    g.addColorStop(0.7, `rgba(255,255,255,${weight * 0.10})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, opts.radius, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'

  const imageData = ctx.getImageData(0, 0, opts.width, opts.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const intensity = data[i] / 255
    const normalized = Math.min(1, intensity / opts.maxIntensity)
    const [r, g, b, a] = heatmapColor(normalized)
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = a
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}
