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

  //#region actionOnPoint
  actionOnPoint(p: SEPoint): void {
    this.tmpVector.copy(p.locationVector); // Copy the old vector location of the SEPoint
    this.tmpVector.applyMatrix4(this.transformMatrix); // Apply the matrix
    if (p instanceof SEPointOnOneDimensional) {
      p.pointDirectLocationSetter(this.tmpVector); // use the direct setter because the parent might be out of date.
    } else {
      p.locationVector = this.tmpVector; // Set the new position vector
    }
    // // First mark the kids out of date so that the update method does a topological sort
    // p.markKidsOutOfDate();
    // p.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }
  //#endregion actionOnPoint

  actionOnLine(m: SELine): void {
    // lines depend on two two points that are on them and, if the points are antipodal, the normal vector
    // The points are updated by the action on point, so we don't worry about them
    this.tmpVector.copy(m.normalVector); // Copy the old vector location of the SEPoint
    this.tmpVector.applyMatrix4(this.transformMatrix); // Apply the matrix
    m.normalVector = this.tmpVector;
    // First mark the kids out of date so that the update method does a topological sort
    // m.markKidsOutOfDate();
    // m.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }

  actionOnSegment(s: SESegment): void {
    // segment depend on two two points that are on them and, if the points are antipodal, the normal
    // vector (and the length, but that is unaffected by a rotation so remains the same)
    // The points are updated by the action on point, so we don't worry about them
    this.tmpVector.copy(s.normalVector); // Copy the old vector location of the SEPoint
    this.tmpVector.applyMatrix4(this.transformMatrix); // Apply the matrix
    s.normalVector = this.tmpVector;
    // First mark the kids out of date so that the update method does a topological sort
    // s.markKidsOutOfDate();
    // s.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }

  actionOnCircle(c: SECircle): void {
    //Circles are completely determined by two points they depend on so no need to update them
  }
  actionOnLabel(l: SELabel): void {
    this.tmpVector.copy(l.locationVector); // Copy the old vector location of the SEPoint
    this.tmpVector.applyMatrix4(this.transformMatrix); // Apply the matrix
    l.labelDirectLocationSetter(this.tmpVector); // Set the new position vector directly because the parent might be out of date
    // First mark the kids out of date so that the update method does a topological sort
    // l.markKidsOutOfDate();
    // l.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }
}
