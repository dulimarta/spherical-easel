import { StyleCategory, StyleOptions } from "@/types/Styles";

export interface Stylable {
  /**
   * Update visual properties to render object as glowing
   */
  // frontGlowingDisplay(): void;
  // backGlowingDisplay(): void;
  glowingDisplay(): void;
  /**
   * Restore to normal style
   */
  // frontNormalDisplay(): void;
  // backNormalDisplay(): void;
  normalDisplay(): void;

  updateStyle(mode: StyleCategory, options: StyleOptions): void;
}
