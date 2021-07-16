import { SETTINGS } from "@/global-settings";
// We move the declaration of LabelDisplayMode from this file
// to @/types/index.ts to solve the circular dependency issue
import { LabelDisplayMode } from "@/types";
export enum StyleEditPanels { // The order of these *must* match the order of the panels in Style.vue
  Label,
  Front,
  Back,
  Advanced
}

export enum Styles {
  // Important: Be sure to include "Color" for enum member
  // that refers to Color property
  strokeWidthPercent,
  strokeColor,
  fillColor,
  dashArray,
  dynamicBackStyle,
  pointRadiusPercent,
  labelDisplayText,
  labelDisplayCaption,
  labelTextStyle,
  labelTextFamily,
  labelTextDecoration,
  labelTextRotation,
  labelTextScalePercent,
  labelDisplayMode,
  labelFrontFillColor,
  labelBackFillColor,
  angleMarkerRadiusPercent,
  angleMarkerTickMark,
  angleMarkerDoubleArc
}

export interface StyleOptions {
  panel: StyleEditPanels; // TODO: delete the panel field
  strokeWidthPercent?: number;
  strokeColor?: string; // TODO : replace the type to "Two.Color"
  fillColor?: string;
  dashArray?: number[];
  dynamicBackStyle?: boolean;
  pointRadiusPercent?: number;
  backStyleContrast?: number;
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
  angleMarkerRadiusPercent?: number;
  angleMarkerTickMark?: boolean;
  angleMarkerDoubleArc?: boolean;
}

export const DEFAULT_POINT_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  fillColor: SETTINGS.point.drawn.fillColor.front,
  pointRadiusPercent: SETTINGS.point.radiusPercent.front,
  strokeColor: SETTINGS.point.drawn.strokeColor.front
};

export const DEFAULT_POINT_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Back,
  dynamicBackStyle: SETTINGS.point.dynamicBackStyle,
  fillColor: SETTINGS.point.drawn.fillColor.back,
  pointRadiusPercent: SETTINGS.point.radiusPercent.back,
  strokeColor: SETTINGS.point.drawn.strokeColor.back
};

export const DEFAULT_NONFREEPOINT_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  fillColor: SETTINGS.point.nonFree.fillColor.front,
  strokeColor: SETTINGS.point.nonFree.strokeColor.front
};

export const DEFAULT_LINE_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  strokeColor: SETTINGS.line.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.line.drawn.dashArray.front
};

export const DEFAULT_LINE_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Back,
  dynamicBackStyle: SETTINGS.line.dynamicBackStyle,
  strokeColor: SETTINGS.line.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.line.drawn.dashArray.back
};
export const DEFAULT_NONFREE_LINE_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  strokeColor: SETTINGS.line.nonFree.strokeColor.front,
  strokeWidthPercent: 100
};

export const DEFAULT_NONFREE_LINE_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  strokeColor: SETTINGS.line.nonFree.strokeColor.back,
  strokeWidthPercent: 100,
  dynamicBackStyle: SETTINGS.line.dynamicBackStyle
};

export const DEFAULT_SEGMENT_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  strokeColor: SETTINGS.segment.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.segment.drawn.dashArray.front
};

export const DEFAULT_SEGMENT_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  strokeColor: SETTINGS.segment.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.segment.drawn.dashArray.back,
  dynamicBackStyle: SETTINGS.segment.dynamicBackStyle
};

export const DEFAULT_CIRCLE_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  fillColor: SETTINGS.circle.drawn.fillColor.front,
  strokeColor: SETTINGS.circle.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.circle.drawn.dashArray.front
};

export const DEFAULT_CIRCLE_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  dynamicBackStyle: SETTINGS.circle.dynamicBackStyle,
  fillColor: SETTINGS.circle.drawn.fillColor.back,
  strokeColor: SETTINGS.circle.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.circle.drawn.dashArray.back
};

export const DEFAULT_ELLIPSE_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  fillColor: SETTINGS.ellipse.drawn.fillColor.front,
  strokeColor: SETTINGS.ellipse.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.ellipse.drawn.dashArray.front
};
export const DEFAULT_ELLIPSE_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Back,
  fillColor: SETTINGS.ellipse.drawn.fillColor.back,
  strokeColor: SETTINGS.ellipse.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.ellipse.drawn.dashArray.back
};

export const DEFAULT_ANGLE_MARKER_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  fillColor: SETTINGS.angleMarker.drawn.fillColor.front,
  strokeColor: SETTINGS.angleMarker.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.angleMarker.drawn.dashArray.front,
  angleMarkerTickMark: SETTINGS.angleMarker.defaultTickMark,
  angleMarkerDoubleArc: SETTINGS.angleMarker.defaultDoubleArc,
  angleMarkerRadiusPercent: 100
};

export const DEFAULT_ANGLE_MARKER_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  fillColor: SETTINGS.angleMarker.drawn.fillColor.back,
  strokeColor: SETTINGS.angleMarker.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.angleMarker.drawn.dashArray.back,
  // TODO: should we also include tickmark and doubleArc for the back style?
  angleMarkerTickMark: SETTINGS.angleMarker.defaultTickMark,
  angleMarkerDoubleArc: SETTINGS.angleMarker.defaultDoubleArc,
  angleMarkerRadiusPercent: 100,
  dynamicBackStyle: SETTINGS.angleMarker.dynamicBackStyle
};
