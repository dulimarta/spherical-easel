import Two from "two.js";
import { SENodule } from "@/models/SENodule";
import { Stylable } from "./Styleable";

/**
 * A Nodule consists of one or more SVG elements
 */
export default abstract class Nodule extends Two.Group implements Stylable {
  public owner!: SENodule;
  public name: string;

  constructor() {
    super();
    this.name = "Nodule" + this.id;
  }

  /**
   * Add various SVG elements of this nodule to appropriate layers
   * @param {Two.Group[]} layers
   */
  abstract addToLayers(layers: Two.Group[]): void;

  /**
   * This operation reverses the action performed by addToLayers()
   */
  abstract removeFromLayers(/*layers: Two.Group[]*/): void;

  /** Update visual style(s) */
  abstract frontGlowStyle(): void;
  abstract backGlowStyle(): void;
  abstract frontNormalStyle(): void;
  abstract backNormalStyle(): void;
}
