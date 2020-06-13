/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS from "@/global-settings";
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
  private outer: Vector3;
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

  constructor(center?: Vector3, outer?: Vector3) {
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
    this.center_ = center || new Vector3(0, 0, 0);
    this.outer = outer || new Vector3(1, 0, 0);
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

  /* Determine the elliptical shape of the (tilted) circle.
   * The algorithm below determines the rotation between
   * a circle parallel to the XY plane and the tilted circle
   * centered around the user selected point on the sphere.
   * We use XY-plane because it is parallel to the "image plane"
   * where we can measure true length of any distances.
   *
   * The axis of rotation that transforms the two circles is actually
   * the major axis of the ellipse on the XY-plane and its length
   * can be determined from the arc length radius between the center point
   * and the outer point of the circle on the sphere.
   *
   * The minor length of the ellipse is the cosine of the rotation angle.
   */
  private readjustNew() {
    // Major axis line for debugging only
    this.majorLine.vertices[1].x =
      this.projectedRadius * SETTINGS.boundaryCircle.radius;

    // how far is the circle from the origin (translated along the
    // circle normal)
    const distanceFromOrigin = Math.cos(this.arcRadius);
    this.tmpVector
      .copy(this.center_)
      .multiplyScalar(distanceFromOrigin * SETTINGS.boundaryCircle.radius);

    // Orthographic projection of the distance on the XY plane
    this.translation.set(this.tmpVector.x, this.tmpVector.y);

    // The ellipse major axis is actually the axis of rotation
    // to orient the circle and make it parallel with the XY-plane
    // Then the major length is the same as the projected radius
    this.tmpVector.copy(this.center_).normalize();
    this.majorAxisDirection.crossVectors(this.tmpVector, Z_AXIS).normalize();
    // The angle between the tilted circle and the XY-plane can be used
    // to calculate the minor length
    const tiltAngle = this.tmpVector.angleTo(Z_AXIS);
    const minorRadius = this.projectedRadius * Math.cos(tiltAngle);

    // Rotate the ellipse on the XY-plane
    const angleToMajorAxis = Math.atan2(
      this.majorAxisDirection.y,
      this.majorAxisDirection.x
    );
    // console.debug("Angle of major axis", angleToMajorAxis);
    if (Math.abs(angleToMajorAxis) < Math.PI / 2)
      this.rotation = angleToMajorAxis;
    else this.rotation = angleToMajorAxis + Math.PI;

    // Once we know the major length, minor length, and angleToMajorAxis
    // we can determine the 2D shape of the ellipse. But we have to split
    // the ellipse into its front half and its back half

    console.debug("Group rotation", angleToMajorAxis.toDegrees().toFixed(2));
    // Calculate the rotation matrix to may the circle on the XY plane
    // to the tilted circle
    transformMatrix.makeRotationAxis(this.majorAxisDirection, -tiltAngle);
    let posCount = 0;
    let negCount = 0;
    let frontLen = this.frontHalf.vertices.length;
    let backLen = this.backHalf.vertices.length;
    let firstNeg = -1;
    let firstPos = -1;
    let prevSign: number | null = null;

    // Adjust the number of points in the both semi circles
    // The angles generated  begins CCW at the negative X-axis
    // So it fills the lower-half (that will become the frontHalf) first
    // the upper half later becomes the backHalf
    for (let k = 0; k < 2 * SUBDIVISIONS; k++) {
      // start at Math.PI (negative X-axis)
      const angle = Math.PI + (k * Math.PI) / SUBDIVISIONS;
      this.tmpVector
        .set(
          Math.cos(angle) * this.projectedRadius,
          Math.sin(angle) * this.projectedRadius,
          distanceFromOrigin
        )
        .multiplyScalar(SETTINGS.boundaryCircle.radius);
      this.tmpVector.applyMatrix4(transformMatrix);
      if (this.tmpVector.z >= 0) {
        posCount++;
        if (posCount > frontLen) {
          // Transfer one point from backHalf to frontHalf
          this.frontHalf.vertices.push(this.backHalf.vertices.pop()!);
          frontLen++;
          backLen--;
        }
        if (prevSign && prevSign < 0) {
          firstPos = k;
        }
      } else {
        negCount++;
        if (negCount > backLen) {
          // Transfer one point from the frontHalf to backHalf
          this.backHalf.vertices.push(this.frontHalf.vertices.pop()!);
          backLen++;
          frontLen--;
        }
        if (prevSign && prevSign >= 0) {
          firstNeg = k;
        }
      }
      prevSign = Math.sign(this.tmpVector.z);
    }
    // console.debug(`First pos at ${firstPos} for ${frontLen} points`);
    // console.debug(`First neg at ${firstNeg} for ${backLen} points`);
    if (firstPos === -1) {
      // No negative points (all points are in the frontHalf)
      if (backLen == 0) firstPos = 0;
      else firstPos = (firstNeg + backLen) % (2 * SUBDIVISIONS);
      // console.debug(`First pos corrected to ${firstPos}`);
    }
    if (firstNeg === -1) {
      // No positive points (all points are in the backHalf)
      if (frontLen == 0) firstNeg = 0;
      else firstNeg = (firstPos + frontLen) % (2 * SUBDIVISIONS);
      // console.debug(`First neg corrected to ${firstNeg}`);
    }

    // FIXME: the following algorithm is not correct yet!
    this.frontHalf.vertices.forEach((v, pos) => {
      const angle = Math.PI + ((pos + firstPos) * Math.PI) / SUBDIVISIONS;
      v.x =
        this.projectedRadius * Math.cos(angle) * SETTINGS.boundaryCircle.radius;
      v.y = minorRadius * Math.sin(angle) * SETTINGS.boundaryCircle.radius;
    });
    // The front half is a closed curve when the backHalf vanishes
    this.frontHalf.closed = backLen === 0;

    this.backHalf.vertices.forEach((v, pos) => {
      const angle = Math.PI + ((pos + firstNeg) * Math.PI) / SUBDIVISIONS;
      v.x =
        this.projectedRadius * Math.cos(angle) * SETTINGS.boundaryCircle.radius;
      v.y = minorRadius * Math.sin(angle) * SETTINGS.boundaryCircle.radius;
    });
    // The back half is a closed curve when the frontHalf vanishes
    this.backHalf.closed = frontLen === 0;
  }

  set centerPoint(position: Vector3) {
    this.center_.copy(position);
    this.arcRadius = this.center_.angleTo(this.outer);
    // project the arc length on the sphere to the circle
    this.projectedRadius = Math.sin(this.arcRadius);
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

  set circlePoint(position: Vector3) {
    this.outer.copy(position);
    this.arcRadius = this.center_.angleTo(this.outer);
    // project the arc length on the sphere to the circle

    this.projectedRadius = Math.sin(this.arcRadius);
    this.readjust();
  }

  frontGlowStyle(): void {
    throw new Error("Method not implemented.");
  }
  backGlowStyle(): void {
    throw new Error("Method not implemented.");
  }
  frontNormalStyle(): void {
    throw new Error("Method not implemented.");
  }
  backNormalStyle(): void {
    throw new Error("Method not implemented.");
  }

  clone(): this {
    const dup = new Circle(this.center_, this.outer);
    dup.rotation = this.rotation;
    dup.translation.copy(this.translation);
    dup.frontHalf.closed = this.frontHalf.closed;
    dup.backHalf.closed = this.backHalf.closed;
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
    throw new Error("Method not implemented.");
  }
  removeFromLayers(/*layers: Two.Group[]*/): void {
    throw new Error("Method not implemented.");
  }
}
