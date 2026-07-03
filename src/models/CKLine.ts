import type { Vector3 } from "three/webgpu";
import { CKNodule } from "./CKNodule";
import { AlgebraElement } from "ts-geometric-algebra";
import { SLine } from "@/plottables-spherical/SLine";
import { SLabel } from "@/plottables-spherical/SLabel";

export class CKLine extends CKNodule {
  private startPointCoord: AlgebraElement;
  private endPointCoord: AlgebraElement;
  theLine: AlgebraElement;

  constructor(startPoint: Vector3, endPoint: Vector3) {
    super();

    this.startPointCoord = CKNodule.GA_Factory.makePoint(
      startPoint.x,
      startPoint.y,
      startPoint.z
    );
    this.endPointCoord = CKNodule.GA_Factory.makePoint(
      endPoint.x,
      endPoint.y,
      endPoint.z
    );
    this.theLine = this.startPointCoord.vee(this.endPointCoord).normalize();
    const z = this.theLine.vector(1);
    console.debug(
      `Line created with start point ${startPoint.toFixed(2)} and end point ${endPoint.toFixed(2)}`,
      // this.theLine,
      "Plane Orientation:",
      z[2].toFixed(3),
      z[1].toFixed(3),
      z[0].toFixed(3)
    );
    const plottableLine = new SLine(`L${this.id}`, this);
    this.ref = plottableLine;
    this.subscribe(plottableLine);
    // const plottableLabel = new SLabel<CKLine>(this, "line");
    // this.labelRef = plottableLabel;
    // this.subscribe(plottableLabel);
    this.notifyModelUpdated();
  }
}
