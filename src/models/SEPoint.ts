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
  protected vectorLocation = new Vector3();

  constructor(p: Point) {
    super();
    /* Establish the link between this abstract object on the fixed unit sphere
    and the object that helps create the corresponding renderable object  */
    // p.owner = this; // Make the SEPoint object the owner of the Point
    this.ref = p;
    POINT_COUNT++;
    this.name = `P-${POINT_COUNT}`;
  }

  public update(): void {
    // make sure that all parents of this Point are up to date.
    if (!this.canUpdateNow()) {
      return;
    }
    //in more complex objects we will have to update other information in the Class
    this.setOutOfDate(false);
    this.updateKids();
  }

  /**
   * Set or get the location vector of the SEPoint on the unit ideal sphere
   */
  set vectorPosition(pos: Vector3) {
    // Record the location on the unit ideal sphere of this SEPoint
    this.vectorLocation.copy(pos).normalize();
    // Set the position of the associated displayed plottable Point
    this.ref.positionVector = this.vectorLocation;
  }
  get vectorPosition(): Vector3 {
    return this.vectorLocation;
  }

  accept(v: Visitor): void {
    v.actionOnPoint(this);
  }

  public isHitAt(spherePos: Vector3): boolean {
    return (
      this.vectorLocation.distanceTo(spherePos) <
      SETTINGS.point.hitIdealDistance
    );
  }

  setShowing(b: boolean): void {
    super.setShowing(b);
    this.ref.setVisible(b);
  }
}
