import { TextLabelMode } from "@/types";

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
  textName,
  textCaption,
  textStyle,
  textFamily,
  textDecoration,
  textRotation,
  textScalePercent,
  textLabelMode
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
  backStyleContrast?: number;
  textStyle?: string;
  textFamily?: string;
  textDecoration?: string;
  textRotation?: number;
  textScalePercent?: number;
  textName?: string;
  textCaption?: string;
  textLabelMode?: TextLabelMode;
};
