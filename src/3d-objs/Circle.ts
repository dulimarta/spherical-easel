import {
  Mesh,
  Vector3,
  TorusBufferGeometry,
  MeshPhongMaterial,
  Matrix4
} from "three";
import Two from "two.js"
import SETTINGS from "@/global-settings";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const rotationMatrix = new Matrix4();

export default class Circle extends Two.Path {
  // private center: Vector3;
  // private outer: Vector3;
  constructor(center?: Vector3, outer?: Vector3) {
    const vertices: Two.Vector[] = [];
    for (let k = 0; k <= 120; k++) {
      const angle = 2 * k * Math.PI / 120;
      vertices.push(new Two.Vector(100 * Math.cos(angle), 100 * Math.sin(angle)));
    }
    super(vertices, true, false);
    // this.fill = "red";
    this.linewidth = 5;
    (this as any).dashes.push(10, 5);
    // this.center = center || new Vector3(0, 0, 0);
    // this.outer = outer || new Vector3(1, 0, 0);
  }

  private readjust() {
    // desiredZAxis.copy(this.center).normalize();
    // desiredYAxis.crossVectors(this.outer, this.center);
    // desiredXAxis.crossVectors(desiredYAxis, desiredZAxis);
    // rotationMatrix.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);
    // this.position.set(0, 0, 0);
    // const angle = this.center.angleTo(this.outer);
    // const circleRadius = Math.sin(angle);
    // const translateDistance = Math.cos(angle);
    // this.scale.set(circleRadius, circleRadius, 1);
    // this.translateZ(translateDistance);
    // this.rotation.setFromRotationMatrix(rotationMatrix);
  }

  set centerPoint(position: Vector3) {
    // this.center.copy(position);
    this.readjust();
  }

  set circlePoint(position: Vector3) {
    // this.outer.copy(position);
    this.readjust();
  }

  // clone(): this {
  //   const dup = new Circle(this.center, this.outer);
  //   dup.rotation.copy(this.rotation);
  //   dup.position.copy(this.position);
  //   dup.scale.copy(this.scale);
  //   return dup as this;
  // }
}
