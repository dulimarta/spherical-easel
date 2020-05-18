import {
  Line as ThreeJSLine,
  LineBasicMaterial,
  // TorusBufferGeometry,
  Float32BufferAttribute,
  Vector3,
  Matrix4,
  BufferGeometry,
  Group,
  LineDashedMaterial
} from "three";
import SETTINGS from "@/global-settings";
const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const rotationMatrix = new Matrix4();

class HalfLine extends ThreeJSLine {
  constructor(rotation?: number, dashed?: boolean) {
    super();
    const radius = SETTINGS.sphere.radius;
    const vertices = [];
    // debugger; // eslint-disable-line
    const N = SETTINGS.circle.radialSegments / 2;
    for (let k = 0; k <= N; k++) {
      const angle = k * Math.PI / N + (rotation || 0);
      // Build the circle on the XY plane
      vertices.push(radius * Math.cos(angle), radius * Math.sin(angle), 0);
    }
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position',
      new Float32BufferAttribute(vertices, 3));
    if (dashed === true)
      this.material = new LineDashedMaterial({ color: 0xFF0000, linewidth: SETTINGS.line.thickness, dashSize: 3, gapSize: 1 })
    else
      this.material = new LineBasicMaterial({ color: 0x00FF00, linewidth: SETTINGS.line.thickness });
  }
}
export default class Line extends Group {
  private start: Vector3;
  private end: Vector3;
  private _segment: boolean;
  private frontHalf: HalfLine;
  private backHalf: HalfLine;

  constructor(start?: Vector3, end?: Vector3, segment?: boolean) {
    super();
    this.start = start || new Vector3(1, 0, 0);
    this.end = end || new Vector3(0, 1, 0);
    this._segment = segment || false;
    this.frontHalf = new HalfLine(0, false);
    this.backHalf = new HalfLine(Math.PI, true);
    this.add(this.frontHalf);
    this.add(this.backHalf);
    this.name = (this._segment ? "Segment-" : "Line-") + this.id;
  }

  public highlight() {
    // TODO: incomplete implementation
  }
  private calculateRotation() {
    desiredZAxis.crossVectors(this.start, this.end).normalize();
    desiredXAxis.copy(this.start).normalize();
    desiredYAxis.crossVectors(desiredZAxis, desiredXAxis);
    rotationMatrix.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);
    this.rotation.setFromRotationMatrix(rotationMatrix);
    // if (this._segment) {
    //   // Readjust arc length
    //   const angle = this.start.angleTo(this.end);
    //   this.geometry.dispose();
    //   this.geometry = new TorusBufferGeometry(
    //     SETTINGS.sphere.radius,
    //     /* thickness */ 0.01,
    //     /* tubular segments */ 6,
    //     /* radial segments */ 60,
    //     angle
    //   );
    // }
  }

  // Use JavaScript setter functions to auto compute
  // the other properties of this object
  set isSegment(value: boolean) {
    this._segment = value;
    this.name = (value ? "Segment-" : "Line-") + this.id;
  }

  set startV3Point(position: Vector3) {
    this.start.copy(position);
    this.calculateRotation();
  }

  set endV3Point(position: Vector3) {
    this.end.copy(position);
    this.calculateRotation();
  }

  // It looks like we have to define our own clone() function
  // The builtin clone() does not seem to work correctly
  // clone(): this {
  //   const dup = new Line(this.start, this.end, this._segment);
  //   (dup.geometry as BufferGeometry).copy(
  //     (this.geometry as BufferGeometry).clone()
  //   );
  //   dup.rotation.copy(this.rotation);
  //   dup._segment = this._segment;
  //   dup.start.copy(this.start);
  //   dup.end.copy(this.end);
  //   return dup as this;
  // }
}
