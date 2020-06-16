import { Vector3, Matrix4 } from "three";
import Two, { Vector } from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule from "./Nodule";

const SUBDIVS = 100;
// const XAxis = new Vector3(1, 0, 0);
/**
 * Geodesic line on a circle
 *
 * @export
 * @class Line
 * @extends {Two.Group}
 */
export default class Line extends Nodule {
  // Declare owner as non-null, this field will be initialized by the associated owner
  // public owner?: SELine | null = null;
  private start: Vector3;
  private end: Vector3;
  // public name = "";
  private oldFrontStroke: Two.Color = "";
  private oldBackStroke: Two.Color = "";
  public normalDirection: Vector3;

  private majorAxisDirection: Vector3 = new Vector3();
  private tmpVector: Vector3;
  private desiredXAxis = new Vector3();
  private desiredYAxis = new Vector3();
  // const desiredZAxis = new Vector3();
  private transformMatrix = new Matrix4();
  private segment: boolean;
  private frontHalf: Two.Path;
  private backHalf: Two.Path;
  private points: Vector3[];

  // The following lines are for debugging only
  private majorAxis: Two.Line;
  private minorAxis: Two.Line;

  constructor(start?: Vector3, end?: Vector3, segment?: boolean) {
    super();
    const radius = SETTINGS.boundaryCircle.radius;
    const vertices: Two.Vector[] = [];
    // Generate 2D coordinates of a half circle
    for (let k = 0; k < SUBDIVS; k++) {
      const angle = (k * Math.PI) / SUBDIVS;
      const px = radius * Math.cos(angle);
      const py = radius * Math.sin(angle);
      vertices.push(new Two.Vector(px, py));
    }
    // Generate 3D coordinates of the entire circle
    this.points = [];
    for (let k = 0; k < 2 * SUBDIVS; k++) {
      const angle = (2 * k * Math.PI) / (2 * SUBDIVS);
      const px = radius * Math.cos(angle);
      const py = radius * Math.sin(angle);
      this.points.push(new Vector3(px, py, 0));
    }
    this.tmpVector = new Vector3();
    this.frontHalf = new Two.Path(
      vertices,
      /* closed */ false,
      /* curve */ false
    );
    this.backHalf = this.frontHalf.clone();
    this.frontHalf.linewidth = 5;
    this.frontHalf.stroke = "green";
    // Create the back half circle by cloning the front half
    this.backHalf = this.frontHalf.clone();
    this.backHalf.stroke = "gray";
    (this.backHalf as any).dashes.push(10, 5); // render as dashed lines
    this.backHalf.linewidth = 3;
    // Be sure to clone() the incoming start and end points
    // Otherwise update by other Line will affect this one!
    if (start) this.start = start.clone();
    else this.start = new Vector3(1, 0, 0);
    if (end) this.end = end.clone();
    else this.end = new Vector3(0, 1, 0);
    this.normalDirection = new Vector3();
    this.normalDirection.crossVectors(this.start, this.end);
    this.segment = segment || false;
    // this.scaleVector = new Two.Vector(1, 1);
    this.add(this.frontHalf);
    if (!segment) {
      // FIXME: how to handle segments longer than 180 degrees?
      this.add(this.backHalf);
      this.name = "Line-" + this.id;
    } else {
      // Line segment does not a back semicircle
      this.name = "Segment-" + this.id;
    }
    this.noFill();

    // For debugging only
    this.majorAxis = new Two.Line(0, 0, SETTINGS.boundaryCircle.radius, 0); // Along the X-axis
    this.majorAxis.stroke = "red";
    this.majorAxis.linewidth = 5;
    this.minorAxis = new Two.Line(0, 0, 0, SETTINGS.boundaryCircle.radius / 2); // Along the y-axis
    this.minorAxis.stroke = "green";
    this.minorAxis.linewidth = 3;

    // Enable the following for debugging
    // this.add(this.majorAxis, this.minorAxis);
  }
  frontGlowStyle(): void {
    this.oldFrontStroke = this.frontHalf.stroke;
    this.oldBackStroke = this.backHalf.stroke;
    this.frontHalf.stroke = "red";
    this.backHalf.stroke = "red";
  }

  backGlowStyle(): void {
    return void 0;
  }

  backNormalStyle(): void {
    return void 0;
  }

  frontNormalStyle(): void {
    this.frontHalf.stroke = this.oldFrontStroke;
    this.backHalf.stroke = this.oldBackStroke;
  }

  normalStyle(): void {
    console.debug("Not implemented");
  }
  glowStyle(): void {
    // console.debug("Not implemented");
  }

