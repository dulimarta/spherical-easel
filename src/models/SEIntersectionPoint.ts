import { SEPoint } from "./SEPoint";
import { SECircle } from "./SECircle";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
import Point from "@/plottables/Point";

type SEOneDimension = SELine | SESegment | SECircle;

export class SEIntersectionPoint extends SEPoint {
  /**
   * Create an intersection point between two 1D objects
   * @param p the TwoJS point associated with this intersection
   * @param p1 the first parent
   * @param p2 the second parent
   * @param order the order of this intersection point (in case there are multiple intersections)
   *
   * We need to add the "order" parameter so multiple intersection points of
   * the same two objects have unique names. For instance a line potentially
   * intersects a circle at two locations
   */
  constructor(p: Point, p1: SEOneDimension, p2: SEOneDimension, order: number) {
    super(p);

    // Make sure parent names are in alpha order so we can consistently
    // identify the intersection by its parents
    if (p1.name < p2.name) this.name = `(${p1.name},${p2.name},${order})`;
    else this.name = `(${p2.name},${p1.name},${order})`;
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
