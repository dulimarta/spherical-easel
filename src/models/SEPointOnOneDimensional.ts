import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { Vector3 } from "three";
import { SEOneDimensional } from "@/types";

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
  constructor(
    point: Point,
    oneDimensionalParent: SEOneDimensional
    //    initialVector: Vector3
  ) {
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

  public update(): void {
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
    this.updateKids();
  }
}
