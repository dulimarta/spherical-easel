import {
  Mesh,
  TorusBufferGeometry,
  MeshPhongMaterial,
  Vector3,
  Matrix4,
  BufferGeometry,
  Geometry
} from "three";
import SETTINGS from "@/global-settings";
const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const rotationMatrix = new Matrix4();

export default class Line extends Mesh {
  private start: Vector3;
  private end: Vector3;
  private _segment: boolean;
  constructor(start?: Vector3, end?: Vector3, segment?: boolean) {
    super();
    this.start = start || new Vector3(1, 0, 0);
    this.end = end || new Vector3(0, 1, 0);
    this._segment = segment || false;
    this.geometry = new TorusBufferGeometry(
      SETTINGS.sphere.radius,
      /* thickness */ 0.01,
      /* tubular segments */ 6,
      /* radial segments */ 60,
      2 * Math.PI
    );
    this.material = new MeshPhongMaterial({ color: 0xffffff });
  }

  private calculateRotation() {
    desiredZAxis.crossVectors(this.start, this.end).normalize();
    desiredXAxis.copy(this.start).normalize();
    desiredYAxis.crossVectors(desiredZAxis, desiredXAxis);
    rotationMatrix.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);
    this.rotation.setFromRotationMatrix(rotationMatrix);
    if (this._segment) {
      // Readjust arc length
      const angle = this.start.angleTo(this.end);
      this.geometry.dispose();
      this.geometry = new TorusBufferGeometry(
        SETTINGS.sphere.radius,
        /* thickness */ 0.01,
        /* tubular segments */ 6,
        /* radial segments */ 60,
        angle
      );
    }
  }

  // Use JavaScript setter functions to auto compute
  // the other properties of this object
  set isSegment(value: boolean) {
    this._segment = value;
    this.name = (value ? "Segment-" : "Line-") + this.id;
  }

  set startPoint(position: Vector3) {
    this.start.copy(position);
    this.calculateRotation();
  }

  set endPoint(position: Vector3) {
    this.end.copy(position);
    this.calculateRotation();
  }

  // It looks like we have to define our own clone() function
  // The builtin clone() does not seem to work correctly
  clone(recursive?: boolean): this {
    const dup = super.clone(recursive);
    const geoDup = this.geometry.clone() as BufferGeometry & Geometry;
    dup.geometry.copy(geoDup);
    //(dup.geometry as BufferGeometry).copy(this.geometry.clone());
    // Use the setter to automatically sets the name
    dup.isSegment = this._segment;

    return dup;
  }
}
