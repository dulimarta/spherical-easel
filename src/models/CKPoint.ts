import { useEllipticGA } from "@/composables/ga";
import { Vector3 } from "three";
import Algebra, { AlgebraElement } from "ts-geometric-algebra";
import { CKNodule } from "./CKNodule";
import Point from "@/plottables-spherical/Point";
import { DisplayStyle } from "@/plottables-spherical/Nodule";
const ga = useEllipticGA();
export class CKPoint extends CKNodule {
  ga_coord: AlgebraElement;
  constructor(pos: Vector3) {
    super();
    this.ga_coord = ga.makePoint(pos.x, pos.y, pos.z);
    this.name = `P${this.id}`;
    const p = new Point(this.name);
    p.positionVector = pos;
    p.stylize(DisplayStyle.ApplyCurrentVariables);
    p.setVisible(true);
    p.adjustSize();
    this.ref = p;
  }

  isHitAt(unitIdealVector: Vector3): boolean {
    const checkPoint = ga.makePoint(
      unitIdealVector.x,
      unitIdealVector.y,
      unitIdealVector.z
    );
    const distance = this.ga_coord.vee(checkPoint).norm();
    // console.debug(
    //   `Distance between point ${this.ga_coord} and hit point ${checkPoint} is ${distance}`
    // );
    return distance < 1e-2;
  }
}
