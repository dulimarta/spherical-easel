import {
  // Mesh,
  Vector3,
  Matrix4,
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial
} from "three";
import SETTINGS from "@/global-settings";


const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const rotationMatrix = new Matrix4();

export default class Circle extends Line {
  private center: Vector3;
  private outer: Vector3;

  constructor(center?: Vector3, outer?: Vector3) {
    super();
    this.center = center || new Vector3(0, 0, 0);
    this.outer = outer || new Vector3(1, 0, 0);
    const radius = this.center?.distanceTo(this.outer);
    const vertices = [];
    // debugger; // eslint-disable-line
    const N = SETTINGS.circle.radialSegments;
    for (let k = 0; k <= N; k++) {
      const angle = k * 2 * Math.PI / N;
      // Build the circle on the XY plane
      vertices.push(radius * Math.cos(angle), radius * Math.sin(angle), 0.4);
    }
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position',
      new Float32BufferAttribute(vertices, 3));
    this.material = new LineBasicMaterial({ color: 0x000000, linewidth: SETTINGS.line.thickness });
    this.scale.setScalar(1);
    // this.name = "Circle-" + this.id;
  }

  private readjust() {
    desiredZAxis.copy(this.center).normalize();
    desiredYAxis.crossVectors(this.outer, this.center);
    desiredXAxis.crossVectors(desiredYAxis, desiredZAxis);
    rotationMatrix.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);
    this.position.set(0, 0, 0);
    const angle = this.center.angleTo(this.outer);
    const circleRadius = Math.sin(angle);
    const translateDistance = Math.cos(angle);
    this.scale.set(circleRadius, circleRadius, 1);
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
    dup.rotation.copy(this.rotation);
    dup.position.copy(this.position);
    dup.scale.copy(this.scale);
    return dup as this;
  }
}
