import * as Cesium from 'cesium'

export const LABEL_FONT = '600 14px "JetBrains Mono", monospace'
export const LABEL_STYLE = Cesium.LabelStyle.FILL
export const LABEL_FILL_COLOR = Cesium.Color.WHITE

export const LABEL_DISTANCE_DISPLAY_CONDITION = new Cesium.DistanceDisplayCondition(0, 3.0e7)

export const LABEL_SCALE_BY_DISTANCE = new Cesium.NearFarScalar(
  1.0e5, 1.0,
  2.5e7, 0.6
)

export const LABEL_TRANSLUCENCY_BY_DISTANCE = new Cesium.NearFarScalar(
  2.0e7, 1.0,
  3.0e7, 0.3
)

export function createLabelGraphics(options: {
  text: string | Cesium.Property
  pixelOffset?: Cesium.Cartesian2
  horizontalOrigin?: Cesium.HorizontalOrigin
  verticalOrigin?: Cesium.VerticalOrigin
  fillColor?: Cesium.Color
  scaleByDistance?: Cesium.NearFarScalar
}): Cesium.LabelGraphics {
  return new Cesium.LabelGraphics({
    text: options.text,
    font: LABEL_FONT,
    fillColor: options.fillColor ?? LABEL_FILL_COLOR,
    style: LABEL_STYLE,
    horizontalOrigin: options.horizontalOrigin ?? Cesium.HorizontalOrigin.LEFT,
    verticalOrigin: options.verticalOrigin ?? Cesium.VerticalOrigin.CENTER,
    pixelOffset: options.pixelOffset ?? new Cesium.Cartesian2(10, 0),
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    scaleByDistance: options.scaleByDistance ?? LABEL_SCALE_BY_DISTANCE,
    translucencyByDistance: LABEL_TRANSLUCENCY_BY_DISTANCE,
    distanceDisplayCondition: LABEL_DISTANCE_DISPLAY_CONDITION,
  })
}

// Asset Marker Icons (SVGs)
export const MARKER_ICONS = {
  aircraft: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4L19 13H28L21 19L24 28L16 22L8 28L11 19L4 13H13L16 4Z" fill="#22d3ee" stroke="white" stroke-width="1.5"/>
    </svg>
  `)}`,
  maritime: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4L26 10V22L16 28L6 22V10L16 4Z" fill="#4ade80" stroke="white" stroke-width="1.5"/>
    </svg>
  `)}`,
  satellite: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="10" fill="#fbbf24" stroke="white" stroke-width="1.5"/>
      <path d="M16 6V10M16 22V26M6 16H10M22 16H26" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `)}`,
  groundStation: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4V28M4 16H28M16 10C12.6863 10 10 12.6863 10 16C10 19.3137 12.6863 22 16 22C19.3137 22 22 19.3137 22 16C22 12.6863 19.3137 10 16 10Z" stroke="#60a5fa" stroke-width="2"/>
      <path d="M16 14C14.8954 14 14 14.8954 14 16C14 17.1046 14.8954 18 16 18C17.1046 18 18 17.1046 18 16C18 14.8954 17.1046 14 16 14Z" fill="#60a5fa"/>
    </svg>
  `)}`
}
