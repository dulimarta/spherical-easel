import { SEPoint } from "./SEPoint";
import { SECircle } from "./SECircle";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
import Point from "@/plottables/Point";

type SEOneDimension = SELine | SESegment | SECircle;

export class SEIntersectionPoint extends SEPoint {
  /**
   * Create an intersection point between two one-dimensional objects
   * @param pt the TwoJS point associated with this intersection
   * @param seParent1 the first parent
   * @param seParent2 the second parent
   * @param order the order of this intersection point (in case there are multiple intersections)
   *
   * We need to add the "order" parameter so multiple intersection points of
   * the same two objects have unique names. For instance a line potentially
   * intersects a circle at two locations
   */
  constructor(
    pt: Point,
    seParent1: SEOneDimension,
    seParent2: SEOneDimension,
    order: number
  ) {
    super(pt);

    // Make sure parent names are in alpha order so we can consistently
    // identify the intersection by its parents
    if (seParent1.name < seParent2.name)
      this.name = `(${seParent1.name},${seParent2.name},${order})`;
    else this.name = `(${seParent2.name},${seParent1.name},${order})`;
    // Place registerChild calls AFTER the name is set
    // so debugging output shows name correctly

    seParent1.registerChild(this);
    seParent2.registerChild(this);

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
