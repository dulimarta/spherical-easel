import { Vector3, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";

const SUBDIVS = SETTINGS.segment.numPoints;

// Temporary ThreeJS objects for computing
const tmpMatrix = new Matrix4();
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();
const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();

/**
 * A line segment
 *
 * @export
 * @class Segment
 * @extends {Two.Group}
 */
export default class Segment extends Nodule {
  /** The start vector of the segment on the unit Sphere*/
  public start: Vector3;
  /** The midpoint vector of the segment on the unit Sphere */
  public mid: Vector3;
  /** The end vector of the segment on the unit Sphere*/
  public end: Vector3;
  /** A vector perpendicular to the plane containing the segment (unit vector)*/
  public normalDirection: Vector3;
  /** The arc length of the segment*/
  private arcLen = 0;

  /** A temporary matrix maps a segment in standard position to the current position so we can determine which points are on the back and which are on the front*/
  private transformMatrix = new Matrix4();

  /**
   * A line segment of length longer than \pi has two pieces on one face of the sphere (say the front)
   * and on piece on the other face of the sphere (say the back). This means that any line segment
   * can have two front parts or two back parts. The frontExtra and backExtra are variables to represent those
   * extra parts. There are glowing counterparts for each part.
   */
  private frontPart: Two.Path;
  private frontExtra: Two.Path;
  private backPart: Two.Path;
  private backExtra: Two.Path;
  private midMarker = new Two.Circle(0, 0, 5);
  private glowingFrontPart: Two.Path;
  private glowingFrontExtra: Two.Path;
  private glowingBackPart: Two.Path;
  private glowingBackExtra: Two.Path;

  /**
   * The styling variables for the drawn segment. The user can modify these.
   * Created with the Google Sheet "Segment Styling Code" in the "Set Drawn Variables" tab
   */
  // FRONT
  private strokeColorFront = SETTINGS.segment.drawn.strokeColor.front;
  private strokeWidthFront = SETTINGS.segment.drawn.strokeWidth.front;
  private opacityFront = SETTINGS.segment.drawn.opacity.front;
  private dashArrayFront = SETTINGS.segment.drawn.dashArray.front;
  private dashArrayOffsetFront = SETTINGS.segment.drawn.dashArray.offset.front;
  // BACK
  private strokeColorBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastStrokeColor(SETTINGS.segment.drawn.strokeColor.front)
    : SETTINGS.segment.drawn.strokeColor.back;
  private strokeWidthBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contractStrokeWidth(SETTINGS.segment.drawn.strokeWidth.front)
    : SETTINGS.segment.drawn.strokeWidth.back;
  private opacityBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastOpacity(SETTINGS.segment.drawn.opacity.front)
    : SETTINGS.segment.drawn.opacity.back;
  private dashArrayBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastDashArray(SETTINGS.segment.drawn.dashArray.front)
    : SETTINGS.segment.drawn.dashArray.back;
  private dashArrayOffsetBack = SETTINGS.segment.dynamicBackStyle
    ? Nodule.contrastDashArrayOffset(
        SETTINGS.segment.drawn.dashArray.offset.front
      )
    : SETTINGS.segment.drawn.dashArray.offset.back;

  constructor(start?: Vector3, mid?: Vector3, end?: Vector3) {
    // Name the segment and initialize the Two.Group
    super();
    //this.name = "Segment-" + this.id;

    // Create the vertices for the segment
    const vertices: Two.Vector[] = [];
    for (let k = 0; k < SUBDIVS; k++) {
      vertices.push(new Two.Vector(0, 0));
    }
    this.frontPart = new Two.Path(
      vertices,
      /* closed */ false,
      /* curve */ false
    );
    // Create the other parts cloning the front part
    this.glowingFrontPart = this.frontPart.clone();
    this.frontExtra = this.frontPart.clone();
    this.glowingFrontExtra = this.frontPart.clone();
    this.backPart = this.frontPart.clone();
    this.glowingBackPart = this.frontPart.clone();
    this.backExtra = this.backPart.clone();
    this.glowingBackExtra = this.backPart.clone();
    // Clear the vertices from the extra parts because they will be added later as they are exchanged from other parts

    // The clear() extension functio works only of JS Array, but
    // not on Two.JS Collection class. Use splice() instead.
    this.frontExtra.vertices.splice(0);
    this.glowingFrontExtra.vertices.splice(0);
    this.backExtra.vertices.splice(0);
    this.glowingBackExtra.vertices.splice(0);

    // Set the style that never changes -- Fill
    this.frontPart.noFill();
    this.glowingFrontPart.noFill();
    this.backPart.noFill();
    this.glowingBackPart.noFill();
    this.frontExtra.noFill();
    this.glowingFrontExtra.noFill();
    this.backExtra.noFill();
    this.glowingBackExtra.noFill();

    // Be sure to clone() the incoming start and end points
    // Otherwise update by other Line will affect this one!
    if (start) {
      this.start = start.clone();
    } else {
      this.start = new Vector3(1, 0, 0);
    }
    if (end) {
      this.end = end.clone();
    } else {
      this.end = new Vector3(0, 1, 0);
    }
    if (mid) {
      this.mid = mid.clone();
    } else {
      this.mid = new Vector3(0.5, 0.5, 0);
    }

    // Initialize the normal vector
    this.normalDirection = new Vector3(0, 0, 1);
    // The back half will be dynamically added to the group

    // For debugging
    this.midMarker.fill = "orange";

    // The segment is not initially glowing
    (this.frontPart as any).visible = true;
    (this.glowingFrontPart as any).visible = false;
    (this.backPart as any).visible = true;
    (this.glowingBackPart as any).visible = false;
    (this.frontExtra as any).visible = true;
    (this.glowingFrontExtra as any).visible = false;
    (this.backExtra as any).visible = true;
    (this.glowingBackExtra as any).visible = false;
  }

  // TODO: adjust size of frontextra, backextra and glowing parts use stylize("update")
  adjustSizeForZoom(factor: number): void {
    const newThickness = this.strokeWidthFront * factor;
    console.debug("Attempt to change line thickness to", newThickness);
    if (factor > 1)
      this.frontPart.linewidth = Math.min(
        newThickness,
        SETTINGS.segment.drawn.strokeWidth.max
      );
    else
      this.frontPart.linewidth = Math.max(
        newThickness,
        SETTINGS.segment.drawn.strokeWidth.min
      );
  }

  frontGlowingDisplay(): void {
    (this.frontPart as any).visible = true;
    (this.glowingFrontPart as any).visible = true;
    (this.frontExtra as any).visible = true;
    (this.glowingFrontExtra as any).visible = true;
  }

  backGlowingDisplay(): void {
    (this.backPart as any).visible = true;
    (this.glowingBackPart as any).visible = true;
    (this.backExtra as any).visible = true;
    (this.glowingBackExtra as any).visible = true;
  }

  backNormalDisplay(): void {
    (this.backPart as any).visible = true;
    (this.glowingBackPart as any).visible = false;
    (this.backExtra as any).visible = true;
    (this.glowingBackExtra as any).visible = false;
  }

  frontNormalDisplay(): void {
    (this.frontPart as any).visible = true;
    (this.glowingFrontPart as any).visible = false;
    (this.frontExtra as any).visible = true;
    (this.glowingFrontExtra as any).visible = false;
  }

  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }

  /**
   * Reorient the unit circle in 3D and then project the points to 2D
   * This method updates the TwoJS objects (frontPart, frontExtra, ...) for display
   */
  private deformIntoEllipse(): void {
    // Avoid the degenerate case when the normalDirection is "zero"
    if (this.normalDirection.length() < 0.01) return;
    this.upDateArcLength();
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
      this.normalDirection // The normal direction of the plane containing the segment
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
    pool.push(...this.frontPart.vertices.splice(0));
    pool.push(...this.frontExtra.vertices.splice(0));
    pool.push(...this.backPart.vertices.splice(0));
    pool.push(...this.backExtra.vertices.splice(0));
    const glowingPool: Two.Anchor[] = [];
    glowingPool.push(...this.glowingFrontPart.vertices.splice(0));
    glowingPool.push(...this.glowingFrontExtra.vertices.splice(0));
    glowingPool.push(...this.glowingBackPart.vertices.splice(0));
    glowingPool.push(...this.glowingBackExtra.vertices.splice(0));

    // We begin with the "main" paths as the current active paths
    // As we find additional zero-crossing, we then switch to the
    // "extra" paths
    let activeFront = this.frontPart.vertices;
    let activeBack = this.backPart.vertices;
    let glowingActiveFront = this.glowingFrontPart.vertices;
    let glowingActiveBack = this.glowingBackPart.vertices;
    for (let pos = 0; pos < 2 * SUBDIVS; pos++) {
      const angle = (pos / (2 * SUBDIVS - 1)) * Math.abs(this.arcLen);
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
          // The next chunk is a split front part
          if (toPos.length > 0) {
            activeFront = this.frontExtra.vertices;
            glowingActiveFront = this.glowingFrontExtra.vertices;
            posIndex = 0;
          }
          toPos.push(pos);
        }
        // If we already had a negative crossing
        // The next chunk is a split back part
        if (thisSign < 0) {
          if (toNeg.length > 0) {
            activeBack = this.backExtra.vertices;
            glowingActiveBack = this.glowingBackExtra.vertices;
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
          glowingActiveFront.push(glowingPool.pop()!);
        }
        activeFront[posIndex].x = tmpVector1.x;
        activeFront[posIndex].y = tmpVector1.y;
        glowingActiveFront[posIndex].x = tmpVector1.x;
        glowingActiveFront[posIndex].y = tmpVector1.y;
        posIndex++;
      } else {
        if (negIndex === activeBack.length) {
          // transfer one cell from the common pool
          activeBack.push(pool.pop()!);
          glowingActiveBack.push(glowingPool.pop()!);
        }
        activeBack[negIndex].x = tmpVector1.x;
        activeBack[negIndex].y = tmpVector1.y;
        glowingActiveBack[negIndex].x = tmpVector1.x;
        glowingActiveBack[negIndex].y = tmpVector1.y;
        negIndex++;
      }
    }
  }

  // private isLongSegment(): boolean {
  //   this.upDateArcLength();
  //   return this.arcLen >= Math.PI;
  // }

  private upDateArcLength() {
    // angleTo() seems to return the smaller angle between two vectors
    // To get arc length > 180 we measure it with a break at midpoint
    // and sum the SIGNED length of each.
    //tmpVector1.crossVectors(this.start, this.mid);
    const angle1 = this.start.angleTo(this.mid);
    //tmpVector1.crossVectors(this.mid, this.end);
    const angle2 = this.mid.angleTo(this.end);
    this.arcLen = angle1 + angle2;
  }

  set startVector(idealUnitStartVector: Vector3) {
    this.start.copy(idealUnitStartVector).normalize();
  }
  set midVector(idealUnitMidVector: Vector3) {
    this.mid.copy(idealUnitMidVector).normalize();
  }
  set endVector(idealUnitEndVector: Vector3) {
    this.end.copy(idealUnitEndVector).normalize();
  }
  set normalVector(idealUnitNormalVector: Vector3) {
    this.normalDirection.copy(idealUnitNormalVector).normalize();
  }

  public update(): void {
    this.deformIntoEllipse();
  }
  // /**
  //  * Set the start point vector of the segment
  //  * Update the normal vector by averaging the normal to the plane containing
  //  *   1) The origin, the start point, and the midpoint
  //  *   2) The origin, the midpoint, and the (new) endpoint
  //  * Finish by updating the display of the segment
  //  */
  // set startVector(newStartVector: Vector3) {
  //   this.repositionMidPoint(newStartVector, this.end);
  //   this.start.copy(newStartVector).normalize();
  //   // Recalculate the normal vector as the average of two (potentially correct) normals
  //   tmpVector1.crossVectors(this.start, this.mid).normalize();
  //   tmpVector2.crossVectors(this.mid, this.end).normalize();
  //   this.normalDirection.addVectors(tmpVector1, tmpVector2).normalize();

  //   this.deformIntoEllipse();
  // }
  // /**
  //  * Return the start point vector of the segment
  //  */
  // get startVector(): Vector3 {
  //   return this.start;
  // }

  // private repositionMidPoint(start: Vector3, end: Vector3): void {
  //   console.log("reposition mid point of segment");
  //   if (!this.isLongSegment()) {
  //     this.mid
  //       .copy(start)
  //       .add(end)
  //       .normalize();
  //   } else {
  //     // FIXME: recalculate the midpoint
  //     throw new Error("Method not implemented.");
  //   }
  // }

  // /**
  //  * Set the midpoint vector of the segment
  //  * Update the normal vector by averaging the normal to the plane containing
  //  *   1) The origin, the (new) start point, and the midpoint
  //  *   2) The origin, the midpoint, and the endpoint
  //  * Does *not* update the display of the segment
  //  */
  // set midVector(newMidVector: Vector3) {
  //   console.log("set Mid Vector");
  //   // Copy and normalize the newEndPointVector into this.end
  //   this.mid.copy(newMidVector).normalize();
  //   // Recalculate the normal vector as the average of two (potentially correct) normals
  //   tmpVector1.crossVectors(this.start, this.mid).normalize();
  //   tmpVector2.crossVectors(this.mid, this.end).normalize();
  //   this.normalDirection.addVectors(tmpVector1, tmpVector2).normalize();
  //   this.calculateArcLength();
  // }

  // /**
  //  * Return the midpoint vector of the segment
  //  */
  // get midVector(): Vector3 {
  //   return this.mid;
  // }
  // /**
  //  * Set the endpoint vector of the segment
  //  * Update the normal vector by averaging the normal to the plane containing
  //  *   1) The origin, the start point, and the midpoint
  //  *   2) The origin, the midpoint, and the (new) endpoint
  //  * Finish by updating the display of the segment
  //  */
  // set endVector(position: Vector3) {
  //   this.repositionMidPoint(this.start, position);
  //   this.end.copy(position).normalize();
  //   this.midMarker.translation
  //     .set(this.mid.x, this.mid.y)
  //     .multiplyScalar(SETTINGS.boundaryCircle.radius);

  //   // Recalculate the normal vector as the average of two normals
  //   tmpVector1.crossVectors(this.start, this.mid).normalize();
  //   tmpVector2.crossVectors(this.mid, this.end).normalize();
  //   this.normalDirection.addVectors(tmpVector1, tmpVector2).normalize();
  //   // Update the display of the segment
  //   this.deformIntoEllipse();
  // }

  // /**
  //  * Return the endpoint vector of the segment
  //  */
  // get endVector(): Vector3 {
  //   return this.end;
  // }
  // /**
  //  * Set:the normal vector to the plane containing the segment
  //  * Doesn't change the length of the segment
  //  * Updates the start, end, and mid vectors by rotating them
  //  * by the angle between the (old) normal vector and newNormal
  //  */
  // set normalVector(newNormalVector: Vector3) {
  //   // Update normal directions to be newNormal and normalize
  //   this.normalDirection.copy(newNormalVector).normalize();
  //   // tmpVector1 should be zero because this.normalDirection was just set to point in the same direction as newNormal?!?!?!?!?!
  //   tmpVector1.crossVectors(this.normalDirection, newNormalVector);
  //   // Calculate the angle between the old normal and the newNormal
  //   const rotAngle = this.normalDirection.angleTo(newNormalVector);
  //   // Create a matrix4 that is rotation about tempVector1
  //   tmpMatrix.makeRotationAxis(tmpVector1, rotAngle);
  //   // Update the display of the segment
  //   this.deformIntoEllipse();
  //   // Apply the rotation matrix
  //   this.start.applyMatrix4(tmpMatrix);
  //   this.end.applyMatrix4(tmpMatrix);
  //   this.mid.applyMatrix4(tmpMatrix);
  // }

  // /**
  //  * Get: Return the normal direction to the plane of the segment
  //  */
  // get normalVector(): Vector3 {
  //   return this.normalDirection;
  // }

  get arcLength(): number {
    return this.arcLen;
  }

  setVisible(flag: boolean): void {
    throw new Error("Method not implemented.");
  }

  /**
   * Clone the segment - We have to define our own clone() function
   * The builtin clone() does not seem to work correctly
   */
  clone(): this {
    // Create a new segment and copy all this's properties into it
    const dup = new Segment(this.start, this.end);
    //Copy name and start/end/mid/normal vectors
    dup.name = this.name;
    dup.arcLen = this.arcLen;
    dup.start.copy(this.start);
    dup.mid.copy(this.mid);
    dup.end.copy(this.end);
    dup.midMarker.translation.copy(this.midMarker.translation);
    dup.normalDirection.copy(this.normalDirection);
    //Copy the vertices of front/back/part
    const pool: Two.Anchor[] = [];
    pool.push(...dup.frontPart.vertices.splice(0)); //concatenates the pool array and the front vertices array and empties the frontPart array
    pool.push(...dup.backPart.vertices.splice(0)); //concatenates the pool array and the back vertices array and empties the backPart array

    // The length of the Pool array is 2*SUBDIVISIONS = this.frontPart.length + this.frontExtra.length + this.backPart.length + this.backExtra.length because dup.frontPart and dup.backPart initially contains all the vertices and frontExtra and backExtra are empty.
    this.frontPart.vertices.forEach((v, pos: number) => {
      // Add a vertex in the frontPart (while taking one away from the pool)
      dup.frontPart.vertices.push(pool.pop()!); // Exclamation point means that the linter assumes that the popped object is non-null
      // Copy the this.frontPart vertex v into the newly added vertex in frontPart
      dup.frontPart.vertices[pos].copy(v); //
    });
    // Repeat for the frontExtra/backPart/backExtra
    this.frontExtra.vertices.forEach((v, pos: number) => {
      dup.frontExtra.vertices.push(pool.pop()!);
      dup.frontExtra.vertices[pos].copy(v);
    });
    this.backPart.vertices.forEach((v, pos: number) => {
      dup.backPart.vertices.push(pool.pop()!);
      dup.backPart.vertices[pos].copy(v);
    });
    this.backExtra.vertices.forEach((v, pos: number) => {
      dup.backExtra.vertices.push(pool.pop()!);
      dup.backExtra.vertices[pos].copy(v);
    });

    // Repeat for all glowing parts/extras
    const glowingPool: Two.Anchor[] = [];
    glowingPool.push(...dup.glowingFrontPart.vertices.splice(0));
    glowingPool.push(...dup.glowingBackPart.vertices.splice(0));
    this.glowingFrontPart.vertices.forEach((v, pos: number) => {
      dup.glowingFrontPart.vertices.push(glowingPool.pop()!);
      dup.glowingFrontPart.vertices[pos].copy(v);
    });
    this.glowingFrontExtra.vertices.forEach((v, pos: number) => {
      dup.glowingFrontExtra.vertices.push(glowingPool.pop()!);
      dup.glowingFrontExtra.vertices[pos].copy(v);
    });
    this.glowingBackPart.vertices.forEach((v, pos: number) => {
      dup.glowingBackPart.vertices.push(glowingPool.pop()!);
      dup.glowingBackPart.vertices[pos].copy(v);
    });
    this.backExtra.vertices.forEach((v, pos: number) => {
      dup.glowingBackExtra.vertices.push(glowingPool.pop()!);
      dup.glowingBackExtra.vertices[pos].copy(v);
    });
    return dup as this;
  }

  addToLayers(layers: Two.Group[]): void {
    this.frontPart.addTo(layers[LAYER.foreground]);
    this.frontExtra.addTo(layers[LAYER.foreground]);
    this.backPart.addTo(layers[LAYER.background]);
    this.backExtra.addTo(layers[LAYER.background]);
    this.glowingFrontPart.addTo(layers[LAYER.foregroundGlowing]);
    this.glowingFrontExtra.addTo(layers[LAYER.foregroundGlowing]);
    this.glowingBackPart.addTo(layers[LAYER.backgroundGlowing]);
    this.glowingBackExtra.addTo(layers[LAYER.backgroundGlowing]);
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontPart.remove();
    this.frontExtra.remove();
    this.backPart.remove();
    this.backExtra.remove();
    this.glowingFrontPart.remove();
    this.glowingFrontExtra.remove();
    this.glowingBackPart.remove();
    this.glowingBackExtra.remove();
  }

  /**
   * Set the rendering style (flags: temporary, default, glowing, update) of the segment
   * Update flag means at least one of the private variables storing style information has
   * changed and should be applied to the displayed segment.
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.TEMPORARY: {
        // The style for the temporary segment display.  These options are not user modifiable.
        // Created with the Google Sheet "Segment Styling Code" in the "Temporary" tab

        // FRONT PART
        this.frontPart.stroke = SETTINGS.segment.temp.strokeColor.front;
        this.frontPart.linewidth = SETTINGS.segment.temp.strokeWidth.front;
        this.frontPart.opacity = SETTINGS.segment.temp.opacity.front;
        if (SETTINGS.segment.temp.dashArray.front.length > 0) {
          SETTINGS.segment.temp.dashArray.front.forEach(v => {
            (this.frontPart as any).dashes.push(v);
          });
          (this.frontPart as any).offset =
            SETTINGS.segment.temp.dashArray.offset.front;
        }
        // FRONT EXTRA
        this.frontExtra.stroke = SETTINGS.segment.temp.strokeColor.front;
        this.frontExtra.linewidth = SETTINGS.segment.temp.strokeWidth.front;
        this.frontExtra.opacity = SETTINGS.segment.temp.opacity.front;
        if (SETTINGS.segment.temp.dashArray.front.length > 0) {
          SETTINGS.segment.temp.dashArray.front.forEach(v => {
            (this.frontExtra as any).dashes.push(v);
          });
          (this.frontExtra as any).offset =
            SETTINGS.segment.temp.dashArray.offset.front;
        }
        // BACK PART
        this.backPart.stroke = SETTINGS.segment.temp.strokeColor.back;
        this.backPart.linewidth = SETTINGS.segment.temp.strokeWidth.back;
        this.backPart.opacity = SETTINGS.segment.temp.opacity.back;
        if (SETTINGS.segment.temp.dashArray.back.length > 0) {
          SETTINGS.segment.temp.dashArray.back.forEach(v => {
            (this.backPart as any).dashes.push(v);
          });
          (this.backPart as any).offset =
            SETTINGS.segment.temp.dashArray.offset.back;
        }
        // BACK EXTRA
        this.backExtra.stroke = SETTINGS.segment.temp.strokeColor.back;
        this.backExtra.linewidth = SETTINGS.segment.temp.strokeWidth.back;
        this.backExtra.opacity = SETTINGS.segment.temp.opacity.back;
        if (SETTINGS.segment.temp.dashArray.back.length > 0) {
          SETTINGS.segment.temp.dashArray.back.forEach(v => {
            (this.backExtra as any).dashes.push(v);
          });
          (this.backExtra as any).offset =
            SETTINGS.segment.temp.dashArray.offset.back;
        }
        // The temporary display is never highlighted
        (this.glowingFrontPart as any).visible = false;
        (this.glowingBackPart as any).visible = false;
        (this.glowingFrontExtra as any).visible = false;
        (this.glowingBackExtra as any).visible = false;
        break;
      }
      case DisplayStyle.GLOWING: {
        // The style for the glowing circle display.  These options are not user modifiable.
        // Created with the Google Sheet "Segment Styling Code" in the "Glowing" tab

        // FRONT PART
        this.glowingFrontPart.stroke =
          SETTINGS.segment.glowing.strokeColor.front;
        this.glowingFrontPart.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.front;
        this.glowingFrontPart.opacity = SETTINGS.segment.glowing.opacity.front;
        if (SETTINGS.segment.glowing.dashArray.front.length > 0) {
          SETTINGS.segment.glowing.dashArray.front.forEach(v => {
            (this.glowingFrontPart as any).dashes.push(v);
          });
          (this.glowingFrontPart as any).offset =
            SETTINGS.segment.glowing.dashArray.offset.front;
        }
        // FRONT EXTRA
        this.glowingFrontExtra.stroke =
          SETTINGS.segment.glowing.strokeColor.front;
        this.glowingFrontExtra.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.front;
        this.glowingFrontExtra.opacity = SETTINGS.segment.glowing.opacity.front;
        if (SETTINGS.segment.glowing.dashArray.front.length > 0) {
          SETTINGS.segment.glowing.dashArray.front.forEach(v => {
            (this.glowingFrontExtra as any).dashes.push(v);
          });
          (this.glowingFrontExtra as any).offset =
            SETTINGS.segment.glowing.dashArray.offset.front;
        }

        // BACK PART
        this.glowingBackPart.stroke = SETTINGS.segment.glowing.strokeColor.back;
        this.glowingBackPart.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.back;
        this.glowingBackPart.opacity = SETTINGS.segment.glowing.opacity.back;
        if (SETTINGS.segment.glowing.dashArray.back.length > 0) {
          SETTINGS.segment.glowing.dashArray.back.forEach(v => {
            (this.glowingBackPart as any).dashes.push(v);
          });
          (this.glowingBackPart as any).offset =
            SETTINGS.segment.glowing.dashArray.offset.back;
        }
        // BACK EXTRA
        this.glowingBackExtra.stroke =
          SETTINGS.segment.glowing.strokeColor.back;
        this.glowingBackExtra.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.back;
        this.glowingBackExtra.opacity = SETTINGS.segment.glowing.opacity.back;
        if (SETTINGS.segment.glowing.dashArray.back.length > 0) {
          SETTINGS.segment.glowing.dashArray.back.forEach(v => {
            (this.glowingBackExtra as any).dashes.push(v);
          });
          (this.glowingBackExtra as any).offset =
            SETTINGS.segment.glowing.dashArray.offset.back;
        }
        break;
      }
      case DisplayStyle.UPDATE: {
        // Use the current variables to update the display style
        // Created with the Google Sheet "Segment Styling Code" in the "Drawn Update" tab
        // FRONT PART
        this.frontPart.stroke = this.strokeColorFront;
        this.frontPart.linewidth = this.strokeWidthFront;
        this.frontPart.opacity = this.opacityFront;
        if (this.dashArrayFront.length > 0) {
          (this.frontPart as any).dashes.length = 0;
          this.dashArrayFront.forEach(v => {
            (this.frontPart as any).dashes.push(v);
          });
          (this.frontPart as any).offset = this.dashArrayOffsetFront;
        }
        // FRONT EXTRA
        this.frontExtra.stroke = this.strokeColorFront;
        this.frontExtra.linewidth = this.strokeWidthFront;
        this.frontExtra.opacity = this.opacityFront;
        if (this.dashArrayFront.length > 0) {
          (this.frontExtra as any).dashes.length = 0;
          this.dashArrayFront.forEach(v => {
            (this.frontExtra as any).dashes.push(v);
          });
          (this.frontExtra as any).offset = this.dashArrayOffsetFront;
        }
        // BACK PART
        this.backPart.stroke = this.strokeColorBack;
        this.backPart.linewidth = this.strokeWidthBack;
        this.backPart.opacity = this.opacityBack;
        if (this.dashArrayBack.length > 0) {
          (this.backPart as any).dashes.length = 0;
          this.dashArrayBack.forEach((v: number) => {
            (this.backPart as any).dashes.push(v);
          });
          (this.backPart as any).offset = this.dashArrayOffsetBack;
        }
        // BACK EXTRA
        this.backExtra.stroke = this.strokeColorBack;
        this.backExtra.linewidth = this.strokeWidthBack;
        this.backExtra.opacity = this.opacityBack;
        if (this.dashArrayBack.length > 0) {
          (this.backExtra as any).dashes.length = 0;
          this.dashArrayBack.forEach((v: number) => {
            (this.backExtra as any).dashes.push(v);
          });
          (this.backExtra as any).offset = this.dashArrayOffsetBack;
        }
        // UPDATE the glowing width so it is always bigger than the drawn width
        this.glowingFrontPart.linewidth =
          this.strokeWidthFront + SETTINGS.segment.glowing.edgeWidth;
        this.glowingFrontExtra.linewidth =
          this.strokeWidthFront + SETTINGS.segment.glowing.edgeWidth;
        this.glowingBackPart.linewidth =
          this.strokeWidthBack + SETTINGS.segment.glowing.edgeWidth;
        this.glowingBackExtra.linewidth =
          this.strokeWidthBack + SETTINGS.segment.glowing.edgeWidth;
        break;
      }
      case DisplayStyle.DEFAULT:
      default: {
        // Reset the style to the defaults i.e. Use the global defaults to update the display style
        // Created with the Google Sheet "Segment Styling Code" in the "Drawn Set To Defaults" tab
        // FRONT PART
        this.frontPart.stroke = SETTINGS.segment.drawn.strokeColor.front;
        this.frontPart.linewidth = SETTINGS.segment.drawn.strokeWidth.front;
        this.frontPart.opacity = SETTINGS.segment.drawn.opacity.front;
        if (SETTINGS.segment.drawn.dashArray.front.length > 0) {
          (this.frontPart as any).dashes.length = 0;
          SETTINGS.segment.drawn.dashArray.front.forEach(v => {
            (this.frontPart as any).dashes.push(v);
          });
          (this.frontPart as any).offset =
            SETTINGS.segment.drawn.dashArray.offset.front;
        }
        // FRONT EXTRA
        this.frontExtra.stroke = SETTINGS.segment.drawn.strokeColor.front;
        this.frontExtra.linewidth = SETTINGS.segment.drawn.strokeWidth.front;
        this.frontExtra.opacity = SETTINGS.segment.drawn.opacity.front;
        if (SETTINGS.segment.drawn.dashArray.front.length > 0) {
          (this.frontExtra as any).dashes.length = 0;
          SETTINGS.segment.drawn.dashArray.front.forEach(v => {
            (this.frontExtra as any).dashes.push(v);
          });
          (this.frontExtra as any).offset =
            SETTINGS.segment.drawn.dashArray.offset.front;
        }
        // BACK PART
        this.backPart.stroke = SETTINGS.segment.drawn.strokeColor.back;
        this.backPart.linewidth = SETTINGS.segment.drawn.strokeWidth.back;
        this.backPart.opacity = SETTINGS.segment.drawn.opacity.back;
        if (SETTINGS.segment.drawn.dashArray.back.length > 0) {
          (this.backPart as any).dashes.length = 0;
          SETTINGS.segment.drawn.dashArray.back.forEach(v => {
            (this.backPart as any).dashes.push(v);
          });
          (this.backPart as any).offset =
            SETTINGS.segment.drawn.dashArray.offset.back;
        }
        // BACK EXTRA
        this.backExtra.stroke = SETTINGS.segment.drawn.strokeColor.back;
        this.backExtra.linewidth = SETTINGS.segment.drawn.strokeWidth.back;
        this.backExtra.opacity = SETTINGS.segment.drawn.opacity.back;
        if (SETTINGS.segment.drawn.dashArray.back.length > 0) {
          (this.backExtra as any).dashes.length = 0;
          SETTINGS.segment.drawn.dashArray.back.forEach(v => {
            (this.backExtra as any).dashes.push(v);
          });
          (this.backExtra as any).offset =
            SETTINGS.segment.drawn.dashArray.offset.back;
        }
        // UPDATE the glowing width so it is always bigger than the drawn width
        this.glowingFrontPart.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.front;
        this.glowingFrontExtra.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.front;
        this.glowingBackPart.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.back;
        this.glowingBackExtra.linewidth =
          SETTINGS.segment.glowing.edgeWidth +
          SETTINGS.segment.drawn.strokeWidth.back;
        break;
      }
    }
  }
}
