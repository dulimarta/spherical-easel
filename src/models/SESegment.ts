import { SENodule } from "./SENodule";
import Segment from "@/plottables/Segment";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
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
   *
   * @param seg plottable (TwoJS) segment associated with this model segment
   */
  constructor(seg: Segment) {
    super();
    this.ref = seg;
    seg.owner = this;
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

  get startPoint(): Vector3 {
    return this.ref.startVector;
  }

  set startPoint(pos: Vector3) {
    this.ref.startVector = pos;
  }

  get midPoint(): Vector3 {
    return this.ref.midVector;
  }

  set midPoint(pos: Vector3) {
    this.ref.midVector = pos;
  }

  get endPoint(): Vector3 {
    return this.ref.endVector;
  }

  set endPoint(pos: Vector3) {
    this.ref.endVector = pos;
  }

  public isHitAt(spherePos: Vector3): boolean {
    // Is the spherePos close to the plane containing the segment?
    //  Is the angle between the normal vector to the segment and the spherePos close to Pi/2?
    //  That is, is the cos(angle) close to zero?
    if (
      Math.abs(spherePos.dot(this.ref.normalVector)) >
      SETTINGS.segment.hitIdealDistance
    )
      return false;
    // If the code is here spherePos is close to the plane containing the segment
    //  Is it close the line segment which may be longer or shorter than Pi?
    //  Is the angle from the midPoint vector to the spherePos less than 1/2(arcLength + wiggle room)
    return (
      2 * spherePos.angleTo(this.ref.midVector) - this.ref.arcLength() <
      SETTINGS.segment.hitIdealDistance
    );
  }

  public update(): void {
    throw new Error("Method not implemented.");
  }
}
