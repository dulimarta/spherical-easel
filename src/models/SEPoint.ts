import Point from "../plottables/Point";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SENodule } from "./SENodule";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";

// const POINT_PROXIMITY_THRESHOLD = SETTINGS.point.hitIdealDistance;
let POINT_COUNT = 0;

export class SEPoint extends SENodule implements Visitable {
  /* This should be the only reference to the plotted version of this SEPoint */
  public ref: Point;

  /**
   * The vector location of the SEPoint on the ideal unit sphere
   */
  protected _locationVector = new Vector3();

  /**
   * Create a model SEPoint using:
   * @param p The plottable TwoJS Object associated to this object
   */
  constructor(p: Point) {
    super();
    /* Establish the link between this abstract object on the fixed unit sphere
    and the object that helps create the corresponding renderable object  */
    this.ref = p;
    POINT_COUNT++;
    this.name = `P-${POINT_COUNT}`;
  }

  public update(): void {
    // make sure that all parents of this SEPoint are up to date.
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    //These points always exist - they have no parents to depend on

    //Update the location of the associate plottable Point (setter also updates the display)
    this.ref.positionVector = this._locationVector;

    if (this.showing) {
      this.ref.updateDisplay();
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    this.updateKids();
  }

  /**
   * Set or get the location vector of the SEPoint on the unit ideal sphere
   */
  set locationVector(pos: Vector3) {
    // Record the location on the unit ideal sphere of this SEPoint
    this._locationVector.copy(pos).normalize();
    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this._locationVector;
  }
  get locationVector(): Vector3 {
    return this._locationVector;
  }

  accept(v: Visitor): void {
    v.actionOnPoint(this);
  }

  public isHitAt(unitIdealVector: Vector3): boolean {
    return (
      this._locationVector.distanceTo(unitIdealVector) <
      SETTINGS.point.hitIdealDistance
    );
  }
}
