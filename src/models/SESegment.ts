import { SENodule } from "./SENodule";
import Segment from "@/plottables/Segment";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";

const tmpVec1 = new Vector3();
const tmpVec2 = new Vector3();
let SEGMENT_COUNT = 0;

/** A segment is defined by three points:
 * startPoint, midPoint, and endPoint
 */
export class SESegment extends SENodule implements Visitable {
  public ref: Segment;
  private startAt: SEPoint;
  private endAt: SEPoint;

  /**
   *
   * @param s plottable (TwoJS) segment associated with this segment
   */
  constructor(s: Segment, start: SEPoint, end: SEPoint) {
    super();
    this.ref = s;
    s.owner = this;
    this.startAt = start;
    this.endAt = end;
    SEGMENT_COUNT++;
    this.name = `Ls-${SEGMENT_COUNT}`;
  }

  accept(v: Visitor): void {
    v.actionOnSegment(this);
  }

  get normalDirection(): Vector3 {
    return this.ref.orientation;
  }

  set normalDirection(dir: Vector3) {
    this.ref.orientation = dir;
  }

  get startPoint(): Vector3 {
    return this.ref.startPoint;
  }

  set startPoint(pos: Vector3) {
    this.ref.startPoint = pos;
  }

  get midPoint(): Vector3 {
    return this.ref.midPoint;
  }

  set midPoint(pos: Vector3) {
    this.ref.midPoint = pos;
  }

  get endPoint(): Vector3 {
    return this.ref.endPoint;
  }

  set endPoint(pos: Vector3) {
    this.ref.endPoint = pos;
  }

  public isHitAt(spherePos: Vector3): boolean {
    // Is the unit vector to the point is perpendicular to the circle normal?
    if (Math.abs(spherePos.dot(this.ref.orientation)) > 1e-2) return false;
    // Is the point between start and mid?
    let angle1;
    let angle2;
    tmpVec1.crossVectors(this.startPoint, spherePos).normalize();
    angle1 = this.startPoint.angleTo(spherePos) * Math.sign(tmpVec1.z);
    tmpVec2.crossVectors(spherePos, this.midPoint).normalize();
    angle2 = spherePos.angleTo(this.midPoint) * Math.sign(tmpVec2.z);
    if (
      Math.sign(angle1) === Math.sign(angle2) &&
      Math.abs(angle1 + angle2 - this.ref.arcLength / 2) < 0.1
    )
      return true;

    // Is the point between mid and end?
    tmpVec1.crossVectors(this.midPoint, spherePos).normalize();
    angle1 = this.midPoint.angleTo(spherePos) * Math.sign(tmpVec1.z);
    tmpVec2.crossVectors(spherePos, this.endPoint).normalize();
    angle2 = spherePos.angleTo(this.endPoint) * Math.sign(tmpVec2.z);
    return (
      Math.sign(angle1) === Math.sign(angle2) &&
      Math.abs(angle1 + angle2 - this.ref.arcLength / 2) < 0.1
    );
  }

  public update(): void {
    console.debug("Updating segment", this.name);
    this.ref.startPoint = this.startAt.positionOnSphere;
    this.ref.endPoint = this.endAt.positionOnSphere;
    this.setOutOfDate(false);
    this.updateKids();
  }
}
