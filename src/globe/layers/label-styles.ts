import * as Cesium from 'cesium'

export const LABEL_FONT = '500 13px "Inter", system-ui, sans-serif'
export const LABEL_STYLE = Cesium.LabelStyle.FILL
export const LABEL_FILL_COLOR = Cesium.Color.WHITE

export const LABEL_DISTANCE_DISPLAY_CONDITION = new Cesium.DistanceDisplayCondition(0, 4.0e7)
export const SATELLITE_LABEL_DISTANCE = new Cesium.DistanceDisplayCondition(0, 3.0e7)
export const AIRCRAFT_LABEL_DISTANCE = new Cesium.DistanceDisplayCondition(0, 3.0e6)
export const MARITIME_LABEL_DISTANCE = new Cesium.DistanceDisplayCondition(0, 3.0e6)
export const STATION_LABEL_DISTANCE = new Cesium.DistanceDisplayCondition(0, 5.0e6)
export const EVENT_LABEL_DISTANCE = new Cesium.DistanceDisplayCondition(0, 2.0e6)

export const LABEL_SCALE_BY_DISTANCE = new Cesium.NearFarScalar(
  1.0e5, 1.0,
  3.0e7, 0.5
)

export const LABEL_BACKGROUND_COLOR = Cesium.Color.fromCssColorString('#0a0c12').withAlpha(0.75)
export const LABEL_BACKGROUND_PADDING = new Cesium.Cartesian2(4, 2)

export function createLabelGraphics(options: {
  text: string | Cesium.Property
  pixelOffset?: Cesium.Cartesian2
  horizontalOrigin?: Cesium.HorizontalOrigin
  verticalOrigin?: Cesium.VerticalOrigin
  fillColor?: Cesium.Color
  scaleByDistance?: Cesium.NearFarScalar
  showBackground?: boolean
  distanceDisplayCondition?: Cesium.DistanceDisplayCondition
}): Cesium.LabelGraphics {
  return new Cesium.LabelGraphics({
    text: options.text,
    font: LABEL_FONT,
    fillColor: options.fillColor ?? LABEL_FILL_COLOR,
    style: LABEL_STYLE,
    horizontalOrigin: options.horizontalOrigin ?? Cesium.HorizontalOrigin.LEFT,
    verticalOrigin: options.verticalOrigin ?? Cesium.VerticalOrigin.CENTER,
    pixelOffset: options.pixelOffset ?? new Cesium.Cartesian2(8, 0),
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    scaleByDistance: options.scaleByDistance ?? LABEL_SCALE_BY_DISTANCE,
    distanceDisplayCondition: options.distanceDisplayCondition ?? LABEL_DISTANCE_DISPLAY_CONDITION,
    showBackground: options.showBackground ?? true,
    backgroundColor: LABEL_BACKGROUND_COLOR,
    backgroundPadding: LABEL_BACKGROUND_PADDING,
  })
}

// Asset Marker Icons — clean SVG markers without glow
export const MARKER_ICONS = {
  aircraft: `data:image/svg+xml;base64,${btoa(`
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 6L19 14H27L21 19L23 27L16 22L9 27L11 19L5 14H13L16 6Z" fill="#22d3ee" stroke="white" stroke-width="1.2"/>
    </svg>
  `)}`,
  maritime: `data:image/svg+xml;base64,${btoa(`
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 6L25 12V22L16 27L7 22V12L16 6Z" fill="#4ade80" stroke="white" stroke-width="1.2"/>
    </svg>
  `)}`,
  satellite: `data:image/svg+xml;base64,${btoa(`
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="9" fill="#fbbf24" stroke="white" stroke-width="1.2"/>
      <path d="M16 8V11M16 21V24M8 16H11M21 16H24" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `)}`,
  groundStation: `data:image/svg+xml;base64,${btoa(`
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 6V26M6 16H26M16 12C13.2386 12 11 14.2386 11 17C11 19.7614 13.2386 22 16 22C18.7614 22 21 19.7614 21 17C21 14.2386 18.7614 12 16 12Z" stroke="#60a5fa" stroke-width="1.5"/>
      <circle cx="16" cy="17" r="2.5" fill="#60a5fa"/>
    </svg>
  `)}`
}
