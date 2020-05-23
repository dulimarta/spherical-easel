/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
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
    this.deformIntoEllipse();
  }

  set endPoint(position: Vector3) {
    this.end.copy(position);
    this.deformIntoEllipse();
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
