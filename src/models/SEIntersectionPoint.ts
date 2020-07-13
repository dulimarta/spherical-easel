import { SEPoint } from "./SEPoint";
import { SECircle } from "./SECircle";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
import Point from "@/plottables/Point";
import { SENodule } from "./SENodule";
import { IntersectionReturnType } from "@/types";
import { DisplayStyle } from "@/plottables/Nodule";
import store from "@/store";

type SEOneDimension = SELine | SESegment | SECircle;

export class SEIntersectionPoint extends SEPoint {
  /**
   * This flag is true if the user created this point
   * This flag is false if this point was automatically created
   */
  private _isUserCreated = false;

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
   * @param seParent1 The first parent
   * @param seParent2 The second parent
   * @param order The order of this intersection point (in case there are multiple intersections)
   * @param isUserCreated False if this point was automatically created
   *
   * We need to add the "order" parameter so multiple intersection points of
   * the same two objects have unique names. For instance a line potentially
   * intersects a circle at two locations
   */
  constructor(
    pt: Point,
    seParent1: SEOneDimension,
    seParent2: SEOneDimension,
    order: number,
    isUserCreated: boolean
  ) {
    super(pt);
    this.ref = pt;
    this.seParent1 = seParent1;
    this.seParent2 = seParent2;
    this.order = order;
    if (isUserCreated) {
      this._isUserCreated = true;
      // Display userCreated intersections
      this.showing = true;
    } else {
      this._isUserCreated = false;
      // Hide automatically created intersections
      this.showing = false;
    }

    // Make sure parent names are in alpha order so we can consistently
    // identify the intersection by its parents
    if (seParent1.name < seParent2.name)
      this.name = `(${seParent1.name},${seParent2.name},${order})`;
    else this.name = `(${seParent2.name},${seParent1.name},${order})`;
    // Place registerChild calls AFTER the name is set
    // so debugging output shows name correctly

    seParent1.registerChild(this);
    seParent2.registerChild(this);
  }

  /**
   * If the intersection point is changed to isUserCreated(true) then the point should be showing,
   * the default style should be displayed and the glowing background should be set up
   */
  set isUserCreated(flag: boolean) {
    this._isUserCreated = flag;
  }
  get isUserCreated(): boolean {
    return this._isUserCreated;
  }

  public update(): void {
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this._exists = this.seParent1.exists && this.seParent2.exists;
    if (this._exists) {
      //console.debug("Updating SEIntersectionPoint", this.name);
      const updatedIntersectionInfo: IntersectionReturnType[] = store.getters.intersectTwoObjects(
        this.seParent1,
        this.seParent2
      );

      this._exists = updatedIntersectionInfo[this.order].exists;
      this.locationVector = updatedIntersectionInfo[this.order].vector; // Calls the setter of SEPoint which calls the setter of Point which updates the display
      // console.log("order", this.order);
      // console.log("exist", this._exists);
      // console.log("location", this._locationVector.toFixed(2));
      // console.log("user created", this._isUserCreated);
      // console.log("showing", this._showing);
      if (this._exists && this._isUserCreated && this._showing) {
        // Update the location and display (called in setter)
        this.ref.setVisible(true);
      } else {
        this.ref.setVisible(false);
      }
    }
    this.updateKids();
  }

  // For !isUserCreated points glowing is the same as showing or not showing the point,
  set glowing(b: boolean) {
    if (!this._isUserCreated) {
      this.ref.setVisible(b);
    } else {
      super.glowing = b;
    }
  }
}
