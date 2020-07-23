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
    this._locationVector
      .copy((this.oneDimensionalParent as SEOneDimensional).closestVector(pos))
      .normalize();
    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this._locationVector;
  }

  get locationVector(): Vector3 {
    return this._locationVector;
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
    if (this._showing) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    if (state.mode == UpdateMode.RecordState) {
      // If the parent points of the segment are antipodal, the normal vector determines the
      // plane of the segment.  The points also don't determine the arcLength of the segments.
      // Both of these quantities could change during a move therefore store normal vector and arcLength
      // in stateArray for undo move. (No need to store the parent points, they will be updated on their own
      // before this line is updated.) Store the coordinate values of the vector and not the point to the vector.
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
}
