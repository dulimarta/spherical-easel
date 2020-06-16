import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Circle from "@/plottables/Circle";
import { Vector3 } from "three";

export class SECircle extends SENodule {
  public ref!: Circle;
  private normalDir: Vector3;
  private radius: number; // Arc length (in radians) not straight line distance
  center!: SEPoint;
  point!: SEPoint;

  constructor(c: Circle, radius: number) {
    super();
    this.normalDir = new Vector3();
    this.normalDir.copy(c.centerPoint);
    this.radius = radius;
    this.ref = c;
  }

  set normalDirection(v: Vector3) {
    this.normalDir.copy(v);
    this.ref.centerPoint = v;
  }

  get normalDirection() {
    return this.normalDir;
  }

  public isHitAt(spherePos: Vector3): boolean {
    const angleToCenter = spherePos.angleTo(this.normalDir);
    console.debug(
      `Radius of point ${angleToCenter} cirle radius ${this.radius}`
    );
    return Math.abs(angleToCenter - this.radius) < 0.01;
  }

  public update(): void {
    // No implementation yet
  }
}
