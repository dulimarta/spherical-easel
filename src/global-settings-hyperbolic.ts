import colors from "vuetify/util/colors";
export const SETTINGS = {
  angularBorder: 4, // in degrees of the angular radius of the border around the viewport
  dollyDistanceMax: 500,
  dollyDistanceMin: 10,
  pointsAtInfinityAngularWidth: 0.005, // The angular width of the strip at the top of the hyperboloid mesh to which points at infinity are constrained
  pointsAtInfinityAngularGap: 0.02, // The angular gap between the points at infinity strip and the edge of the hyperboloid mesh
  minDollyDistanceChangeForGridUpdate: 0.15, // The minimum change in dolly distance (camera to origin) required to trigger a grid update
  fadePercentage: 0.85, // The percentage of the height of the hyperboloid at which fading (opacity lowers) begins
  startOpacityFade: 1.0, // The opacity at the start of the fade of hyperboloid
  endOpacityFade: 0.85 // The opacity at the end of the fade hyperboloid
};
export enum HYPERBOLIC_LAYER {
  // These are not layers in the sense of spherical easel - layers that are displayed in a certain order to render the background behind the foreground. They are groups of objects that can be added or removed from the scene. ThreeJS constraint: max 32 layers
  upperSheet,
  upperSheetGrid,
  upperSheetPoints,
  upperSheetInfPoints,
  upperSheetLines,
  lowerSheet,
  lowerSheetGrid,
  lowerSheetPoints,
  lowerSheetInfPoints,
  lowerSheetLines,
  labels
  /* The following three are experimental */
  // unitSphere,
  // kleinDisk,
  // poincareDisk
}

export default SETTINGS;
