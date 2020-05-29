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
    p.positionOnSphere = this.tmpVector; // this doesn't make sense. the SEPoint location doesn't change under a rotation only where it is displayed changes
  }
  /* This should never be called because lines are always children of points */
  actionOnLine(m: SELine): void {
    // console.debug(`Updating SELine ${m.id}, Line ${m.ref.id}`);
    // Transform the normal of this line
    const tmp = new Vector3();
    tmp.copy(m.normalDirection);
    tmp.applyMatrix3(this.normalMatrix);
    m.normalDirection.copy(tmp);

    // Transform the normal vector of the circle?
    // m.ref.orientation = tmp;
    // Transform both end points of the plotable line
    tmp.copy(m.ref.startPoint);
    tmp.applyMatrix4(this.transformMatrix);
    m.ref.startPoint = tmp; // use the setter function
    tmp.copy(m.ref.endPoint);
    tmp.applyMatrix4(this.transformMatrix);
    m.ref.endPoint = this.tmpVector; // use the setter function
  }
}
