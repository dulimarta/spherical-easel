import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { Vector3 } from "three";
import { SEOneDimensional } from "@/types";
import { SaveStateMode, SaveStateType } from "@/types";

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

  /**
   * Get the location vector of the SEAntipodalPoint on the unit ideal sphere
   */
  set locationVector(pos: Vector3) {
    // Record the location on the unit ideal sphere of this SEAntipodalPoint
    console.debug("Antipodal Point set location -- should NEVER be called");
    this._locationVector
      .copy(this._antipodalPointParent.locationVector)
      .multiplyScalar(-1);
    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this._locationVector;
  }
  get locationVector(): Vector3 {
    return this._locationVector;
  }

  get antipodalPointParent(): SEPoint {
    return this._antipodalPointParent;
  }

  public update(state: SaveStateType): void {
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
    // Record the state of the object in state.stateArray
    switch (state.mode) {
      case SaveStateMode.UndoMove: {
        // The location of this antipodal point is determined by the parent point so no need to
        // store anything for moving undo
        break;
      }
      case SaveStateMode.UndoDelete: {
        break;
      }
      // The DisplayOnly case fall through and does nothing
      case SaveStateMode.DisplayOnly:
      default:
        break;
    }
    this.updateKids(state);
  }
}
