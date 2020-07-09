import Two from "two.js";
import { SENodule } from "@/models/SENodule";
import { Stylable } from "./Styleable";
import { Resizeable } from "./Resizeable";
import SETTINGS from "@/global-settings";

export enum DisplayStyle {
  DEFAULT,
  TEMPORARY,
  UPDATE,
  GLOWING
}

/**
 * A Nodule consists of one or more TwoJS(SVG) elements
 */
export default abstract class Nodule implements Stylable, Resizeable {
  // Declare owner, this field will be initialized by the associated owner of the plottable Nodule
  public owner!: SENodule;
  public name!: string;

  /**
   * Add various TwoJS (SVG) elements of this nodule to appropriate layers
   * @param {Two.Group[]} layers
   */
  abstract addToLayers(layers: Two.Group[]): void;

  /**
   * This operation reverses the action performed by addToLayers()
   */
  abstract removeFromLayers(): void;

  /**This operation constraint the visual properties (linewidth, circle size, etc) when the view is zoomed in/out */
  abstract adjustSizeForZoom(factor: number): void;

  /** Update visual style(s) */
  abstract normalDisplay(): void;
  abstract glowingDisplay(): void;

  /** Set the temporary/glowing style and update the current display*/
  abstract stylize(flag: DisplayStyle): void;
  abstract setVisible(flag: boolean): void;

  //** Get the back contrasting style using the value of contrast */
  static contrastFillColor(frontColor: string): string {
    return frontColor;
  }
  static contrastStrokeColor(frontColor: string): string {
    return frontColor;
  }
  static contractStrokeWidth(frontStrokeWidth: number): number {
    return frontStrokeWidth;
  }
  static contrastOpacity(frontOpacity: number): number {
    return SETTINGS.contrast * frontOpacity;
  }
  static contrastDashArray(frontDashArray: number[]): number[] {
    return frontDashArray;
  }
  static contrastDashArrayOffset(frontOffset: number): number {
    return frontOffset;
  }
}
