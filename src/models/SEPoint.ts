import Point from "../plottables/Point";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SENodule } from "./SENodule";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";

const POINT_PROXIMITY_THRESHOLD = SETTINGS.point.hitIdealDistance;
let POINT_COUNT = 0;

export class SEPoint extends SENodule implements Visitable {
  /* The location of the SEPoint on the Sphere*/

  /* This should be the only reference to the plotted version of this SEPoint */
  public ref: Point;

  constructor(p: Point) {
    super();
    /* Establish the link between this abstract object on the fixed unit sphere
    and the object that helps create the corresponding renderable object  */
    // p.owner = this; // Make the SEPoint object the owner of the Point
    this.ref = p;
    POINT_COUNT++;
    this.name = `P-${POINT_COUNT}`;
  }

  public update() {
    // make sure that all parents of this Point are up to date.
    if (!this.updateNow()) {
      return;
    }
    //in more complex objects we will have to update other information in the Class
    this.setOutOfDate(false);
    this.updateKids();
  }

  set positionOnSphere(pos: Vector3) {
    // console.log("Updating Point", this.name, "position to", pos.toFixed(1));
    this.ref.positionVector = pos.normalize();
  }

  get positionOnSphere(): Vector3 {
    return this.ref.positionVector;
  }

  accept(v: Visitor): void {
    v.actionOnPoint(this);
  }

  public isHitAt(spherePos: Vector3): boolean {
    return (
      this.ref.positionVector.distanceTo(spherePos) <
      SETTINGS.point.hitIdealDistance
    );
  }
}
