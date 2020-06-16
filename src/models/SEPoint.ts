import Point from "../plottables/Point";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SENodule } from "./SENodule";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";

const POINT_PROXIMITY_THRESHOLD = 1e-2;
export class SEPoint extends SENodule implements Visitable {
  /* The location of the SEPoint on the Sphere*/
  private _posOnSphere: Vector3; //_ starts names of variable that are private

  /* This should be the only reference to the plotted version of this SEPoint */
  public ref: Point;

  constructor(p: Point) {
    super();
    /* Establish the link between this abstract object on the fixed unit sphere
    and the object that helps create the corresponding renderable object  */
    p.owner = this; // Make the SEPoint object the owner of the Point
    this.ref = p;
    this._posOnSphere = new Vector3();
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
    this._posOnSphere.copy(pos);
    this._posOnSphere.normalize();
    this.ref.update();
  }

  get positionOnSphere() {
    return this._posOnSphere;
  }

  accept(v: Visitor): void {
    v.actionOnPoint(this);
  }

  public isHitAt(spherePos: Vector3): boolean {
    return this._posOnSphere.distanceTo(spherePos) < POINT_PROXIMITY_THRESHOLD;
  }
}
