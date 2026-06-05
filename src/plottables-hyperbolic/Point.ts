import { Nodule } from "@/plottables/Nodule";
import { Mesh, Scene } from "three";
import { Group } from "two.js/src/group";
import { createPoint } from "./MeshFactory";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import { ModelPublisher } from "@/models/CKNodule";

export class Point extends Nodule {
  _pointMesh: Mesh;
  constructor(modelRef: ModelPublisher) {
    super("HyperbolicPoint", modelRef);
    this._pointMesh = createPoint("TestPoint", false);
  }
  show(): void {
    throw new Error("Method not implemented.");
  }
  hide(): void {
    throw new Error("Method not implemented.");
  }
  addToLayers(layers: Group[], scene: Scene | null): void {
    scene?.add(this._pointMesh);
    this._pointMesh.layers.set(HYPERBOLIC_LAYER.upperSheetPoints);
  }
  removeFromLayers(): void {
    this._pointMesh.removeFromParent();
  }
  glowingDisplay(): void {
    throw new Error("Method not implemented.");
  }
  normalDisplay(): void {
    throw new Error("Method not implemented.");
  }
  modelUpdated(): void {
    throw new Error("Method not implemented.");
  }
}
