import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Circle from "@/plottables/Circle";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
let CIRCLE_COUNT = 0;
import SETTINGS from "@/global-settings";

export class SECircle extends SENodule implements Visitable {
  public ref!: Circle;
  private normalDir: Vector3;
  private radius: number; // Arc length (in radians) not straight line distance
  private centerAt: SEPoint;
  private pointAt: SEPoint;

  constructor(c: Circle, ctr: SEPoint, out: SEPoint) {
    super();
    this.normalDir = new Vector3();
    this.normalDir.copy(c.centerVector);
    this.centerAt = ctr;
    this.pointAt = out;
    this.radius = ctr.positionOnSphere.angleTo(out.positionOnSphere);
    this.ref = c;
    CIRCLE_COUNT++;
    this.name = `C-${CIRCLE_COUNT}`;
  }

  set normalDirection(v: Vector3) {
    this.normalDir.copy(v);
    this.ref.centerVector = v;
  }

  get normalDirection(): Vector3 {
    return this.normalDir;
  }

  get centerPoint(): SEPoint {
    return this.centerAt;
  }

  get circlePoint(): SEPoint {
    return this.pointAt;
  }

  public isHitAt(spherePos: Vector3): boolean {
    const angleToCenter = spherePos.angleTo(this.normalDir);
    return (
      Math.abs(angleToCenter - this.radius) < SETTINGS.circle.hitIdealDistance
    );
  }

  public update(): void {
    this.ref.centerVector = this.centerPoint.positionOnSphere;

    const newRadius = this.centerPoint.positionOnSphere.angleTo(
      this.circlePoint.positionOnSphere
    );
    console.debug("Must update SECircle radius to", newRadius);
    this.radius = newRadius;
    this.ref.radius = newRadius;
    this.setOutOfDate(false);
  }

  accept(v: Visitor): void {
    v.actionOnCircle(this);
  }
}
