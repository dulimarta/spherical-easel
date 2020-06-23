import { Vector3, Matrix4 } from "three";
import Two from "two.js";
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
  // public name = "";
  private oldFrontStroke: Two.Color = "";
  private oldBackStroke: Two.Color = "";
  private normalDirection: Vector3;
  private start_ = new Vector3();
  private tmpVector: Vector3;
  private desiredXAxis = new Vector3();
  private desiredYAxis = new Vector3();
  private transformMatrix = new Matrix4();
  private frontHalf: Two.Path;
  private frontArcLen = 0;
  private backHalf: Two.Path;
  private backArcLen = 0;

  private points: Vector3[];

  // The following lines are for debugging only
  private majorAxis: Two.Line;
  private minorAxis: Two.Line;

  constructor() {
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
    this.frontHalf.linewidth = SETTINGS.line.thickness.front;
    this.frontHalf.stroke = "green";
    this.frontHalf.noFill();
    // Create the back half circle by cloning the front half
    this.backHalf = this.frontHalf.clone();
    this.backHalf.stroke = "gray";
    (this.backHalf as any).dashes.push(10, 5); // render as dashed lines
    this.backHalf.linewidth = SETTINGS.line.thickness.back;
    this.backHalf.noFill();
    this.add(this.backHalf, this.frontHalf);
    // Be sure to clone() the incoming start and end points
    // Otherwise update by other Line will affect this one!
    this.normalDirection = new Vector3();
    // this.normalDirection.crossVectors(this.start, this.end);
    // The back half will be dynamically added to the group
    this.name = "Line-" + this.id;

    // For debugging only
    // Major axis is along the X-axis
    this.majorAxis = new Two.Line(0, 0, SETTINGS.boundaryCircle.radius, 0);
    this.majorAxis.stroke = "red";
    this.majorAxis.linewidth = 5;
    // Minor axis is along the Y-axis
    this.minorAxis = new Two.Line(0, 0, 0, SETTINGS.boundaryCircle.radius / 2);
    this.minorAxis.stroke = "green";
    this.minorAxis.linewidth = 3;

    // Enable the following for debugging
    // this.add(this.majorAxis, this.minorAxis);
  }

  adjustSizeForZoom(factor: number): void {
    const newThickness = SETTINGS.line.thickness.front * factor;
    console.debug("Attempt to change line thickness to", newThickness);
    if (factor > 1)
      this.frontHalf.linewidth = Math.min(
        newThickness,
        SETTINGS.line.thickness.max
      );
    else
      this.frontHalf.linewidth = Math.max(
        newThickness,
        SETTINGS.line.thickness.min
      );
  }

  frontGlowStyle(): void {
    this.oldFrontStroke = this.frontHalf.stroke;
    this.frontHalf.stroke = "red";
  }

  backGlowStyle(): void {
    this.oldBackStroke = this.backHalf.stroke;
    this.backHalf.stroke = "red";
  }

  backNormalStyle(): void {
    this.backHalf.stroke = this.oldBackStroke;
  }

  frontNormalStyle(): void {
    this.frontHalf.stroke = this.oldFrontStroke;
  }

  normalStyle(): void {
    this.frontNormalStyle();
    this.backNormalStyle();
  }

  glowStyle(): void {
    this.frontGlowStyle();
    this.backGlowStyle();
  }

  /** Reorient the unit circle in 3D and then project the points to 2D
   */
  private deformIntoEllipse(): void {
    if (this.normalDirection.length() < 0.01) return;
    this.desiredXAxis
      .set(-this.normalDirection.y, this.normalDirection.x, 0)
      .normalize();
    this.desiredYAxis.crossVectors(this.normalDirection, this.desiredXAxis);
    this.transformMatrix.makeBasis(
      this.desiredXAxis,
      this.desiredYAxis,
      this.normalDirection
    );
    let firstPos = -1;
    let posIndex = 0;
    let firstNeg = -1;
    let negIndex = 0;
    let lastSign = 0;

    this.points.forEach((v, pos) => {
      this.tmpVector.copy(v);

      this.tmpVector.applyMatrix4(this.transformMatrix);
      const thisSign = Math.sign(this.tmpVector.z);
      if (lastSign !== thisSign) {
        // We have a zero crossing
        if (thisSign > 0) firstPos = pos;
        if (thisSign < 0) firstNeg = pos;
      }
      lastSign = thisSign;
      if (this.tmpVector.z > 0) {
        if (posIndex === this.frontHalf.vertices.length) {
          const extra = this.backHalf.vertices.pop();
          this.frontHalf.vertices.push(extra!);
        }
        this.frontHalf.vertices[posIndex].x = this.tmpVector.x;
        this.frontHalf.vertices[posIndex].y = this.tmpVector.y;
        posIndex++;
      } else {
        if (negIndex === this.backHalf.vertices.length) {
          const extra = this.frontHalf.vertices.pop();
          this.backHalf.vertices.push(extra!);
        }
        this.backHalf.vertices[negIndex].x = this.tmpVector.x;
        this.backHalf.vertices[negIndex].y = this.tmpVector.y;
        negIndex++;
      }
    });
    if (0 < firstPos && firstPos < SUBDIVS) {
      // Gap in backhalf
      this.backHalf.vertices.rotate(firstPos);
    }
    if (0 < firstNeg && firstNeg < SUBDIVS) {
      // Gap in fronthalf
      this.frontHalf.vertices.rotate(firstNeg);
    }
  }

  set orientation(dir: Vector3) {
    // console.debug(
    //   `Changing normal orientation of ${
    //     this.id
    //   } from ${this.normalDirection.toFixed(2)} to ${dir.toFixed(2)}`
    // );
    this.normalDirection.copy(dir).normalize();
    this.deformIntoEllipse();
  }

  get orientation(): Vector3 {
    return this.normalDirection;
  }

  set startPoint(pos: Vector3) {
    this.start_.copy(pos);
  }

  get startPoint(): Vector3 {
    return this.start_;
  }
  // It looks like we have to define our own clone() function
  // The builtin clone() does not seem to work correctly
  clone(): this {
    const dup = new Line();
    dup.name = this.name;
    // dup.start.copy(this.start);
    dup.normalDirection.copy(this.normalDirection);
    dup.rotation = this.rotation;
    dup.majorAxis.rotation = this.majorAxis.rotation;
    dup.minorAxis.rotation = this.minorAxis.rotation;
    dup.frontHalf.rotation = this.frontHalf.rotation;
    dup.backHalf.rotation = this.backHalf.rotation;
    dup.frontArcLen = this.frontArcLen;
    dup.backArcLen = this.backArcLen;
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
    // if (this.frontArcLen > 0 || !this.isSegment) {
    // Copy the group rotation to individual group member
    // this.frontHalf.rotation = this.rotation;
    // }
    this.backHalf.addTo(layers[LAYER.background]);
    // if (this.backArcLen > 0 || !this.isSegment) {
    // Copy the group rotation to individual group member
    // this.backHalf.rotation = this.rotation;
    // }
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontHalf.remove();
    this.backHalf.remove();
  }
}
