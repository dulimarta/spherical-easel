import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Matrix4, Vector3, Matrix3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { SELabel } from "@/models/SELabel";
import { UpdateMode } from "@/types";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";

export class RotationVisitor implements Visitor {
  private transformMatrix: Matrix4 = new Matrix4();
  private normalMatrix: Matrix3 = new Matrix3();
  private tmpVector: Vector3 = new Vector3();

  setTransform(m: Matrix4): void {
    this.transformMatrix.copy(m);
    this.normalMatrix.getNormalMatrix(this.transformMatrix);
  }

  /**
   * Without the pointDirectLocationSetter being called from rotationVisitor and pointMoverVisitor, if you create a line segment, a point on that line segment.
   * Then if you move one endpoint of the line segment (causing the point on it to move maybe by shrinking the original line segment) and then you undo the movement of the
   * endpoint of the line segment, the point on the segment doesn’t return to its proper (original) location.
   */
  //#region actionOnPoint
  actionOnPoint(p: SEPoint): void {
    this.tmpVector.copy(p.locationVector); // Copy the old vector location of the SEPoint
    this.tmpVector.applyMatrix4(this.transformMatrix); // Apply the matrix
    if (p instanceof SEPointOnOneDimensional) {
      p.pointDirectLocationSetter(this.tmpVector); // use the direct setter because the parent might be out of date.
    } else {
      p.locationVector = this.tmpVector; // Set the new position vector
    }
  }
  //#endregion actionOnPoint

  actionOnLine(m: SELine): void {
    // lines depend on two two points that are on them and, if the points are antipodal, the normal vector
    // The points are updated by the action on point, so we don't worry about them
    this.tmpVector.copy(m.normalVector); // Copy the old vector location of the SEPoint
    this.tmpVector.applyMatrix4(this.transformMatrix); // Apply the matrix
    m.normalVector = this.tmpVector;
  }

  actionOnSegment(s: SESegment): void {
    // segment depend on two two points that are on them and, if the points are antipodal, the normal
    // vector (and the length, but that is unaffected by a rotation so remains the same)
    // The points are updated by the action on point, so we don't worry about them
    this.tmpVector.copy(s.normalVector); // Copy the old vector location of the SEPoint
    this.tmpVector.applyMatrix4(this.transformMatrix); // Apply the matrix
    s.normalVector = this.tmpVector;
  }

  actionOnCircle(c: SECircle): void {
    //Circles are completely determined by two points they depend on so no need to update them
  }
  actionOnLabel(l: SELabel): void {
    this.tmpVector.copy(l.locationVector); // Copy the old vector location of the SEPoint
    this.tmpVector.applyMatrix4(this.transformMatrix); // Apply the matrix
    l.labelDirectLocationSetter(this.tmpVector); // Set the new position vector directly because the parent might be out of date
  }
}
