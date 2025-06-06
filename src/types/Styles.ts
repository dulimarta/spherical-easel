import { SETTINGS } from "@/global-settings";
// We move the declaration of LabelDisplayMode from this file
// to @/types/index.ts to solve the circular dependency issue
import { LabelDisplayMode } from "@/types";
export enum StyleCategory {
  Label,
  Front,
  Back,
  Advanced
}

export type StyleOptions = ShapeStyleOptions & LabelStyleOptions
export type ShapeStyleOptions = {
  strokeWidthPercent?: number;
  strokeColor?: string; // TODO : replace the type to "Two.Color"
  fillColor?: string;
  useDashPattern?: boolean;
  dashArray?: Array<number>; 
  reverseDashArray?: boolean;
  dynamicBackStyle?: boolean;
  pointRadiusPercent?: number;
  angleMarkerRadiusPercent?: number;
  angleMarkerTickMark?: boolean;
  angleMarkerDoubleArc?: boolean;
  angleMarkerArrowHeads?: boolean;
}

export type LabelStyleOptions = {
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
}

export type StylePropertyValue = number | string | boolean | LabelDisplayMode | Array<number>;

export const DEFAULT_POINT_FRONT_STYLE: ShapeStyleOptions = {
  fillColor: SETTINGS.point.drawn.fillColor.front,
  pointRadiusPercent: SETTINGS.point.radiusPercent.front,
  strokeColor: SETTINGS.point.drawn.strokeColor.front
};

export const DEFAULT_POINT_BACK_STYLE: ShapeStyleOptions = {
  dynamicBackStyle: SETTINGS.point.dynamicBackStyle,
  fillColor: SETTINGS.point.drawn.fillColor.back,
  pointRadiusPercent: SETTINGS.point.radiusPercent.back,
  strokeColor: SETTINGS.point.drawn.strokeColor.back
};

export const DEFAULT_NONFREEPOINT_FRONT_STYLE: ShapeStyleOptions = {
  ...DEFAULT_POINT_FRONT_STYLE,
  fillColor: SETTINGS.point.nonFree.fillColor.front,
  strokeColor: SETTINGS.point.nonFree.strokeColor.front,
  pointRadiusPercent: SETTINGS.point.nonFree.scalePercent
};

export const DEFAULT_NONFREEPOINT_BACK_STYLE: ShapeStyleOptions = {
  ...DEFAULT_POINT_BACK_STYLE,
  fillColor: SETTINGS.point.nonFree.fillColor.back,
  strokeColor: SETTINGS.point.nonFree.strokeColor.back,
  pointRadiusPercent: SETTINGS.point.nonFree.scalePercent,
  dynamicBackStyle: SETTINGS.point.dynamicBackStyle
};

export const DEFAULT_LINE_FRONT_STYLE: ShapeStyleOptions = {
  strokeColor: SETTINGS.line.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.line.drawn.dashArray.useOnFront,
  dashArray: SETTINGS.line.drawn.dashArray.front,
  reverseDashArray: SETTINGS.line.drawn.dashArray.reverse.front
};

export const DEFAULT_LINE_BACK_STYLE: ShapeStyleOptions = {
  dynamicBackStyle: SETTINGS.line.dynamicBackStyle,
  strokeColor: SETTINGS.line.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.line.drawn.dashArray.useOnBack,
  dashArray: SETTINGS.line.drawn.dashArray.back,
  reverseDashArray: SETTINGS.line.drawn.dashArray.reverse.back
};
export const DEFAULT_NONFREE_LINE_FRONT_STYLE: ShapeStyleOptions = {
  ...DEFAULT_LINE_FRONT_STYLE,
  strokeColor: SETTINGS.line.nonFree.strokeColor.front,
  useDashPattern: SETTINGS.line.nonFree.dashArray.useOnFront,
  dashArray: SETTINGS.line.nonFree.dashArray.front,
  reverseDashArray: SETTINGS.line.nonFree.dashArray.reverse.front,
  strokeWidthPercent: SETTINGS.line.nonFree.scalePercent
};

export const DEFAULT_NONFREE_LINE_BACK_STYLE: ShapeStyleOptions = {
  ...DEFAULT_LINE_BACK_STYLE,
  strokeColor: SETTINGS.line.nonFree.strokeColor.back,
  strokeWidthPercent: SETTINGS.line.nonFree.scalePercent,
  useDashPattern: SETTINGS.line.nonFree.dashArray.useOnBack,
  dashArray: SETTINGS.line.nonFree.dashArray.back,
  reverseDashArray: SETTINGS.line.nonFree.dashArray.reverse.back,
  dynamicBackStyle: SETTINGS.line.dynamicBackStyle
};

export const DEFAULT_SEGMENT_FRONT_STYLE: ShapeStyleOptions = {
  strokeColor: SETTINGS.segment.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.segment.drawn.dashArray.useOnFront,
  dashArray: SETTINGS.segment.drawn.dashArray.front,
  reverseDashArray: SETTINGS.segment.drawn.dashArray.reverse.front
};

