import { SENodule } from "./SENodule";
import Line from "@/plottables/Line";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";

const tmpVec1 = new Vector3();
const tmpVec2 = new Vector3();
let LINE_COUNT = 0;
export class SELine extends SENodule implements Visitable {
  public ref: Line;

  /**
   *
   * @param l plottable (TwoJS) line associated with this line
   * @param start
   * @param end
   */
  constructor(l: Line) {
    super();
    this.ref = l;
    l.owner = this;
    LINE_COUNT++;
    this.name = `Li-${LINE_COUNT}`;
  }

  accept(v: Visitor): void {
    v.actionOnLine(this);
  }

  get normalDirection(): Vector3 {
    return this.ref.orientation;
  }

  set normalDirection(dir: Vector3) {
    this.ref.orientation = dir;
  }

  public isHitAt(spherePos: Vector3): boolean {
    // Is the unit vector to the point is perpendicular to the circle normal?
    return Math.abs(spherePos.dot(this.ref.orientation)) < 1e-2;
    // if (!this.ref.isSegment) return true;
    // tmpVec1.crossVectors(spherePos, this.start.positionOnSphere);
    // tmpVec2.crossVectors(this.end.positionOnSphere, spherePos);
    // return tmpVec1.angleTo(tmpVec2) < 1e-1;
  }

  public update(): void {
    throw new Error("Method not implemented.");
  }
}
