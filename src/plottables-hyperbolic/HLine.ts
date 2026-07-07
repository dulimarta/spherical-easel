import type { CKLine } from "@/models/CKLine";
import { Nodule } from "@/plottables/Nodule";
import {
  Mesh,
  MeshStandardNodeMaterial,
  TubeGeometry,
  Vector3,
  type Scene
} from "three/webgpu";
import { HyperbolicCurve } from "./HyperbolicCurve";
import type { CKSegment } from "@/models/CKSegment";
export class HLine extends Nodule<CKLine> {
  private _lineMesh: Mesh;
  private _lineMaterial: MeshStandardNodeMaterial;
  private _curve: HyperbolicCurve;
  private _startPosition = new Vector3();
  private _endPosition = new Vector3();
  constructor(name: string, modelRef: CKLine, infiniteLine: boolean) {
    super(name, modelRef);
    this._lineMaterial = new MeshStandardNodeMaterial({ color: 0xffff00 });
    this._curve = new HyperbolicCurve(infiniteLine);
    this._lineMesh = new Mesh(
      new TubeGeometry(this._curve),
      this._lineMaterial
    );
    this.viewGroup.add(this._lineMesh);
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
    const startPoint = this.modelRef.startPointCoord.vector(2);
    const endPoint = this.modelRef.endPointCoord.vector(2);
    this._startPosition.set(startPoint[0], startPoint[1], startPoint[2]);
    this._endPosition.set(endPoint[0], endPoint[1], endPoint[2]);
    this._curve.setPoints(this._startPosition, this._endPosition);
    this._lineMesh.geometry.dispose();
    this._lineMesh.geometry = new TubeGeometry(this._curve, 50, 0.025, 12);
  }
}
