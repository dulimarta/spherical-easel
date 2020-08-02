export enum Styles {
  // Important: Be sure to include "Color" for enum member
  // that refers to Color property
  strokeWidthPercent,
  strokeColor,
  fillColorWhite,
  fillColorGray,
  fillColor,
  dashArray,
  opacity,
  dynamicBackStyle,
  pointRadiusPercent
}

export type StyleOptions = {
  front: boolean;
  strokeWidthPercent?: number;
  strokeColor?: string;
  fillColor?: string;
  dashArray?: number[];
  opacity?: number;
  dynamicBackStyle?: boolean;
  pointRadiusPercent?: number;
};
