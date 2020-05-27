import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { Matrix4, Vector3 } from "three";

export class PositionVisitor implements Visitor {
  private transformMatrix: Matrix4 = new Matrix4();
  private tmpVector: Vector3 = new Vector3();
  setTransform(m: Matrix4) {
    this.transformMatrix.copy(m);
  }

  positionUpdateVisitor(p: SEPoint): void {
    /* none */
    console.debug("Updating position of ", p.ref.name);
    this.tmpVector.copy(p.ref.positionOnSphere);
    this.tmpVector.applyMatrix4(this.transformMatrix);
    p.ref.positionOnSphere = this.tmpVector;
    // p.ref.translation.x++;
    // p.ref.translation.y++;
  }
}
