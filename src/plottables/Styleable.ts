export interface Stylable {
  /**
   * Update visual properties to render object as glowing
   */
  frontGlowStyle(): void;
  backGlowStyle(): void;

  /**
   * Restore to normal style
   */
  frontNormalStyle(): void;
  backNormalStyle(): void;

  // TODO: Add more styles
}
