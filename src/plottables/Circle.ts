/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const Z_AXIS = new Vector3(0, 0, 1);
const transformMatrix = new Matrix4();
const SUBDIVISIONS = SETTINGS.circle.numPoints;

/**
 * For drawing surface circle. A circle consists of two paths (front and back)
 * for a total of 2N subdivisions.
 * We initially assign the same number of segments/subdivisions to each path,
 * but as the circle is being deformed the number of subdivisions on each path
 * may change: longer path will hold more subdivision points (while keeping the
 * total points 2N so we don't create/remove new points)
 */
export default class Circle extends Nodule {
  /**
   * The center of the circle in ideal unit sphere
   */
  private center_: Vector3; // Can't use "center", name conflict with TwoJS

  /**
   * The radius (in radians) as the user drags the mouse on the surface of the sphere
   */
  private arcRadius = 1;
  /**
   *  This the arcRadius projected to the plane of the circle
   */
  private projectedRadius = 1;

  /**
   * The TwoJS objects to display the front/back parts and their glowing counterparts.
   */
  private frontPart: Two.Path;
  private backPart: Two.Path;
  private glowingFrontPart: Two.Path;
  private glowingBackPart: Two.Path;

  /**
   * The TwoJS objects to display the front/back fill
   */
  private frontFill: Two.Path;
  private backFill: Two.Path;

  /**
   * The styling variables for the drawn circle. The user can modify these.
   * Created with the Google Sheet "Circle Styling Code" in the "Set Drawn Variables" tab
   */
  // FRONT
  private fillColorFront = SETTINGS.circle.drawn.fillColor.front;
  private strokeColorFront = SETTINGS.circle.drawn.strokeColor.front;
  private strokeWidthFront = SETTINGS.circle.drawn.strokeWidth.front;
  private opacityFront = SETTINGS.circle.drawn.opacity.front;
  private dashArrayFront = SETTINGS.circle.drawn.dashArray.front;
  private dashArrayOffsetFront = SETTINGS.circle.drawn.dashArray.offset.front;
  // BACK
  private fillColorBack = SETTINGS.circle.dynamicBackStyle
    ? Nodule.contrastFillColor(SETTINGS.circle.drawn.fillColor.front)
    : SETTINGS.circle.drawn.fillColor.back;
  private strokeColorBack = SETTINGS.circle.dynamicBackStyle
    ? Nodule.contrastStrokeColor(SETTINGS.circle.drawn.strokeColor.front)
    : SETTINGS.circle.drawn.strokeColor.back;
  private strokeWidthBack = SETTINGS.circle.dynamicBackStyle
    ? Nodule.contractStrokeWidth(SETTINGS.circle.drawn.strokeWidth.front)
    : SETTINGS.circle.drawn.strokeWidth.back;
  private opacityBack = SETTINGS.circle.dynamicBackStyle
    ? Nodule.contrastOpacity(SETTINGS.circle.drawn.opacity.front)
    : SETTINGS.circle.drawn.opacity.back;
  private dashArrayBack = SETTINGS.circle.dynamicBackStyle
    ? Nodule.contrastDashArray(SETTINGS.circle.drawn.dashArray.front)
    : SETTINGS.circle.drawn.dashArray.back;
  private dashArrayOffsetBack = SETTINGS.circle.dynamicBackStyle
    ? Nodule.contrastDashArrayOffset(
        SETTINGS.circle.drawn.dashArray.offset.front
      )
    : SETTINGS.circle.drawn.dashArray.offset.back;

  /**
   * The stops and gradient for front/back fill
   */
  private frontGradientColorCenter = new Two.Stop(
    0,
    SETTINGS.fill.frontWhite,
    1
  );
  private frontGradientColor = new Two.Stop(
    2 * SETTINGS.boundaryCircle.radius,
    this.fillColorFront,
    1
  );
  private frontGradient = new Two.RadialGradient(
    SETTINGS.fill.lightSource.x,
    SETTINGS.fill.lightSource.y,
    1 * SETTINGS.boundaryCircle.radius,
    [this.frontGradientColorCenter, this.frontGradientColor]
  );
  private backGradientColorCenter = new Two.Stop(0, SETTINGS.fill.backGray, 1);
  private backGradientColor = new Two.Stop(
    1 * SETTINGS.boundaryCircle.radius,
    this.fillColorBack,
    1
  );
  private backGradient = new Two.RadialGradient(
    -SETTINGS.fill.lightSource.x,
    -SETTINGS.fill.lightSource.y,
    2 * SETTINGS.boundaryCircle.radius,
    [this.backGradientColorCenter, this.backGradientColor]
  );

