import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { Matrix4, Vector3 } from "three";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SEParametric } from "./SEParametric";
import { SEStore } from "@/store";
const MIN = true;

export class SEParametricTracePoint extends SEPoint {
  /**
   * The parent of this SEParametricEndPoint
   */
  private _parametricParent: SEParametric;
  private parametricTime = NaN;

  // private tmpVector4 = new Vector3();
  private tmpMatrix = new Matrix4();
  constructor(point: Point, parametricParent: SEParametric) {
    super(point);
    this.ref = point;
    this._parametricParent = parametricParent;
    this.parametricParent.tracePoint = this;
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
    const possibleVec = this._parametricParent.ref.endPointVector(MIN);
    if (!this._parametricParent.isOutOfDate() && possibleVec !== undefined) {
      this._locationVector.copy(possibleVec).normalize();
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
    return String(
      i18n.t(`objectTree.tracePointOfParametric`, {
        parent: this._parametricParent.label?.ref.shortUserName
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
   * use the closest point method and that the object that this point depends on will be move under this point (if necessary)
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

  public setLocationByTime(tVal: number): void {
    this.parametricTime = tVal;
    // console.log("location by time");
    const pos = this.parametricParent.ref.P(tVal);
    this.pointDirectLocationSetter(pos);
    this.markKidsOutOfDate();
    this.update();
  }

  get parametricParent(): SEParametric {
    return this._parametricParent;
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this._exists = this.parametricParent.exists;

    const possibleVec = this._parametricParent.ref.P(this.parametricTime);
    if (possibleVec !== undefined && this._exists) {
      // Update the current location with the closest point on the parent to the old location
      this._locationVector.copy(possibleVec).normalize();
      this.tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix);
      this._locationVector.applyMatrix4(this.tmpMatrix);

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

    // These parametric point are completely determined by their parametric parents and an update on the parents
    // will cause this point to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Parametric Trace Point with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "parametricTracePoint", object: this });
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
