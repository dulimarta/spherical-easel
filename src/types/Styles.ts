export enum StyleEditMode {
  Front,
  Back,
  Label
}

export enum LabelDisplayMode {
  NameOnly, // display only the name
  CaptionOnly, // display the caption only
  NameAndCaption // display the name and caption
}

export enum Styles {
  // Important: Be sure to include "Color" for enum member
  // that refers to Color property
  strokeWidthPercent,
  strokeColor,
  fillColor,
  dashArray,
  opacity,
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
  labelVisibility,
  objectVisibility
}

export type StyleOptions = {
  mode: StyleEditMode;
  strokeWidthPercent?: number;
  strokeColor?: string;
  fillColor?: string;
  dashArray?: number[];
  opacity?: number;
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
  labelVisibility?: boolean;
  objectVisibility?: boolean;
};
