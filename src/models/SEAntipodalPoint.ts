import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { Vector3 } from "three";
import { SEOneDimensional } from "@/types";
import { UpdateMode, UpdateStateType, PointState } from "@/types";

export class SEAntipodalPoint extends SEPoint {
  /**
   * The point parent of this SEAntipodalPoint
   */
  private _antipodalPointParent: SEPoint;

  /**
   * Create an intersection point between two one-dimensional objects
   * @param point the TwoJS point associated with this intersection
   * @param antipodalPointParent The parent
   */
  constructor(point: Point, antipodalPointParent: SEPoint) {
    super(point);
    this.ref = point;
    this._antipodalPointParent = antipodalPointParent;
    this.name = `Antipodal(${antipodalPointParent.name})`;
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this._exists = this._antipodalPointParent.exists;
    if (this._exists) {
      // Update the current location with the opposite of the antipodal parent vector location
      this._locationVector
        .copy(this._antipodalPointParent.locationVector)
        .multiplyScalar(-1);
      // console.log(
      //   "update the antipodal",
      //   this._locationVector.toFixed(2),
      //   this._antipodalPointParent.locationVector.toFixed(2)
      // );
      this.ref.positionVector = this._locationVector;
    }

    // Update visibility
    if (this._showing) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // The location of this antipodal point is determined by the parent point so no need to
    // store anything for moving undo Only store for delete

    if (state.mode == UpdateMode.RecordStateForDelete) {
      const pointState: PointState = {
        kind: "point",
        locationVectorX: this._locationVector.x,
        locationVectorY: this._locationVector.y,
        locationVectorZ: this._locationVector.z,
        object: this
      };
      state.stateArray.push(pointState);
    }

    this.updateKids(state);
  }
}
