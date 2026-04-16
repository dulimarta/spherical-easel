import { max, min } from "three/tsl";
import colors from "vuetify/util/colors";
export const SETTINGS = {
  angularBorder: 4, // in degrees of the angular radius of the border around the viewport
  dollyDistanceMax: 200,
  dollyDistanceMin: 10,
  minDollyDistanceChangeForViewUpdate: 0.05, // The minimum change in dolly distance (camera to origin) required to trigger a view update
  maxFieldOfView: 45, // The maximum field of view for the perspective camera in degrees. Also the initial field of view
  minFieldOfView: 10, // The minimum field of view for the perspective camera in degrees.
  minFOVChangeForViewUpdate: 0.2, // The minimum change in field of view required to trigger a view update
  idealPointsStripAngularWidth: 0.01, // The angular width of the strip at the top of the hyperboloid mesh to which ideal points are constrained, when the field of view is at a maximum
  idealPointsStripAngularGap: 0.02, // The angular gap between the ideal points' strip and the edge of the hyperboloid mesh, when the field of view is at a maximum
  angularUnit: 0.04, // A line segment starting at (0,0,1) and in the plane parallel to the screen subtending this angle in any zoom/dolly level is considered a unit length

  fadePercentage: 0.985, // The percentage of the height of the hyperboloid at which fading (opacity lowering) begins
  startOpacityFade: 0.95, // The opacity at the start of the fade of hyperboloid and below
  endOpacityFade: 0.65, // The opacity at the end (i.e. top bottom edge) of the fade hyperboloid

  maxZClip: 150, //set the maximum value of zUpperClip so that the entire hyperboloid and grid lines are shown at max dolly distance and maxFieldOfView

  percentReductionAtMaxDolly: 0.5 // the percent non-ideal points and labels are reduced by at max dolly
};

export enum HYPERBOLIC_LAYER {
  // These are not layers in the sense of spherical easel - layers that are displayed in a certain order to render the background behind the foreground. They are groups of objects that can be added or removed from the scene. ThreeJS constraint: max 32 layers
  upperSheet,
  upperSheetGrid,
  upperSheetPoints,
  upperSheetIdealPoints,
  upperSheetLabels,
  upperSheetIdealLabels,
  upperSheetLines,
  lowerSheet,
  lowerSheetGrid,
  lowerSheetPoints,
  lowerSheetIdealPoints,
  lowerSheetLabels,
  lowerSheetIdealLabels,
  lowerSheetLines,
  labels
}

export default SETTINGS;
