import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { Vector3 } from "three";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SEParametric } from "./SEParametric";

const MAX = false;
const MIN = true;

export class SEParametricEndPoint extends SEPoint {
  /**
   * The parent of this SEParametricEndPoint
   */
  private _parametricParent: SEParametric;
  private _isMinPoint = MIN;

  private tmpVector4 = new Vector3();

  constructor(point: Point, parametricParent: SEParametric, endPoint: string) {
    super(point);
    this.ref = point;
    this._parametricParent = parametricParent;
    this._isMinPoint = endPoint === "min";
    if (this._isMinPoint)
      console.debug(
        `Point ${this.name} is a minimum endppoint for parametric ${parametricParent.name}`
      );
    else
      console.debug(
        `Point ${this.name} is a maximum endppoint for parametric ${parametricParent.name}`
      );
    point.updateDisplay();
  }

  /**
   * Set or get the location vector of the SEPointOnOneDim on the unit ideal sphere
   * If you over ride a setting your must also override the getter! (And Vice Versa)
   */
  // set locationVector(pos: Vector3) {
  //   // Record the location on the unit ideal sphere of this SEPointOnOneDim
  //   // If the parent is not out of date, use the closest vector, if not set the location directly
  //   // and the program will update the parent later so that the set location is on the parent (even though it is
  //   // at the time of execution)
  //   let possibleVec: Vector3 | undefined;
  //   if (this.parents.length > 0) {
  //     const parent = this.parents[0] as SEParametric;
  //     let tValue: number;
  //     if (this._endpoint)
  //       // Start point
  //       tValue = parent.tRanges[0][0];
  //     else {
  //       const nRange = parent.tRanges.length;
  //       const len = parent.tRanges[nRange - 1].length;
  //       tValue = parent.tRanges[nRange - 1][len - 1];
  //     }
  //     possibleVec = parent.P(tValue);
  //   }
  //   if (!this._parametricParent.isOutOfDate() && possibleVec !== undefined) {
  //     this._locationVector.copy(possibleVec).normalize();
  //   } else {
  //     this._locationVector.copy(pos);
  //   }
  //   // Set the position of the associated displayed plottable Point
  //   this.ref.positionVector = this._locationVector;
  // }

  // get locationVector(): Vector3 {
  //   return this._locationVector;
  // }

  get isMinPoint(): boolean {
    return this._isMinPoint;
  }

  public get noduleDescription(): string {
    let endPoint: string;
    if (this._isMinPoint) {
      endPoint = "start";
    } else {
      endPoint = "end";
    }
    return String(
      i18n.t(`objectTree.endPointOfParametric`, {
        parent: this._parametricParent.label?.ref.shortUserName,
        end: endPoint
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ??
      "No Label Short Name In SEParametricEndPoint"
    );
  }

  /**
   * When undoing or redoing a move, we do *not* want to use the "set locationVector" method because
   * that will set the position on a potentially out of date object. We will trust that we do not need to
   * use the closest point method and that the object that this point depends on will be moved under this point
   * (if necessary)
   *
   * Without this method being called from rotationVisitor and pointMoverVisitor, if you create a line segment, a point on that line segment.
   * Then if you move one endpoint of the line segment (causing the point on it to move maybe by shrinking the original line segment) and then you undo the movement of the
   * endpoint of the line segment, the point on the segment doesn’t return to its proper (original) location.
   * @param pos The new position of the point
   */
  private pointDirectLocationSetter(pos: Vector3): void {
    // Record the location on the unit ideal sphere of this SEPoint
    this._locationVector.copy(pos).normalize();
    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this._locationVector;
  }

  get parametricParent(): SEParametric {
    return this._parametricParent;
  }

  public shallowUpdate(): void {
    this._exists = this.parametricParent.exists;

    let possibleVec: Vector3 | undefined = undefined;
    if (this.parents.length > 0) {
      const parent = this.parents[0] as SEParametric;
      let tValue: number;
      if (this._isMinPoint)
        // Start point
        tValue = parent.tRanges[0][0];
      else {
        const nRange = parent.tRanges.length;
        const len = parent.tRanges[nRange - 1].length;
        tValue = parent.tRanges[nRange - 1][len - 1];
      }
      possibleVec = parent.P(tValue);
    }
    if (possibleVec !== undefined && this._exists) {
      // Update the current location with the closest point on the parent to the old location
      this._locationVector.copy(possibleVec).normalize();
      // Set the position of the associated displayed plottable Point
      this.ref.positionVector = this._locationVector;
    } else {
      this._exists = false;
    }

    // Update visibility
    if (this._showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
  }
  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);
    this.shallowUpdate();

    // These parametric point are completely determined by their parametric parents and an update on the parents
    // will cause this point to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Parametric End Point with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "parametricEndPoint", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }
  public isNonFreePoint(): boolean {
    return true;
  }
  public isFreePoint(): boolean {
    return false;
  }
}
