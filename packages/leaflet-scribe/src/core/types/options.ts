import type * as L from 'leaflet'
import type { PrecisionOptions } from './localization.js'

export interface DrawErrorOptions {
  color?: string | undefined
  timeout?: number | undefined
  message?: string | undefined
}

export interface SimpleShapeOptions {
  /**
   * Determines if the draw tool remains enabled after drawing a shape.
   * @default false
   */
  repeatMode?: boolean | undefined
}

export interface DrawShapePathOptions extends L.PathOptions {
  clickable?: boolean | undefined
  maintainColor?: boolean | undefined
  showArea?: boolean | undefined
}

export interface PolylineDrawOptions extends SimpleShapeOptions {
  /**
   * Determines if line segments can cross.
   * @default true
   */
  allowIntersection?: boolean | undefined
  /**
   * Configuration options for the error that displays if an intersection is detected.
   * @default { color: '#b00b00', timeout: 2500 }
   */
  drawError?: DrawErrorOptions | undefined
  /**
   * Distance in pixels between each guide dash.
   * @default 20
   */
  guidelineDistance?: number | undefined
  /**
   * The options used when drawing the polyline/polygon on the map.
   */
  shapeOptions?: (L.PolylineOptions & { clickable?: boolean | undefined }) | undefined
  /**
   * Whether to display distance in the tooltip.
   * @default true
   */
  showLength?: boolean | undefined
  /**
   * Determines which measurement system (metric or imperial) is used.
   * @default true
   */
  metric?: boolean | string | string[] | undefined
  /**
   * When not metric, to use feet instead of yards for display.
   * @default true
   */
  feet?: boolean | undefined
  /**
   * When not metric, not feet use nautic mile for display.
   * @default false
   */
  nautic?: boolean | undefined
  /**
   * This should be a high number to ensure that you can draw over all other layers on the map.
   * @default 2000
   */
  zIndexOffset?: number | undefined
  icon?: L.Icon | L.DivIcon | undefined
  touchIcon?: L.Icon | L.DivIcon | undefined
  /**
   * The maximum length of the guide line.
   * @default 4000
   */
  maxGuideLineLength?: number | undefined
  /**
   * To change distance calculation.
   * @default 1
   */
  factor?: number | undefined
  /**
   * Once this number of points are placed, finish shape.
   * @default 0
   */
  maxPoints?: number | undefined
  precision?: PrecisionOptions | undefined
}

export interface PolygonDrawOptions extends PolylineDrawOptions {
  /**
   * Show the area of the drawn polygon in m², ha or km².
   * @default false
   */
  showArea?: boolean | undefined
  /**
   * Show the length of the drawn line.
   * @default false
   */
  showLength?: boolean | undefined
  /**
   * Defines the precision for each type of unit (e.g. { km: 2, ft: 0 }).
   * @default {}
   */
  precision?: PrecisionOptions | undefined
}

export interface RectangleDrawOptions extends SimpleShapeOptions {
  /**
   * The options used when drawing the rectangle on the map.
   */
  shapeOptions?: DrawShapePathOptions | undefined
  /**
   * Whether to show the area in the tooltip.
   * @default true
   */
  showArea?: boolean | undefined
  /**
   * Whether to use the metric measurement system or imperial.
   * @default true
   */
  metric?: boolean | string | string[] | undefined
}

export interface CircleDrawOptions extends SimpleShapeOptions {
  /**
   * The options used when drawing the circle on the map.
   */
  shapeOptions?: DrawShapePathOptions | undefined
  /**
   * Whether to show the radius in the tooltip.
   * @default true
   */
  showRadius?: boolean | undefined
  /**
   * Whether to use the metric measurement system or imperial.
   * @default true
   */
  metric?: boolean | string | string[] | undefined
  /**
   * When not metric, use feet instead of yards for display.
   * @default true
   */
  feet?: boolean | undefined
  /**
   * When not metric, not feet use nautic mile for display.
   * @default false
   */
  nautic?: boolean | undefined
}

export interface MarkerDrawOptions {
  /**
   * The icon displayed when drawing a marker.
   */
  icon?: L.Icon | L.DivIcon | undefined
  /**
   * This should be a high number to ensure that you can draw over all other layers on the map.
   * @default 2000
   */
  zIndexOffset?: number | undefined
  /**
   * Determines if the draw tool remains enabled after drawing a shape.
   * @default false
   */
  repeatMode?: boolean | undefined
}

