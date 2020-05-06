import {
  Mesh,
  Vector3,
  TorusBufferGeometry,
  MeshPhongMaterial,
  Matrix4
} from "three";
import SETTINGS from "@/global-settings";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const rotationMatrix = new Matrix4();

export default class Circle extends Mesh {
  private center: Vector3;
  private outer: Vector3;
  constructor(center?: Vector3, outer?: Vector3) {
    super();
    this.center = center || new Vector3(0, 0, 0);
    this.outer = outer || new Vector3(1, 0, 0);
    this.geometry = new TorusBufferGeometry(
      1.0,
      SETTINGS.line.thickness /* thickness */,
      12 /* tubular segments */,
      120 /* radial segments */,
      2 * Math.PI
    );
    this.material = new MeshPhongMaterial({ color: 0xffffff });
    this.name = "Circle-" + this.id;
  }

  private readjust() {
    desiredZAxis.copy(this.center).normalize();
    desiredYAxis.crossVectors(this.outer, this.center);
    desiredXAxis.crossVectors(desiredYAxis, desiredZAxis);
    rotationMatrix.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);
    this.position.set(0, 0, 0);
    const angle = this.center.angleTo(this.outer);
    const ringRadius = Math.sin(angle);
    const translateDistance = Math.cos(angle);
    this.scale.set(ringRadius, ringRadius, 1);
    this.translateZ(translateDistance);
    this.rotation.setFromRotationMatrix(rotationMatrix);
  }

  set centerPoint(position: Vector3) {
    this.center.copy(position);
    this.readjust();
  }

  set circlePoint(position: Vector3) {
    this.outer.copy(position);
    this.readjust();
  }

  clone(): this {
    const dup = new Circle(this.center, this.outer);
    dup.name = this.name;
    dup.rotation.copy(this.rotation);
    dup.position.copy(this.position);
    dup.scale.copy(this.scale);
    return dup as this;
  }
}
