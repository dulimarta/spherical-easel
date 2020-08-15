import { SEPoint } from "./SEPoint";
import Point from "@/plottables/Point";
import { IntersectionReturnType } from "@/types";
import store from "@/store";
import { SEOneDimensional } from "@/types";
import { UpdateMode, UpdateStateType, PointState } from "@/types";

export class SEIntersectionPoint extends SEPoint {
  /**
   * This flag is true if the user created this point
   * This flag is false if this point was automatically created
   */
  private _isUserCreated = false;

  /**
   * The One-Dimensional parents of this SEInstructionPoint
   */
  private seParent1: SEOneDimensional;
  private seParent2: SEOneDimensional;

  /**
   * The numbering of the intersection in the case of multiple intersection
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
    seParent1: SEOneDimensional,
    seParent2: SEOneDimensional,
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
      this.name = this.name + ` (${seParent1.name},${seParent2.name},${order})`;
    else
      this.name = this.name + ` (${seParent2.name},${seParent1.name},${order})`;
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

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this._exists = this.seParent1.exists && this.seParent2.exists;
    if (this._exists) {
      //console.debug("Updating SEIntersectionPoint", this.name);
      // The objects are in the correct order because the SEIntersectionPoint parents are assigned that way
      const updatedIntersectionInfo: IntersectionReturnType[] = store.getters.intersectTwoObjects(
        this.seParent1,
        this.seParent2
      );

      this._exists = updatedIntersectionInfo[this.order].exists;
      this.locationVector = updatedIntersectionInfo[this.order].vector; // Calls the setter of SEPoint which calls the setter of Point which updates the display
    }
    // Update visibility
    if (this._exists && this._isUserCreated && this._showing) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // Intersection Points are completely determined by their parents and an update on the parents
    // will cause this point to be put into the correct location. Therefore there is no need to
    // store it in the stateArray for undo move. Only store for delete

    if (state.mode == UpdateMode.RecordStateForDelete) {
      const pointState: PointState = {
        kind: "point",
        locationVectorX: this._locationVector.x,
        locationVectorY: this._locationVector.y,
        locationVectorZ: this._locationVector.z,
        object: this
      };
      state.stateArray.push(pointState);
    }
    this.updateKids(state);
  }

  // For !isUserCreated points glowing is the same as showing or not showing the point,
  set glowing(b: boolean) {
    if (!this._isUserCreated) {
      this.ref.setVisible(b);
    } else {
      super.glowing = b;
    }
  }
  // I wish the SENodule methods would work but I couldn't figure out how
  // See the attempts in SENodule
  public isFreePoint() {
    return false;
  }
  public isOneDimensional() {
    return false;
  }
  public isPoint() {
    return false;
  }
  public isLabel(): boolean {
    return false;
  }
}
