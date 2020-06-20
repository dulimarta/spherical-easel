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
   * The styling of the front/back/glowing/temp/not parts of the circle
   * The user can modify these
   */
  private fillColorFront = SETTINGS.circle.drawn.fillColor.front;
  private fillColorBack = SETTINGS.circle.drawn.fillColor.back;
  private strokeColorFront = SETTINGS.circle.drawn.strokeColor.front;
  private strokeColorBack =
    /*SETTINGS.circle.dynamicBackStyle
      ? Nodule.contrastColorString(this.frontStokeColor)
      : */ SETTINGS
      .circle.drawn.strokeColor.back;
  private strokeWidthFront = SETTINGS.circle.drawn.strokeWidth.front;
  private strokeWidthBack =
    /*SETTINGS.circle.dynamicBackStyle
  ? Nodule.contrastStrokeWidth(this.frontStokeWidth)
  : */ SETTINGS
      .circle.drawn.strokeWidth.back;
  private opacityFront = SETTINGS.circle.drawn.opacity.front;
  private opacityBack =
    /*SETTINGS.circle.dynamicBackStyle
  ? Nodule.contrastOpacity(this.frontOpacity)
  : */ SETTINGS
      .circle.drawn.opacity.back;
  private dashingArrayFront = SETTINGS.circle.drawn.dashArray.front;
  private dashingArrayBack =
    /*SETTINGS.circle.dynamicBackStyle
  ? Nodule.contrastDashArray(this.dashingArrayFront)
  : */ SETTINGS
      .circle.drawn.dashArray.back;
  private dashingOffsetFront = SETTINGS.circle.drawn.dashArray.offset.front;
  private dashingOffsetBack = SETTINGS.circle.drawn.dashArray.offset.back;
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
  private majorLine: Two.Line;

  constructor(center?: Vector3, arcRadius?: number) {
    super();

    // For debugging
    // Draw the segment on the positive X-axis of the circle/ellipse
    this.majorLine = new Two.Line(0, 0, SETTINGS.boundaryCircle.radius, 0);
    this.add(this.majorLine);

    // Create the initial front and back vertices (glowing and not)
    const frontVertices: Two.Vector[] = [];
    const backVertices: Two.Vector[] = [];
    const glowingFrontVertices: Two.Vector[] = [];
    const glowingBackVertices: Two.Vector[] = [];
    // TODO: Is there a way for the glowing and not vertices to be the same?  I tried and it didn't seem to work.
    for (let k = 0; k < Math.ceil(SUBDIVISIONS / 2); k++) {
      const angle = (k * Math.PI) / Math.ceil(SUBDIVISIONS / 2); // [0, pi)
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
      glowingFrontVertices.push(
        new Two.Vector(
          SETTINGS.boundaryCircle.radius * Math.cos(angle),
          SETTINGS.boundaryCircle.radius * Math.sin(angle)
        )
      );
      glowingBackVertices.push(
        new Two.Vector(
          SETTINGS.boundaryCircle.radius * Math.cos(angle + Math.PI), // [pi, 2*pi)
          SETTINGS.boundaryCircle.radius * Math.sin(angle + Math.PI)
        )
      );
    }
    this.frontPart = new Two.Path(
      frontVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    this.glowingFrontPart = new Two.Path(
      glowingFrontVertices, // This is not a new array of vertices, I'm trying to get glowing and not to share an array
      /*closed*/ false,
      /*curve*/ false
    );
    this.backPart = new Two.Path(
      backVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    this.glowingBackPart = new Two.Path(
      glowingBackVertices, // This is not a new array of vertices, I'm trying to get glowing and not to share an array
      /*closed*/ false,
      /*curve*/ false
    );
    this.add(this.backPart);
    this.add(this.frontPart);
    this.add(this.glowingBackPart);
    this.add(this.glowingFrontPart);

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

    this.name = "Circle-" + this.id;
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

    // A parts becomes closed when the other part vanishes
    this.frontPart.closed = backLen === 0;
    this.backPart.closed = frontLen === 0;
    this.glowingFrontPart.closed = backLen === 0;
    this.glowingBackPart.closed = frontLen === 0;
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
    (this.frontPart as any).visible = true;
    (this.glowingFrontPart as any).visible = true;
  }
  backGlowStyle(): void {
    (this.backPart as any).visible = true;
    (this.glowingBackPart as any).visible = true;
  }

  glowStyle(): void {
    this.frontGlowStyle();
    this.backGlowStyle();
  }

  frontNormalStyle(): void {
    (this.frontPart as any).visible = true;
    (this.glowingFrontPart as any).visible = false;
  }

  backNormalStyle(): void {
    (this.backPart as any).visible = true;
    (this.glowingBackPart as any).visible = false;
  }

  normalStyle(): void {
    this.frontNormalStyle();
    this.backNormalStyle();
  }

  /**
   * This method is used to copy the temporary circle created with the Circle Tool into a
   * permanent one in the scene.
   */
  clone(): this {
    // Use the constructor for this class to create a template to copy over the
    // values from the current (the `this`) Circle object
    const dup = new Circle(this.center_, this.arcRadius);
    dup.rotation = this.rotation;
    dup.translation.copy(this.translation);
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
    this.frontPart.addTo(layers[LAYER.foreground]);
    this.glowingFrontPart.addTo(layers[LAYER.foregroundGlowing]);
    this.backPart.addTo(layers[LAYER.background]);
    this.glowingBackPart.addTo(layers[LAYER.backgroundGlowing]);
  }
  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontPart.remove();
    this.glowingFrontPart.remove();
    this.backPart.remove();
    this.glowingBackPart.remove();
  }
  adjustSizeForZoom(factor: number): void {
    throw new Error("Method not implemented.");
  }

  //set the rendering style of the circle
  stylize(flag: string): void {
    switch (flag) {
      case "temporary": {
        // The style for the temporary circle displayed.  These options are not user modifiable.
        this.frontPart.opacity = SETTINGS.circle.temp.opacity.front;
        this.backPart.opacity = SETTINGS.circle.temp.opacity.back;
        this.frontPart.linewidth = SETTINGS.circle.temp.strokeWidth.front;
        this.backPart.linewidth = SETTINGS.circle.temp.strokeWidth.back;
        this.frontPart.stroke = SETTINGS.circle.temp.strokeColor.front;
        this.backPart.stroke = SETTINGS.circle.temp.strokeColor.back;
        if (SETTINGS.circle.temp.fillColor.front === "noFill") {
          this.frontPart.noFill();
        } else {
          this.frontPart.fill = SETTINGS.circle.temp.fillColor.front;
        }
        if (SETTINGS.circle.temp.fillColor.back === "noFill") {
          this.backPart.noFill();
        } else {
          this.backPart.fill = SETTINGS.circle.temp.fillColor.back;
        }
        // The temporary display is never highlighted
        (this.glowingFrontPart as any).visible = false;
        (this.glowingBackPart as any).visible = false;
        break;
      }

      default: {
        // Turn on the glowing parts that were hidden during the creation of the object
        (this.glowingFrontPart as any).visible = false;
        (this.glowingBackPart as any).visible = false;
        //Set the styles of the front/back/glowing/drawn parts
        // Fill Color
        if (this.fillColorFront === "noFill") {
          this.frontPart.noFill();
        } else {
          this.frontPart.fill = this.fillColorFront;
        }
        if (this.fillColorBack === "noFill") {
          this.backPart.noFill();
        } else {
          this.backPart.fill = this.fillColorBack;
        }
        this.glowingBackPart.noFill(); // the glowing circle is never filled
        this.glowingFrontPart.noFill(); // the glowing circle is never filled

        // Stroke Width
        this.frontPart.linewidth = this.strokeWidthFront;
        this.backPart.linewidth = this.strokeWidthBack;
        this.glowingFrontPart.linewidth =
          SETTINGS.circle.glowing.edgeWidth + this.strokeWidthFront;
        this.glowingBackPart.linewidth =
          SETTINGS.circle.glowing.edgeWidth + this.strokeWidthBack;

        // Stroke color
        this.frontPart.stroke = this.strokeColorFront;
        this.backPart.stroke = this.strokeColorBack;
        this.glowingFrontPart.stroke =
          SETTINGS.circle.glowing.strokeColor.front;
        this.glowingBackPart.stroke = SETTINGS.circle.glowing.strokeColor.back;

        // Opacity
        this.frontPart.opacity = this.opacityFront;
        this.backPart.opacity = this.opacityBack;
        this.glowingFrontPart.opacity = SETTINGS.circle.glowing.opacity.front;
        this.glowingBackPart.opacity = SETTINGS.circle.glowing.opacity.back;

        // Dashing
        if (this.dashingArrayFront.length > 0) {
          (this.frontPart as any).dashes.concat(this.dashingArrayFront);
          (this.frontPart as any).offset = this.dashingOffsetFront;
        }

        if (this.dashingArrayBack.length > 0) {
          this.dashingArrayBack.forEach(v => {
            (this.backPart as any).dashes.push(v);
          });
          (this.backPart as any).offset = this.dashingOffsetBack;
        }
        // There is no dashing on the glowing objects. For now.
        //statements;
        break;
      }
    }
  }
}
