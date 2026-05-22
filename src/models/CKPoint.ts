import { useEllipticGA } from "@/composables/ga";
import { Vector3 } from "three";
import Algebra, { AlgebraElement } from "ts-geometric-algebra";
const ga = useEllipticGA();
export class CKPoint {
  point: AlgebraElement;
  constructor(pos: Vector3) {
    this.point = ga.makePoint(pos.x, pos.y, pos.z);
    console.log("Dumping point:", this.point);
  }
}
