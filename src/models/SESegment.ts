import { SENodule } from "./SENodule";
import Segment from "@/plottables/Segment";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";

const tmpVec1 = new Vector3();
const tmpVec2 = new Vector3();
let SEGMENT_COUNT = 0;
export class SESegment extends SENodule implements Visitable {
  public ref: Segment;

  /**
   *
   * @param s plottable (TwoJS) segment associated with this segment
   */
  constructor(s: Segment) {
    super();
    this.ref = s;
    s.owner = this;
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
    tmpVec1.crossVectors(spherePos, this.startPoint);
    tmpVec2.crossVectors(this.endPoint, spherePos);
    return tmpVec1.angleTo(tmpVec2) < 1e-1;
  }

  public update(): void {
    throw new Error("Method not implemented.");
  }
}
