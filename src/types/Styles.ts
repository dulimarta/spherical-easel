export enum Styles {
  // Important: Be sure to include "Color" for enum member
  // that refers to Color property
  pointFrontRadius,
  pointBackRadius,
  strokeWidthPercentage,
  strokeColor,
  fillColorWhite,
  fillColorGray,
  dashPattern,
  opacity
}

export type StyleOptions = {
  pointFrontRadius?: number;
  pointBackRadius?: number;
  strokeWidthPercentage?: number;
  strokeColor?: string;
  fillColorWhite?: string;
  fillColorGray?: string;
  dashPattern?: number[];
  opacity?: number;

  /* TODO: Add more options later */
};
