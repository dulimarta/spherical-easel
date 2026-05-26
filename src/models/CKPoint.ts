import { useGA } from "@/composables/ga";
import { Vector3 } from "three";
import Algebra, { AlgebraElement } from "ts-geometric-algebra";
import { CKNodule } from "./CKNodule";
import Point from "@/plottables-spherical/Point";
import { DisplayStyle } from "@/plottables-spherical/Nodule";
const ega = useGA(false); // false for elliptic, true for hyperbolic
const hga = useGA(true);
export class CKPoint extends CKNodule {
  ga_coord: AlgebraElement;
  constructor(pos: Vector3) {
    super();
    const checkSpherical = pos.x ** 2 + pos.y ** 2 + pos.z ** 2;
    const checkHyperBolic = pos.x ** 2 + pos.y ** 2 - pos.z ** 2;
    console.debug("Elliptic check (should be 1):", checkSpherical);
    console.debug("Hyperbolic check (should be -1):", checkHyperBolic);
    if (checkSpherical > 1.0) {
      // checkHyperBolic: -1 for proper point
      // checkSpherical: 0 for direction/point at infinity
      // checkSpherical: 1 for ultra point
      this.ga_coord = hga.makePoint(pos.x, pos.y, pos.z);
    } else {
      this.ga_coord = ega.makePoint(pos.x, pos.y, pos.z);
    }
    this.name = `P${this.id}`;
    const p = new Point(this.name);
    p.positionVector = pos;
    p.stylize(DisplayStyle.ApplyCurrentVariables);
    p.setVisible(true);
    p.adjustSize();
    this.ref = p;
  }

  isHitAt(unitIdealVector: Vector3): boolean {
    const checkPoint = ega.makePoint(
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
