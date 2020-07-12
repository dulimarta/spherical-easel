import { SEPoint } from "./SEPoint";
import { SECircle } from "./SECircle";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
import Point from "@/plottables/Point";
import { SENodule } from "./SENodule";
import { IntersectionReturnType } from "@/types";
import store from "@/store";

type SEOneDimension = SELine | SESegment | SECircle;

export class SEIntersectionPoint extends SEPoint {
  /**
   * This flag is true if the user created this point
   * This flag is false if this point was automatically created
   */
  private isUserCreated = false;

  /**
   * The One-Dimensional parents of this SEInstructionPoint
   */
  private seParent1: SENodule;
  private seParent2: SENodule;

  /**
   * The numbering of the intersection in the case of
   */
  private order: number;
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
    this.ref = pt;
    this.seParent1 = seParent1;
    this.seParent2 = seParent2;
    this.order = order;

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

  set userCreated(flag: boolean) {
    this.isUserCreated = flag;
  }

  public update() {
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this.exists = this.seParent1.getExists() && this.seParent2.getExists();
    if (this.exists) {
      console.debug("Updating SEIntersectionPoint", this.name);
      let updatedIntersectionInfo = [];
      //Depending on the parent update the location of this intersection point
      if (this.seParent1 instanceof SELine) {
        if (this.seParent2 instanceof SELine) {
          updatedIntersectionInfo = store.getters.intersectLineWithLine(
            this.seParent1,
            this.seParent2
          );
        }
        if (this.seParent2 instanceof SESegment) {
          updatedIntersectionInfo = store.getters.intersectLineWithSegment(
            this.seParent1,
            this.seParent2
          );
        }
        if (this.seParent2 instanceof SECircle) {
          updatedIntersectionInfo = store.getters.intersectLineWithCircle(
            this.seParent1,
            this.seParent2
          );
        }
      }

      if (this.seParent1 instanceof SESegment) {
        if (this.seParent2 instanceof SESegment) {
          updatedIntersectionInfo = store.getters.intersectSegmentWithSegment(
            this.seParent1,
            this.seParent2
          );
        }
        if (this.seParent2 instanceof SECircle) {
          updatedIntersectionInfo = store.getters.intersectSegmentWithCircle(
            this.seParent1,
            this.seParent2
          );
        }
      }

      if (this.seParent1 instanceof SECircle) {
        if (this.seParent2 instanceof SECircle) {
          updatedIntersectionInfo = store.getters.intersectCircle(
            this.seParent1,
            this.seParent2
          );
        }
      }

      this.exists = updatedIntersectionInfo[this.order].exists;
      if (this.exists && this.isUserCreated) {
        this.vectorLocation = updatedIntersectionInfo[this.order].vector;
        this.ref.updateDisplay();
      } else {
        this.ref.setVisible(false);
      }
    }
    this.updateKids();
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
