import * as Cesium from 'cesium'

export const LABEL_FONT = '16px "JetBrains Mono", monospace'
export const LABEL_OUTLINE_WIDTH = 2.5
export const LABEL_STYLE = Cesium.LabelStyle.FILL_AND_OUTLINE
export const LABEL_FILL_COLOR = Cesium.Color.WHITE
export const LABEL_OUTLINE_COLOR = Cesium.Color.BLACK.withAlpha(0.8)

export const LABEL_DISTANCE_DISPLAY_CONDITION = new Cesium.DistanceDisplayCondition(0, 1.5e7)

export const LABEL_SCALE_BY_DISTANCE = new Cesium.NearFarScalar(
  1.5e6, 1.0,
  1.5e7, 0.5
)

export const LABEL_TRANSLUCENCY_BY_DISTANCE = new Cesium.NearFarScalar(
  1.0e7, 1.0,
  1.5e7, 0.0
)

export function createLabelGraphics(options: {
  text: string | Cesium.Property
  pixelOffset?: Cesium.Cartesian2
  horizontalOrigin?: Cesium.HorizontalOrigin
  verticalOrigin?: Cesium.VerticalOrigin
  showBackground?: boolean
  fillColor?: Cesium.Color
}): Cesium.LabelGraphics {
  return new Cesium.LabelGraphics({
    text: options.text,
    font: LABEL_FONT,
    fillColor: options.fillColor ?? LABEL_FILL_COLOR,
    outlineColor: LABEL_OUTLINE_COLOR,
    outlineWidth: LABEL_OUTLINE_WIDTH,
    style: LABEL_STYLE,
    horizontalOrigin: options.horizontalOrigin ?? Cesium.HorizontalOrigin.LEFT,
    verticalOrigin: options.verticalOrigin ?? Cesium.VerticalOrigin.CENTER,
    pixelOffset: options.pixelOffset ?? new Cesium.Cartesian2(12, 0),
    showBackground: options.showBackground ?? false,
    backgroundColor: Cesium.Color.fromCssColorString('#0f172a').withAlpha(0.7),
    backgroundPadding: new Cesium.Cartesian2(8, 4),
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    scaleByDistance: LABEL_SCALE_BY_DISTANCE,
    translucencyByDistance: LABEL_TRANSLUCENCY_BY_DISTANCE,
    distanceDisplayCondition: LABEL_DISTANCE_DISPLAY_CONDITION,
  })
}
