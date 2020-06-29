import { SEPoint } from "./SEPoint";
import { SECircle } from "./SECircle";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
import { SENodule } from "./SENodule";
import Point from "@/plottables/Point";
import { Vector3 } from "three";

type SEOneDimension = SELine | SESegment | SECircle;

export class SEIntersection extends SEPoint {
  public parent1!: SEOneDimension;
  public parent2!: SEOneDimension;

  constructor(p: Point, p1: SEOneDimension, p2: SEOneDimension) {
    super(p);
    this.parent1 = p1;
    this.parent2 = p2;
    this.name =
      "Intersection" +
      (p.positionVector.z >= 0 ? "+" : "-") +
      ` (${p1.name},${p2.name})`;
  }

  set positionOnSphere(pos: Vector3) {
    super.positionOnSphere = pos;
    this.name =
      "Intersection" +
      (pos.z >= 0 ? "+" : "-") +
      ` (${this.parent1.name},${this.parent2.name})`;
  }
}
