import { SENodule } from "./SENodule";
import Line from "@/plottables/Line";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";

let LINE_COUNT = 0;
export class SELine extends SENodule implements Visitable {
  /**
   * The corresponding plottable TwoJS object
   */
  public ref: Line;
  /**
   * The model SE object that is one point on the line
   */
  private start: SEPoint;
  /**
   * The model SE object that is a second point on the line
   */
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

    //l.owner = this;
    LINE_COUNT++;
    this.name = `Li-${LINE_COUNT}`;
    // Place registerChild calls AFTER the name is set
    // so debugging output shows name correctly
    // Add this line as a child of the two points
    start.registerChild(this);
    end.registerChild(this);
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

  public isHitAt(sphereVector: Vector3): boolean {
    // Is the sphereVector is perpendicular to the line normal?
    return Math.abs(sphereVector.dot(this.ref.normalVector)) < 1e-2;
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
    this.ref.startPoint = this.start.vectorPosition;
    this.ref.endPoint = this.end.vectorPosition;
    this.setOutOfDate(false);
  }
}
