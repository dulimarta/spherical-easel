import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Matrix4, Vector3, Matrix3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";
import { UpdateMode, UpdateStateType } from "@/types";

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
    p.locationVector = this.tmpVector; // Set the new position vector
    // First mark the kids out of date so that the update method does a topological sort
    p.markKidsOutOfDate();
    p.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }
  //#endregion actionOnPoint

  actionOnLine(m: SELine): void {
    //m.update();
  }

  actionOnSegment(s: SESegment): void {
    // s.update();
  }

  actionOnCircle(c: SECircle): void {
    // c.update();
  }
}
