/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule from "./Nodule";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const Z_AXIS = new Vector3(0, 0, 1);
const transformMatrix = new Matrix4();
const SUBDIVISIONS = 50;

/**
 * For drawing surface circle. A circle consists of two paths (front and back)
 * for a total of 2N subdivisions.
 * We initially assign the same number of segments/subdivisions to each path,
 * but as the circle is being deformed the number of subdivisions on each path
 * may change: longer path will hold more subdivision points (while keeping the
 * total points 2N so we don't create/remove new points)
 */
export default class Circle extends Nodule {
  private center_: Vector3; // Can't use "center", name conflict with TwoJS
  // private outer: Vector3;
  // arcRadius: the radius (in radiuans) as the user drag the mouse the
  // surface of the sphere
  private arcRadius = 1;
  // projectedRadius: the above radius projected to the circle plane
  private projectedRadius = 1;
  private frontHalf: Two.Path;
  private backHalf: Two.Path;
  private majorAxisDirection = new Vector3();
  private tmpVector: Vector3; // for temporary calculation
  private tmpMatrix: Matrix4; // for temporary calculation
  private originalVertices: Vector2[];
  private majorLine: Two.Line; // for debugging only

  constructor(center?: Vector3, arcRadius?: number) {
    super();
    // Line on the positive X-axis of the circle/ellipse
    this.majorLine = new Two.Line(0, 0, SETTINGS.boundaryCircle.radius, 0);
    this.add(this.majorLine);
    const frontVertices: Two.Vector[] = [];
    const backVertices: Two.Vector[] = [];
    for (let k = 0; k < SUBDIVISIONS; k++) {
      const angle = (k * Math.PI) / SUBDIVISIONS; // [0, pi)
      frontVertices.push(
        new Two.Vector(
          SETTINGS.boundaryCircle.radius * Math.cos(angle),
          SETTINGS.boundaryCircle.radius * Math.sin(angle)
        )
      );
      backVertices.push(
        new Two.Vector(
          SETTINGS.boundaryCircle.radius * Math.cos(angle + Math.PI), // [pi, 2*pi)
          SETTINGS.boundaryCircle.radius * Math.sin(angle + Math.PI)
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
    this.center_ = new Vector3(0, 0, 0);
    if (center) this.center_.copy(center);
    this.arcRadius = arcRadius || Math.PI / 4;
    this.projectedRadius = Math.sin(this.arcRadius);
    this.tmpVector = new Vector3();
    this.tmpMatrix = new Matrix4();
    this.name = "Circle-" + this.id;
  }

  // Using this algorithm, the frontHalf and backHalf are rendered correctly
  // but the center of the circle is off by several pixels
  private readjust() {
    const sphereRadius = SETTINGS.boundaryCircle.radius; // in pixels
    // The vector to the circle center is ALSO the normal direction of the circle
    // These three vectors will be stored in SECircle -- just copy them from there
    desiredZAxis.copy(this.center_).normalize();
    desiredXAxis.set(-this.center_.y, this.center_.x, 0).normalize();
    desiredYAxis.crossVectors(desiredZAxis, desiredXAxis);

    // Set up the local coordinate from for the circle
    transformMatrix.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);
    // The circle plane is below the tangent plane
    const distanceFromOrigin = Math.cos(this.arcRadius);

    // translate along the Z of the local coord frame
    this.tmpMatrix.makeTranslation(0, 0, distanceFromOrigin * sphereRadius);
    transformMatrix.multiply(this.tmpMatrix);
    // scale the circle on the XY-plane of the local coord frame
    this.tmpMatrix.makeScale(this.projectedRadius, this.projectedRadius, 1);
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
        this.backHalf.vertices[negIndex].x = this.tmpVector.x;
        this.backHalf.vertices[negIndex].y = this.tmpVector.y;
        negIndex++;
      }
    });
    // Rotate the array elements to remove gap
    if (firstNeg < firstPos && firstPos <= firstNeg + backLen) {
      // There is a gap in the back path
      this.backHalf.vertices.rotate(firstPos);
    } else if (firstPos < firstNeg && firstNeg <= firstPos + frontLen) {
      // There is a gap in the front path
      this.frontHalf.vertices.rotate(firstNeg);
    }

    // A halfpath becomes a closed path when the other half vanishes
    this.frontHalf.closed = backLen === 0;
    this.backHalf.closed = frontLen === 0;
  }

  set centerPoint(position: Vector3) {
    this.center_.copy(position);
    // this.arcRadius = this.center_.angleTo(this.outer);
    // project the arc length on the sphere to the circle
    // this.projectedRadius = Math.sin(this.arcRadius);
    this.readjust();
  }

  get centerPoint(): Vector3 {
    return this.center_;
  }

  set radius(arcLengthRadius: number) {
    this.arcRadius = arcLengthRadius;
    this.projectedRadius = Math.sin(arcLengthRadius);
    this.readjust();
  }

  // set circlePoint(position: Vector3) {
  //   this.outer.copy(position);
  //   this.arcRadius = this.center_.angleTo(this.outer);
  //   // project the arc length on the sphere to the circle

  //   this.projectedRadius = Math.sin(this.arcRadius);
  //   this.readjust();
  // }

  frontGlowStyle(): void {
    this.frontHalf.stroke = "red";
  }
  backGlowStyle(): void {
    this.backHalf.stroke = "red";
  }

  glowStyle(): void {
    this.frontGlowStyle();
    this.backGlowStyle();
  }

  frontNormalStyle(): void {
    this.frontHalf.stroke = "black";
  }

  backNormalStyle(): void {
    this.backHalf.stroke = "black";
  }

  normalStyle(): void {
    this.frontNormalStyle();
    this.backNormalStyle();
  }

  clone(): this {
    const dup = new Circle(this.center_, this.arcRadius);
    dup.rotation = this.rotation;
    dup.translation.copy(this.translation);
    dup.frontHalf.closed = this.frontHalf.closed;
    dup.frontHalf.rotation = this.frontHalf.rotation;
    dup.frontHalf.translation.copy(this.frontHalf.translation);
    dup.backHalf.closed = this.backHalf.closed;
    dup.backHalf.rotation = this.backHalf.rotation;
    dup.backHalf.translation.copy(this.backHalf.translation);
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

  addToLayers(layers: Two.Group[]): void {
    if (this.frontHalf.vertices.length > 0) {
      this.frontHalf.addTo(layers[LAYER.foreground]);
    }
    if (this.backHalf.vertices.length > 0)
      this.backHalf.addTo(layers[LAYER.background]);
  }
  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontHalf.remove();
    this.backHalf.remove();
  }
  adjustSizeForZoom(factor: number): void {
    throw new Error("Method not implemented.");
  }
}
