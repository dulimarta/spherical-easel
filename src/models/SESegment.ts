import { SENodule } from "./SENodule";
import Segment from "@/plottables/Segment";
import { SEPoint } from "./SEPoint";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SELine } from "./SELine";

const tmpVec1 = new Vector3();
const tmpVec2 = new Vector3();
export class SESegment extends SENodule implements Visitable {
  public ref: Segment;
  // private normalDir: Vector3;

  // FIXME: We probably don't have to store the following
  // Keep them here for now to make the rest of the code compiles
  public start: SEPoint;
  public end: SEPoint;
  //   public isSegment: boolean;

  /**
   *
   * @param l plottable (TwoJS) line associated with this line
   * @param start
   * @param end
   */
  constructor(s: Segment, start: SEPoint, end: SEPoint) {
    super();
    this.ref = s;
    s.owner = this;
    this.start = start;
    this.end = end;
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

  public isHitAt(spherePos: Vector3): boolean {
    // Is the unit vector to the point is perpendicular to the circle normal?
    if (Math.abs(spherePos.dot(this.ref.orientation)) > 1e-2) return false;
    tmpVec1.crossVectors(spherePos, this.start.positionOnSphere);
    tmpVec2.crossVectors(this.end.positionOnSphere, spherePos);
    return tmpVec1.angleTo(tmpVec2) < 1e-1;
  }

  public update(): void {
    throw new Error("Method not implemented.");
  }
}