export const DEFAULT_SEGMENT_BACK_STYLE: ShapeStyleOptions = {
  strokeColor: SETTINGS.segment.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.segment.drawn.dashArray.useOnBack,
  dashArray: SETTINGS.segment.drawn.dashArray.back,
  reverseDashArray: SETTINGS.segment.drawn.dashArray.reverse.back,
  dynamicBackStyle: SETTINGS.segment.dynamicBackStyle
};

export const DEFAULT_NONFREE_SEGMENT_FRONT_STYLE: ShapeStyleOptions = {
  ...DEFAULT_SEGMENT_FRONT_STYLE,
  strokeColor: SETTINGS.segment.nonFree.strokeColor.front,
  useDashPattern: SETTINGS.segment.nonFree.dashArray.useOnFront,
  dashArray: SETTINGS.segment.nonFree.dashArray.front,
  reverseDashArray: SETTINGS.segment.nonFree.dashArray.reverse.front,
  strokeWidthPercent: SETTINGS.segment.nonFree.scalePercent
};

export const DEFAULT_NONFREE_SEGMENT_BACK_STYLE: ShapeStyleOptions = {
  ...DEFAULT_SEGMENT_BACK_STYLE,
  strokeColor: SETTINGS.segment.nonFree.strokeColor.back,
  strokeWidthPercent: SETTINGS.segment.nonFree.scalePercent,
  useDashPattern: SETTINGS.segment.nonFree.dashArray.useOnBack,
  dashArray: SETTINGS.segment.nonFree.dashArray.back,
  reverseDashArray: SETTINGS.segment.nonFree.dashArray.reverse.back,
  dynamicBackStyle: SETTINGS.segment.dynamicBackStyle
};

export const DEFAULT_CIRCLE_FRONT_STYLE: ShapeStyleOptions = {
  fillColor: SETTINGS.circle.drawn.fillColor.front,
  strokeColor: SETTINGS.circle.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.circle.drawn.dashArray.useOnFront,
  dashArray: SETTINGS.circle.drawn.dashArray.front,
  reverseDashArray: SETTINGS.circle.drawn.dashArray.reverse.front
};

export const DEFAULT_CIRCLE_BACK_STYLE: ShapeStyleOptions = {
  dynamicBackStyle: SETTINGS.circle.dynamicBackStyle,
  fillColor: SETTINGS.circle.drawn.fillColor.back,
  strokeColor: SETTINGS.circle.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.circle.drawn.dashArray.useOnBack,
  dashArray: SETTINGS.circle.drawn.dashArray.back,
  reverseDashArray: SETTINGS.circle.drawn.dashArray.reverse.back
};
export const DEFAULT_NONFREE_CIRCLE_FRONT_STYLE: ShapeStyleOptions = {
  ...DEFAULT_CIRCLE_FRONT_STYLE,
  strokeColor: SETTINGS.circle.nonFree.strokeColor.front,
  fillColor: SETTINGS.circle.nonFree.fillColor.front,
  useDashPattern: SETTINGS.circle.nonFree.dashArray.useOnFront,
  dashArray: SETTINGS.circle.nonFree.dashArray.front,
  reverseDashArray: SETTINGS.circle.nonFree.dashArray.reverse.front,
  strokeWidthPercent: SETTINGS.circle.nonFree.scalePercent
};

export const DEFAULT_NONFREE_CIRCLE_BACK_STYLE: ShapeStyleOptions = {
  ...DEFAULT_CIRCLE_BACK_STYLE,
  strokeColor: SETTINGS.circle.nonFree.strokeColor.back,
  fillColor: SETTINGS.circle.nonFree.fillColor.back,
  strokeWidthPercent: SETTINGS.circle.nonFree.scalePercent,
  useDashPattern: SETTINGS.circle.nonFree.dashArray.useOnBack,
  dashArray: SETTINGS.circle.nonFree.dashArray.back,
  reverseDashArray: SETTINGS.circle.nonFree.dashArray.reverse.back,
  dynamicBackStyle: SETTINGS.circle.dynamicBackStyle
};
export const DEFAULT_ELLIPSE_FRONT_STYLE: ShapeStyleOptions = {
  fillColor: SETTINGS.ellipse.drawn.fillColor.front,
  strokeColor: SETTINGS.ellipse.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.ellipse.drawn.dashArray.useOnFront,
  dashArray: SETTINGS.ellipse.drawn.dashArray.front,
  reverseDashArray: SETTINGS.ellipse.drawn.dashArray.reverse.front
};
export const DEFAULT_ELLIPSE_BACK_STYLE: ShapeStyleOptions = {
  dynamicBackStyle: SETTINGS.ellipse.dynamicBackStyle,
  fillColor: SETTINGS.ellipse.drawn.fillColor.back,
  strokeColor: SETTINGS.ellipse.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.ellipse.drawn.dashArray.useOnBack,
  dashArray: SETTINGS.ellipse.drawn.dashArray.back,
  reverseDashArray: SETTINGS.ellipse.drawn.dashArray.reverse.back
};
export const DEFAULT_NONFREE_ELLIPSE_FRONT_STYLE: ShapeStyleOptions = {
  strokeColor: SETTINGS.ellipse.nonFree.strokeColor.front,
  fillColor: SETTINGS.ellipse.nonFree.fillColor.front,
  useDashPattern: SETTINGS.ellipse.nonFree.dashArray.useOnFront,
  dashArray: SETTINGS.ellipse.nonFree.dashArray.front,
  reverseDashArray: SETTINGS.ellipse.nonFree.dashArray.reverse.front,
  strokeWidthPercent: SETTINGS.ellipse.nonFree.scalePercent
};

