import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Matrix4, Vector3, Matrix3 } from "three";
import { SECircle } from "@/models/SECircle";

export class PositionVisitor implements Visitor {
  private transformMatrix: Matrix4 = new Matrix4();
  private normalMatrix: Matrix3 = new Matrix3();
  private tmpVector: Vector3 = new Vector3();

  setTransform(m: Matrix4): void {
    this.transformMatrix.copy(m);
    this.normalMatrix.getNormalMatrix(this.transformMatrix);
  }

  actionOnPoint(p: SEPoint): void {
    this.tmpVector.copy(p.positionOnSphere);
    this.tmpVector.applyMatrix4(this.transformMatrix);
    p.positionOnSphere = this.tmpVector; // this doesn't make sense. the SEPoint location doesn't change under a rotation only where it is displayed changes
  }

  /* This should never be called because lines are always children of points */
  actionOnLine(m: SELine): void {
    // Transform both end points of the plotable line
    this.tmpVector.copy(m.ref.startPoint);
    this.tmpVector.applyMatrix4(this.transformMatrix);
    m.ref.startPoint = this.tmpVector; // use the setter function
    this.tmpVector.copy(m.ref.endPoint);
    this.tmpVector.applyMatrix4(this.transformMatrix);
    m.ref.endPoint = this.tmpVector; // use the setter function
  }

  actionOnCircle(c: SECircle): void {
    this.tmpVector.copy(c.normalDirection);
    this.tmpVector.applyMatrix4(this.transformMatrix);
    c.normalDirection = this.tmpVector;
  }
}
