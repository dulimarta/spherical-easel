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
  fillColor: SETTINGS.point.drawn.fillColor.front,
  pointRadiusPercent: SETTINGS.point.radiusPercent.front,
  strokeColor: SETTINGS.point.drawn.strokeColor.front
};

export const DEFAULT_POINT_BACK_STYLE: StyleOptions = {
  dynamicBackStyle: SETTINGS.point.dynamicBackStyle,
  backStyleContrast: SETTINGS.style.backStyleContrast,
  fillColor: SETTINGS.point.drawn.fillColor.back,
  pointRadiusPercent: SETTINGS.point.radiusPercent.back,
  strokeColor: SETTINGS.point.drawn.strokeColor.back
};

export const DEFAULT_NONFREEPOINT_FRONT_STYLE: StyleOptions = {
  fillColor: SETTINGS.point.nonFree.fillColor.front,
  strokeColor: SETTINGS.point.nonFree.strokeColor.front
};

export const DEFAULT_LINE_FRONT_STYLE: StyleOptions = {
  strokeColor: SETTINGS.line.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.line.drawn.dashArray.front
};

export const DEFAULT_LINE_BACK_STYLE: StyleOptions = {
  dynamicBackStyle: SETTINGS.line.dynamicBackStyle,
  backStyleContrast: SETTINGS.style.backStyleContrast,
  strokeColor: SETTINGS.line.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.line.drawn.dashArray.back
};
export const DEFAULT_NONFREE_LINE_FRONT_STYLE: StyleOptions = {
  strokeColor: SETTINGS.line.nonFree.strokeColor.front,
  strokeWidthPercent: 100
};

export const DEFAULT_NONFREE_LINE_BACK_STYLE: StyleOptions = {
  strokeColor: SETTINGS.line.nonFree.strokeColor.back,
  strokeWidthPercent: 100,
  backStyleContrast: SETTINGS.style.backStyleContrast,
  dynamicBackStyle: SETTINGS.line.dynamicBackStyle
};

export const DEFAULT_SEGMENT_FRONT_STYLE: StyleOptions = {
  strokeColor: SETTINGS.segment.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.segment.drawn.dashArray.front
};

export const DEFAULT_SEGMENT_BACK_STYLE: StyleOptions = {
  strokeColor: SETTINGS.segment.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  backStyleContrast: SETTINGS.style.backStyleContrast,
  dashArray: SETTINGS.segment.drawn.dashArray.back,
  dynamicBackStyle: SETTINGS.segment.dynamicBackStyle
};

export const DEFAULT_CIRCLE_FRONT_STYLE: StyleOptions = {
  fillColor: SETTINGS.circle.drawn.fillColor.front,
  strokeColor: SETTINGS.circle.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.circle.drawn.dashArray.front
};

export const DEFAULT_CIRCLE_BACK_STYLE: StyleOptions = {
  dynamicBackStyle: SETTINGS.circle.dynamicBackStyle,
  backStyleContrast: SETTINGS.style.backStyleContrast,
  fillColor: SETTINGS.circle.drawn.fillColor.back,
  strokeColor: SETTINGS.circle.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.circle.drawn.dashArray.back
};

export const DEFAULT_ELLIPSE_FRONT_STYLE: StyleOptions = {
  fillColor: SETTINGS.ellipse.drawn.fillColor.front,
  strokeColor: SETTINGS.ellipse.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.ellipse.drawn.dashArray.front
};
export const DEFAULT_ELLIPSE_BACK_STYLE: StyleOptions = {
  fillColor: SETTINGS.ellipse.drawn.fillColor.back,
  strokeColor: SETTINGS.ellipse.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.ellipse.drawn.dashArray.back,
  backStyleContrast: SETTINGS.style.backStyleContrast
};

export const DEFAULT_ANGLE_MARKER_FRONT_STYLE: StyleOptions = {
  fillColor: SETTINGS.angleMarker.drawn.fillColor.front,
  strokeColor: SETTINGS.angleMarker.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.angleMarker.drawn.dashArray.front,
  angleMarkerTickMark: SETTINGS.angleMarker.defaultTickMark,
  angleMarkerDoubleArc: SETTINGS.angleMarker.defaultDoubleArc,
  angleMarkerRadiusPercent: 100
};

export const DEFAULT_ANGLE_MARKER_BACK_STYLE: StyleOptions = {
  fillColor: SETTINGS.angleMarker.drawn.fillColor.back,
  strokeColor: SETTINGS.angleMarker.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.angleMarker.drawn.dashArray.back,
  angleMarkerTickMark: SETTINGS.angleMarker.defaultTickMark,
  angleMarkerDoubleArc: SETTINGS.angleMarker.defaultDoubleArc,
  angleMarkerRadiusPercent: 100,
  dynamicBackStyle: SETTINGS.angleMarker.dynamicBackStyle,
  backStyleContrast: SETTINGS.style.backStyleContrast
};

export const DEFAULT_LABEL_TEXT_STYLE: Partial<StyleOptions> = {
  labelDisplayMode: LabelDisplayMode.NameOnly,
  // labelDisplayText: "No Label",
  // labelDisplayCaption: "No caption",
  labelTextFamily: SETTINGS.label.family,
  labelTextStyle: SETTINGS.label.style,
  labelTextDecoration: SETTINGS.label.decoration,
  labelTextScalePercent: 100,
  labelTextRotation: 0,
  labelFrontFillColor: SETTINGS.label.fillColor.front,
  labelBackFillColor: SETTINGS.label.fillColor.back
};

export const DEFAULT_LABEL_FRONT_STYLE: Partial<StyleOptions> = {
  fillColor: SETTINGS.label.fillColor.front
};

export const DEFAULT_LABEL_BACK_STYLE: Partial<StyleOptions> = {
  fillColor: SETTINGS.label.fillColor.back,
  dynamicBackStyle: SETTINGS.label.dynamicBackStyle,
  backStyleContrast: SETTINGS.style.backStyleContrast
};

export const DEFAULT_PARAMETRIC_FRONT_STYLE: StyleOptions = {
  strokeColor: SETTINGS.parametric.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.parametric.drawn.dashArray.front
};

export const DEFAULT_PARAMETRIC_BACK_STYLE: StyleOptions = {
  dynamicBackStyle: SETTINGS.parametric.dynamicBackStyle,
  backStyleContrast: SETTINGS.style.backStyleContrast,
  strokeColor: SETTINGS.parametric.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  dashArray: SETTINGS.parametric.drawn.dashArray.back
};
