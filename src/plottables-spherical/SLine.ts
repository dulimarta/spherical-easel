import { CKLine } from "@/models/CKLine";
import { Nodule } from "@/plottables/Nodule";
import { Line2NodeMaterial, ArcCurve } from "three/webgpu";
import { Line2 } from "three/addons/lines/webgpu/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { color, normalLocal, uniform } from "three/tsl";

export class SLine extends Nodule<CKLine> {
  private _lineMesh: Line2;
  private _lineMaterial: Line2NodeMaterial;

  constructor(name: string, modelRef: CKLine) {
    super(name, modelRef);

    const circleCurve = new ArcCurve(0, 0, 1, 0, 2 * Math.PI, true);
    const l2geometry = new LineGeometry();
    l2geometry.setPositions(
      circleCurve
        .getPoints(120)
        // After making the unit sphere with radius slightly smaller than 1
        // it is unnecessary to scale the circle geometry
        // .map(p => p.multiplyScalar(1.01))
        .flatMap(p => [p.x, p.y, 0])
    );
    this._lineMaterial = new Line2NodeMaterial({
      linewidth: 4,
      worldUnits: false
    });
    // this._lineMaterial.colorNode = normalLocal;
    this._lineMesh = new Line2(l2geometry, this._lineMaterial);
    this._lineMesh.name = this.name;
    this.viewGroup.add(this._lineMesh);
  }
  show(): void {
    // throw new Error("Method not implemented.");
  }
  hide(): void {
    // throw new Error("Method not implemented.");
  }
  glowingDisplay(): void {
    this._lineMesh.material.dispose();
    this._lineMesh.material = new Line2NodeMaterial({
      color: 0xff0000,
      linewidth: 4,
      worldUnits: false
    });
  }

  normalDisplay(): void {
    this._lineMesh.material.dispose();
    this._lineMesh.material = new Line2NodeMaterial({
      color: 0xffff00,
      linewidth: 4,
      worldUnits: false
    });
  }
  modelUpdated(): void {
    const line = this.modelRef.theLine.vector(1);
    console.debug(
      "SLine::modelUpdated line vector:",
      -line[2].toFixed(3),
      line[1].toFixed(3),
      -line[0].toFixed(3)
    );
    this.viewGroup.lookAt(-line[2], line[1], -line[0]);
    if (this.modelRef.isHighlighted()) {
      this.glowingDisplay();
    } else {
      this.normalDisplay();
    }
  }
}