  /**
   * For temporary calculation with ThreeJS objects
   */
  private tmpVector: Vector3;
  private tmpMatrix: Matrix4;

  /**
   * This is the list of original vertices of a circle in the XY plane of radius
   * SETTINGS.boundaryCircle.radius. There are SETTINGS.circle.subdivisions of these vertices
   */
  private originalVertices: Vector2[];

  // for debugging only
  //private majorLine: Two.Line;

  constructor(center?: Vector3, arcRadius?: number) {
    super();

    // For debugging
    // Draw the segment on the positive X-axis of the circle/ellipse
    //this.majorLine = new Two.Line(0, 0, SETTINGS.boundaryCircle.radius, 0);
    //this.add(this.majorLine);

    // Create the initial front and back vertices (glowing/not/fill)
    const frontVertices: Two.Vector[] = [];
    const backVertices: Two.Vector[] = [];
    const glowingFrontVertices: Two.Vector[] = [];
    const glowingBackVertices: Two.Vector[] = [];
    const frontFillVertices: Two.Vector[] = [];
    const backFillVertices: Two.Vector[] = [];
    // TODO: Is there a way for the glowing and not vertices to be the same?  I tried and it didn't seem to work.

    // As the circle is moved around the vertices are passed between the front and back parts, but it
    // is always true that frontVertices.length + backVertices.length = SUBDIVISIONS
    // As the circle is moved around the some of the frontVertices are the same as the ones on the
    // frontFillVertices, but it is always true that frontVertices.length + number of non-front Vertices in
    // frontFillVertices = SUBDIVISIONS
    // The non-frontVertices are ones on the boundary circle.
    // Similar for the back vertices. Initially the length of back/front FillVertices must be SUBDIVISIONS.
    for (let k = 0; k < Math.ceil(SUBDIVISIONS / 2); k++) {
      const angle = (k * Math.PI) / Math.ceil(SUBDIVISIONS / 2); // [0, pi)
      const x = SETTINGS.boundaryCircle.radius * Math.cos(angle);
      const x1 = SETTINGS.boundaryCircle.radius * Math.cos(angle + Math.PI);
      const y = SETTINGS.boundaryCircle.radius * Math.sin(angle);
      const y1 = SETTINGS.boundaryCircle.radius * Math.sin(angle + Math.PI);
      frontVertices.push(new Two.Vector(x, y));
      frontFillVertices.push(new Two.Vector(x, y), new Two.Vector(x1, y1));
      backVertices.push(new Two.Vector(x1, y1));
      backFillVertices.push(new Two.Vector(x, y), new Two.Vector(x1, y1));
      glowingFrontVertices.push(new Two.Vector(x, y));
      glowingBackVertices.push(new Two.Vector(x1, y1));
    }
    this.frontPart = new Two.Path(
      frontVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    this.glowingFrontPart = new Two.Path(
      glowingFrontVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    this.frontFill = new Two.Path(
      frontFillVertices,
      /*closed*/ true,
      /*curve*/ false
    );
    this.backPart = new Two.Path(
      backVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    this.glowingBackPart = new Two.Path(
      glowingBackVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    this.backFill = new Two.Path(
      backFillVertices,
      /*closed*/ true,
      /*curve*/ false
    );

    // Set the styles that are always true
    // The front/back parts have no fill because that is handled by the front/back fill
    // The front/back fill have no stroke because that is handled by the front/back part
    this.frontPart.noFill();
    this.backPart.noFill();
    this.frontFill.noStroke();
    this.backFill.noStroke();
    this.glowingFrontPart.noFill();
    this.glowingBackPart.noFill();

    this.originalVertices = [];
    frontVertices.forEach(v => {
      this.originalVertices.push(new Vector2(v.x, v.y));
    });
    backVertices.forEach(v => {
      this.originalVertices.push(new Vector2(v.x, v.y));
    });

    // Set the center, radii, and temporary variables
    this.center_ = new Vector3(0, 0, 0);
    if (center) this.center_.copy(center);
    this.arcRadius = arcRadius || Math.PI / 4;
    this.projectedRadius = Math.sin(this.arcRadius);
    this.tmpVector = new Vector3();
    this.tmpMatrix = new Matrix4();

    //this.name = "Circle-" + this.id;
  }

  // Using this algorithm, the frontPart and backPart are rendered correctly
  // but the center of the circle is off by several pixels
  private readjust() {
    const sphereRadius = SETTINGS.boundaryCircle.radius; // in pixels
    // The vector to the circle center is ALSO the normal direction of the circle
    // These three vectors will be stored in SECircle -- just copy them from there
    desiredZAxis.copy(this.center_).normalize();
    desiredXAxis.set(-this.center_.y, this.center_.x, 0).normalize();
    desiredYAxis.crossVectors(desiredZAxis, desiredXAxis);

    // Set up the local coordinates from for the circle
    transformMatrix.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);
    // The circle plane is below the tangent plane
    const distanceFromOrigin = Math.cos(this.arcRadius);

    // translate along the Z of the local coordinate frame
    this.tmpMatrix.makeTranslation(0, 0, distanceFromOrigin * sphereRadius);
    transformMatrix.multiply(this.tmpMatrix);
    // scale the circle on the XY-plane of the local coordinate frame
    this.tmpMatrix.makeScale(this.projectedRadius, this.projectedRadius, 1);
    transformMatrix.multiply(this.tmpMatrix);

    // Recalculate the 2D coordinate of the TwoJS path (From the originalVertices array)
    // As we drag the mouse, the number of vertices in the front half
    // and back half are dynamically changing and to avoid
    // allocating and de-allocating arrays, we dynamically transfers
    // elements between the two

    let posIndex = 0;
    let negIndex = 0;
    let frontLen = this.frontPart.vertices.length;
    let backLen = this.backPart.vertices.length;
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
          // Steal one element from the backPart
          const extra = this.backPart.vertices.pop();
          this.frontPart.vertices.push(extra!);
          const glowExtra = this.glowingBackPart.vertices.pop();
          this.glowingFrontPart.vertices.push(glowExtra!);
          backLen--;
          frontLen++;
        }
        this.frontPart.vertices[posIndex].x = this.tmpVector.x;
        this.frontPart.vertices[posIndex].y = this.tmpVector.y;
        this.glowingFrontPart.vertices[posIndex].x = this.tmpVector.x;
        this.glowingFrontPart.vertices[posIndex].y = this.tmpVector.y;
        posIndex++;
      } else {
        if (firstNeg === -1) firstNeg = pos;
        if (negIndex >= backLen) {
          // Steal one element from the frontPart
          const extra = this.frontPart.vertices.pop();
          this.backPart.vertices.push(extra!);
          const glowingExtra = this.glowingFrontPart.vertices.pop();
          this.glowingBackPart.vertices.push(glowingExtra!);
          frontLen--;
          backLen++;
        }
        this.backPart.vertices[negIndex].x = this.tmpVector.x;
        this.backPart.vertices[negIndex].y = this.tmpVector.y;
        this.glowingBackPart.vertices[negIndex].x = this.tmpVector.x;
        this.glowingBackPart.vertices[negIndex].y = this.tmpVector.y;
        negIndex++;
      }
    });
    // Rotate the array elements to remove gap
    if (firstNeg < firstPos && firstPos <= firstNeg + backLen) {
      // There is a gap in the back path
      this.backPart.vertices.rotate(firstPos);
      this.glowingBackPart.vertices.rotate(firstPos);
    } else if (firstPos < firstNeg && firstNeg <= firstPos + frontLen) {
      // There is a gap in the front path
      this.frontPart.vertices.rotate(firstNeg);
      this.glowingFrontPart.vertices.rotate(firstNeg);
    }

