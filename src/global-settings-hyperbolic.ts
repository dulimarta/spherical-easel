import colors from "vuetify/util/colors";
export const SETTINGS = {
  angularBorder: 4, // in degrees of the angular radius of the border around the viewport
  dollyDistanceMax: 100,
  dollyDistanceMin: 10,
  pointsAtInfinityStripWidth: 10, // The width of the strip at the top of the hyperboloid mesh to which points at infinity are constrained
  minDollyDistanceChangeForGridUpdate: 0.5 // The minimum change in dolly distance (camera to origin) required to trigger a grid update
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
