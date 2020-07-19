export enum Styles {
  StrokeWidth,
  StrokeColor,
  FillWhiteTint,
  FillGrayTint,
  DashPattern,
  Opacity,
  PointFrontRadius,
  PointBackRadius
}

export type StyleOptions = {
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;

  /* TODO: Add more options later */
};
