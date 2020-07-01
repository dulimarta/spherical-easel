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
    this.name =
      "Intersection" +
      (p.positionVector.z >= 0 ? "+" : "-") +
      ` (${p1.name},${p2.name})`;
    // Place registerChild calls AFTER the name is set
    // so debugging output shows name correctly

    p1.registerChild(this);
    p2.registerChild(this);

    // Intersection points are invisible when they are created
    this.setShowing(false);
  }

  // Warning: if you define settet you MUST also define
  // getter otherwise it will be undefined
  set positionOnSphere(pos: Vector3) {
    super.positionOnSphere = pos;
    this.name =
      "Intersection" +
      (pos.z >= 0 ? "+" : "-") +
      ` (${this.parents[0].name},${this.parents[1].name})`;
  }

  get positionOnSphere(): Vector3 {
    return super.positionOnSphere;
  }

  public setShowing(flag: boolean): void {
    if (flag) {
      super.setShowing(true);
    } else if (this.kids.length == 0) {
      // Hide only no one else depends on this intersection
      super.setShowing(false);
    }
  }
}
