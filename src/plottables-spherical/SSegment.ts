import { CKSegment } from "@/models/CKSegment";
import { Nodule } from "@/plottables/Nodule";
import {
  MeshStandardNodeMaterial,
  Vector3,
  Mesh,
  TorusGeometry,
  Matrix4
} from "three/webgpu";

const X_AXIS = new Vector3(1, 0, 0);

export class SSegment extends Nodule<CKSegment> {
  private start = new Vector3();
  private end = new Vector3();
  private currentPlaneNormal = new Vector3();
  private _meshMaterial: MeshStandardNodeMaterial;
  private _mesh: Mesh;
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
    this._meshMaterial = new MeshStandardNodeMaterial({ color: 0x0000ff });
    this._mesh = new Mesh(
      new TorusGeometry(1, 0.006, 16, 120),
      this._meshMaterial
    );
    this._mesh.matrixAutoUpdate = false;
    this.viewGroup.add(this._mesh);
  }
  show(): void {}
  hide(): void {}
  glowingDisplay(): void {}
  normalDisplay(): void {}
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
    this._mesh.geometry.dispose();
    this._mesh.geometry = new TorusGeometry(1, 0.006, 16, 120, arcLength);
    this._mesh.matrix.identity();
    this._rotationAxis.crossVectors(X_AXIS, this.start).normalize();
    const angle1 = X_AXIS.angleTo(this.start);
    this._tmpMatrix.makeRotationAxis(this._rotationAxis, angle1);
    this._mesh.matrix.multiply(this._tmpMatrix);
    this._mesh.matrix.extractBasis(this.xHolder, this.yHolder, this.zHolder);
    const angle2 = this.zHolder.angleTo(this.currentPlaneNormal);
    this.yHolder
      .crossVectors(this.zHolder, this.currentPlaneNormal)
      .normalize();
    this._tmpMatrix.makeRotationX(angle2 * Math.sign(this.yHolder.x));
    this._mesh.matrix.multiply(this._tmpMatrix);
  }
}
