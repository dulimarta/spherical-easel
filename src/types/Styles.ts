import { SETTINGS } from "@/global-settings";
// We move the declaration of LabelDisplayMode from this file
// to @/types/index.ts to solve the circular dependency issue
import { hslaColorType, LabelDisplayMode } from "@/types";
export enum StyleEditPanels { // The order of these *must* match the order of the panels in Style.vue
  Label,
  Front,
  Back,
  Advanced
}

export interface StyleOptions {
  // panel?: StyleEditPanels; // TODO: delete the panel field
  strokeWidthPercent?: number;
  strokeColor?: string; // TODO : replace the type to "Two.Color"
  fillColor?: string;
  dashArray?: number[];
  reverseDashArray?: boolean;
  dynamicBackStyle?: boolean;
  pointRadiusPercent?: number;
  labelTextStyle?: string;
  labelTextFamily?: string;
  labelTextDecoration?: string;
  labelTextRotation?: number;
  labelTextScalePercent?: number;
  labelDisplayText?: string;
  labelDisplayCaption?: string;
  labelDisplayMode?: LabelDisplayMode;
  labelFrontFillColor?: string;
  labelBackFillColor?: string;
  labelDynamicBackStyle?: boolean;
  angleMarkerRadiusPercent?: number;
  angleMarkerTickMark?: boolean;
  angleMarkerDoubleArc?: boolean;
}

export const DEFAULT_POINT_FRONT_STYLE: StyleOptions = {
  fillColor: SETTINGS.point.drawn.fillColor.front,
  pointRadiusPercent: SETTINGS.point.radiusPercent.front,
  strokeColor: SETTINGS.point.drawn.strokeColor.front
};

export const DEFAULT_POINT_BACK_STYLE: StyleOptions = {
  dynamicBackStyle: SETTINGS.point.dynamicBackStyle,
  fillColor: SETTINGS.point.drawn.fillColor.back,
  pointRadiusPercent: SETTINGS.point.radiusPercent.back,
  strokeColor: SETTINGS.point.drawn.strokeColor.back
};

export const DEFAULT_NONFREEPOINT_FRONT_STYLE: StyleOptions = {
  fillColor: SETTINGS.point.nonFree.fillColor.front,
  strokeColor: SETTINGS.point.nonFree.strokeColor.front,
  pointRadiusPercent: SETTINGS.point.nonFree.scalePercent
};

export const DEFAULT_NONFREEPOINT_BACK_STYLE: StyleOptions = {
  fillColor: SETTINGS.point.nonFree.fillColor.back,
  strokeColor: SETTINGS.point.nonFree.strokeColor.back,
  pointRadiusPercent: SETTINGS.point.nonFree.scalePercent,
  dynamicBackStyle: SETTINGS.point.dynamicBackStyle
};

export const DEFAULT_LINE_FRONT_STYLE: StyleOptions = {
  strokeColor: SETTINGS.line.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.line.drawn.dashArray.front,
  reverseDashArray: SETTINGS.line.drawn.dashArray.reverse.front
};

export const DEFAULT_LINE_BACK_STYLE: StyleOptions = {
  dynamicBackStyle: SETTINGS.line.dynamicBackStyle,
  strokeColor: SETTINGS.line.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.line.drawn.dashArray.back,
  reverseDashArray: SETTINGS.line.drawn.dashArray.reverse.back
};
export const DEFAULT_NONFREE_LINE_FRONT_STYLE: StyleOptions = {
  strokeColor: SETTINGS.line.nonFree.strokeColor.front,
  dashArray: SETTINGS.line.nonFree.dashArray.front,
  reverseDashArray: SETTINGS.line.nonFree.dashArray.reverse.front,
  strokeWidthPercent: SETTINGS.line.nonFree.scalePercent
};

export const DEFAULT_NONFREE_LINE_BACK_STYLE: StyleOptions = {
  strokeColor: SETTINGS.line.nonFree.strokeColor.back,
  strokeWidthPercent: SETTINGS.line.nonFree.scalePercent,
  dashArray: SETTINGS.line.nonFree.dashArray.back,
  reverseDashArray: SETTINGS.line.nonFree.dashArray.reverse.back,
  dynamicBackStyle: SETTINGS.line.dynamicBackStyle
};

export const DEFAULT_SEGMENT_FRONT_STYLE: StyleOptions = {
  strokeColor: SETTINGS.segment.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.segment.drawn.dashArray.front,
  reverseDashArray: SETTINGS.segment.drawn.dashArray.reverse.front
};

export const DEFAULT_SEGMENT_BACK_STYLE: StyleOptions = {
  strokeColor: SETTINGS.segment.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.segment.drawn.dashArray.back,
  reverseDashArray: SETTINGS.segment.drawn.dashArray.reverse.back,
  dynamicBackStyle: SETTINGS.segment.dynamicBackStyle
};

