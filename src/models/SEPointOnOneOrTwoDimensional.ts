import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { Vector3 } from "three";
import { ObjectState, SEOneOrTwoDimensional } from "@/types";
import i18n from "@/i18n";
import { SESegment } from "./SESegment";
import { SELine } from "./SELine";
import { SECircle } from "./SECircle";
import { SEEllipse } from "./SEEllipse";

export class SEPointOnOneOrTwoDimensional extends SEPoint {
  /**
   * The One-Dimensional parents of this SEPointOnOneDimensional
   */
  private oneDimensionalParent: SEOneOrTwoDimensional;

  private tmpVector4 = new Vector3();
  /**
   * Create an intersection point between two one-dimensional objects
   * @param point the TwoJS point associated with this intersection
   * @param oneDimensionalParent The parent
   */
  constructor(point: Point, oneDimensionalParent: SEOneOrTwoDimensional) {
    super(point);
    this.ref = point;
    this.oneDimensionalParent = oneDimensionalParent;
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
          (this.oneDimensionalParent as SEOneOrTwoDimensional).closestVector(
            pos
          )
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

  public get noduleDescription(): string {
    let typeParent;
    if (this.oneDimensionalParent instanceof SESegment) {
      typeParent = i18n.tc("objects.segments", 3);
    } else if (this.oneDimensionalParent instanceof SELine) {
      typeParent = i18n.tc("objects.lines", 3);
    } else if (this.oneDimensionalParent instanceof SECircle) {
      typeParent = i18n.tc("objects.circles", 3);
    } else if (this.oneDimensionalParent instanceof SEEllipse) {
      typeParent = i18n.tc("objects.ellipses", 3);
    }

    return String(
      i18n.t(`objectTree.pointOnOneDimensional`, {
        parent: this.oneDimensionalParent.label?.ref.shortUserName,
        typeParent: typeParent
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ??
      "No Label Short Name In SEPointOnOneDimensional"
    );
  }

  /**
   * When undoing or redoing a move, we do *not* want to use the "set locationVector" method because
   * that will set the position on a potentially out of date object. We will trust that we do not need to
   * use the closest point method and that the object that this point depends on will be move under this point (if necessary)
   *
   * Without this method being called from rotationVisitor and pointMoverVisitor, if you create a line segment, a point on that line segment.
   * Then if you move one endpoint of the line segment (causing the point on it to move maybe by shrinking the original line segment) and then you undo the movement of the
   * endpoint of the line segment, the point on the segment doesn’t return to its proper (original) location.
   * @param pos The new position of the point
   */
  public pointDirectLocationSetter(pos: Vector3): void {
    // Record the location on the unit ideal sphere of this SEPoint
    this._locationVector.copy(pos).normalize();
    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this._locationVector;
  }

  get parentOneDimensional(): SEOneOrTwoDimensional {
    return this.oneDimensionalParent;
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this._exists = this.oneDimensionalParent.exists;

    if (this._exists) {
      // Update the current location with the closest point on the parent to the old location
      this._locationVector
        .copy(
          (this.oneDimensionalParent as SEOneOrTwoDimensional).closestVector(
            this._locationVector
          )
        )
        .normalize();
      // Set the position of the associated displayed plottable Point
      this.ref.positionVector = this._locationVector;
    }

    // Update visibility
    if (this._showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    // These are free points on their parent and so we store additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Point On One or Two Dimensional with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      const location = new Vector3();
      location.copy(this._locationVector);
      objectState.set(this.id, {
        kind: "pointOnOneOrTwoDimensional",
        object: this,
        locationVector: location
      });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public isPointOnOneDimensional(): boolean {
    return true;
  }
}
