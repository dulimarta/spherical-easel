import colors from "vuetify/util/colors";
export const SETTINGS = {
  Z_MAX: 50 //sMath.acosh(50) // Maximum z-coordinate for points in the upper sheet, negative for lower sheet
};
export enum HYPERBOLIC_LAYER {
  // These are not layers in the sense of spherical easel - layers that are displayed in a certain order to render the background behind the foreground. They are groups of objects that can be added or removed from the scene. ThreeJS constraint: max 32 layers
  upperSheet,
  upperSheetPoints,
  upperSheetLines,
  lowerSheet,
  lowerSheetPoints,
  lowerSheetLines,
  labels
  /* The following three are experimental */
  // unitSphere,
  // kleinDisk,
  // poincareDisk
}

export default SETTINGS;