    // Parts becomes closed when the other parts vanishes
    this.frontPart.closed = backLen === 0;
    this.backPart.closed = frontLen === 0;
    this.glowingFrontPart.closed = backLen === 0;
    this.glowingBackPart.closed = frontLen === 0;

    //Now build the front/back fill objects based on the front/back parts

    // The circle interior is only on the front of the sphere
    if (backLen === 0 && this.arcRadius < Math.PI / 2) {
      // In this case the frontFillVertices are the same as the frontVertices
      this.frontFill.vertices.forEach((v, index) => {
        v.x = this.frontPart.vertices[index].x;
        v.y = this.frontPart.vertices[index].y;
      });
      // Only the front fill is displayed
      (this.frontFill as any).visible = true;
      (this.backFill as any).visible = false;
    }

    // The circle interior is split between front and back
    if (backLen !== 0 && frontLen !== 0) {
      //} && this.arcRadius < Math.PI / 2) {
      //find the angular width of the part of the boundary circle to be copied
      // Compute the angle from the positive x axis to the last frontPartVertex
      const startAngle = Math.atan2(
        this.frontPart.vertices[frontLen - 1].y,
        this.frontPart.vertices[frontLen - 1].x
      );

      // Compute the angle from the positive x axis to the first frontPartVertex
      const endAngle = Math.atan2(
        this.frontPart.vertices[0].y,
        this.frontPart.vertices[0].x
      );

      // Compute the angular width of the section of the boundary circle to add to the front/back fill
      // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
      let angularWidth = endAngle - startAngle;
      if (angularWidth < 0) {
        angularWidth += 2 * Math.PI;
      }
      //console.log(angularWidth);
      // When tracing the boundary circle we start from fromVector = this.frontPart.vertices[frontLen - 1]
      const fromVector = new Two.Vector(
        this.frontPart.vertices[frontLen - 1].x,
        this.frontPart.vertices[frontLen - 1].y
      );
      // then
      // trace in the direction of a toVector that is perpendicular to this.frontPart.vertices[frontLen - 1]
      // and points in the same direction as this.frontPart.vertices[0]
      const toVector = new Two.Vector(
        -this.frontPart.vertices[frontLen - 1].y,
        this.frontPart.vertices[frontLen - 1].x
      );
      if (toVector.dot(this.frontPart.vertices[0]) < 0) {
        toVector.multiplyScalar(-1);
      }

      // If the arcRadius is bigger than Pi/2 then reverse the toVector
      if (this.arcRadius > Math.PI / 2) {
        toVector.multiplyScalar(-1);
      }

      // Build the frontFill
      // First copy the frontPart into the first part of the frontFill
      this.frontFill.vertices.forEach((v, index) => {
        if (index < frontLen) {
          v.x = this.frontPart.vertices[index].x;
          v.y = this.frontPart.vertices[index].y;
        } else {
          const angle =
            (angularWidth / (SUBDIVISIONS - 1 - frontLen)) * (index - frontLen);
          v.x = Math.cos(angle) * fromVector.x + Math.sin(angle) * toVector.x;
          v.y = Math.cos(angle) * fromVector.y + Math.sin(angle) * toVector.y;
        }
      });

      // Build the backFill
      // First copy the backPart into the first part of the backFill
      this.backFill.vertices.forEach((v, index) => {
        if (index < backLen) {
          v.x = this.backPart.vertices[backLen - 1 - index].x;
          v.y = this.backPart.vertices[backLen - 1 - index].y;
        } else {
          const angle =
            (angularWidth / (SUBDIVISIONS - 1 - backLen)) * (index - backLen);
          v.x = Math.cos(angle) * fromVector.x + Math.sin(angle) * toVector.x;
          v.y = Math.cos(angle) * fromVector.y + Math.sin(angle) * toVector.y;
        }
      });
      // console.log("front", frontLen, "back", backLen);

      // Display front and back
      (this.frontFill as any).visible = true;
      (this.backFill as any).visible = true;
    }

