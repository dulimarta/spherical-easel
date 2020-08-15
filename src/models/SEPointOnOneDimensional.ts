import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { Vector3 } from "three";
import { SEOneDimensional } from "@/types";
import { UpdateMode, UpdateStateType, PointState } from "@/types";

export class SEPointOnOneDimensional extends SEPoint {
  /**
   * The One-Dimensional parents of this SEPointOnOneDimensional
   */
  private oneDimensionalParent: SEOneDimensional;

  /**
   * Create an intersection point between two one-dimensional objects
   * @param point the TwoJS point associated with this intersection
   * @param oneDimensionalParent The parent
   */
  constructor(point: Point, oneDimensionalParent: SEOneDimensional) {
    super(point);
    this.ref = point;
    this.oneDimensionalParent = oneDimensionalParent;
    // this._locationVector.copy(initialVector);
    this.name = `PointOn(${oneDimensionalParent.name})`;
  }

  /**
   * Set or get the location vector of the SEPointOnOneDim on the unit ideal sphere
   * If you over ride a setting your must also override the getter! (And Vice Versa)
   */
  set locationVector(pos: Vector3) {
    // Record the location on the unit ideal sphere of this SEPointOnOneDim
    // If the parent is not out of date, use the closest vector, if not set the location directly
    // and the program will update the parent later so that the set location is on the parent (even though it is
    // at the time of execution)
    if (!this.oneDimensionalParent.isOutOfDate()) {
      this._locationVector
        .copy(
          (this.oneDimensionalParent as SEOneDimensional).closestVector(pos)
        )
        .normalize();
    } else {
      this._locationVector.copy(pos);
    }
    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this._locationVector;
  }

  get locationVector(): Vector3 {
    return this._locationVector;
  }
  /**
   * When undoing or redoing a move, we do *not* want to use the "set locationVector" method because
   * that will set the position on a potentially out of date object. We will trust that we do not need to
   * use the closest point method and that the object that this point depends on will be move under this point (if necessary)
   * @param pos The new position of the point
   */
  public pointDirectLocationSetter(pos: Vector3): void {
    // Record the location on the unit ideal sphere of this SEPoint
    this._locationVector.copy(pos).normalize();
    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this._locationVector;
  }

  get parentOneDimensional(): SEOneDimensional {
    return this.oneDimensionalParent;
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this._exists = this.oneDimensionalParent.exists;
    if (this._exists) {
      // Update the current location with the closest point on the parent to the old location
      this.locationVector = (this
        .oneDimensionalParent as SEOneDimensional).closestVector(
        this._locationVector
      );
    }
    // Update visibility
    if (this._showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // SEPointOnOneDimensional are free points and should be recorded for move and delete always
    if (
      state.mode == UpdateMode.RecordStateForDelete ||
      state.mode == UpdateMode.RecordStateForMove
    ) {
      const pointState: PointState = {
        kind: "point",
        object: this,
        locationVectorX: this._locationVector.x,
        locationVectorY: this._locationVector.y,
        locationVectorZ: this._locationVector.z
      };
      state.stateArray.push(pointState);
    }
    this.updateKids(state);
  }

  // I wish the SENodule methods would work but I couldn't figure out how
  // See the attempts in SENodule
  public isPointOnOneDimensional(): boolean {
    return true;
  }
}
