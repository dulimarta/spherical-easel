import Point from "../plotables/Point";
import { SELine, SECircle } from "@/types";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SENode } from "./SENode";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";

export class SEPoint extends SENode implements Visitable {
  private _posOnSphere: Vector3;
  public ref: Point;
  public startOf: SELine[] = [];
  public endOf: SELine[] = [];
  public centerOf: SECircle[] = [];
  public circumOf: SECircle[] = [];

  constructor(p: Point) {
    super();
    p.owner = this; // Make the SEPoint object the owner of the Point
    this.ref = p;
    this._posOnSphere = new Vector3();
  }

  set positionOnSphere(pos: Vector3) {
    this._posOnSphere.copy(pos);

    // Must update the corresponding TwoJS visual properties
    const twojsLine = this.ref;
    twojsLine.translation.set(
      pos.x * SETTINGS.sphere.radius,
      pos.y * SETTINGS.sphere.radius
    );
    if (pos.z < 0) twojsLine.backgroundStyle();
    else twojsLine.normalStyle();

    // console.debug(
    //   "3D position",
    //   pos.toFixed(2),
    //   "translation amount ",
    //   this.translation.x.toFixed(2),
    //   this.translation.y.toFixed(2)
    // );
  }

  get positionOnSphere() {
    return this._posOnSphere;
  }

  accept(v: Visitor): void {
    v.actionOnPoint(this);
  }
}