    // The circle interior is only on the back of the sphere
    if (frontLen === 0 && this.arcRadius < Math.PI / 2) {
      // The circle interior is only on the back of the sphere
      // In this case the backFillVertices are the same as the backVertices
      this.backFill.vertices.forEach((v, index) => {
        v.x = this.backPart.vertices[index].x;
        v.y = this.backPart.vertices[index].y;
      });
      // Only the back fill is displayed
      (this.frontFill as any).visible = false;
      (this.backFill as any).visible = true;
    }

    // The circle interior covers the entire front half of the sphere and is a 'hole' on the back
    if (frontLen === 0 && this.arcRadius > Math.PI / 2) {
      // In this case set the frontFillVertices to the entire front of the sphere
      this.frontFill.vertices.forEach((v, index) => {
        const angle = (index / SUBDIVISIONS) * 2 * Math.PI;
        v.x = SETTINGS.boundaryCircle.radius * Math.cos(angle);
        v.y = SETTINGS.boundaryCircle.radius * Math.sin(angle);
      });

      // In this case the backFillVertices must trace out first the boundary circle and then
      //  the circle, to trace an annular region.  To help with the rendering, start tracing
      //  the boundary circle directly across from the vertex on the circle at index zero
      const backStartTrace = Math.atan2(
        this.backPart.vertices[0].y,
        this.backPart.vertices[0].x
      );

      this.backFill.vertices.forEach((v, index) => {
        if (index <= Math.floor(SUBDIVISIONS / 2) - 2) {
          const angle = -((2 * index) / SUBDIVISIONS) * 2 * Math.PI; //must trace in the opposite direction on the back to render the annular region
          v.x =
            SETTINGS.boundaryCircle.radius * Math.cos(angle + backStartTrace);
          v.y =
            SETTINGS.boundaryCircle.radius * Math.sin(angle + backStartTrace);
          //console.log(index, angle);
        } else if (index == Math.floor(SUBDIVISIONS / 2) - 1) {
          //make sure the last point on the boundary is the same as the first
          v.x = SETTINGS.boundaryCircle.radius * Math.cos(0 + backStartTrace);
          v.y = SETTINGS.boundaryCircle.radius * Math.sin(0 + backStartTrace);
          //console.log(index, 0);
        } else if (
          Math.floor(SUBDIVISIONS / 2) <= index &&
          index <= SUBDIVISIONS - 2
        ) {
          v.x = this.backPart.vertices[
            2 * (index - Math.floor(SUBDIVISIONS / 2))
          ].x;
          v.y = this.backPart.vertices[
            2 * (index - Math.floor(SUBDIVISIONS / 2))
          ].y;
          //console.log(index, Math.atan2(v.y, v.x));
        } else if (index == SUBDIVISIONS - 1) {
          // make sure the last point on the (inner) circle is the same as the first
          v.x = this.backPart.vertices[0].x;
          v.y = this.backPart.vertices[0].y;
          //console.log(index, Math.atan2(v.y, v.x));
        }
      });

      // Both front/back fill are displayed
      (this.frontFill as any).visible = true;
      (this.backFill as any).visible = true;
    }

