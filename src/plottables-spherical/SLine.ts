import { CKLine } from "@/models/CKLine";
import { Nodule } from "@/plottables/Nodule";
import {
  NodeMaterial,
  TorusGeometry,
  Mesh,
  MeshStandardNodeMaterial,
  Line2NodeMaterial,
  ArcCurve,
  Vector3
} from "three/webgpu";
import { Line2 } from "three/addons/lines/webgpu/Line2.js";
// import { LineSegments2 } from "three/examples/jsm/lines/webgpu/LineSegments2.js";
// import { LineSegmentsGeometry } from "three/examples/jsm/Addons.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { color, Fn } from "three/tsl";
export class SLine extends Nodule<CKLine> {
  // private _lineMesh: Mesh;
  // private _lineMaterial: NodeMaterial;
  constructor(name: string, modelRef: CKLine, infiniteLine: boolean) {
    super(name, modelRef);

    // this._lineMaterial = new MeshStandardNodeMaterial({ color: 0xffff00 });
    // this._lineMesh = new Mesh(
    //   new TorusGeometry(1, 0.006, 20, 120),
    //   this._lineMaterial
    // );
    // this.viewGroup.add(this._lineMesh);

    const circleCurve = new ArcCurve(0, 0, 1, 0, 2 * Math.PI, true);
    const l2geometry = new LineGeometry();
    // l2geometry.setPositions(
    //   circleCurve.getPoints(20).flatMap(p => [p.x, p.y, 0])
    // );
    l2geometry.setFromPoints(circleCurve.getPoints(60));
    l2geometry.setColors(
      Array.from({ length: 120 }, () => [0, 15, 200]).flatMap(z => z)
    );
    const l2material = new Line2NodeMaterial({
      vertexColors: true,
      linewidth: 5,
      dashed: false,
      worldUnits: false
    });
    const ls = new Line2(l2geometry, l2material);
    ls.computeLineDistances();

    this.viewGroup.add(ls);
  }
  show(): void {
    // throw new Error("Method not implemented.");
  }
  hide(): void {
    // throw new Error("Method not implemented.");
  }
  glowingDisplay(): void {
    // throw new Error("Method not implemented.");
  }
  normalDisplay(): void {
    // throw new Error("Method not implemented.");
  }
  modelUpdated(): void {
    const line = this.modelRef.theLine.vector(1);
    console.debug(
      "SLine::modelUpdated line vector:",
      -line[2],
      line[1],
      -line[0]
    );
    // this._lineMesh.lookAt(-line[2], line[1], -line[0]);
    this.viewGroup.lookAt(-line[2], line[1], -line[0]);
  }
}