export interface CircleMarkerDrawOptions extends MarkerDrawOptions {
  stroke?: boolean | undefined
  color?: string | undefined
  weight?: number | undefined
  opacity?: number | undefined
  fill?: boolean | undefined
  fillColor?: string | null | undefined
  fillOpacity?: number | undefined
  clickable?: boolean | undefined
  zIndexOffset?: number | undefined
}

export interface EditPolyVerticesEditOptions {
  icon?: L.Icon | L.DivIcon | undefined
  touchIcon?: L.Icon | L.DivIcon | undefined
  drawError?: DrawErrorOptions | undefined
  allowIntersection?: boolean | undefined
}

export interface EditSimpleShapeOptions {
  moveIcon?: L.Icon | L.DivIcon | undefined
  resizeIcon?: L.Icon | L.DivIcon | undefined
  touchMoveIcon?: L.Icon | L.DivIcon | undefined
  touchResizeIcon?: L.Icon | L.DivIcon | undefined
}

export interface EditPolyOptions extends EditPolyVerticesEditOptions {
  /**
   * The icon displayed on the move handle used to drag the whole polyline/polygon.
   */
  moveIcon?: L.Icon | L.DivIcon | undefined
  /**
   * The touch icon displayed on the move handle used to drag the whole polyline/polygon.
   */
  touchMoveIcon?: L.Icon | L.DivIcon | undefined
  /**
   * Determines if line segments can cross.
   * @default true
   */
  allowIntersection?: boolean | undefined
}

export interface SelectedPathOptions extends L.PathOptions {
  maintainColor?: boolean | undefined
}

export interface EditHandlerOptions {
  /**
   * This is the FeatureGroup that stores all editable shapes.
   */
  featureGroup: L.FeatureGroup
  /**
   * The options for the polygon layer in editing mode.
   */
  poly?: EditPolyOptions | undefined
  /**
   * The path options for how the layers will look while in edit mode.
   */
  selectedPathOptions?: SelectedPathOptions | undefined
}

export interface DeleteHandlerOptions {
  /**
   * This is the FeatureGroup that stores all deletable shapes.
   */
  featureGroup: L.FeatureGroup
}

export interface ControlDrawToolbarOptions {
  polyline?: PolylineDrawOptions | boolean | undefined
  polygon?: PolygonDrawOptions | boolean | undefined
  rectangle?: RectangleDrawOptions | boolean | undefined
  circle?: CircleDrawOptions | boolean | undefined
  marker?: MarkerDrawOptions | boolean | undefined
  circlemarker?: CircleMarkerDrawOptions | boolean | undefined
}

export interface ControlEditToolbarOptions {
  /**
   * This is the FeatureGroup that stores all editable shapes.
   */
  featureGroup: L.FeatureGroup
  /**
   * Edit handler options. Set to false to disable handler.
   */
  edit?: Omit<EditHandlerOptions, 'featureGroup'> | boolean | undefined
  /**
   * Delete handler options. Set to false to disable handler.
   */
  remove?: Record<string, unknown> | boolean | null | undefined
  /**
   * Poly vertex editing options.
   */
  poly?: EditPolyOptions | boolean | null | undefined
  /**
   * Allow polygon/polyline line segment intersections while editing.
   */
  allowIntersection?: boolean | undefined
}

export interface DrawConstructorOptions extends L.ControlOptions {
  /**
   * The initial position of the control (one of the map corners).
   * @default 'topleft'
   */
  position?: L.ControlPosition | undefined
  /**
   * The options used to configure the draw toolbar.
   * @default {}
   */
  draw?: ControlDrawToolbarOptions | false | undefined
  /**
   * The options used to configure the edit toolbar.
   * @default false
   */
  edit?: ControlEditToolbarOptions | false | undefined
}

export interface ToolbarAction {
  enabled?: boolean | ((...args: unknown[]) => unknown) | undefined
  title: string
  text: string
  callback: () => void
  context: object
}

export interface ToolbarModeHandler {
  enabled: boolean | Record<string, unknown> | undefined
  handler: L.Handler & {
    type?: string
    completeShape?: () => void
    deleteLastVertex?: () => void
    removeAllLayers?: () => void
    revertLayers?: () => void
    save?: () => void
    setOptions?: (options: unknown) => void
  }
  title: string
}

export interface TooltipLabelText {
  text: string
  subtext?: string | null | undefined
}
