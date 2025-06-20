import {
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  Mesh,
  Object3D
} from "three";
import { HENodule } from "./HENodule";
import { applyActionCode } from "firebase/auth";

export class HEPoint extends HENodule {
  constructor(pos: Vector3) {
    super();
    this.mesh.push(
      new Mesh(
        new SphereGeometry(0.05),
        new MeshStandardMaterial({ color: "white" })
      )
    );
    this.mesh[0].position.copy(pos);
    const scale = pos.length();
    let apppliedScale = -1;
    if (scale > 1) {
      // clicked position is on the hyperboloid sheet, by scaling down with the length
      // from the origin, we compute the position of the point on the sphere
      apppliedScale = scale;
    } else {
      // clicked position is on the sphere
      const hscale = pos.x * pos.x + pos.y * pos.y - pos.z * pos.z;
      // When hscale is positive, the projective line does not intersect the hyperboloid
      apppliedScale = hscale < 0 ? Math.sqrt(-hscale) : -1;
    }
    if (apppliedScale > 0) {
      // We have a secondary point to add
      this.mesh.push(
        new Mesh(
          new SphereGeometry(0.05),
          new MeshStandardMaterial({ color: "white" })
        )
      );
      this.mesh[1].position.copy(pos);
      this.mesh[1].position.divideScalar(apppliedScale);
    }
  }

  addToScene(s: Scene): void {
    // throw new Error("Method not implemented.");
    this.mesh.forEach((m: Object3D) => {
      s.add(m);
    });
  }
  removeFromScene(s: Scene): void {
    // throw new Error("Method not implemented.");
    this.mesh.forEach((m: Object3D) => {
      s.remove(m);
    });
  }

  public update(): void {
    throw new Error("Method not implemented.");
  }
  public shallowUpdate(): void {
    throw new Error("Method not implemented.");
  }
}
