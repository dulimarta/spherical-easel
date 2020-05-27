export interface Stylable {
  /**
   * Update visual properties to render object as glowing
   */
  glowStyle(): void;

  /**
   * Update visual properties to render as background object
   */
  backgroundStyle(): void;

  /**
   * Restore to normal style
   */
  normalStyle(): void;

  // TODO: Add more styles
}
