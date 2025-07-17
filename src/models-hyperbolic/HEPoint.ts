import {
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  Mesh,
  Object3D
} from "three";
import { HENodule } from "./HENodule";

export class HEPoint extends HENodule {
  constructor(pos: Vector3) {
    super();
    const material = new MeshStandardMaterial({ color: "white" });
    this.mesh.push(new Mesh(new SphereGeometry(0.05), material));
    this.mesh[0].position.copy(pos);
    HENodule.POINT_COUNT++;
    this.mesh[0].name = `P${HENodule.POINT_COUNT}`;
    this.name = `P${HENodule.POINT_COUNT}`;
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
    } else {
      // Points on sphere with no associated hyperbolic counterpart are colored red
      material.color.setColorName("red");
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
  public glowingDisplay(): void {
    // console.debug(`Attempt to glow ${this.name}`);
    (this.mesh[0].material as MeshStandardMaterial).color.set("yellow");
    this.mesh[0].scale.set(2, 2, 2);
  }
  public normalDisplay(): void {
    // console.debug(`Attempt to unglow ${this.name}`);
    (this.mesh[0].material as MeshStandardMaterial).color.set("white");
    this.mesh[0].scale.set(1.0, 1.0, 1.0);
  }
}
