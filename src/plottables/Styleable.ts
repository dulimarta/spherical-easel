export interface Stylable {
  /**
   * Update visual properties to render object as glowing
   */
  frontGlowStyle(): void;
  backGlowStyle(): void;
  glowStyle(): void;
  /**
   * Restore to normal style
   */
  frontNormalStyle(): void;
  backNormalStyle(): void;
  normalStyle(): void;

  // TODO: Add more styles
}
