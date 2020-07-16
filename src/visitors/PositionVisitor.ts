import { Visitor } from "./Visitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Matrix4, Vector3, Matrix3 } from "three";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";

export class PositionVisitor implements Visitor {
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
    p.markKidsOutOfDate();
    console.log("position visitor point", p.name);
    p.update();
  }
  //#endregion actionOnPoint

  /**
   * Are these necessary? All other objects are children of points  but somehow if these are not update methods
   * then if you create a circle, rotate it to a new location, then undo twice so the canvas is blank.
   * The first redo, correctly makes the circles, but the second redo only rotates the points and not the circle....
   */
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
