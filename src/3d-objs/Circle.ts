/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS from "@/global-settings";
// import Arrow from "./Arrow";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const transformMatrix = new Matrix4();
const SUBDIVISIONS = 50;

/**
 * For drawning surface circle
 */
export default class Circle extends Two.Group {
  private center_: Vector3; // Can't use "center", name conflict with TwoJS
  private outer: Vector3;
  public name = "";
  private frontHalf: Two.Path;
  private backHalf: Two.Path;
  private tmpVector: Vector3; // for temporary calculation
  private tmpMatrix: Matrix4; // for temporary calculation
  private originalVertices: Vector2[];
  constructor(center?: Vector3, outer?: Vector3) {
    super();
    const frontVertices: Two.Vector[] = [];
    const backVertices: Two.Vector[] = [];
    for (let k = 0; k < SUBDIVISIONS; k++) {
      const angle = (k * Math.PI) / SUBDIVISIONS; // [0, pi)
      frontVertices.push(
        new Two.Vector(
          SETTINGS.sphere.radius * Math.cos(angle),
          SETTINGS.sphere.radius * Math.sin(angle)
        )
      );
      backVertices.push(
        new Two.Vector(
          SETTINGS.sphere.radius * Math.cos(angle + Math.PI), // [pi, 2*pi)
          SETTINGS.sphere.radius * Math.sin(angle + Math.PI)
        )
      );
    }
    this.frontHalf = new Two.Path(frontVertices, false, false);
    this.backHalf = new Two.Path(backVertices, false, false);
    this.add(this.backHalf);
    this.add(this.frontHalf);
    this.originalVertices = [];
    frontVertices.forEach(v => {
      this.originalVertices.push(new Vector2(v.x, v.y));
    });
    backVertices.forEach(v => {
      this.originalVertices.push(new Vector2(v.x, v.y));
    });
    this.noFill();
    this.frontHalf.linewidth = 4;
    this.backHalf.linewidth = 2;
    // draw the backhalf using dashed line
    (this.backHalf as any).dashes.push(10, 5);
    this.center_ = center || new Vector3(0, 0, 0);
    this.outer = outer || new Vector3(1, 0, 0);
    this.tmpVector = new Vector3();
    this.tmpMatrix = new Matrix4();
    this.name = "Circle-" + this.id;
  }

  // TODO: split the circle into front and back semicircles
  private readjust() {
    const sphereRadius = SETTINGS.sphere.radius; // in pixels
    // The vector to the circle center is ALSO the normal direction of the circle
    desiredZAxis.copy(this.center_).normalize();
    desiredYAxis.crossVectors(this.outer, this.center_).normalize();
    desiredXAxis.crossVectors(desiredYAxis, desiredZAxis);

    // Set up the local coordinate from for the circle
    transformMatrix.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);
    const angle = this.center_.angleTo(this.outer);
    // project the arc length on the sphere to the circle
    const ringRadius = Math.sin(angle);
    // The circle plane is below the tangent plane
    const distanceFromOrigin = Math.cos(angle);

    // translate along the Z of the local coord frame
    this.tmpMatrix.makeTranslation(0, 0, distanceFromOrigin * sphereRadius);
    transformMatrix.multiply(this.tmpMatrix);
    // scale the circle on the XY-plane of the local coord frame
    this.tmpMatrix.makeScale(ringRadius, ringRadius, 1);
    transformMatrix.multiply(this.tmpMatrix);

    // Recalculate the 2D coordinate of the TwoJS path
    // As we drag the mouse, the number of vertices in the front half
    // and back half are dynamically changing and to avoid
    // allocating and de-allocating arrays, we dynamically transfers
    // elements between the two

