import { useEllipticGA } from "@/composables/ga";
import { Vector3 } from "three";
import Algebra, { AlgebraElement } from "ts-geometric-algebra";
import { CKNodule } from "./CKNodule";
import Point from "@/plottables-spherical/Point";
import { DisplayStyle } from "@/plottables-spherical/Nodule";
const ga = useEllipticGA();
export class CKPoint extends CKNodule {
  repr: AlgebraElement;
  constructor(pos: Vector3) {
    super();
    this.repr = ga.makePoint(pos.x, pos.y, pos.z);
    this.name = `P${this.id}`;
    const p = new Point(this.name);
    p.positionVector = pos;
    p.stylize(DisplayStyle.ApplyCurrentVariables);
    p.setVisible(true);
    p.adjustSize();
    this.ref = p;
    console.log("Dumping point:", this.repr.grade(2));
  }
}
