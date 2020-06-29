import { SEPoint } from "./SEPoint";
import { SECircle } from "./SECircle";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
import { SENodule } from "./SENodule";
import Point from "@/plottables/Point";
import { Vector3 } from "three";

type SEOneDimension = SELine | SESegment | SECircle;

export class SEIntersection extends SEPoint {
  constructor(p: Point, p1: SEOneDimension, p2: SEOneDimension) {
    super(p);
    p1.registerChild(this);
    p2.registerChild(this);
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
      ` (${this.parents[0].name},${this.parents[1].name})`;
  }
}
