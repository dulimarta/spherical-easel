import Two from "two.js";
import { SENodule } from "@/models/SENodule";
import { Stylable } from "./Styleable";

export default abstract class Nodule extends Two.Group implements Stylable {
  public owner!: SENodule;
  public name: string;

  constructor() {
    super();
    this.name = "Nodule" + this.id;
  }

  // abstract addToLayers(layers: Two.Group[]): void;
  // abstract removeFromLayers(layers: Two.Group[]): void;
  abstract frontGlowStyle(): void;
  abstract backGlowStyle(): void;
  abstract frontNormalStyle(): void;
  abstract backNormalStyle(): void;
}