  // Recalculate the ellipse in 2D
  // FIXME: the circle does not accurately pass thro its end point?
  private deformIn2D(): void {
    // The ellipse major axis on the XY plane is perpendicular
    // to the circle normal [Nx,Ny,Nz]. We can fix the direction of
    // the major axis to [-Ny,Nx, 0] (pointing "left") and use these numbers
    // to compute the angle between the major axis and the viewport X-axis

    this.majorAxisDirection
      .set(-this.normalDirection.y, this.normalDirection.x, 0)
      .normalize();
    const angleToMajorAxis =
      Math.atan2(this.majorAxisDirection.y, this.majorAxisDirection.x) *
      Math.sign(this.normalDirection.z);
    // this.majorAxis.vertices[1].x = SETTINGS.boundaryCircle.radius;
    // This rotation applies to the ENTIRE group
    // but in addtoLayers() we must copy the rotation to each group member
    this.rotation = angleToMajorAxis;

    // Calculate the length of its minor axes from the non-rotated ellipse
    const cosAngle = Math.cos(angleToMajorAxis); // cos(-x) = cos(x)
    const sinAngle = Math.sin(-angleToMajorAxis);
    // (Px,Py) is the projected start point of the unrotated ellipse

    // apply the reverse rotation to the start point
    const px = cosAngle * this.start.x - sinAngle * this.start.y;
    let py = sinAngle * this.start.x + cosAngle * this.start.y;

    // Use ellipse equation to compute minorAxis given than majorAxis is 1
    const minorLength = Math.sqrt((py * py) / (1 - px * px));
    let numSubdivs = this.frontHalf.vertices.length;
    const RADIUS = SETTINGS.boundaryCircle.radius;
    this.minorAxis.vertices[1].y = minorLength * RADIUS;
    // When the Z-value is negative, the front semicircle
    // is projected above the back semicircle
    const flipSign = Math.sign(this.normalDirection.z);
    if (this.segment) {
      // apply the reverse rotation to the start point
      const qx = cosAngle * this.end.x - sinAngle * this.end.y;
      let qy = sinAngle * this.end.x + cosAngle * this.end.y;
      let startAngle = Math.atan2(py, px);
      let endAngle = Math.atan2(qy, qx);

      // Retain the Y-coord sign of the unscaled points
      py = Math.sqrt(1 - px * px) * Math.sign(py);
      qy = Math.sqrt(1 - qx * qx) * Math.sign(qy);
      // console.debug(
      //   `Unrotate and unscaled points (${px.toFixed(3)},${py.toFixed(3)})` +
      //     " and " +
      //     `(${qx.toFixed(3)},${qy.toFixed(3)})`
      // );
      // Angles of the unscaled points
      startAngle = Math.atan2(py, px);
      endAngle = Math.atan2(qy, qx);
      if (startAngle > endAngle) {
        // Be sure to start from the smaller angle
        const tmp = startAngle;
        startAngle = endAngle;
        endAngle = tmp;
      }

      const totalArcLength = Math.abs(startAngle - endAngle);
      // TODO: how to handle length > 180 degrees
      this.frontHalf.vertices.forEach((v, pos) => {
        const angle = startAngle + (pos * totalArcLength) / numSubdivs;
        // Don't need flipSign here because cos(-alpha) = cos(alpha)
        v.x = RADIUS * Math.cos(angle);
        v.y = minorLength * RADIUS * Math.sin(angle);
      });
    } else {
      // reposition all vertices of the front semicircle
      this.frontHalf.vertices.forEach((v, pos) => {
        const angle = (flipSign * (pos * Math.PI)) / numSubdivs;
        v.x = RADIUS * Math.cos(angle);
        v.y = minorLength * RADIUS * Math.sin(angle);
      });
      // reposition all vertices of the back semicircle
      numSubdivs = this.backHalf.vertices.length;
      this.backHalf.vertices.forEach((v, pos) => {
        const angle = (flipSign * (pos * Math.PI)) / numSubdivs;
        v.x = RADIUS * Math.cos(angle);
        v.y = -minorLength * RADIUS * Math.sin(angle);
      });
    }
  }

