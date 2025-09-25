import colors from "vuetify/util/colors";
export const SETTINGS = {
  Z_MAX: 10 // Maximum z-coordinate for points in the upper sheet, negative for lower sheet
};
export enum HYPERBOLIC_LAYER {
  // ThreeJS constraint: max 32 layers
  upperSheet,
  upperSheetPoints,
  upperSheetLines,
  lowerSheet,
  lowerSheetPoints,
  lowerShettLines,
  label,
  /* The following three are experimental */
  unitSphere,
  kleinDisk,
  poincareDisk
}

export default SETTINGS;
