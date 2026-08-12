import { CKSegment } from "@/models/CKSegment";
import { Nodule } from "@/plottables/Nodule";
import {
  Vector3,
  Mesh,
  TorusGeometry,
  Matrix4,
  Line2NodeMaterial,
  ArcCurve
} from "three/webgpu";
import { Line2 } from "three/addons/lines/webgpu/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { color } from "three/tsl";
const X_AXIS = new Vector3(1, 0, 0);

export class SSegment extends Nodule<CKSegment> {
  private start = new Vector3();
  private end = new Vector3();
  private currentPlaneNormal = new Vector3();
  private _segmentMaterial: Line2NodeMaterial;
  private _segmentGeometry: LineGeometry;
  private _segmentMesh: Mesh;
  private _rotationAxis = new Vector3();
  private _tmpMatrix = new Matrix4();
  private xHolder = new Vector3();
  private yHolder = new Vector3();
  private zHolder = new Vector3();

  constructor(
    name: string,
    modelRef: CKSegment,
    public readonly longerThanPi: boolean
  ) {
    super(name, modelRef);
    this._segmentMaterial = new Line2NodeMaterial({
      color: 0xffff00,
      linewidth: 4,
      worldUnits: false
    });
    this._segmentGeometry = new LineGeometry();
    this._segmentMesh = new Line2(this._segmentGeometry, this._segmentMaterial);
    this._segmentMesh.name = this.name;
    this._segmentMesh.matrixAutoUpdate = false;
    this.viewGroup.add(this._segmentMesh);
  }
  show(): void {}
  hide(): void {}
  glowingDisplay(): void {
    this._segmentMaterial.colorNode = color(0xff0000);
    this._segmentMaterial.needsUpdate = true;
  }
  normalDisplay(): void {
    this._segmentMaterial.colorNode = color(0xffff00);
    this._segmentMaterial.needsUpdate = true;
  }
  modelUpdated(): void {
    const startPoint = this.modelRef.startPointCoord.vector(2);
    const endPoint = this.modelRef.endPointCoord.vector(2);
    const normal = this.modelRef.theLine.vector(1);
    this.start.set(startPoint[0], startPoint[1], startPoint[2]);
    this.end.set(endPoint[0], endPoint[1], endPoint[2]);
    this.currentPlaneNormal.set(-normal[2], normal[1], -normal[0]);
    let arcLength: number;
    if (this.longerThanPi) {
      this.currentPlaneNormal.multiplyScalar(-1);
      arcLength = 2 * Math.PI - this.start.angleTo(this.end);
    } else {
      arcLength = this.start.angleTo(this.end);
    }
    const arc = new ArcCurve(0, 0, 1, 0, arcLength, false);
    this._segmentGeometry.setPositions(
      arc
        .getPoints(120)
        // Make the circle slightly larger than unit radius to avoid z-fighting
        // with the unit sphere
        .map(p => p.multiplyScalar(1.01))
        .flatMap(p => [p.x, p.y, 0])
    );
    // this._segmentMesh.geometry.dispose();
    // this._segmentMesh.geometry = new TorusGeometry(
    //   1,
    //   0.006,
    //   16,
    //   120,
    //   arcLength
    // );
    this._segmentMesh.matrix.identity();
    this._rotationAxis.crossVectors(X_AXIS, this.start).normalize();
    const angle1 = X_AXIS.angleTo(this.start);
    this._tmpMatrix.makeRotationAxis(this._rotationAxis, angle1);
    this._segmentMesh.matrix.multiply(this._tmpMatrix);
    this._segmentMesh.matrix.extractBasis(
      this.xHolder,
      this.yHolder,
      this.zHolder
    );
    const angle2 = this.zHolder.angleTo(this.currentPlaneNormal);
    this.yHolder
      .crossVectors(this.zHolder, this.currentPlaneNormal)
      .normalize();
    this._tmpMatrix.makeRotationX(angle2 * Math.sign(this.yHolder.x));
    this._segmentMesh.matrix.multiply(this._tmpMatrix);
    if (this.modelRef.isHighlighted()) {
      this.glowingDisplay();
    } else {
      this.normalDisplay();
    }
  }
}
