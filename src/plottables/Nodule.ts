import Two from "two.js";
import { SENode } from "@/models/SENode";

export default abstract class Nodule extends Two.Group {
  public owner!: SENode;

  abstract addToLayers(layers: Two.Group[]): void;
  abstract removeFromLayers(layers: Two.Group[]): void;
}
