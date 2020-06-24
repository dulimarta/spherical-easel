import { SENodule } from "./SENodule";
import Segment from "@/plottables/Segment";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";
import SETTINGS from "@/global-settings";

const tmpVec1 = new Vector3();
const tmpVec2 = new Vector3();
let SEGMENT_COUNT = 0;

/** A segment is defined by three points:
 * startPoint, midPoint, and endPoint
 */
export class SESegment extends SENodule implements Visitable {
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public ref: Segment;
  private startAt: SEPoint;
  private endAt: SEPoint;

  /**
   *
   * @param seg plottable (TwoJS) segment associated with this model segment
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
    return this.ref.normalVector;
  }

  /**
   * TODO: I'm not sure that set normalVector works -- be careful here
   */
  set normalDirection(dir: Vector3) {
    this.ref.normalVector = dir;
  }

  get startPoint(): SEPoint {
    return this.startAt;
  }

  get endPoint(): SEPoint {
    return this.endAt;
  }

  get midVector(): Vector3 {
    return this.ref.midVector;
  }

  public isHitAt(spherePos: Vector3): boolean {
    //TODO: This causes a hit if you pass by the antipode of the line segment!!
    // Is the unit vector to the point is perpendicular to the circle normal?
    if (Math.abs(spherePos.dot(this.ref.normalVector)) > 1e-2) return false;
    // Is the point between start and mid?
    let angle1;
    let angle2;
    tmpVec1.crossVectors(this.startAt.positionOnSphere, spherePos).normalize();
    angle1 =
      this.startAt.positionOnSphere.angleTo(spherePos) * Math.sign(tmpVec1.z);
    tmpVec2.crossVectors(spherePos, this.midVector).normalize();
    angle2 = spherePos.angleTo(this.midVector) * Math.sign(tmpVec2.z);
    if (
      Math.sign(angle1) === Math.sign(angle2) &&
      Math.abs(angle1 + angle2 - this.ref.arcLength / 2) < 0.1
    )
      return true;

    // Is the point between mid and end?
    tmpVec1.crossVectors(this.midVector, spherePos).normalize();
    angle1 = this.midVector.angleTo(spherePos) * Math.sign(tmpVec1.z);
    tmpVec2.crossVectors(spherePos, this.endPoint.positionOnSphere).normalize();
    angle2 =
      spherePos.angleTo(this.endPoint.positionOnSphere) * Math.sign(tmpVec2.z);
    return (
      Math.sign(angle1) === Math.sign(angle2) &&
      Math.abs(angle1 + angle2 - this.ref.arcLength / 2) < 0.1
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
    console.debug("Updating segment", this.name);
    this.ref.startVector = this.startAt.positionOnSphere;
    this.ref.midVector = this.midVector;
    this.ref.endPoint = this.endAt.positionOnSphere;
    this.setOutOfDate(false);
    this.updateKids();
  }
}
