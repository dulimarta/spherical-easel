import { AlgebraElement } from "ts-geometric-algebra";
import { CKNodule } from "./CKNodule";
import { Vector3 } from "three/webgpu";

export class CKLinear extends CKNodule {
  startPointCoord: AlgebraElement;
  endPointCoord: AlgebraElement;
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
  }
}
