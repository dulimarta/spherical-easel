/** @format */

import { Vector3, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS from "@/global-settings";
import Point from "./Point";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const transformMatrix = new Matrix4();
const NegXAxis = new Vector3(-1, 0, 0);

const SUBDIVS = 100;
/**
 * Geodesic line on a circle
 *
 * @export
 * @class Line
 * @extends {Mesh}
 */
export default class Line extends Two.Group {
  private start: Vector3;
  private end: Vector3;
  public normalDirection: Vector3;

  private majorAxisDirection: Vector3 = new Vector3();
  private tmpVector: Vector3;
  private segment: boolean;
  private frontHalf: Two.Path;
  private backHalf: Two.Path;
  private points: Vector3[];
  constructor(start?: Vector3, end?: Vector3, segment?: boolean) {
    super();
    const radius = SETTINGS.sphere.radius;
    const vertices: Two.Vector[] = [];
    // Generate 2D coordinates of a half circle
    for (let k = 0; k < SUBDIVS; k++) {
      const angle = (k * Math.PI) / SUBDIVS;
      const px = radius * Math.cos(angle);
      const py = radius * Math.sin(angle);
      vertices.push(new Two.Vector(px, py));
    }
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
    this.start = start || new Vector3(1, 0, 0);
    this.end = end || new Vector3(0, 1, 0);
    this.normalDirection = new Vector3();
    this.segment = segment || false;
    // this.scaleVector = new Two.Vector(1, 1);
    this.add(this.frontHalf);
    if (!segment) {
      // FIXME: how to handle segments longer than 180 degrees?
      // Line segment does not a back semicircle
      this.add(this.backHalf);
    }
    this.noFill();
  }

  deformIn2D() {
    // The circle plane passes through three points the origin (0,0,0)
    // and the two points (start (S) and end (E)). The normal of this plane
    // is the cross product of SxE
    console.debug(
      "Start",
      this.start.x.toFixed(2),
      this.start.y.toFixed(2),
      this.start.z.toFixed(2)
    );
    console.debug(
      "End",
      this.end.x.toFixed(2),
      this.end.y.toFixed(2),
      this.end.z.toFixed(2)
    );

    this.normalDirection.crossVectors(this.start, this.end).normalize();

    // The ellipse major axis on the XY plane is perpendicular
    // to the circle normal [Nx,Ny,Nz]. We can fix the direction of
    // the major axis to [-Ny,Nx, 0] (pointing "left") and use these numbers to compute the angle
    this.majorAxisDirection
      .set(-this.normalDirection.y, this.normalDirection.x, 0)
      .normalize();

    // this.leftMarker.positionOnSphere = this.majorAxisDirection;
    const angleToMajorAxis = Math.atan2(
      this.majorAxisDirection.y,
      this.majorAxisDirection.x
    );
    console.debug("Angle of major axis", angleToMajorAxis);
    this.rotation = angleToMajorAxis;

    // Calculate the length of its minor axes from the non-rotated ellipse
    const cosAngle = Math.cos(angleToMajorAxis); // cos(-x) = cos(x)
    const sinAngle = Math.sin(-angleToMajorAxis);
    // (Px,Py) is the projected start point of the non-rotated ellipse
    // apply the reverse rotation to the start point
    const px = cosAngle * this.start.x - sinAngle * this.start.y;
    const py = sinAngle * this.start.x + cosAngle * this.start.y;

    // Use ellipse equation to compute minorAxis given than majorAxis is 1
    const minorAxis = Math.sqrt((py * py) / (1 - px * px));
    let numSubdivs = this.frontHalf.vertices.length;
    const radius = SETTINGS.sphere.radius;
    // When the Z-value is negative, the front semicircle
    // is projected above the back semicircle
    const flipSign = Math.sign(this.normalDirection.z);
    if (this.segment) {
      // FIXME: the position or arc end points are not accurate
      // Readjust arc length

      const startAngle = this.majorAxisDirection.angleTo(this.start);
      const totalArcLength = this.start.angleTo(this.end);
      // TODO: how to handle length > 180 degrees
      this.frontHalf.vertices.forEach((v, pos) => {
        const angle = startAngle + (pos * totalArcLength) / numSubdivs;
        // Don't need flipSign here because cos(-alpha) = cos(alpha)
        v.x = radius * Math.cos(angle);

        // When flipSign (Z-coord of the circle normal) is negative
        // the semicircle must be reflected onto the Y-axis
        v.y = minorAxis * radius * Math.sin(flipSign * angle);
      });
    } else {
      // reposition all vertices of the front semicircle
      this.frontHalf.vertices.forEach((v, pos) => {
        const angle = (flipSign * (pos * Math.PI)) / numSubdivs;
        v.x = radius * Math.cos(angle);
        v.y = minorAxis * radius * Math.sin(angle);
      });
      // reposition all vertices of the back semicircle
      numSubdivs = this.backHalf.vertices.length;
      this.backHalf.vertices.forEach((v, pos) => {
        const angle = (flipSign * (pos * Math.PI)) / numSubdivs;
        v.x = radius * Math.cos(angle);
        v.y = -minorAxis * radius * Math.sin(angle);
      });
    }
  }

  private deformIntoEllipse() {
    desiredZAxis.crossVectors(this.start, this.end).normalize();
    desiredXAxis.copy(this.start).normalize();
    desiredYAxis.crossVectors(desiredZAxis, desiredXAxis);
    transformMatrix.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);
    let firstPos = -1;
    let firstNeg = -1;
    let lastSign = 0;

    this.points.forEach((v, pos) => {
      this.tmpVector.copy(v);
      this.tmpVector.applyMatrix4(transformMatrix);
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
          Math.cos(angle) * SETTINGS.sphere.radius,
          Math.sin(angle) * SETTINGS.sphere.radius,
          0
        );
        this.tmpVector.applyMatrix4(transformMatrix);
        v.x = this.tmpVector.x;
        v.y = this.tmpVector.y;
      });
    } else {
      for (let k = 0; k < SUBDIVS; k++) {
        const idx = (firstPos + k) % (2 * SUBDIVS);
        this.tmpVector.copy(this.points[idx]);
        this.tmpVector.applyMatrix4(transformMatrix);
        this.frontHalf.vertices[k].x = this.tmpVector.x;
        this.frontHalf.vertices[k].y = this.tmpVector.y;
      }
      for (let k = 0; k < SUBDIVS; k++) {
        const idx = (firstNeg + k) % (2 * SUBDIVS);
        this.tmpVector.copy(this.points[idx]);
        this.tmpVector.applyMatrix4(transformMatrix);
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

  set startPoint(position: Vector3) {
    this.start.copy(position);
    // this.deformIntoEllipse();
    this.deformIn2D();
  }

  set endPoint(position: Vector3) {
    this.end.copy(position);
    // this.deformIntoEllipse();
    this.deformIn2D();
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
