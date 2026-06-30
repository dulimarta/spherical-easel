import { CKLine } from "@/models/CKLine";
import { Nodule } from "@/plottables/Nodule";
import {
  NodeMaterial,
  TorusGeometry,
  Mesh,
  type Scene,
  MeshStandardNodeMaterial
} from "three/webgpu";

export class SLine extends Nodule<CKLine> {
  private _lineMesh: Mesh;
  private _lineMaterial: NodeMaterial;
  constructor(name: string, modelRef: CKLine) {
    super(name, modelRef);

    this._lineMaterial = new MeshStandardNodeMaterial({ color: 0xffff00 });
    this._lineMesh = new Mesh(
      new TorusGeometry(1, 0.006, 20, 120),
      this._lineMaterial
    );
  }
  show(): void {
    // throw new Error("Method not implemented.");
  }
  hide(): void {
    // throw new Error("Method not implemented.");
  }
  addToScene(s: Scene): void {
    s.add(this._lineMesh);
  }
  removeFromScene(): void {
    // throw new Error("Method not implemented.");
    this._lineMesh.removeFromParent();
  }
  glowingDisplay(): void {
    // throw new Error("Method not implemented.");
  }
  normalDisplay(): void {
    // throw new Error("Method not implemented.");
  }
  modelUpdated(): void {
    const line = this.modelRef.theLine.vector(1);
    console.debug(
      "SLine::modelUpdated line vector:",
      -line[2],
      line[1],
      -line[0]
    );
    this._lineMesh.lookAt(-line[2], line[1], -line[0]);
  }
}
