import type { CKLine } from "@/models/CKLine";
import { Nodule } from "@/plottables/Nodule";
import {
  Mesh,
  MeshStandardNodeMaterial,
  Line2NodeMaterial,
  TubeGeometry,
  Vector3,
  type Scene
} from "three/webgpu";
import { HyperbolicCurve } from "./HyperbolicCurve";
import type { CKSegment } from "@/models/CKSegment";
import { Line2 } from "three/examples/jsm/lines/webgpu/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
export class HLine extends Nodule<CKLine | CKSegment> {
  private _lineMesh: Line2;
  private _lineGeometry: LineGeometry;
  private _lineMaterial: Line2NodeMaterial;
  private _curve: HyperbolicCurve;
  private _startPosition = new Vector3();
  private _endPosition = new Vector3();
  constructor(
    name: string,
    modelRef: CKLine | CKSegment,
    infiniteLine: boolean
  ) {
    super(name, modelRef);
    this._lineMaterial = new Line2NodeMaterial({
      color: 0xff8080,
      linewidth: 5,
      worldUnits: false
    });
    this._curve = new HyperbolicCurve(infiniteLine);
    this._lineGeometry = new LineGeometry();
    // this._lineGeometry.setPositions(
    //   this._curve.getPoints(120).flatMap(p => [p.x, p.y, 0])
    // );
    this._lineMesh = new Line2(this._lineGeometry, this._lineMaterial);
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
      color: 0xffff00,
      linewidth: 5
    });
  }
  normalDisplay(): void {
    this._lineMesh.material.dispose();
    this._lineMesh.material = new Line2NodeMaterial({
      color: 0xff8000,
      linewidth: 5
    });
  }
  modelUpdated(): void {
    const startPoint = this.modelRef.startPointCoord.vector(2);
    const endPoint = this.modelRef.endPointCoord.vector(2);
    this._startPosition.set(startPoint[0], startPoint[1], startPoint[2]);
    this._endPosition.set(endPoint[0], endPoint[1], endPoint[2]);
    this._curve.setPoints(this._startPosition, this._endPosition);
    this._lineMesh.geometry.setPositions(
      this._curve.getPoints(120).flatMap(p => [p.x, p.y, p.z])
    );
    if (this.modelRef.isHighlighted()) {
      this.glowingDisplay();
    } else {
      this.normalDisplay();
    }
  }
}