    let posIndex = 0;
    let negIndex = 0;
    let frontLen = this.frontHalf.vertices.length;
    let backLen = this.backHalf.vertices.length;
    let firstNeg = -1;
    let firstPos = -1;
    this.originalVertices.forEach((v, pos) => {
      this.tmpVector.set(v.x, v.y, 0);
      this.tmpVector.applyMatrix4(transformMatrix);

      // When the Z-coordinate is negative, the vertex belongs the
      // the back semi circle
      if (this.tmpVector.z > 0) {
        if (firstPos === -1) firstPos = pos;
        if (posIndex >= frontLen) {
          // Steal one element from the backHalf
          const extra = this.backHalf.vertices.pop();
          this.frontHalf.vertices.push(extra!);
          backLen--;
          frontLen++;
        }
        this.frontHalf.vertices[posIndex].x = this.tmpVector.x;
        this.frontHalf.vertices[posIndex].y = this.tmpVector.y;
        posIndex++;
      } else {
        if (firstNeg === -1) firstNeg = pos;
        if (negIndex >= backLen) {
          // Steal one element from the frontHalf
          const extra = this.frontHalf.vertices.pop();
          this.backHalf.vertices.push(extra!);
          frontLen--;
          backLen++;
        }
        negIndex++;
      }
    });
    console.debug(
      `First negative at ${firstNeg} length ${backLen}, first positive at ${firstPos} length ${frontLen}`
    );
    if (backLen == 0) this.frontHalf.closed = true;
    else {
      // FIXME: back half is broken when moving the mouse near the upper left
      // or upper right arc of the boundary circle
      this.frontHalf.closed = false;
      this.backHalf.closed = false;
      if (firstPos !== 0 && firstPos < backLen) {
        // the negative vertices (Z-val < 0) are split into two
        // non-consecutive groups (separated by positive vertices)
        // The first negative  group is at indices [0, firstPos)
        // The second negative group starts at index firstPos + frontLen
        // Rearrange the negative vertices to remove this gap
        for (let k = 0; k < backLen; k++) {
          const index =
            (firstPos + frontLen + k) % this.originalVertices.length;
          this.tmpVector.set(
            this.originalVertices[index].x,
            this.originalVertices[index].y,
            0
          );
          this.tmpVector.applyMatrix4(transformMatrix);
          this.backHalf.vertices[k].x = this.tmpVector.x;
          this.backHalf.vertices[k].y = this.tmpVector.y;
        }
      }

      if (firstNeg !== 0 && firstNeg < frontLen) {
        // the positive vertices (Z-val > 0) are split into two
        // non-consecutive groups
        for (let k = 0; k < frontLen; k++) {
          const index = (firstNeg + backLen + k) % this.originalVertices.length;
          this.tmpVector.set(
            this.originalVertices[index].x,
            this.originalVertices[index].y,
            0
          );
          this.tmpVector.applyMatrix4(transformMatrix);
          this.frontHalf.vertices[k].x = this.tmpVector.x;
          this.frontHalf.vertices[k].y = this.tmpVector.y;
        }
      }
    }
  }

  set centerPoint(position: Vector3) {
    this.center_.copy(position);
    this.readjust();
  }

  set circlePoint(position: Vector3) {
    this.outer.copy(position);
    this.readjust();
  }

  clone(): this {
    const dup = new Circle(this.center_, this.outer);
    dup.rotation = this.rotation;
    dup.translation.copy(this.translation);

    // The clone has equal nunber of vertices for the front and back halves
    while (dup.frontHalf.vertices.length > this.frontHalf.vertices.length) {
      // Transfer from fronthalf to backhalf
      dup.backHalf.vertices.push(dup.frontHalf.vertices.pop()!);
    }
    while (dup.backHalf.vertices.length > this.backHalf.vertices.length) {
      // Transfer from backHalf to fronthalf
      dup.frontHalf.vertices.push(dup.backHalf.vertices.pop()!);
    }
    dup.frontHalf.vertices.forEach((v, pos) => {
      v.copy(this.frontHalf.vertices[pos]);
    });
    dup.backHalf.vertices.forEach((v, pos) => {
      v.copy(this.backHalf.vertices[pos]);
    });
    //   dup.scale.copy(this.scale);
    return dup as this;
  }
}
