export enum StyleEditPanels { // The order of these *must* match the order of the panels in Style.vue
  Label,
  Front,
  Back,
  Advanced
}

export enum LabelDisplayMode {
  NameOnly, // display only the name
  CaptionOnly, // display the caption only
  ValueOnly, // display the value only (if any)
  NameAndCaption, // display the name and caption
  NameAndValue // display the name and value (if any)
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
  fillColor: "green",
  pointRadiusPercent: 100,
  strokeColor: "hsla(240, 55%, 55%, 1)"
};

export const DEFAULT_POINT_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Back,
  dynamicBackStyle: true,
  fillColor: "hsla(0, 100%, 75%, 1)",
  pointRadiusPercent: 90,
  strokeColor: "hsla(240, 55%, 75%, 1)"
};

export const DEFAULT_NONFREEPOINT_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  fillColor: "hsla(0, 50%, 75%, 1)",
  strokeColor: "hsla(240, 30%, 55%, 1)"
};

export const DEFAULT_LINE_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  strokeColor: "hsla(217, 90%, 61%, 1)",
  strokeWidthPercent: 100,
  dashArray: []
};

export const DEFAULT_LINE_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Back,
  dynamicBackStyle: true,
  strokeColor: "hsla(217, 90%, 80%, 1)",
  strokeWidthPercent: 100,
  dashArray: [10, 5]
};
export const DEFAULT_NONFREE_LINE_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  strokeColor: "hsla(217, 90%, 61%, 1)",
  strokeWidthPercent: 100
};

export const DEFAULT_NONFREE_LINE_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  strokeColor: "hsla(217, 90%, 81%, 1)",
  strokeWidthPercent: 100,
  dynamicBackStyle: true
};

export const DEFAULT_SEGMENT_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  strokeColor: "hsla(217, 90%, 61%, 1)",
  strokeWidthPercent: 100,
  dashArray: []
};

export const DEFAULT_SEGMENT_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  strokeColor: "hsla(217, 90%, 80%, 1)",
  strokeWidthPercent: 100,
  dashArray: [10, 5],
  dynamicBackStyle: true
};

export const DEFAULT_CIRCLE_FRONT_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  fillColor: "hsla(254, 100%, 90%, 0.2)",
  strokeColor: "hsla(217, 90%, 61%, 1)",
  strokeWidthPercent: 100,
  dashArray: []
};

export const DEFAULT_CIRCLE_BACK_STYLE: StyleOptions = {
  panel: StyleEditPanels.Front,
  dynamicBackStyle: true,
  fillColor: "hsla(10, 100%, 50%, 0.1)",
  strokeColor: "hsla(217, 90%, 80%, 1)",
  strokeWidthPercent: 100,
  dashArray: [10, 5]
};
