import { Vector3, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule from "./Nodule";

const SUBDIVS = 20;
// The following lines are for debugging only
const majorAxis: Two.Line = new Two.Line(
  0,
  0,
  SETTINGS.boundaryCircle.radius,
  0
);
const minorAxis: Two.Line = new Two.Line(
  0,
  0,
  0,
  SETTINGS.boundaryCircle.radius / 2
);
// For debugging only
// Major axis is along the X-axis

majorAxis.stroke = "red";
majorAxis.linewidth = 5;
// Minor axis is along the Y-axis
minorAxis.stroke = "green";
minorAxis.linewidth = 3;

const tmpMatrix = new Matrix4();
// const XAxis = new Vector3(1, 0, 0);
/**
 * Geodesic line on a circle
 *
 * @export
 * @class Segment
 * @extends {Two.Group}
 */
export default class Segment extends Nodule {
  // Declare owner as non-null, this field will be initialized by the associated owner
  // public owner?: SELine | null = null;
  private start: Vector3;
  private end: Vector3;
  // public name = "";
  private oldFrontStroke: Two.Color = "";
  private oldBackStroke: Two.Color = "";
  private normalDirection: Vector3;

  private tmpVector: Vector3;
  private desiredXAxis = new Vector3();
  private desiredYAxis = new Vector3();
  // const desiredZAxis = new Vector3();
  private transformMatrix = new Matrix4();
  private frontHalf: Two.Path;
  private frontArcLen = 0;
  private backHalf: Two.Path;
  private backArcLen = 0;
  private arcLen = 0;

  constructor(start?: Vector3, end?: Vector3) {
    super();
    this.tmpVector = new Vector3();
    const vertices: Two.Vector[] = [];
    for (let k = 0; k < SUBDIVS; k++) {
      vertices.push(new Two.Vector(0, 0));
    }
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
    if (start) this.start = start.clone();
    else this.start = new Vector3(1, 0, 0);
    if (end) this.end = end.clone();
    else this.end = new Vector3(0, 1, 0);
    this.normalDirection = new Vector3(0, 0, 1);
    // The back half will be dynamically added to the group
    this.name = "Segment-" + this.id;

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
    this.tmpVector.set(-this.normalDirection.y, this.normalDirection.x, 0);
    const startAngle = this.tmpVector.angleTo(this.start);
    const endAngle = this.tmpVector.angleTo(this.end);
    console.debug(
      `Arc start at ${startAngle.toDegrees().toFixed(0)}` +
        ` end at ${endAngle.toDegrees().toFixed(0)}`
    );
    this.desiredXAxis
      .copy(this.start)
      // .set(-this.normalDirection.y, this.normalDirection.x, 0)
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

    for (let pos = 0; pos < 2 * SUBDIVS; pos++) {
      const angle =
        ((pos * this.arcLen) / (2 * SUBDIVS - 1)) *
        Math.sign(endAngle - startAngle);
      this.tmpVector
        .set(Math.cos(angle), Math.sin(angle), 0)
        .multiplyScalar(SETTINGS.boundaryCircle.radius);
      this.tmpVector.applyMatrix4(this.transformMatrix);
      const thisSign = Math.sign(this.tmpVector.z);
      if (lastSign !== thisSign) {
        // We have a zero crossing
        if (thisSign > 0) firstPos = pos;
        if (thisSign < 0) firstNeg = pos;
      }
      lastSign = thisSign;
      if (this.tmpVector.z > 0) {
        if (posIndex == this.frontHalf.vertices.length) {
          // transfer one cell from backhalf to fronthalf
          console.debug("Transfer from back to front");
          this.frontHalf.vertices.push(this.backHalf.vertices.pop()!);
        }
        this.frontHalf.vertices[posIndex].x = this.tmpVector.x;
        this.frontHalf.vertices[posIndex].y = this.tmpVector.y;
        posIndex++;
      } else {
        if (negIndex === this.backHalf.vertices.length) {
          // transfer one cell from fronthalf to backhalf
          console.debug("Transfer from front to back");
          this.backHalf.vertices.push(this.frontHalf.vertices.pop()!);
        }
        this.backHalf.vertices[negIndex].x = this.tmpVector.x;
        this.backHalf.vertices[negIndex].y = this.tmpVector.y;
        negIndex++;
      }
    }
    if (0 < firstPos && firstPos < SUBDIVS) {
      // Gap in backhalf
      this.backHalf.vertices.rotate(firstPos);
    }
    if (0 < firstNeg && firstNeg < SUBDIVS) {
      // Gap in fronthalf
      this.frontHalf.vertices.rotate(firstNeg);
    }
  }

  set startPoint(position: Vector3) {
    this.start.copy(position).normalize();
    this.arcLen = this.start.angleTo(this.end);
    // The circle plane passes through three points the origin (0,0,0)
    // and the two points (start (S) and end (E)).
    // The normal of this plane is the cross product of SxE
    this.normalDirection.crossVectors(this.start, this.end).normalize();
    // Be sure the normal direction is pointing towards the viewer
    if (this.normalDirection.z < 0) this.normalDirection.multiplyScalar(-1);
    this.deformIntoEllipse();
    // this.deformIn2D();
  }

  get startPoint(): Vector3 {
    return this.start;
  }

  set endPoint(position: Vector3) {
    this.end.copy(position).normalize();
    this.arcLen = this.start.angleTo(this.end);
    this.normalDirection.crossVectors(this.start, this.end).normalize();
    // Be sure the normal direction is pointing towards the viewer
    if (this.normalDirection.z < 0) this.normalDirection.multiplyScalar(-1);
    this.deformIntoEllipse();
    // this.deformIn2D();
  }

  get endPoint(): Vector3 {
    return this.end;
  }

  set orientation(dir: Vector3) {
    this.normalDirection.copy(dir).normalize();
    this.tmpVector.crossVectors(this.normalDirection, dir);
    const rotAngle = this.normalDirection.angleTo(dir);
    // this.deformIn2D();
    tmpMatrix.makeRotationAxis(this.tmpVector, rotAngle);
    this.deformIntoEllipse();
    this.start.applyMatrix4(tmpMatrix);
    this.end.applyMatrix4(tmpMatrix);
  }

  get orientation(): Vector3 {
    return this.normalDirection;
  }
  // It looks like we have to define our own clone() function
  // The builtin clone() does not seem to work correctly
  clone(): this {
    const dup = new Segment(this.start, this.end);
    dup.name = this.name;
    dup.start.copy(this.start);
    dup.end.copy(this.end);
    dup.normalDirection.copy(this.normalDirection);
    dup.frontArcLen = this.frontArcLen;
    dup.backArcLen = this.backArcLen;
    while (dup.frontHalf.vertices.length < this.frontHalf.vertices.length) {
      dup.frontHalf.vertices.push(dup.backHalf.vertices.pop()!);
    }
    dup.frontHalf.vertices.forEach((v, pos: number) => {
      v.copy(this.frontHalf.vertices[pos]);
    });
    while (dup.backHalf.vertices.length < this.backHalf.vertices.length) {
      dup.backHalf.vertices.push(dup.frontHalf.vertices.pop()!);
    }
    dup.backHalf.vertices.forEach((v, pos: number) => {
      v.copy(this.backHalf.vertices[pos]);
    });
    return dup as this;
  }

  addToLayers(layers: Two.Group[]): void {
    this.frontHalf.addTo(layers[LAYER.foreground]);
    this.backHalf.addTo(layers[LAYER.background]);
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontHalf.remove();
    this.backHalf.remove();
  }
}
