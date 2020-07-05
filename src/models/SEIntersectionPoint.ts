import { SEPoint } from "./SEPoint";
import { SECircle } from "./SECircle";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
import Point from "@/plottables/Point";

type SEOneDimension = SELine | SESegment | SECircle;

export class SEIntersectionPoint extends SEPoint {
  constructor(p: Point, p1: SEOneDimension, p2: SEOneDimension) {
    super(p);
    this.name = `Intersection (${p1.name},${p2.name})`;
    // Place registerChild calls AFTER the name is set
    // so debugging output shows name correctly

    p1.registerChild(this);
    p2.registerChild(this);

    // Intersection points are invisible when they are created
    this.setShowing(false);
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
