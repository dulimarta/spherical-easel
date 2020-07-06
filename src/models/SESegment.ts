import { SENodule } from "./SENodule";
import Segment from "@/plottables/Segment";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";
import { SESegmentMidPoint } from "./SESegmentMidPoint";
import SETTINGS from "@/global-settings";

const tmpVec1 = new Vector3();
const tmpVec2 = new Vector3();
let SEGMENT_COUNT = 0;

export class SESegment extends SENodule implements Visitable {
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public ref: Segment;
  /**
   * The model SE object that is the start of the segment
   */
  private _startPoint: SEPoint;
  /**
   * The model SE object that is the mid point of the segment on the unit ideal sphere
   * IT IS NEVER DISPLAYED, but is need to smoothly update the segment
   */
  public _midPoint: SESegmentMidPoint;
  /**
   * The model SE object that is the end of the segment
   */
  private _endPoint: SEPoint;

  /**
   *
   * @param seg The plottable TwoJS Object associated to this object
   * @param start The plottable TwoJS object that is the start of the segment
   * @param midVec The vector that points to midpoint of the segment
   * @param end The plottable TwoJS object that is the end of the segment
   */
  constructor(
    seg: Segment,
    start: SEPoint,
    mid: SESegmentMidPoint,
    end: SEPoint
  ) {
    super();
    this.ref = seg;
    seg.owner = this;
    this._startPoint = start;
    this._midPoint = mid;
    this._endPoint = end;

    SEGMENT_COUNT++;
    this.name = `Ls-${SEGMENT_COUNT}`;

    // Place registerChild calls AFTER the name is set
    // so debugging output shows name correctly
    start.registerChild(this);
    end.registerChild(this);
  }

  accept(v: Visitor): void {
    v.actionOnSegment(this);
  }

  get startPoint(): SEPoint {
    return this._startPoint;
  }

  get endPoint(): SEPoint {
    return this._endPoint;
  }
  get midPoint(): SESegmentMidPoint {
    return this._midPoint;
  }

  get normalDirection(): Vector3 {
    return tmpVec1
      .crossVectors(
        this.startPoint.vectorPosition,
        this.midPoint.vectorPosition
      )
      .normalize();
  }

  public isHitAt(unitIdealVector: Vector3): boolean {
    // Is the unitIdealVector is perpendicular to the normal to the plane containing the segment?
    tmpVec1
      .crossVectors(
        this.startPoint.vectorPosition,
        this.midPoint.vectorPosition
      )
      .normalize();
    if (Math.abs(unitIdealVector.dot(tmpVec1)) > 1e-2) return false;

    // Is the unitIdealVector inside the radius arcLength/2 circle about the midVector?
    return (
      this.midPoint.vectorPosition.angleTo(unitIdealVector) <
      (this.startPoint.vectorPosition.angleTo(this.midPoint.vectorPosition) +
        this.midPoint.vectorPosition.angleTo(this.endPoint.vectorPosition)) /
        2 +
        SETTINGS.segment.hitIdealDistance
    );
  }

  public isPositionInsideArc(unitIdealVector: Vector3): boolean {
    // Is the point between start and mid?
    let angle1;
    let angle2;
    tmpVec1
      .crossVectors(this.startPoint.vectorPosition, unitIdealVector)
      .normalize();
    angle1 =
      this.startPoint.vectorPosition.angleTo(unitIdealVector) *
      Math.sign(tmpVec1.z);
    tmpVec2
      .crossVectors(unitIdealVector, this.midPoint.vectorPosition)
      .normalize();
    angle2 =
      unitIdealVector.angleTo(this.midPoint.vectorPosition) *
      Math.sign(tmpVec2.z);
    console.log("Start", this.startPoint.vectorPosition.toFixed(2));
    console.log("Mid", this.midPoint.vectorPosition.toFixed(2));
    console.log(
      tmpVec2
        .copy(this.startPoint.vectorPosition)
        .add(this.endPoint.vectorPosition)
        .normalize()
        .toFixed(2)
    );
    console.log("End", this.endPoint.vectorPosition.toFixed(2));
    console.log(
      "a1",
      angle1,
      "a2",
      angle2,
      "sum",
      angle1 + angle2,
      this.ref.arcLength / 2
    );

    if (
      Math.sign(angle1) === Math.sign(angle2) &&
      Math.abs(angle1 + angle2) - this.ref.arcLength / 2 < 0.1
    ) {
      return true;
    }

    // Is the point between mid and end?
    tmpVec1
      .crossVectors(this.midPoint.vectorPosition, unitIdealVector)
      .normalize();
    angle1 =
      this.midPoint.vectorPosition.angleTo(unitIdealVector) *
      Math.sign(tmpVec1.z);
    tmpVec2
      .crossVectors(unitIdealVector, this.endPoint.vectorPosition)
      .normalize();
    angle2 =
      unitIdealVector.angleTo(this.endPoint.vectorPosition) *
      Math.sign(tmpVec2.z);
    return (
      Math.sign(angle1) === Math.sign(angle2) &&
      Math.abs(angle1 + angle2) - this.ref.arcLength / 2 < 0.1
    );
  }

  // public isHitAt(spherePos: Vector3): boolean {
  //   // Is the spherePos close to the plane containing the segment?
  //   //  Is the angle between the normal vector to the segment and the spherePos close to Pi/2?
  //   //  That is, is the cos(angle) close to zero?
  //   if (
  //     Math.abs(spherePos.dot(this.ref.normalVector)) >
  //     SETTINGS.segment.hitIdealDistance
  //   )
  //     return false;
  //   // If the code is here spherePos is close to the plane containing the segment
  //   //  Is it close the line segment which may be longer or shorter than Pi?
  //   //  Is the angle from the midPoint vector to the spherePos less than 1/2(arcLength + wiggle room)
  //   return (
  //     2 * spherePos.angleTo(this.ref.midVector) - this.ref.arcLength() <
  //     SETTINGS.segment.hitIdealDistance
  //   );
  // }

  public update(): void {
    if (!this.canUpdateNow()) {
      return;
    }
    console.debug("Updating segment", this.name);

    // set the start, end, mid and normal vectors in the plottable object
    this.ref.startVector = this.startPoint.vectorPosition;
    this.ref.midVector = this.midPoint.vectorPosition;
    this.ref.normalDirection = tmpVec1
      .crossVectors(
        this.startPoint.vectorPosition,
        this.midPoint.vectorPosition
      )
      .normalize();
    this.ref.endVector = this.endPoint.vectorPosition;
    // update the display of the segment now that the four vectors are set
    this.ref.updateDisplay();

    this.setOutOfDate(false);
    this.updateKids();
  }
}
