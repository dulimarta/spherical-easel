import type { Vector3 } from "three/webgpu";
import { CKNodule } from "./CKNodule";
import { AlgebraElement } from "ts-geometric-algebra";
import { SLine } from "@/plottables-spherical/SLine";
import { SLabel } from "@/plottables-spherical/SLabel";
import { SSegment } from "@/plottables-spherical/SSegment";
import { HLine } from "@/plottables-hyperbolic/HLine";
import { CKLinear } from "./CKLinear";

export class CKSegment extends CKLinear {
  constructor(
    startPoint: Vector3,
    endPoint: Vector3,
    public longerThanPi: boolean = true
  ) {
    super(startPoint, endPoint);

    // const z = this.theLine.vector(1);
    // console.debug(
    //   `Segment created with start point ${startPoint.toFixed(2)} and end point ${endPoint.toFixed(2)}`,
    //   // this.theLine,
    //   "Plane Orientation:",
    //   z[2].toFixed(3),
    //   z[1].toFixed(3),
    //   z[0].toFixed(3)
    // );
    this.name = `S${this.id}`;
    const plottableLine = CKNodule.isHyperbolicMode()
      ? new HLine(this.name, this, false)
      : new SSegment(this.name, this, this.longerThanPi);
    this.ref = plottableLine;
    this.subscribe(plottableLine);
    // const plottableLabel = new SLabel<CKLine>(this, "line");
    // this.labelRef = plottableLabel;
    // this.subscribe(plottableLabel);
    this.notifyModelUpdated();
  }
}
