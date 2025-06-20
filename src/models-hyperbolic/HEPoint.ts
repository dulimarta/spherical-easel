import {
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  Mesh
} from "three";
import { HENodule } from "./HENodule";

export class HEPoint extends HENodule {
  constructor(pos: Vector3) {
    super();
    this.mesh = new Mesh(
      new SphereGeometry(0.05),
      new MeshStandardMaterial({ color: "white" })
    );
    this.mesh.position.copy(pos);
  }

  addToScene(s: Scene): void {
    // throw new Error("Method not implemented.");
    if (this.mesh) s.add(this.mesh);
  }
  removeFromScene(s: Scene): void {
    // throw new Error("Method not implemented.");
    if (this.mesh) s.remove(this.mesh);
  }

  public update(): void {
    throw new Error("Method not implemented.");
  }
  public shallowUpdate(): void {
    throw new Error("Method not implemented.");
  }
}
