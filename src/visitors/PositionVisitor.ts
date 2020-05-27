import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Matrix4, Vector3, Matrix3 } from "three";

export class PositionVisitor implements Visitor {
  private transformMatrix: Matrix4 = new Matrix4();
  private normalMatrix: Matrix3 = new Matrix3();
  private tmpVector: Vector3 = new Vector3();

  setTransform(m: Matrix4): void {
    this.transformMatrix.copy(m);
    this.normalMatrix.getNormalMatrix(this.transformMatrix);
  }

  actionOnPoint(p: SEPoint): void {
    // console.debug("Updating position of ", p.ref.name);
    this.tmpVector.copy(p.positionOnSphere);
    this.tmpVector.applyMatrix4(this.transformMatrix);
    p.positionOnSphere = this.tmpVector;
  }
  actionOnLine(m: SELine): void {
    // Transform both end points
    this.tmpVector.copy(m.ref.orientation);
    this.tmpVector.applyMatrix3(this.normalMatrix);
    m.normalDirection = this.tmpVector;
  }
}
