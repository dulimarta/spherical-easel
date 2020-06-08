import { SENode } from "./SENode";
import { SEPoint } from "./SEPoint";
import Circle from "@/3d-objs/Circle";

export class SECircle extends SENode {
  ref!: Circle;
  center!: SEPoint;
  point!: SEPoint;

  constructor(c: Circle) {
    super();
    this.ref = c;
  }
}
