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
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();
const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
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
  private mid: Vector3;
  private end: Vector3;
  // public name = "";
  private oldFrontStroke: Two.Color = "";
  private oldBackStroke: Two.Color = "";
  private normalDirection: Vector3;

  // const desiredZAxis = new Vector3();
  private transformMatrix = new Matrix4();
  private frontHalf: Two.Path;
  private frontExtra: Two.Path;
  private backHalf: Two.Path;
  private backExtra: Two.Path;
  private arcLen = 0;

  constructor(start?: Vector3, mid?: Vector3, end?: Vector3) {
    super();
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

    this.frontExtra = this.frontHalf.clone();
    this.frontExtra.vertices.clear();

    // Create the back half circle by cloning the front half
    this.backHalf = this.frontHalf.clone();
    this.backHalf.stroke = "gray";
    (this.backHalf as any).dashes.push(10, 5); // render as dashed lines
    this.backHalf.linewidth = SETTINGS.line.thickness.back;
    this.backHalf.noFill();
    this.backExtra = this.backHalf.clone();
    this.backExtra.vertices.clear();
    (this.backExtra as any).dashes.push(10, 5); // render as dashed lines
    this.backExtra.linewidth = SETTINGS.line.thickness.back;

    this.add(this.backHalf, this.backExtra, this.frontHalf, this.frontExtra);
    // Be sure to clone() the incoming start and end points
    // Otherwise update by other Line will affect this one!
    if (start) this.start = start.clone();
    else this.start = new Vector3(1, 0, 0);
    if (end) this.end = end.clone();
    else this.end = new Vector3(0, 1, 0);
    if (mid) this.mid = mid.clone();
    else this.mid = new Vector3(0.5, 0.5, 0);
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
    // Avoid the degenerate case when the normalDirection is "zero"
    if (this.normalDirection.length() < 0.01) return;

    // angleTo() seems to return the smaller angle between two vectors
    // To get arc length > 180 we measure it with a break at midpoint
    // and sum the SIGNED length of each.
    tmpVector1.crossVectors(this.start, this.mid);
    const angle1 = this.start.angleTo(this.mid) * Math.sign(tmpVector1.z);
    tmpVector1.crossVectors(this.mid, this.end);
    const angle2 = this.mid.angleTo(this.end) * Math.sign(tmpVector1.z);
    const arcLen = angle1 + angle2;

    // Use the start of segment as the X-axis so the start point
    // is at zero degrees
    desiredXAxis
      .copy(this.start)
      // .set(-this.normalDirection.y, this.normalDirection.x, 0)
      .normalize();
    desiredYAxis.crossVectors(this.normalDirection, desiredXAxis);

    // Create the rotation matrix that maps the tilted circle to the unit
    // circle on the XY-plane
    this.transformMatrix.makeBasis(
      desiredXAxis,
      desiredYAxis,
      this.normalDirection // The normal direction of the circle plane
    );
    const toPos = []; // Remember the indices of neg-to-pos crossing
    const toNeg = []; // Remember the indices of pos-to-neg crossing
    let posIndex = 0;
    let negIndex = 0;
    let lastSign = 0;

    // Bring all the anchor points to a common pool
    // Each half (and extra) path will pull anchor points from
    // this pool as needed
    const pool: Two.Anchor[] = [];
    pool.push(...this.frontHalf.vertices.splice(0));
    pool.push(...this.frontExtra.vertices.splice(0));
    pool.push(...this.backHalf.vertices.splice(0));
    pool.push(...this.backExtra.vertices.splice(0));

    // We begin with the "main" paths as the current active paths
    // As we find additional zero-crossing, we then switch to the
    // "extra" paths
    let activeFront = this.frontHalf.vertices;
    let activeBack = this.backHalf.vertices;
    for (let pos = 0; pos < 2 * SUBDIVS; pos++) {
      const angle = (pos / (2 * SUBDIVS - 1)) * Math.abs(arcLen);
      tmpVector1
        .set(Math.cos(angle), Math.sin(angle), 0)
        .multiplyScalar(SETTINGS.boundaryCircle.radius);
      tmpVector1.applyMatrix4(this.transformMatrix);
      const thisSign = Math.sign(tmpVector1.z);

      // CHeck for zero-crossing
      if (lastSign !== thisSign) {
        // We have a zero crossing
        if (thisSign > 0) {
          // If we already had a positive crossing
          // The next chunk is a split front half
          if (toPos.length > 0) {
            activeFront = this.frontExtra.vertices;
            posIndex = 0;
          }
          toPos.push(pos);
        }
        // If we already had a negative crossing
        // The next chunk is a split back half
        if (thisSign < 0) {
          if (toNeg.length > 0) {
            activeBack = this.backExtra.vertices;
            negIndex = 0;
          }
          toNeg.push(pos);
        }
      }
      lastSign = thisSign;
      if (tmpVector1.z > 0) {
        if (posIndex === activeFront.length) {
          // transfer one cell from the common pool
          activeFront.push(pool.pop()!);
        }
        activeFront[posIndex].x = tmpVector1.x;
        activeFront[posIndex].y = tmpVector1.y;
        posIndex++;
      } else {
        if (negIndex === activeBack.length) {
          // transfer one cell from the common pool
          activeBack.push(pool.pop()!);
        }
        activeBack[negIndex].x = tmpVector1.x;
        activeBack[negIndex].y = tmpVector1.y;
        negIndex++;
      }
    }
  }

  set startPoint(position: Vector3) {
    this.start.copy(position).normalize();
    // The circle plane passes through three points the origin (0,0,0)
    // and the two points (start (S) and end (E)).
    // The normal of this plane is the cross product of SxE
    tmpVector1.crossVectors(this.start, this.mid).normalize();
    tmpVector2.crossVectors(this.mid, this.end).normalize();
    this.normalDirection.addVectors(tmpVector1, tmpVector2).normalize();
    // this.normalDirection.crossVectors(this.start, this.end).normalize();
    // Be sure the normal direction is pointing towards the viewer
    // if (this.normalDirection.z < 0) this.normalDirection.multiplyScalar(-1);
    this.deformIntoEllipse();
    // this.deformIn2D();
  }

  get startPoint(): Vector3 {
    return this.start;
  }

  set midPoint(position: Vector3) {
    this.mid.copy(position).normalize();
    tmpVector1.crossVectors(this.start, this.mid).normalize();
    tmpVector2.crossVectors(this.mid, this.end).normalize();
    this.normalDirection.addVectors(tmpVector1, tmpVector2).normalize();
  }

  get midPoint(): Vector3 {
    return this.mid;
  }

  set endPoint(position: Vector3) {
    this.end.copy(position).normalize();
    tmpVector1.crossVectors(this.start, this.mid).normalize();
    tmpVector2.crossVectors(this.mid, this.end).normalize();
    this.normalDirection.addVectors(tmpVector1, tmpVector2).normalize();
    // this.normalDirection.crossVectors(this.start, this.end).normalize();
    // Be sure the normal direction is pointing towards the viewer
    // if (this.normalDirection.z < 0) this.normalDirection.multiplyScalar(-1);
    this.deformIntoEllipse();
  }

  get endPoint(): Vector3 {
    return this.end;
  }

  set orientation(dir: Vector3) {
    this.normalDirection.copy(dir).normalize();
    tmpVector1.crossVectors(this.normalDirection, dir);
    const rotAngle = this.normalDirection.angleTo(dir);
    // this.deformIn2D();
    tmpMatrix.makeRotationAxis(tmpVector1, rotAngle);
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
    dup.mid.copy(this.mid);
    dup.end.copy(this.end);
    dup.normalDirection.copy(this.normalDirection);
    const pool: Two.Anchor[] = [];
    pool.push(...dup.frontHalf.vertices.splice(0));
    pool.push(...dup.backHalf.vertices.splice(0));

    this.frontHalf.vertices.forEach((v, pos: number) => {
      dup.frontHalf.vertices.push(pool.pop()!);
      dup.frontHalf.vertices[pos].copy(v);
    });
    this.frontExtra.vertices.forEach((v, pos: number) => {
      dup.frontExtra.vertices.push(pool.pop()!);
      dup.frontExtra.vertices[pos].copy(v);
    });
    this.backHalf.vertices.forEach((v, pos: number) => {
      dup.backHalf.vertices.push(pool.pop()!);
      dup.backHalf.vertices[pos].copy(v);
    });
    this.backExtra.vertices.forEach((v, pos: number) => {
      dup.backExtra.vertices.push(pool.pop()!);
      dup.backExtra.vertices[pos].copy(v);
    });
    return dup as this;
  }

  addToLayers(layers: Two.Group[]): void {
    this.frontHalf.addTo(layers[LAYER.foreground]);
    this.frontExtra.addTo(layers[LAYER.foreground]);
    this.backHalf.addTo(layers[LAYER.background]);
    this.backExtra.addTo(layers[LAYER.background]);
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontHalf.remove();
    this.frontExtra.remove();
    this.backHalf.remove();
    this.backExtra.remove();
  }
}
