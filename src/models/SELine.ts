import { SENodule } from "./SENodule";
import Line from "@/plottables/Line";
import { SEPoint } from "./SEPoint";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";

const tmpVec1 = new Vector3();
const tmpVec2 = new Vector3();
export class SELine extends SENodule implements Visitable {
  public ref: Line;
  private normalDir: Vector3;

  // FIXME: We probably don't have to store the following
  // Keep them here for now to make the rest of the code compiles
  public start: SEPoint;
  public end: SEPoint;
  //   public isSegment: boolean;

  /**
   *
   * @param l plottable (TwoJS) line associated with this line
   * @param normalDir the normal vector of the geodesic circle
   * @param start
   * @param end
   */
  constructor(l: Line, normalDir: Vector3, start: SEPoint, end: SEPoint) {
    super();
    this.ref = l;
    l.owner = this;
    this.normalDir = new Vector3();
    this.normalDir.copy(normalDir);
    this.start = start;
    this.end = end;
  }

  accept(v: Visitor): void {
    v.actionOnLine(this);
  }

  get normalDirection(): Vector3 {
    return this.normalDir;
  }

  set normalDirection(dir: Vector3) {
    this.normalDir.copy(dir);
    this.ref.orientation = dir;
  }

  public isHitAt(spherePos: Vector3): boolean {
    // Is the unit vector to the point is perpendicular to the circle normal?
    if (Math.abs(spherePos.dot(this.normalDir)) > 1e-2) return false;
    if (!this.ref.isSegment) return true;
    tmpVec1.crossVectors(spherePos, this.start.positionOnSphere);
    tmpVec2.crossVectors(this.end.positionOnSphere, spherePos);
    return tmpVec1.angleTo(tmpVec2) < 1e-1;
  }

  public update(): void {
    throw new Error("Method not implemented.");
  }
}
