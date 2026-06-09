import { useGA, toPoint3D } from "@/composables/ga";
import { Vector3 } from "three";
import { AlgebraElement } from "ts-geometric-algebra";
import { CKNodule } from "./CKNodule";
import { NewPoint } from "@/plottables-spherical/NewPoint";
import { Point } from "@/plottables-hyperbolic/Point";
import { NewLabel } from "@/plottables-spherical/NewLabel";
import { Nodule } from "@/plottables/Nodule";
const ega = useGA(false); // false for elliptic, true for hyperbolic
const hga = useGA(true);
export class CKPoint extends CKNodule {
  ga_coord: AlgebraElement;
  constructor(pos: Vector3) {
    super();
    // If pos.z is zero, these two quantities are the same
    const checkSpherical = pos.x ** 2 + pos.y ** 2 + pos.z ** 2;
    const checkHyperbolic = pos.x ** 2 + pos.y ** 2 - pos.z ** 2;
    console.debug("Elliptic check (should be 1):", checkSpherical);
    console.debug("Hyperbolic check (should be -1):", checkHyperbolic);
    let plottablePoint: Nodule;
    if (checkSpherical > 1.0) {
      // checkHyperbolic: -1 for proper point
      // checkHyperbolic: 0 for direction/point at infinity
      // checkHyperbolic: 1 for ultra point
      this.ga_coord = hga.makePoint(pos.x, pos.y, pos.z);
      plottablePoint = new Point(`P${this.id}`, this);
    } else {
      this.ga_coord = ega.makePoint(pos.x, pos.y, pos.z);
      plottablePoint = new NewPoint(this);
      const pointLabel = new NewLabel(this, "point");
      this.labelRef = pointLabel;
      this.subscribe(pointLabel);
    }
    this.ref = plottablePoint;
    this.subscribe(plottablePoint);
    this.name = `P${this.id}`;
    this.notifyModelUpdated();
    // p.positionVector = pos;
    // p.stylize(DisplayStyle.ApplyCurrentVariables);
    // p.setVisible(true);
    // p.adjustSize();
  }

  isHitAt(unitIdealVector: Vector3): boolean {
    const checkPoint = ega.makePoint(
      unitIdealVector.x,
      unitIdealVector.y,
      unitIdealVector.z
    );
    const distance = this.ga_coord.vee(checkPoint).norm();
    console.debug(
      `Distance between point ${toPoint3D(this.ga_coord)} and hit point ${toPoint3D(checkPoint)} is ${distance}`
    );
    if (distance < 1e-2) {
      this.setHighlight(true);
    }
    return distance < 1e-2;
  }
}