    // The circle interior covers the entire back half of the sphere and is a 'hole' on the front
    if (backLen === 0 && this.arcRadius > Math.PI / 2) {
      // In this case set the frontFillVertices to the entire front of the sphere
      this.backFill.vertices.forEach((v, index) => {
        const angle = (index / SUBDIVISIONS) * 2 * Math.PI;
        v.x = SETTINGS.boundaryCircle.radius * Math.cos(angle);
        v.y = SETTINGS.boundaryCircle.radius * Math.sin(angle);
      });

      // In this case the backFillVertices must trace out first the boundary circle and then
      //  the circle, to trace an annular region.  To help with the rendering, start tracing
      //  the boundary circle directly across from the vertex on the circle at index zero
      const frontStartTrace = Math.atan2(
        this.frontPart.vertices[0].y,
        this.frontPart.vertices[0].x
      );

      this.frontFill.vertices.forEach((v, index) => {
        if (index <= Math.floor(SUBDIVISIONS / 2) - 2) {
          const angle = ((2 * index) / SUBDIVISIONS) * 2 * Math.PI;
          v.x =
            SETTINGS.boundaryCircle.radius * Math.cos(angle + frontStartTrace);
          v.y =
            SETTINGS.boundaryCircle.radius * Math.sin(angle + frontStartTrace);
        } else if (index == Math.floor(SUBDIVISIONS / 2) - 1) {
          //make sure the last point on the boundary is the same as the first
          v.x = SETTINGS.boundaryCircle.radius * Math.cos(0 + frontStartTrace);
          v.y = SETTINGS.boundaryCircle.radius * Math.sin(0 + frontStartTrace);
        } else if (
          Math.floor(SUBDIVISIONS / 2) <= index &&
          index <= SUBDIVISIONS - 2
        ) {
          v.x = this.frontPart.vertices[
            2 * (index - Math.floor(SUBDIVISIONS / 2))
          ].x;
          v.y = this.frontPart.vertices[
            2 * (index - Math.floor(SUBDIVISIONS / 2))
          ].y;
        } else if (index == SUBDIVISIONS - 1) {
          // make sure the last point on the (inner) circle is the same as the first
          v.x = this.frontPart.vertices[0].x;
          v.y = this.frontPart.vertices[0].y;
        }
      });

      // Both front/back fill are displayed
      (this.frontFill as any).visible = true;
      (this.backFill as any).visible = true;
    }
  }

  /**
   * Set or Get the center of the circle vector. Setting it updates the display.
   */
  set centerVector(position: Vector3) {
    this.center_.copy(position);
    this.readjust();
  }

  get centerVector(): Vector3 {
    return this.center_;
  }

  /**
   * Set or Get the radius of the circle. Setting it updates the display.
   */
  set radius(arcLengthRadius: number) {
    this.arcRadius = arcLengthRadius;
    this.projectedRadius = Math.sin(arcLengthRadius);
    this.readjust();
  }
  get radius(): number {
    return this.arcRadius;
  }

  frontGlowingDisplay(): void {
    (this.frontPart as any).visible = true;
    (this.glowingFrontPart as any).visible = true;
  }
  backGlowingDisplay(): void {
    (this.backPart as any).visible = true;
    (this.glowingBackPart as any).visible = true;
  }

  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }

  frontNormalDisplay(): void {
    (this.frontPart as any).visible = true;
    (this.glowingFrontPart as any).visible = false;
  }

  backNormalDisplay(): void {
    (this.backPart as any).visible = true;
    (this.glowingBackPart as any).visible = false;
  }

  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  setVisible(flag: boolean): void {
    (this.frontPart as any).visible = flag;
    (this.backPart as any).visible = flag;
    (this.frontFill as any).visible = flag;
    (this.backFill as any).visible = flag;
    (this.glowingBackPart as any).visible = flag;
    (this.glowingFrontPart as any).visible = flag;
  }

  /**
   * This method is used to copy the temporary circle created with the Circle Tool (in the midground) into a
   * permanent one in the scene (in the foreground).
   */
  clone(): this {
    // Use the constructor for this class to create a template to copy over the
    // values from the current (the `this`) Circle object
    const dup = new Circle(this.center_, this.arcRadius);
    //dup.rotation = this.rotation;
    //dup.translation.copy(this.translation);
    // Duplicate the non-glowing parts
    dup.frontPart.closed = this.frontPart.closed;
    dup.frontPart.rotation = this.frontPart.rotation;
    dup.frontPart.translation.copy(this.frontPart.translation);
    dup.backPart.closed = this.backPart.closed;
    dup.backPart.rotation = this.backPart.rotation;
    dup.backPart.translation.copy(this.backPart.translation);
    // The clone (i.e. dup) initially has equal number of vertices for the front and back part
    //  so adjust to match `this`. If one of the this.front or this.back has more vertices then
    //  the corresponding dup part, then remove the excess vertices from the one with more and
    //  move them to the other
    while (dup.frontPart.vertices.length > this.frontPart.vertices.length) {
      // Transfer from frontPart to backPart
      dup.backPart.vertices.push(dup.frontPart.vertices.pop()!);
    }
    while (dup.backPart.vertices.length > this.backPart.vertices.length) {
      // Transfer from backPart to frontPart
      dup.frontPart.vertices.push(dup.backPart.vertices.pop()!);
    }
    // After the above two while statement execute this.front/back and dup.front/back are the same length
    // Now we can copy the vertices from the this.front/back to the dup.front/back
    dup.frontPart.vertices.forEach((v, pos) => {
      v.copy(this.frontPart.vertices[pos]);
    });
    dup.backPart.vertices.forEach((v, pos) => {
      v.copy(this.backPart.vertices[pos]);
    });

    //Clone the front/back fill
    dup.frontFill.vertices.forEach((v, pos) => {
      v.copy(this.frontFill.vertices[pos]);
    });
    dup.backFill.vertices.forEach((v, pos) => {
      v.copy(this.backFill.vertices[pos]);
    });
    //Clone the visibility of the front/back fill
    (dup.frontFill as any).visible = (this.frontFill as any).visible;
    (dup.backFill as any).visible = (this.backFill as any).visible;

    // Duplicate the glowing parts
    dup.glowingFrontPart.closed = this.glowingFrontPart.closed;
    dup.glowingFrontPart.rotation = this.glowingFrontPart.rotation;
    dup.glowingFrontPart.translation.copy(this.glowingFrontPart.translation);
    dup.glowingBackPart.closed = this.glowingBackPart.closed;
    dup.glowingBackPart.rotation = this.glowingBackPart.rotation;
    dup.glowingBackPart.translation.copy(this.glowingBackPart.translation);
    // The clone has equal number of vertices for the front and back halves
    while (
      dup.glowingFrontPart.vertices.length >
      this.glowingFrontPart.vertices.length
    ) {
      // Transfer from frontPart to backPart
      dup.glowingBackPart.vertices.push(dup.glowingFrontPart.vertices.pop()!);
    }
    while (
      dup.glowingBackPart.vertices.length > this.glowingBackPart.vertices.length
    ) {
      // Transfer from backpart to frontPart
      dup.glowingFrontPart.vertices.push(dup.glowingBackPart.vertices.pop()!);
    }
    dup.glowingFrontPart.vertices.forEach((v, pos) => {
      v.copy(this.glowingFrontPart.vertices[pos]);
    });
    dup.glowingBackPart.vertices.forEach((v, pos) => {
      v.copy(this.glowingBackPart.vertices[pos]);
    });
    //   dup.scale.copy(this.scale);
    return dup as this;
  }

  /**
   * Adds the front/back/glowing/not parts to the correct layers
   * @param layers
   */
  addToLayers(layers: Two.Group[]): void {
    // These must always be executed even if the front/back part is empty
    // Otherwise when they become non-empty they are not displayed
    this.frontFill.addTo(layers[LAYER.foreground]);
    this.frontPart.addTo(layers[LAYER.foreground]);
    this.glowingFrontPart.addTo(layers[LAYER.foregroundGlowing]);
    this.backFill.addTo(layers[LAYER.background]);
    this.backPart.addTo(layers[LAYER.background]);
    this.glowingBackPart.addTo(layers[LAYER.backgroundGlowing]);
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontPart.remove();
    this.frontFill.remove();
    this.glowingFrontPart.remove();
    this.backPart.remove();
    this.backFill.remove();
    this.glowingBackPart.remove();
  }

  adjustSizeForZoom(factor: number): void {
    throw new Error("Method not implemented.");
  }

  /**
   * Set the rendering style (flags: temporary, default, glowing, update) of the circle
   * Update flag means at least one of the private variables storing style information has
   * changed and should be applied to the displayed circle.
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.TEMPORARY: {
        // The style for the temporary circle display.  These options are not user modifiable.
        // Created with the Google Sheet "Circle Styling Code" in the "Temporary" tab

        //FRONT
        if (SETTINGS.circle.temp.fillColor.front === "noFill") {
          this.frontFill.noFill();
        } else {
          this.frontGradientColor.color = SETTINGS.circle.temp.fillColor.front;
          this.frontFill.fill = this.frontGradient;
        }
        this.frontPart.stroke = SETTINGS.circle.temp.strokeColor.front;
        this.frontPart.linewidth = SETTINGS.circle.temp.strokeWidth.front;
        this.frontPart.opacity = SETTINGS.circle.temp.opacity.front;
        if (SETTINGS.circle.temp.dashArray.front.length > 0) {
          SETTINGS.circle.temp.dashArray.front.forEach(v => {
            (this.frontPart as any).dashes.push(v);
          });
          (this.frontPart as any).offset =
            SETTINGS.circle.temp.dashArray.offset.front;
        }
        //BACK
        if (SETTINGS.circle.temp.fillColor.back === "noFill") {
          this.backFill.noFill();
        } else {
          this.backGradientColor.color = SETTINGS.circle.temp.fillColor.back;
          this.backFill.fill = this.backGradient;
        }
        this.backPart.stroke = SETTINGS.circle.temp.strokeColor.back;
        this.backPart.linewidth = SETTINGS.circle.temp.strokeWidth.back;
        this.backPart.opacity = SETTINGS.circle.temp.opacity.back;
        if (SETTINGS.circle.temp.dashArray.back.length > 0) {
          SETTINGS.circle.temp.dashArray.back.forEach(v => {
            (this.backPart as any).dashes.push(v);
          });
          (this.backPart as any).offset =
            SETTINGS.circle.temp.dashArray.offset.back;
        }
        // The temporary display is never highlighted
        (this.glowingFrontPart as any).visible = false;
        (this.glowingBackPart as any).visible = false;
        break;
      }

      case DisplayStyle.GLOWING: {
        // The style for the glowing circle display.  These options are not user modifiable.
        // Created with the Google Sheet "Circle Styling Code" in the "Glowing" tab

        // FRONT
        this.glowingFrontPart.stroke =
          SETTINGS.circle.glowing.strokeColor.front;
        this.glowingFrontPart.linewidth =
          SETTINGS.circle.glowing.edgeWidth +
          SETTINGS.circle.drawn.strokeWidth.front;
        this.glowingFrontPart.opacity = SETTINGS.circle.glowing.opacity.front;
        if (SETTINGS.circle.glowing.dashArray.front.length > 0) {
          SETTINGS.circle.glowing.dashArray.front.forEach(v => {
            (this.glowingFrontPart as any).dashes.push(v);
          });
          (this.glowingFrontPart as any).offset =
            SETTINGS.circle.glowing.dashArray.offset.front;
        }
        // BACK
        this.glowingBackPart.stroke = SETTINGS.circle.glowing.strokeColor.back;
        this.glowingBackPart.linewidth =
          SETTINGS.circle.glowing.edgeWidth +
          SETTINGS.circle.drawn.strokeWidth.back;
        this.glowingBackPart.opacity = SETTINGS.circle.glowing.opacity.back;
        if (SETTINGS.circle.glowing.dashArray.back.length > 0) {
          SETTINGS.circle.glowing.dashArray.back.forEach(v => {
            (this.glowingBackPart as any).dashes.push(v);
          });
          (this.glowingBackPart as any).offset =
            SETTINGS.circle.glowing.dashArray.offset.back;
        }
        break;
      }
      case DisplayStyle.UPDATE: {
        // Use the current variables to update the display style
        // Created with the Google Sheet "Circle Styling Code" in the "Drawn Update" tab

        // FRONT
        if (this.fillColorFront === "noFill") {
          this.frontFill.noFill();
        } else {
          this.frontGradientColor.color = this.fillColorFront;
          this.frontFill.fill = this.frontGradient;
        }
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
        // BACK
        if (this.fillColorBack === "noFill") {
          this.backFill.noFill();
        } else {
          this.backGradientColor.color = this.fillColorBack;
          this.backFill.fill = this.backGradient;
        }
        this.backPart.stroke = this.strokeColorBack;
        this.backPart.linewidth = this.strokeWidthBack;
        this.backPart.opacity = this.opacityBack;
        if (this.dashArrayBack.length > 0) {
          (this.backPart as any).dashes.length = 0;
          this.dashArrayBack.forEach(v => {
            (this.backPart as any).dashes.push(v);
          });
          (this.backPart as any).offset = this.dashArrayOffsetBack;
        }
        // UPDATE the glowing width so it is always bigger than the drawn width
        this.glowingFrontPart.linewidth =
          SETTINGS.circle.glowing.edgeWidth + this.strokeWidthFront;
        this.glowingBackPart.linewidth =
          SETTINGS.circle.glowing.edgeWidth + this.strokeWidthBack;
        break;
      }
      case DisplayStyle.DEFAULT:
      default: {
        // Reset the style to the defaults i.e. Use the global defaults to update the display style
        // Created with the Google Sheet "Circle Styling Code" in the "Drawn Set To Defaults" tab
        // FRONT
        if (SETTINGS.circle.drawn.fillColor.front === "noFill") {
          this.frontFill.noFill();
        } else {
          this.frontGradientColor.color = SETTINGS.circle.drawn.fillColor.front;
          this.frontFill.fill = this.frontGradient;
        }
        this.frontPart.stroke = SETTINGS.circle.drawn.strokeColor.front;
        this.frontPart.linewidth = SETTINGS.circle.drawn.strokeWidth.front;
        this.frontPart.opacity = SETTINGS.circle.drawn.opacity.front;
        if (SETTINGS.circle.drawn.dashArray.front.length > 0) {
          (this.frontPart as any).dashes.length = 0;
          SETTINGS.circle.drawn.dashArray.front.forEach(v => {
            (this.frontPart as any).dashes.push(v);
          });
          (this.frontPart as any).offset =
            SETTINGS.circle.drawn.dashArray.offset.front;
        }
        // BACK
        if (SETTINGS.circle.drawn.fillColor.back === "noFill") {
          this.backFill.noFill();
        } else {
          this.backGradientColor.color = SETTINGS.circle.drawn.fillColor.back;
          this.backFill.fill = this.backGradient;
        }
        this.backPart.stroke = SETTINGS.circle.drawn.strokeColor.back;
        this.backPart.linewidth = SETTINGS.circle.drawn.strokeWidth.back;
        this.backPart.opacity = SETTINGS.circle.drawn.opacity.back;
        if (SETTINGS.circle.drawn.dashArray.back.length > 0) {
          (this.backPart as any).dashes.length = 0;
          SETTINGS.circle.drawn.dashArray.back.forEach(v => {
            (this.backPart as any).dashes.push(v);
          });
          (this.backPart as any).offset =
            SETTINGS.circle.drawn.dashArray.offset.back;
        }
        // UPDATE the glowing width so it is always bigger than the drawn width
        this.glowingFrontPart.linewidth =
          SETTINGS.circle.glowing.edgeWidth +
          SETTINGS.circle.drawn.strokeWidth.front;
        this.glowingBackPart.linewidth =
          SETTINGS.circle.glowing.edgeWidth +
          SETTINGS.circle.drawn.strokeWidth.back;
        break;
      }
    }
  }
}
