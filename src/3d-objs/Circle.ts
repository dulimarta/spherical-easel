/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS from "@/global-settings";
// import Arrow from "./Arrow";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const transformMatrix = new Matrix4();
const SUBDDIVISIONS = 120;

/**
 * For drawning surface circle
 */
export default class Circle extends Two.Path {
  private center_: Vector3; // Can't use "center", name conflict with TwoJS
  private outer: Vector3;

  private tmpVector: Vector3; // for temporary calculation
  private tmpMatrix: Matrix4; // for temporary calculation
  private vtx: Vector2[];
  constructor(center?: Vector3, outer?: Vector3) {
    const vertices: Two.Vector[] = [];

    for (let k = 0; k < SUBDDIVISIONS; k++) {
      const angle = (2 * k * Math.PI) / 120;
      vertices.push(
        new Two.Vector(
          SETTINGS.sphere.radius * Math.cos(angle),
          SETTINGS.sphere.radius * Math.sin(angle)
        )
      );
    }
    super(vertices, true, false);
    this.vtx = vertices.map(v => new Vector2(v.x, v.y));
    this.noFill();
    this.linewidth = 4;
    (this as any).dashes.push(10, 5);
    this.center_ = center || new Vector3(0, 0, 0);
    this.outer = outer || new Vector3(1, 0, 0);
    this.tmpVector = new Vector3();
    this.tmpMatrix = new Matrix4();
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
    this.vertices.forEach((v, pos) => {
      this.tmpVector.set(this.vtx[pos].x, this.vtx[pos].y, 0);
      this.tmpVector.applyMatrix4(transformMatrix);
      v.x = this.tmpVector.x;
      v.y = -this.tmpVector.y;
    });
  }

  set centerPoint(position: Vector3) {
    this.center_.copy(position);
    this.readjust();
  }

  set circlePoint(position: Vector3) {
    this.outer.copy(position);
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
