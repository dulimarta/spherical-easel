import { SENode } from "./SENode";
import { SEPoint } from "./SEPoint";
import Circle from "@/plotables/Circle";
import { Vector3 } from "three";

export class SECircle extends SENode {
  public update(): void {
    throw new Error("Method not implemented.");
  }
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
}
