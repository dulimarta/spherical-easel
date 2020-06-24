import { SENodule } from "./SENodule";
import Line from "@/plottables/Line";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";

const tmpVec1 = new Vector3();
const tmpVec2 = new Vector3();
let LINE_COUNT = 0;
export class SELine extends SENodule implements Visitable {
  public ref: Line;
  private start: SEPoint;
  private end: SEPoint;

  /**
   *
   * @param l plottable (TwoJS) line associated with this line
   * @param start
   * @param end
   */
  constructor(l: Line, start: SEPoint, end: SEPoint) {
    super();
    this.ref = l;
    this.start = start;
    this.end = end;
    l.owner = this;
    LINE_COUNT++;
    this.name = `Li-${LINE_COUNT}`;
  }

  accept(v: Visitor): void {
    v.actionOnLine(this);
  }

  get normalDirection(): Vector3 {
    return this.ref.normalVector;
  }

  set normalDirection(dir: Vector3) {
    this.ref.normalVector = dir;
  }

  get startPoint(): SEPoint {
    return this.start;
  }

  get endPoint(): SEPoint {
    return this.end;
  }

  public isHitAt(spherePos: Vector3): boolean {
    // Is the unit vector to the point is perpendicular to the circle normal?
    return Math.abs(spherePos.dot(this.ref.normalVector)) < 1e-2;
    // if (!this.ref.isSegment) return true;
    // tmpVec1.crossVectors(spherePos, this.start.positionOnSphere);
    // tmpVec2.crossVectors(this.end.positionOnSphere, spherePos);
    // return tmpVec1.angleTo(tmpVec2) < 1e-1;
  }

  public update(): void {
    // console.debug(
    //   "Updating SELine",
    //   this.name,
    //   "start SEPoint at",
    //   this.start.positionOnSphere.toFixed(1),
    //   "end SEPoint at",
    //   this.end.positionOnSphere.toFixed(1)
    // );
    this.ref.startPoint = this.start.positionOnSphere;
    this.ref.endPoint = this.end.positionOnSphere;
    this.setOutOfDate(false);
  }
}
