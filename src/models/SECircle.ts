import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Circle from "@/plottables/Circle";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
let CIRCLE_COUNT = 0;
export class SECircle extends SENodule implements Visitable {
  public ref!: Circle;
  private normalDir: Vector3;
  private radius: number; // Arc length (in radians) not straight line distance
  // private center!: SEPoint;
  // private point!: SEPoint;

  constructor(c: Circle, radius: number) {
    super();
    this.normalDir = new Vector3();
    this.normalDir.copy(c.centerPoint);
    this.radius = radius;
    this.ref = c;
    CIRCLE_COUNT++;
    this.name = `C-${CIRCLE_COUNT}`;
  }

  set normalDirection(v: Vector3) {
    this.normalDir.copy(v);
    this.ref.centerPoint = v;
  }

  get normalDirection(): Vector3 {
    return this.normalDir;
  }

  public isHitAt(spherePos: Vector3): boolean {
    const angleToCenter = spherePos.angleTo(this.normalDir);
    return Math.abs(angleToCenter - this.radius) < 0.01;
  }

  public update(): void {
    // No implementation yet
  }

  accept(v: Visitor): void {
    v.actionOnCircle(this);
  }
}