export const DEFAULT_NONFREE_ELLIPSE_BACK_STYLE: ShapeStyleOptions = {
  strokeColor: SETTINGS.ellipse.nonFree.strokeColor.back,
  fillColor: SETTINGS.ellipse.nonFree.fillColor.back,
  strokeWidthPercent: SETTINGS.ellipse.nonFree.scalePercent,
  useDashPattern: SETTINGS.ellipse.nonFree.dashArray.useOnBack,
  dashArray: SETTINGS.ellipse.nonFree.dashArray.back,
  reverseDashArray: SETTINGS.ellipse.nonFree.dashArray.reverse.back,
  dynamicBackStyle: SETTINGS.ellipse.dynamicBackStyle
};
export const DEFAULT_POLYGON_FRONT_STYLE: ShapeStyleOptions = {
  fillColor: SETTINGS.polygon.drawn.fillColor.front
};
export const DEFAULT_POLYGON_BACK_STYLE: ShapeStyleOptions = {
  dynamicBackStyle: SETTINGS.polygon.dynamicBackStyle,
  fillColor: SETTINGS.polygon.drawn.fillColor.back
};

export const DEFAULT_ANGLE_MARKER_FRONT_STYLE: ShapeStyleOptions = {
  fillColor: SETTINGS.angleMarker.drawn.fillColor.front,
  strokeColor: SETTINGS.angleMarker.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.angleMarker.drawn.dashArray.useOnFront,
  dashArray: SETTINGS.angleMarker.drawn.dashArray.front,
  reverseDashArray: SETTINGS.angleMarker.drawn.dashArray.reverse.front,
  angleMarkerTickMark: SETTINGS.angleMarker.defaultTickMark,
  angleMarkerDoubleArc: SETTINGS.angleMarker.defaultDoubleArc,
  angleMarkerArrowHeads: SETTINGS.angleMarker.arrowHeadDisplay,
  angleMarkerRadiusPercent: 100
};

export const DEFAULT_ANGLE_MARKER_BACK_STYLE: ShapeStyleOptions = {
  fillColor: SETTINGS.angleMarker.drawn.fillColor.back,
  strokeColor: SETTINGS.angleMarker.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.angleMarker.drawn.dashArray.useOnBack,
  dashArray: SETTINGS.angleMarker.drawn.dashArray.back,
  reverseDashArray: SETTINGS.angleMarker.drawn.dashArray.reverse.back,
  angleMarkerRadiusPercent: 100,
  dynamicBackStyle: SETTINGS.angleMarker.dynamicBackStyle
};

export const DEFAULT_LABEL_TEXT_STYLE: LabelStyleOptions = {
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

export const DEFAULT_TEXT_TEXT_STYLE: LabelStyleOptions = {
  labelDisplayText: "",
  labelTextFamily: SETTINGS.text.family,
  labelTextStyle: SETTINGS.text.style,
  labelTextDecoration: SETTINGS.text.decoration,
  labelTextScalePercent: 100,
  labelTextRotation: 0,
  labelFrontFillColor: SETTINGS.text.fillColor,
};

export const DEFAULT_PARAMETRIC_FRONT_STYLE: ShapeStyleOptions = {
  strokeColor: SETTINGS.parametric.drawn.strokeColor.front,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.parametric.drawn.dashArray.useOnFront,
  dashArray: SETTINGS.parametric.drawn.dashArray.front,
  reverseDashArray: SETTINGS.parametric.drawn.dashArray.reverse.front
};

export const DEFAULT_PARAMETRIC_BACK_STYLE: ShapeStyleOptions = {
  dynamicBackStyle: SETTINGS.parametric.dynamicBackStyle,
  strokeColor: SETTINGS.parametric.drawn.strokeColor.back,
  strokeWidthPercent: 100,
  useDashPattern: SETTINGS.parametric.drawn.dashArray.useOnBack,
  dashArray: SETTINGS.parametric.drawn.dashArray.back,
  reverseDashArray: SETTINGS.parametric.drawn.dashArray.reverse.front
};
