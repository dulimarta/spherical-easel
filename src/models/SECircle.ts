import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Circle from "@/plottables/Circle";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
let CIRCLE_COUNT = 0;
import SETTINGS from "@/global-settings";

export class SECircle extends SENodule implements Visitable {
  /**
   * The corresponding plottable TwoJS object
   */
  public ref!: Circle;
  private centerAt: SEPoint;
  private pointAt: SEPoint;
  // #region circleConstructor
  constructor(c: Circle, centerPoint: SEPoint, edgePoint: SEPoint) {
    super();
    this.centerAt = centerPoint;
    this.pointAt = edgePoint;
    this.ref = c;
    CIRCLE_COUNT++;
    this.name = `C-${CIRCLE_COUNT}`;
    centerPoint.registerChild(this);
    edgePoint.registerChild(this);
  }
  // #endregion circleConstructor

  set normalDirection(v: Vector3) {
    this.ref.centerVector = v;
  }

  /* On a unit sphere the coordinates of a point is also the normal vector
   *of the sphere at that point */
  get normalDirection(): Vector3 {
    return this.ref.centerVector;
  }

  get centerPoint(): SEPoint {
    return this.centerAt;
  }

  get circlePoint(): SEPoint {
    return this.pointAt;
  }

  get radius(): number {
    return this.ref.radius;
  }
  public isHitAt(spherePos: Vector3): boolean {
    const angleToCenter = spherePos.angleTo(this.normalDirection);
    return (
      Math.abs(angleToCenter - this.radius) < SETTINGS.circle.hitIdealDistance
    );
  }

  public update(): void {
    this.ref.centerVector = this.centerPoint.vectorPosition;

    const newRadius = this.centerPoint.vectorPosition.angleTo(
      this.circlePoint.vectorPosition
    );
    // console.debug(
    //   "Must update SECircle radius to",
    //   newRadius.toDegrees().toFixed(2),
    //   "center to",
    //   this.centerPoint.positionOnSphere.toFixed(2)
    // );

    this.ref.radius = newRadius;
    this.ref.centerVector = this.centerAt.vectorPosition;
    this.setOutOfDate(false);
  }

  accept(v: Visitor): void {
    v.actionOnCircle(this);
  }
}