  /** Reorient the unit circle in 3D and then project the points to 2D
   */
  private deformIntoEllipse(): void {
    // desiredZAxis.crossVectors(this.start, this.end).normalize();
    this.desiredXAxis.copy(this.start).normalize();
    this.desiredYAxis.crossVectors(this.normalDirection, this.desiredXAxis);
    this.transformMatrix.makeBasis(
      this.desiredXAxis,
      this.desiredYAxis,
      this.normalDirection
    );
    let firstPos = -1;
    let firstNeg = -1;
    let lastSign = 0;

    this.points.forEach((v, pos) => {
      this.tmpVector.copy(v);
      this.tmpVector.applyMatrix4(this.transformMatrix);
      if (lastSign * this.tmpVector.z < 0) {
        if (this.tmpVector.z > 0) firstPos = pos;
        if (this.tmpVector.z < 0) firstNeg = pos;
      }
      lastSign = Math.sign(this.tmpVector.z);
    });
    // console.debug(`First pos ${firstPos}, first neg ${firstNeg}`);
    if (this.segment) {
      const totalArcLength = this.start.angleTo(this.end);

      this.frontHalf.vertices.forEach((v, pos) => {
        const angle = (pos * totalArcLength) / SUBDIVS;
        this.tmpVector.set(
          Math.cos(angle) * SETTINGS.boundaryCircle.radius,
          Math.sin(angle) * SETTINGS.boundaryCircle.radius,
          0
        );
        this.tmpVector.applyMatrix4(this.transformMatrix);
        v.x = this.tmpVector.x;
        v.y = this.tmpVector.y;
      });
    } else {
      for (let k = 0; k < SUBDIVS; k++) {
        const idx = (firstPos + k) % (2 * SUBDIVS);
        this.tmpVector.copy(this.points[idx]);
        this.tmpVector.applyMatrix4(this.transformMatrix);
        this.frontHalf.vertices[k].x = this.tmpVector.x;
        this.frontHalf.vertices[k].y = this.tmpVector.y;
      }
      for (let k = 0; k < SUBDIVS; k++) {
        const idx = (firstNeg + k) % (2 * SUBDIVS);
        this.tmpVector.copy(this.points[idx]);
        this.tmpVector.applyMatrix4(this.transformMatrix);
        this.backHalf.vertices[k].x = this.tmpVector.x;
        this.backHalf.vertices[k].y = this.tmpVector.y;
      }
    }
  }
  // Use JavaScript setter functions to auto compute
  // the other properties of this object
  set isSegment(value: boolean) {
    this.segment = value;
    // this.name = (value ? "Segment-" : "Line-") + this.id;
  }

  get isSegment(): boolean {
    return this.segment;
  }

  set startPoint(position: Vector3) {
    this.start.copy(position);
    // The circle plane passes through three points the origin (0,0,0)
    // and the two points (start (S) and end (E)).
    // The normal of this plane is the cross product of SxE
    this.normalDirection.crossVectors(this.start, this.end).normalize();
    // Be sure the normal direction is pointing towards the viewer
    if (this.normalDirection.z < 0) this.normalDirection.multiplyScalar(-1);
    // this.deformIntoEllipse();
    this.deformIn2D();
  }

  get startPoint(): Vector3 {
    return this.start;
  }

  set endPoint(position: Vector3) {
    this.end.copy(position);
    this.normalDirection.crossVectors(this.start, this.end).normalize();

    // Be sure the normal direction is pointing towards the viewer
    if (this.normalDirection.z < 0) this.normalDirection.multiplyScalar(-1);
    // this.deformIntoEllipse();
    this.deformIn2D();
  }

  get endPoint(): Vector3 {
    return this.end;
  }

  set orientation(dir: Vector3) {
    this.normalDirection.copy(dir).normalize();
    this.deformIn2D();
    // this.deformIntoEllipse();
  }

  get orientation(): Vector3 {
    return this.normalDirection;
  }
  // It looks like we have to define our own clone() function
  // The builtin clone() does not seem to work correctly
  clone(): this {
    const dup = new Line(this.start, this.end, this.segment);
    //   (dup.geometry as BufferGeometry).copy(
    //     (this.geometry as BufferGeometry).clone()
    //   );
    //   dup.rotation.copy(this.rotation);
    dup.name = this.name;
    dup.start.copy(this.start);
    dup.end.copy(this.end);
    dup.normalDirection.copy(this.normalDirection);
    dup.segment = this.segment;
    dup.rotation = this.rotation;
    dup.frontHalf.rotation = this.frontHalf.rotation;
    dup.backHalf.rotation = this.backHalf.rotation;

    dup.frontHalf.vertices.forEach((v, pos) => {
      v.copy(this.frontHalf.vertices[pos]);
    });
    dup.backHalf.vertices.forEach((v, pos) => {
      v.copy(this.backHalf.vertices[pos]);
    });
    return dup as this;
  }

  addToLayers(layers: Two.Group[]): void {
    this.frontHalf.addTo(layers[LAYER.foreground]);
    // Copy the group rotation to individual group member
    this.frontHalf.rotation = this.rotation;
    if (!this.isSegment) {
      this.backHalf.addTo(layers[LAYER.background]);

      this.backHalf.rotation = this.rotation;
    }
  }
  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontHalf.remove();
    if (!this.isSegment) this.backHalf.remove();
  }
}
