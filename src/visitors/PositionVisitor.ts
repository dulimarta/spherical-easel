import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { Matrix4, Vector3 } from "three";

export class PositionVisitor implements Visitor {
  private transformMatrix: Matrix4 = new Matrix4();
  private tmpVector: Vector3 = new Vector3();
  setTransform(m: Matrix4): void {
    this.transformMatrix.copy(m);
  }

  actionOnPoint(p: SEPoint): void {
    // console.debug("Updating position of ", p.ref.name);
    this.tmpVector.copy(p.positionOnSphere);
    this.tmpVector.applyMatrix4(this.transformMatrix);
    p.positionOnSphere = this.tmpVector;
  }
}
