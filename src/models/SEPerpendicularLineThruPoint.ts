import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import {
  IntersectionReturnType,
  LineState,
  PerpendicularLineThruPointState
} from "@/types";
import store from "@/store";
import { SEOneDimensional } from "@/types";
import { UpdateMode, UpdateStateType } from "@/types";
import { SELine } from "./SELine";
import { Vector3 } from "three";
import Line from "@/plottables/Line";

export class SEPerpendicularLineThruPoint extends SELine {
  /**
   * The One-Dimensional parent of this SEPerpendicularLine
   */
  private seParentOneDimensional: SEOneDimensional;

  /**
   * The point parent of this SEPerpendicularLine
   */
  private seParentPoint: SEPoint;

  /**
   * Create an intersection point between two one-dimensional objects
   * @param line the TwoJS Line associated with this intersection
   * @param seParentOneDimensional The one-dimensional parent
   * @param seParentPoint The point parent
   */
  constructor(
    line: Line,
    seParentOneDimensional: SEOneDimensional,
    seParentPoint: SEPoint,
    normalVector: Vector3,
    seEndPoint: SEPoint
  ) {
    super(line, seParentPoint, normalVector, seEndPoint);
    this.ref = line;
    this.seParentOneDimensional = seParentOneDimensional;
    this.seParentPoint = seParentPoint;

    this.name = `Perp(${seParentOneDimensional.name},${seParentPoint.name})`;
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this._exists =
      this.seParentOneDimensional.exists && this.seParentPoint.exists;
    if (this._exists) {
      // Get the normal vector to the line
      this.tmpVector.copy(this.normalVector);
      this.normalVector = this.seParentOneDimensional.getNormalToLineThru(
        this.seParentPoint.locationVector,
        this.normalVector // the soon to be old normal vector
      );

      // Given this.startPoint (in SELine)=this.seParentPoint and this.normalVector compute the endSEPoint
      // This is *never* undefined because the getNormalToLineThru *never* returns a point with
      //  location parallel to this.seParentPoint.locationVector
      this.tmpVector1.crossVectors(
        this.seParentPoint.locationVector,
        this.normalVector
      );

      this.endSEPoint.locationVector = this.tmpVector1.normalize();

      // Set the normal vector in the plottable object (the setter also calls the updateDisplay() method)
      this.ref.normalVector = this.normalVector;
    }
    // Update visibility
    if (this._exists && this._showing) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // Perpendicular Lines are completely determined by their parents and an update on the parents
    // will cause this line to be put into the correct location. Therefore there is no need to
    // store it in the stateArray for undo move. Store only for delete
    if (state.mode == UpdateMode.RecordStateForDelete) {
      const perpendicularLineThruPointState: PerpendicularLineThruPointState = {
        kind: "perpendicularLineThruPoint",
        object: this
      };
      state.stateArray.push(perpendicularLineThruPointState);
    }
    this.updateKids(state);
  }

  set glowing(b: boolean) {
    super.glowing = b;
  }
}