export const DEFAULT_CIRCLE_FRONT_STYLE: StyleOptions = {
  fillColor: SETTINGS.circle.drawn.fillColor.front,
  strokeColor: SETTINGS.circle.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.circle.drawn.dashArray.front,
  reverseDashArray: SETTINGS.circle.drawn.dashArray.reverse.front
};

export const DEFAULT_CIRCLE_BACK_STYLE: StyleOptions = {
  dynamicBackStyle: SETTINGS.circle.dynamicBackStyle,
  fillColor: SETTINGS.circle.drawn.fillColor.back,
  strokeColor: SETTINGS.circle.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.circle.drawn.dashArray.back,
  reverseDashArray: SETTINGS.circle.drawn.dashArray.reverse.back
};

export const DEFAULT_ELLIPSE_FRONT_STYLE: StyleOptions = {
  fillColor: SETTINGS.ellipse.drawn.fillColor.front,
  strokeColor: SETTINGS.ellipse.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.ellipse.drawn.dashArray.front,
  reverseDashArray: SETTINGS.ellipse.drawn.dashArray.reverse.front
};
export const DEFAULT_ELLIPSE_BACK_STYLE: StyleOptions = {
  dynamicBackStyle: SETTINGS.ellipse.dynamicBackStyle,
  fillColor: SETTINGS.ellipse.drawn.fillColor.back,
  strokeColor: SETTINGS.ellipse.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.ellipse.drawn.dashArray.back,
  reverseDashArray: SETTINGS.ellipse.drawn.dashArray.reverse.back
};

export const DEFAULT_POLYGON_FRONT_STYLE: StyleOptions = {
  fillColor: SETTINGS.polygon.drawn.fillColor.front
};
export const DEFAULT_POLYGON_BACK_STYLE: StyleOptions = {
  dynamicBackStyle: SETTINGS.polygon.dynamicBackStyle,
  fillColor: SETTINGS.polygon.drawn.fillColor.back
};

export const DEFAULT_ANGLE_MARKER_FRONT_STYLE: StyleOptions = {
  fillColor: SETTINGS.angleMarker.drawn.fillColor.front,
  strokeColor: SETTINGS.angleMarker.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.angleMarker.drawn.dashArray.front,
  reverseDashArray: SETTINGS.angleMarker.drawn.dashArray.reverse.front,
  angleMarkerTickMark: SETTINGS.angleMarker.defaultTickMark,
  angleMarkerDoubleArc: SETTINGS.angleMarker.defaultDoubleArc,
  angleMarkerRadiusPercent: 100
};

export const DEFAULT_ANGLE_MARKER_BACK_STYLE: StyleOptions = {
  fillColor: SETTINGS.angleMarker.drawn.fillColor.back,
  strokeColor: SETTINGS.angleMarker.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.angleMarker.drawn.dashArray.back,
  reverseDashArray: SETTINGS.angleMarker.drawn.dashArray.reverse.back,
  angleMarkerTickMark: SETTINGS.angleMarker.defaultTickMark,
  angleMarkerDoubleArc: SETTINGS.angleMarker.defaultDoubleArc,
  angleMarkerRadiusPercent: 100,
  dynamicBackStyle: SETTINGS.angleMarker.dynamicBackStyle
};

export const DEFAULT_LABEL_TEXT_STYLE: Partial<StyleOptions> = {
  labelDisplayMode: LabelDisplayMode.NameOnly,
  labelDisplayText: "",
  labelDisplayCaption: "",
  labelTextFamily: SETTINGS.label.family,
  labelTextStyle: SETTINGS.label.style,
  labelTextDecoration: SETTINGS.label.decoration,
  labelTextScalePercent: 100,
  labelTextRotation: 0,
  labelFrontFillColor: SETTINGS.label.fillColor.front,
  labelBackFillColor: SETTINGS.label.fillColor.back,
  labelDynamicBackStyle: SETTINGS.label.dynamicBackStyle
};

export const DEFAULT_PARAMETRIC_FRONT_STYLE: StyleOptions = {
  strokeColor: SETTINGS.parametric.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.parametric.drawn.dashArray.front,
  reverseDashArray: SETTINGS.parametric.drawn.dashArray.reverse.front
};

export const DEFAULT_PARAMETRIC_BACK_STYLE: StyleOptions = {
  dynamicBackStyle: SETTINGS.parametric.dynamicBackStyle,
  strokeColor: SETTINGS.parametric.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.parametric.drawn.dashArray.back,
  reverseDashArray: SETTINGS.parametric.drawn.dashArray.reverse.front
};
