/** @format */

import { Vector3, Vector2, Matrix4, UnsignedShort4444Type } from "three";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import AppStore from "@/store";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
const Z_AXIS = new Vector3(0, 0, 1);
const transformMatrix = new Matrix4();
const CIRCLEEDGESUBDIVISIONS = SETTINGS.angleMarker.numCirclePoints;
//const EDGESUBDIVISIONS = SETTINGS.angleMarker.numEdgePoints;
let ANGLEMARKER_COUNT = 0;

/**
 * For drawing angle markers. The circular part of an angle marker consists of two paths (front and back) and a storage path
 * the total number of vertices in the front/back/storage is 2*CIRCLEEDGESUBDIVISIONS.
 * We initially assign the same number of segments/subdivisions to each front/back path and storage empty,
 * but as the angle marker is being deformed and moved the number of subdivisions on each path (front/back/storage)
 * may change: longer path will hold more subdivision points (while keeping the
 * total points 2*CIRCLEEDGESUBDIVISIONS so we don't create/remove new points)
 */
export default class AngleMarker extends Nodule {
  /**
   * The vertex vector of the angle marker in ideal unit sphere.
   */
  private _vertexVector = new Vector3();

  /**
   * The start vector of the angle marker in ideal unit sphere. The righthand rule is used to determine the
   * direction of the angle marker. Put your righthand at the _vertexVector (thumb away from center of sphere)
   *  and your fingers in the direction of _startVector. The region swept out is the angle marker.
   */
  private _startVector = new Vector3();

  /**
   * The end vector of the angle marker in ideal unit sphere.
   */
  private _endVector = new Vector3();

  /**
   *
   * NOTE: Once the above three variables are set, the updateDisplay() will correctly render the angleMarker.
   * These are the only pieces of information that are need to do the rendering. All other
   * calculations in this class are only for the purpose of rendering the segment.
   */

  /**
   * The radius of the angle marker. This get scaled by angleMarkerRadiusPercent
   */
  private _angleMarkerRadius = SETTINGS.angleMarker.defaultRadius;
  /**
   * Vuex global state
   */
  protected store = AppStore; //

  /**
   * The TwoJS objects to display the front/back parts and their glowing counterparts.
   */
  // private frontStartPath: Two.Path;
  // private backStartPath: Two.Path;
  // private frontEndPath: Two.Path;
  // private backEndPath: Two.Path;
  private frontCirclePath: Two.Path;
  private backCirclePath: Two.Path;
  private storageCirclePath: Two.Path; // a non-displayed path that hold un-used vertices from front/backCirclePath so that the sum of the number of vertices in storage + front + back is constant
  // private glowingFrontStartPath: Two.Path;
  // private glowingBackStartPath: Two.Path;
  // private glowingFrontEndPath: Two.Path;
  // private glowingBackEndPath: Two.Path;
  private glowingFrontCirclePath: Two.Path;
  private glowingBackCirclePath: Two.Path;
  private glowingStorageCirclePath: Two.Path;

  /**
   * The TwoJS objects to display the front/back fill. These are different than the front/back parts
   *  because when the angle marker is dragged between the front and back, the fill region includes some
   *  of the boundary circle and is therefore different from the front/back parts. Also there are six ways that
   *  the boundary circle can intersect an angle marker and one of the has a disconnected pair of regions on the
   *  same side of the front/back divide. This means that we need two of each front/back fill region.
   */
  // private frontFill1: Two.Path;
  // private backFill1: Two.Path;
  // private frontFill2: Two.Path;
  // private backFill2: Two.Path;

  /**
   * The styling variables for the drawn angle marker. The user can modify these.
   */
  // Front
  private fillColorFront = SETTINGS.angleMarker.drawn.fillColor.front;
  private strokeColorFront = SETTINGS.angleMarker.drawn.strokeColor.front;
  private glowingStrokeColorFront =
    SETTINGS.angleMarker.glowing.strokeColor.front;
  private strokeWidthPercentFront = 100;
  private dashArrayFront = [] as number[]; // Initialize in constructor
  // Back -- use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
  private fillColorBack = SETTINGS.angleMarker.drawn.fillColor.back;
  private strokeColorBack = SETTINGS.angleMarker.drawn.strokeColor.back;
  private glowingStrokeColorBack =
    SETTINGS.angleMarker.glowing.strokeColor.back;
  private strokeWidthPercentBack = 100;
  private dashArrayBack = [] as number[]; // Initialize in constructor
  private dynamicBackStyle = SETTINGS.angleMarker.dynamicBackStyle;
  //Applies to both sides
  private angleMarkerRadiusPercent = 100;

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

  /** Initialize the current line width that is adjust by the zoom level and the user widthPercent */
  static currentAngleMarkerStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.front;
  static currentAngleMarkerStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.back;
  static currentGlowingAngleMarkerStrokeWidthFront =
    SETTINGS.angleMarker.drawn.strokeWidth.front +
    SETTINGS.angleMarker.glowing.edgeWidth;
  static currentGlowingAngleMarkerStrokeWidthBack =
    SETTINGS.angleMarker.drawn.strokeWidth.back +
    SETTINGS.angleMarker.glowing.edgeWidth;

  /**
   * Update all the current stroke widths
   * @param factor The ratio of the current magnification factor over the old magnification factor
   */
  static updateCurrentStrokeWidthForZoom(factor: number): void {
    AngleMarker.currentAngleMarkerStrokeWidthFront *= factor;
    AngleMarker.currentAngleMarkerStrokeWidthBack *= factor;
    AngleMarker.currentGlowingAngleMarkerStrokeWidthFront *= factor;
    AngleMarker.currentGlowingAngleMarkerStrokeWidthBack *= factor;
  }

  /**
   * This is the list of original vertices of a circle in the XY plane of radius
   * SETTINGS.boundaryCircle.radius. There are SETTINGS.angleMarker.subdivisions of these vertices
   */
  private originalVertices: Vector2[];

  /**
   * For temporary calculation with ThreeJS objects
   */
  private tmpVector = new Vector3();
  private tmpMatrix = new Matrix4();

  constructor() {
    super();
    this.name = "AngleMarker-" + ANGLEMARKER_COUNT++;
    // Create the initial front and back vertices (glowing/not/fill)
    // const frontStartVertices: Two.Vector[] = [];
    // const backStartVertices: Two.Vector[] = [];
    // const frontEndVertices: Two.Vector[] = [];
    // const backEndVertices: Two.Vector[] = [];
    const frontCircleVertices: Two.Vector[] = [];
    const backCircleVertices: Two.Vector[] = [];
    const storageVertices: Two.Vector[] = [];
    // const glowingFrontStartVertices: Two.Vector[] = [];
    // const glowingBackStartVertices: Two.Vector[] = [];
    // const glowingFrontEndVertices: Two.Vector[] = [];
    // const glowingBackEndVertices: Two.Vector[] = [];
    const glowingFrontCircleVertices: Two.Vector[] = [];
    const glowingBackCircleVertices: Two.Vector[] = [];
    const glowingStorageVertices: Two.Vector[] = [];
    // const frontFill1Vertices: Two.Vector[] = [];
    // const backFill1Vertices: Two.Vector[] = [];
    // const frontFill2Vertices: Two.Vector[] = [];
    // const backFill2Vertices: Two.Vector[] = [];

    // As the angle marker is moved around the vertices on the circle edge part are passed between the front, back and storage parts, but it
    //  is always true that
    //   frontCirclePath.vertices.length + backCirclePath.vertices.length + storageCirclePath.vertices.length = 2*CIRCLEEDGESUBDIVISIONS
    //  ??As the angle marker is moved around the some of the frontVertices are the same as the ones on the
    //  ?? frontFillVertices, but it is always true that frontVertices.length + number of non-front Vertices in
    //  ?? frontFillVertices = SUBDIVISIONS
    //  ??  The non-frontVertices are ones on the boundary circle.
    //   Similar for the back vertices. Initially the length of back/front circle vertices is CIRCLEEDGESUBDIVISIONS.
    for (let k = 0; k < Math.ceil(CIRCLEEDGESUBDIVISIONS / 2); k++) {
      const angle = (k * Math.PI) / Math.ceil(CIRCLEEDGESUBDIVISIONS / 2); // [0, pi)
      const x = SETTINGS.boundaryCircle.radius * Math.cos(angle);
      const x1 = SETTINGS.boundaryCircle.radius * Math.cos(angle + Math.PI);
      const y = SETTINGS.boundaryCircle.radius * Math.sin(angle);
      const y1 = SETTINGS.boundaryCircle.radius * Math.sin(angle + Math.PI);
      frontCircleVertices.push(new Two.Vector(x, y));
      //frontFillVertices.push(new Two.Vector(x, y), new Two.Vector(x1, y1));
      backCircleVertices.push(new Two.Vector(x1, y1));
      //backFillVertices.push(new Two.Vector(x, y), new Two.Vector(x1, y1));
      glowingFrontCircleVertices.push(new Two.Vector(x, y));
      glowingBackCircleVertices.push(new Two.Vector(x1, y1));
    }
    this.frontCirclePath = new Two.Path(
      frontCircleVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    this.glowingFrontCirclePath = new Two.Path(
      glowingFrontCircleVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    // this.frontFill = new Two.Path(
    //   frontFillVertices,
    //   /*closed*/ true,
    //   /*curve*/ false
    // );
    this.backCirclePath = new Two.Path(
      backCircleVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    this.glowingBackCirclePath = new Two.Path(
      glowingBackCircleVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    // this.backFill = new Two.Path(
    //   backFillVertices,
    //   /*closed*/ true,
    //   /*curve*/ false
    // );

    this.originalVertices = [];

    frontCircleVertices.forEach(v => {
      this.originalVertices.push(new Vector2(v.x, v.y));
    });
    backCircleVertices.forEach(v => {
      this.originalVertices.push(new Vector2(v.x, v.y));
    });

    // Set the styles that are always true
    // The front/back parts have no fill because that is handled by the front/back fill
    // The front/back fill have no stroke because that is handled by the front/back part
    this.frontCirclePath.noFill();
    this.backCirclePath.noFill();
    //this.frontFill.noStroke();
    //this.backFill.noStroke();
    this.glowingFrontCirclePath.noFill();
    this.glowingBackCirclePath.noFill();

    if (SETTINGS.angleMarker.drawn.dashArray.front.length > 0) {
      SETTINGS.angleMarker.drawn.dashArray.front.forEach(v =>
        this.dashArrayFront.push(v)
      );
    }
    if (SETTINGS.angleMarker.drawn.dashArray.back.length > 0) {
      SETTINGS.angleMarker.drawn.dashArray.back.forEach(v =>
        this.dashArrayBack.push(v)
      );
    }

    //initialize the storage pool path for the circle path vertices and turn off the display
    this.storageCirclePath = new Two.Path(
      storageVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    this.storageCirclePath.remove();
    this.glowingStorageCirclePath = new Two.Path(
      glowingStorageVertices,
      /*closed*/ false,
      /*curve*/ false
    );
    this.glowingStorageCirclePath.remove();
  }
  /**
   * Map part of a circle in standard position to the location and orientation of the angleMarker
   * This method updates the TwoJS objects (frontCirclePath, , ...) for display
   * This is only accurate if the vertexVector, startVector, and endVector are correct so only
   * call this method once those variables are updated.
   */
  public updateDisplay(): void {
    // Create a matrix4 in the three.js package (called transformMatrix) that maps a circle in standard position (i.e. the
    //  original circle with vertices forming a circle in the plane z=0 of radius SETTINGS.boundaryCircle.radius) onto
    //  the one in the target desired (updated) position (i.e. the target circle). In the final mapping only part of the circle will be
    //  used to trace out the angle marker which is a segment of a circle.

    // First set up the coordinate system of the target circle
    // The vector to the circle center is ALSO the normal direction of the circle
    desiredZAxis.copy(this._vertexVector).normalize();
    // Any vector perpendicular the desired z axis can be the desired x axis, but we want one that points from the origin to the
    // the projection of the startVector onto the plane perpendicular to the desiredZAxis.
    this.tmpVector
      .crossVectors(this._vertexVector, this._startVector)
      .normalize();
    desiredXAxis.crossVectors(this.tmpVector, this._vertexVector).normalize();

    // Use the cross product to create the vector perpendicular to both the desired z and x axis
    desiredYAxis.crossVectors(desiredZAxis, desiredXAxis).normalize();

    // Set up the local coordinates from for the circle,
    //  transformMatrix will now map (1,0,0) to the point on the desired x axis a unit from the origin in the positive direction.
    transformMatrix.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);

    //Now appropriately translate and scale the circle in standard position to the one in the desired location

    //Compute the angular/intrinsic radius of the circle
    const angleMarkerRadius = this._vertexVector.angleTo(this._startVector);

    // translate along the Z of the local coordinate frame
    // The standard circle plane (z=0) is below the plane of the target circle so translate the plane z=0 to the
    // the target circle plane
    const distanceFromOrigin = Math.cos(angleMarkerRadius);
    this.tmpMatrix.makeTranslation(
      0,
      0,
      distanceFromOrigin * SETTINGS.boundaryCircle.radius
    );
    transformMatrix.multiply(this.tmpMatrix);
    // The target circle is scaled version of the original circle (but now in the plane of the target circle)
    // so scale XYZ space in the XY directions by the projected radius (z direction by 1)
    // this will make the original circle (in the plane of the target circle) finally coincide with the target circle
    this.tmpMatrix.makeScale(
      Math.sin(angleMarkerRadius),
      Math.sin(angleMarkerRadius),
      1
    );
    transformMatrix.multiply(this.tmpMatrix); // transformMatrix now maps the original circle to the target circle

    // Now figure out the angular length of the angle marker using the endVector
    // First project endVector on the plane perpendicular to the vertexVector
    this.tmpVector.copy(this._endVector);
    this.tmpVector.addScaledVector(
      this._vertexVector,
      -1 * this._vertexVector.dot(this._endVector)
    );

    // Now use the atan2 function in the plane perpendicular to vertexVector where the positive x axis is the desiredXAxis
    //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
    // Returns angle in the range (-pi,pi] to convert to [0,2pi) use modulus 2*Pi operator
    // Note that while in most languages, ‘%’ is a remainder operator, in some (e.g. Python, Perl) it is a
    // modulo operator. For positive values, the two are equivalent, but when the dividend and divisor are
    // of different signs, they give different results. To obtain a modulo in JavaScript,
    // in place of a % n, use ((a % n ) + n ) % n.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder

    const angularLengthOfMarker = Math.atan2(
      desiredYAxis.dot(this.tmpVector),
      desiredXAxis.dot(this.tmpVector)
    ).modTwoPi();
    //console.log("angularLength", angularLengthOfMarker);
    // Recalculate the 2D coordinate of the TwoJS path (From the originalVertices array)
    // As we drag the mouse, the number of vertices in the front half
    // and back half are dynamically changing and to avoid
    // allocating and de-allocating arrays, we dynamically transfers
    // elements between the three (front/back/storage paths)

    let frontCircleIndex = 0; // the number added to the front path
    let backCircleIndex = 0; // the number added to the back path
    let frontCircleLen = this.frontCirclePath.vertices.length;
    let backCircleLen = this.backCirclePath.vertices.length;
    let firstFrontCircleIndexInOriginal = -1; // the index (in original vertices) of the first vertex added to the front
    let firstBackCircleIndexInOriginal = -1; // the index (in original vertices) of the first vertex added to the back

    this.originalVertices.forEach((v: Vector2, pos: number) => {
      // Only add a transformed vertex if the angle it makes with the positive x axis in the original circle
      // (the one with radius SETTINGS.boundaryCircle.radius in the plane z=0) is less than angularLengthOfMarker.
      // store the remaining vertices in the storageCirclePath
      //NOTE: the syntax for atan2 is atan2(y,x) and returns a value in (-pi,pi]!!!!!
      if (Math.atan2(v.y, v.x).modTwoPi() <= angularLengthOfMarker) {
        this.tmpVector.set(v.x, v.y, 0);
        this.tmpVector.applyMatrix4(transformMatrix);

        // When the Z-coordinate is negative, the vertex belongs the
        // the back side of the sphere
        if (this.tmpVector.z > 0) {
          if (firstFrontCircleIndexInOriginal === -1)
            firstFrontCircleIndexInOriginal = pos;
          if (frontCircleIndex >= frontCircleLen) {
            // Steal one element from the backPath or storage
            let extra;
            if (this.backCirclePath.vertices.length !== 0) {
              extra = this.backCirclePath.vertices.pop();
              backCircleLen--;
            } else {
              extra = this.storageCirclePath.vertices.pop();
            }
            this.frontCirclePath.vertices.push(extra!);

            let glowExtra;
            if (this.glowingBackCirclePath.vertices.length !== 0) {
              glowExtra = this.glowingBackCirclePath.vertices.pop();
            } else {
              glowExtra = this.glowingStorageCirclePath.vertices.pop();
            }
            this.glowingFrontCirclePath.vertices.push(glowExtra!);
            frontCircleLen++;
          }
          this.frontCirclePath.vertices[frontCircleIndex].x = this.tmpVector.x;
          this.frontCirclePath.vertices[frontCircleIndex].y = this.tmpVector.y;

          this.glowingFrontCirclePath.vertices[
            frontCircleIndex
          ].x = this.tmpVector.x;
          this.glowingFrontCirclePath.vertices[
            frontCircleIndex
          ].y = this.tmpVector.y;
          frontCircleIndex++;
        } else {
          if (firstBackCircleIndexInOriginal === -1)
            firstBackCircleIndexInOriginal = pos;
          if (backCircleIndex >= backCircleLen) {
            // Steal one element from the frontPath or storage
            let extra;
            if (this.frontCirclePath.vertices.length !== 0) {
              extra = this.frontCirclePath.vertices.pop();
              frontCircleLen--;
            } else {
              extra = this.storageCirclePath.vertices.pop();
            }
            this.backCirclePath.vertices.push(extra!);

            let glowingExtra;
            if (this.glowingFrontCirclePath.vertices.length !== 0) {
              glowingExtra = this.glowingFrontCirclePath.vertices.pop();
            } else {
              glowingExtra = this.glowingStorageCirclePath.vertices.pop();
            }
            this.glowingBackCirclePath.vertices.push(glowingExtra!);
            backCircleLen++;
          }
          this.backCirclePath.vertices[backCircleIndex].x = this.tmpVector.x;
          this.backCirclePath.vertices[backCircleIndex].y = this.tmpVector.y;

          this.glowingBackCirclePath.vertices[
            backCircleIndex
          ].x = this.tmpVector.x;
          this.glowingBackCirclePath.vertices[
            backCircleIndex
          ].y = this.tmpVector.y;
          backCircleIndex++;
        }
      }
    });
    // Collect (into the storage pool) any vertices that are
    //  1) extra (i.e. leftover -- not overwritten -- from previous renderings of) front vertices
    //  2) extra (i.e. leftover -- not overwritten -- from previous renderings of) back vertices

    //Handle case 1
    for (let i = frontCircleIndex; i < frontCircleLen; i++) {
      this.storageCirclePath.vertices.push(
        this.frontCirclePath.vertices.pop()!
      );

      this.glowingStorageCirclePath.vertices.push(
        this.glowingFrontCirclePath.vertices.pop()!
      );
    }

    // Handle case 2
    for (let i = backCircleIndex; i < backCircleLen; i++) {
      this.storageCirclePath.vertices.push(this.backCirclePath.vertices.pop()!);

      this.glowingStorageCirclePath.vertices.push(
        this.glowingBackCirclePath.vertices.pop()!
      );
    }

    // update the lengths of the front/back paths
    backCircleLen = this.backCirclePath.vertices.length;
    frontCircleLen = this.frontCirclePath.vertices.length;

    // Rotate the array elements to remove gap
    if (
      firstBackCircleIndexInOriginal < firstFrontCircleIndexInOriginal &&
      firstFrontCircleIndexInOriginal <=
        firstBackCircleIndexInOriginal + backCircleLen
    ) {
      // There is a gap in the back path
      this.backCirclePath.vertices.rotate(firstFrontCircleIndexInOriginal);
      this.glowingBackCirclePath.vertices.rotate(
        firstFrontCircleIndexInOriginal
      );
    } else if (
      firstFrontCircleIndexInOriginal < firstBackCircleIndexInOriginal &&
      firstBackCircleIndexInOriginal <=
        firstFrontCircleIndexInOriginal + frontCircleLen
    ) {
      // There is a gap in the front path
      this.frontCirclePath.vertices.rotate(firstBackCircleIndexInOriginal); // element at index firstBackCircleIndexInOriginal becomes the index 0 element in this array
      this.glowingFrontCirclePath.vertices.rotate(
        firstBackCircleIndexInOriginal
      );
    }

    //Now build the front/back fill objects based on the front/back parts

    // // The circle interior is only on the front of the sphere
    // if (backCircleLen === 0 && this._circleRadius < Math.PI / 2) {
    //   // In this case the frontFillVertices are the same as the frontVertices
    //   this.frontFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     v.x = this.frontPart.vertices[index].x;
    //     v.y = this.frontPart.vertices[index].y;
    //   });
    //   // Only the front fill is displayed
    //   this.frontFill.visible = true;
    //   this.backFill.visible = false;
    // }

    // // The circle interior is split between front and back
    // if (backCircleLen !== 0 && frontCircleLen !== 0) {
    //   //} && this.arcRadius < Math.PI / 2) {
    //   //find the angular width of the part of the boundary circle to be copied
    //   // Compute the angle from the positive x axis to the last frontPartVertex
    //   const startAngle = Math.atan2(
    //     this.frontPart.vertices[frontCircleLen - 1].y,
    //     this.frontPart.vertices[frontCircleLen - 1].x
    //   );

    //   // Compute the angle from the positive x axis to the first frontPartVertex
    //   const endAngle = Math.atan2(
    //     this.frontPart.vertices[0].y,
    //     this.frontPart.vertices[0].x
    //   );

    //   // Compute the angular width of the section of the boundary circle to add to the front/back fill
    //   // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
    //   let angularWidth = endAngle - startAngle;
    //   if (angularWidth < 0) {
    //     angularWidth += 2 * Math.PI;
    //   }
    //   //console.log(angularWidth);
    //   // When tracing the boundary circle we start from fromVector = this.frontPart.vertices[frontCircleLen - 1]
    //   const fromVector = new Two.Vector(
    //     this.frontPart.vertices[frontCircleLen - 1].x,
    //     this.frontPart.vertices[frontCircleLen - 1].y
    //   );
    //   // then
    //   // trace in the direction of a toVector that is perpendicular to this.frontPart.vertices[frontCircleLen - 1]
    //   // and points in the same direction as this.frontPart.vertices[0]
    //   const toVector = new Two.Vector(
    //     -this.frontPart.vertices[frontCircleLen - 1].y,
    //     this.frontPart.vertices[frontCircleLen - 1].x
    //   );
    //   if (toVector.dot(this.frontPart.vertices[0]) < 0) {
    //     toVector.multiplyScalar(-1);
    //   }

    //   // If the arcRadius is bigger than Pi/2 then reverse the toVector
    //   if (this._circleRadius > Math.PI / 2) {
    //     toVector.multiplyScalar(-1);
    //   }

    //   // Build the frontFill
    //   // First copy the frontPart into the first part of the frontFill
    //   this.frontFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     if (index < frontCircleLen) {
    //       v.x = this.frontPart.vertices[index].x;
    //       v.y = this.frontPart.vertices[index].y;
    //     } else {
    //       const angle =
    //         (angularWidth / (SUBDIVISIONS - 1 - frontCircleLen)) *
    //         (index - frontCircleLen);
    //       v.x = Math.cos(angle) * fromVector.x + Math.sin(angle) * toVector.x;
    //       v.y = Math.cos(angle) * fromVector.y + Math.sin(angle) * toVector.y;
    //     }
    //   });

    //   // Build the backFill
    //   // First copy the backPart into the first part of the backFill
    //   this.backFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     if (index < backCircleLen) {
    //       v.x = this.backPart.vertices[backCircleLen - 1 - index].x;
    //       v.y = this.backPart.vertices[backCircleLen - 1 - index].y;
    //     } else {
    //       const angle =
    //         (angularWidth / (SUBDIVISIONS - 1 - backCircleLen)) *
    //         (index - backCircleLen);
    //       v.x = Math.cos(angle) * fromVector.x + Math.sin(angle) * toVector.x;
    //       v.y = Math.cos(angle) * fromVector.y + Math.sin(angle) * toVector.y;
    //     }
    //   });
    //   // console.log("front", frontCircleLen, "back", backCircleLen);

    //   // Display front and back
    //   this.frontFill.visible = true;
    //   this.backFill.visible = true;
    // }

    // // The circle interior is only on the back of the sphere
    // if (frontCircleLen === 0 && this._circleRadius < Math.PI / 2) {
    //   // The circle interior is only on the back of the sphere
    //   // In this case the backFillVertices are the same as the backVertices
    //   this.backFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     v.x = this.backPart.vertices[index].x;
    //     v.y = this.backPart.vertices[index].y;
    //   });
    //   // Only the back fill is displayed
    //   this.frontFill.visible = false;
    //   this.backFill.visible = true;
    // }

    // // The circle interior covers the entire front half of the sphere and is a 'hole' on the back
    // if (frontCircleLen === 0 && this._circleRadius > Math.PI / 2) {
    //   // In this case set the frontFillVertices to the entire front of the sphere
    //   this.frontFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     const angle = (index / SUBDIVISIONS) * 2 * Math.PI;
    //     v.x = SETTINGS.boundaryCircle.radius * Math.cos(angle);
    //     v.y = SETTINGS.boundaryCircle.radius * Math.sin(angle);
    //   });

    //   // In this case the backFillVertices must trace out first the boundary circle and then
    //   //  the circle, to trace an annular region.  To help with the rendering, start tracing
    //   //  the boundary circle directly across from the vertex on the circle at index zero
    //   const backStartTrace = Math.atan2(
    //     this.backPart.vertices[0].y,
    //     this.backPart.vertices[0].x
    //   );

    //   this.backFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     if (index <= Math.floor(SUBDIVISIONS / 2) - 2) {
    //       const angle = -((2 * index) / SUBDIVISIONS) * 2 * Math.PI; //must trace in the opposite direction on the back to render the annular region
    //       v.x =
    //         SETTINGS.boundaryCircle.radius * Math.cos(angle + backStartTrace);
    //       v.y =
    //         SETTINGS.boundaryCircle.radius * Math.sin(angle + backStartTrace);
    //       //console.log(index, angle);
    //     } else if (index == Math.floor(SUBDIVISIONS / 2) - 1) {
    //       //make sure the last point on the boundary is the same as the first
    //       v.x = SETTINGS.boundaryCircle.radius * Math.cos(0 + backStartTrace);
    //       v.y = SETTINGS.boundaryCircle.radius * Math.sin(0 + backStartTrace);
    //       //console.log(index, 0);
    //     } else if (
    //       Math.floor(SUBDIVISIONS / 2) <= index &&
    //       index <= SUBDIVISIONS - 2
    //     ) {
    //       v.x = this.backPart.vertices[
    //         2 * (index - Math.floor(SUBDIVISIONS / 2))
    //       ].x;
    //       v.y = this.backPart.vertices[
    //         2 * (index - Math.floor(SUBDIVISIONS / 2))
    //       ].y;
    //       //console.log(index, Math.atan2(v.y, v.x));
    //     } else if (index == SUBDIVISIONS - 1) {
    //       // make sure the last point on the (inner) circle is the same as the first
    //       v.x = this.backPart.vertices[0].x;
    //       v.y = this.backPart.vertices[0].y;
    //       //console.log(index, Math.atan2(v.y, v.x));
    //     }
    //   });

    //   // Both front/back fill are displayed
    //   this.frontFill.visible = true;
    //   this.backFill.visible = true;
    // }

    // // The circle interior covers the entire back half of the sphere and is a 'hole' on the front
    // if (backCircleLen === 0 && this._circleRadius > Math.PI / 2) {
    //   // In this case set the frontFillVertices to the entire front of the sphere
    //   this.backFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     const angle = (index / SUBDIVISIONS) * 2 * Math.PI;
    //     v.x = SETTINGS.boundaryCircle.radius * Math.cos(angle);
    //     v.y = SETTINGS.boundaryCircle.radius * Math.sin(angle);
    //   });

    //   // In this case the backFillVertices must trace out first the boundary circle and then
    //   //  the circle, to trace an annular region.  To help with the rendering, start tracing
    //   //  the boundary circle directly across from the vertex on the circle at index zero
    //   const frontStartTrace = Math.atan2(
    //     this.frontPart.vertices[0].y,
    //     this.frontPart.vertices[0].x
    //   );

    //   this.frontFill.vertices.forEach((v: Two.Anchor, index: number) => {
    //     if (index <= Math.floor(SUBDIVISIONS / 2) - 2) {
    //       const angle = ((2 * index) / SUBDIVISIONS) * 2 * Math.PI;
    //       v.x =
    //         SETTINGS.boundaryCircle.radius * Math.cos(angle + frontStartTrace);
    //       v.y =
    //         SETTINGS.boundaryCircle.radius * Math.sin(angle + frontStartTrace);
    //     } else if (index == Math.floor(SUBDIVISIONS / 2) - 1) {
    //       //make sure the last point on the boundary is the same as the first
    //       v.x = SETTINGS.boundaryCircle.radius * Math.cos(0 + frontStartTrace);
    //       v.y = SETTINGS.boundaryCircle.radius * Math.sin(0 + frontStartTrace);
    //     } else if (
    //       Math.floor(SUBDIVISIONS / 2) <= index &&
    //       index <= SUBDIVISIONS - 2
    //     ) {
    //       v.x = this.frontPart.vertices[
    //         2 * (index - Math.floor(SUBDIVISIONS / 2))
    //       ].x;
    //       v.y = this.frontPart.vertices[
    //         2 * (index - Math.floor(SUBDIVISIONS / 2))
    //       ].y;
    //     } else if (index == SUBDIVISIONS - 1) {
    //       // make sure the last point on the (inner) circle is the same as the first
    //       v.x = this.frontPart.vertices[0].x;
    //       v.y = this.frontPart.vertices[0].y;
    //     }
    //   });

    //   // Both front/back fill are displayed
    //   this.frontFill.visible = true;
    //   this.backFill.visible = true;
    // }
  }

  /**
   * Set the vertex/start/end vectors of the angle marker plottable.
   */
  set vertexVector(newVertex: Vector3) {
    this._vertexVector.copy(newVertex);
  }
  set startVector(newStartVector: Vector3) {
    this._startVector.copy(newStartVector);
  }
  set endVector(newEndVector: Vector3) {
    this._endVector.copy(newEndVector);
  }

  /**
   * Use this method to set the display of the angle marker using three vectors. The angle from vertex to start is *not* necessary the
   * the same aa the angle form vertex to end. This method sets the _vertex, _start, _end vectors (all non-zero and unit) so that
   *  1) angle(_vertex,_start) = angle (_vertex,_end) = angleMarkerRadius
   *  2) _vertex, _start, start are all co-planar (and in this plane, when divided by the line containing _vertex, _start & start are on the same side)
   *  3) _vertex, _end, end are all co-planar (and in this plane, when divided by the line containing _vertex, _end & end are on the same side)
   * @param startVector The *direction* of the start of the angleMarker from tempVertex (assume not parallel with tempVertex)
   * @param vertexVector The vertex of the angle Marker
   * @param endVector The *direction* of the end of the angleMarker from tempVertex (assume not parallel with tempVertex)
   * @param angleMarkerRadius The radius of the angleMarker
   * @returns returns the _start,_vertex,_end vectors and sets those same vectors in AngleMarker
   */
  public setAngleMarkerFromThreeVectors(
    startVector: Vector3,
    vertexVector: Vector3,
    endVector: Vector3,
    angleMarkerRadius: number
  ): Vector3[] {
    // In this case the parents are three points and we have already checked that the (1st and 2nd) and (2nd and 3rd) are not the same or antipodal
    // The vertex of the angle marker is the second selected one
    this._vertexVector.copy(vertexVector).normalize();

    // Create a orthonormal frame using the first and second parent points to set the startVector
    this.tmpVector.crossVectors(this._vertexVector, startVector).normalize(); // tmpVector is now perpendicular to the plane containing the first and second parent vectors
    this.tmpVector.crossVectors(this.tmpVector, this._vertexVector).normalize(); // tmpVector is now perpendicular to the vertexVector and in the plane containing the first(start) and second(vertex) parent vectors

    // Now set the _startVector
    this._startVector.set(0, 0, 0);
    this._startVector.addScaledVector(
      this._vertexVector,
      Math.cos(angleMarkerRadius)
    );
    this._startVector
      .addScaledVector(this.tmpVector, Math.sin(angleMarkerRadius))
      .normalize();

    // Create a orthonormal frame using the third and second parent points to set the endVector
    this.tmpVector.crossVectors(this._vertexVector, endVector).normalize(); // tmpVector is now perpendicular to the plane containing the first and third parent vectors
    this.tmpVector.crossVectors(this.tmpVector, this._vertexVector).normalize(); // tmpVector is now perpendicular to the vertexVector and in the plane containing the first and third parent vectors

    // Now set the _endVector
    this._endVector.set(0, 0, 0);
    this._endVector.addScaledVector(
      this._vertexVector,
      Math.cos(angleMarkerRadius)
    );
    this._endVector
      .addScaledVector(this.tmpVector, Math.sin(angleMarkerRadius))
      .normalize();
    return [this._startVector, this._vertexVector, this._endVector];
  }

  frontGlowingDisplay(): void {
    this.frontCirclePath.visible = true;
    this.glowingFrontCirclePath.visible = true;
  }
  backGlowingDisplay(): void {
    this.backCirclePath.visible = true;
    this.glowingBackCirclePath.visible = true;
  }

  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }

  frontNormalDisplay(): void {
    this.frontCirclePath.visible = true;
    this.glowingFrontCirclePath.visible = false;
  }

  backNormalDisplay(): void {
    this.backCirclePath.visible = true;
    this.glowingBackCirclePath.visible = false;
  }

  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontCirclePath.visible = false;
      this.backCirclePath.visible = false;
      // this.frontFill.visible = false;
      // this.backFill.visible = false;
      this.glowingBackCirclePath.visible = false;
      this.glowingFrontCirclePath.visible = false;
    } else {
      this.normalDisplay();
    }
  }

  setSelectedColoring(flag: boolean): void {
    //set the new colors into the variables
    if (flag) {
      this.glowingStrokeColorFront = SETTINGS.style.selectedColor.front;
      this.glowingStrokeColorBack = SETTINGS.style.selectedColor.back;
    } else {
      this.glowingStrokeColorFront =
        SETTINGS.angleMarker.glowing.strokeColor.front;
      this.glowingStrokeColorBack =
        SETTINGS.angleMarker.glowing.strokeColor.back;
    }
    // apply the new color variables to the object
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }
  /**
   * This method is used to copy the temporary angleMarker created with the Angle Tool (in the midground) into a
   * permanent one in the scene (in the the correct layer).
   */
  clone(): this {
    // Use the constructor for this class to create a template to copy over the
    // values from the current (the `this`) Angle Marker object
    const dup = new AngleMarker();
    dup._vertexVector.copy(this._vertexVector);
    dup._startVector.copy(this._startVector);
    dup._endVector.copy(this._endVector);

    // Duplicate the important non-glowing path properties
    dup.frontCirclePath.rotation = this.frontCirclePath.rotation;
    dup.frontCirclePath.translation.copy(this.frontCirclePath.translation);
    dup.backCirclePath.rotation = this.backCirclePath.rotation;
    dup.backCirclePath.translation.copy(this.backCirclePath.translation);
    dup.glowingFrontCirclePath.rotation = this.glowingFrontCirclePath.rotation;
    dup.glowingFrontCirclePath.translation.copy(
      this.glowingFrontCirclePath.translation
    );
    dup.glowingBackCirclePath.rotation = this.glowingBackCirclePath.rotation;
    dup.glowingBackCirclePath.translation.copy(
      this.glowingBackCirclePath.translation
    );

    // The clone (i.e. dup) initially has equal number of vertices for the front and back path
    //  so adjust to match `this`. If one of the this.front or this.back has more vertices then
    //  the corresponding dup part, then remove the excess vertices from the one with more and
    //  move them to the other. Push the remaining vertices into dup.storageCirclePath
    // First Move any extra vertices (ones beyond
    //   this.frontCirclePath.vertices.length+ this.backCirclePath.vertices.length) in the dup.front/back to the dup.storage

    // First add (if necessary) vertices to the frontCirclePath from the backCirclePath
    while (
      dup.frontCirclePath.vertices.length > this.frontCirclePath.vertices.length
    ) {
      // Transfer from frontPath to backPath
      dup.backCirclePath.vertices.push(dup.frontCirclePath.vertices.pop()!);
      dup.glowingBackCirclePath.vertices.push(
        dup.glowingFrontCirclePath.vertices.pop()!
      );
    }

    // Second remove (if necessary) vertices from the frontCirclePath to backCirclePath
    while (
      dup.frontCirclePath.vertices.length < this.frontCirclePath.vertices.length
    ) {
      // Transfer from backPath to frontPath
      dup.frontCirclePath.vertices.push(dup.backCirclePath.vertices.pop()!);
      dup.glowingFrontCirclePath.vertices.push(
        dup.glowingBackCirclePath.vertices.pop()!
      );
    }
    // Now we know that the dup.frontCirclePath and this.frontCirclePath have the same length
    // Further we can guarantee that dup.backCirclePath has more (or equal) vertices than this.backCirclePath

    // Next move any (if necessary) vertices from backCirclePath to storageCirclePath
    while (
      dup.backCirclePath.vertices.length > this.backCirclePath.vertices.length
    ) {
      // Transfer from backPath to storagePath
      dup.storageCirclePath.vertices.push(dup.backCirclePath.vertices.pop()!);
      dup.glowingStorageCirclePath.vertices.push(
        dup.glowingBackCirclePath.vertices.pop()!
      );
    }

    // After the above statements execute this.front/back/storage and dup.front/back/storage are the same length
    // Now we can copy the vertices from the this.front/back to the dup.front/back
    dup.frontCirclePath.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.frontCirclePath.vertices[pos]);
    });
    dup.backCirclePath.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.backCirclePath.vertices[pos]);
    });
    dup.glowingFrontCirclePath.vertices.forEach(
      (v: Two.Anchor, pos: number) => {
        v.copy(this.glowingFrontCirclePath.vertices[pos]);
      }
    );
    dup.glowingBackCirclePath.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.glowingBackCirclePath.vertices[pos]);
    });

    // //Clone the front/back fill
    // dup.frontFill.vertices.forEach((v: Two.Anchor, pos: number) => {
    //   v.copy(this.frontFill.vertices[pos]);
    // });
    // dup.backFill.vertices.forEach((v: Two.Anchor, pos: number) => {
    //   v.copy(this.backFill.vertices[pos]);
    // });
    // // Clone the visibility of the front/back fill
    // dup.frontFill.visible = this.frontFill.visible;
    // dup.backFill.visible = this.backFill.visible;

    return dup as this;
  }

  /**
   * Adds the front/back/glowing/not parts to the correct layers
   * @param layers
   */
  addToLayers(layers: Two.Group[]): void {
    // These must always be executed even if the front/back part is empty
    // Otherwise when they become non-empty they are not displayed
    // this.frontFill.addTo(layers[LAYER.foreground]);
    this.frontCirclePath.addTo(layers[LAYER.foregroundAngleMarkers]);
    this.glowingFrontCirclePath.addTo(
      layers[LAYER.foregroundAngleMarkersGlowing]
    );
    // this.backFill.addTo(layers[LAYER.background]);
    this.backCirclePath.addTo(layers[LAYER.backgroundAngleMarkers]);
    this.glowingBackCirclePath.addTo(
      layers[LAYER.backgroundAngleMarkersGlowing]
    );
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontCirclePath.remove();
    // this.frontFill.remove();
    this.glowingFrontCirclePath.remove();
    this.backCirclePath.remove();
    // this.backFill.remove();
    this.glowingBackCirclePath.remove();
  }

  /**
   * Copies the style options set by the Style Panel into the style variables and then updates the
   * Two.js objects (with adjustSize and stylize(ApplyVariables))
   * @param options The style options
   */
  updateStyle(options: StyleOptions): void {
    console.debug("Angle Marker Update style of", this.name, "using", options);
    if (options.panel === StyleEditPanels.Front) {
      // Set the front options
      if (options.strokeWidthPercent !== undefined) {
        this.strokeWidthPercentFront = options.strokeWidthPercent;
      }
      if (options.fillColor !== undefined) {
        this.fillColorFront = options.fillColor;
      }
      if (options.strokeColor !== undefined) {
        this.strokeColorFront = options.strokeColor;
      }
      if (options.dashArray !== undefined) {
        this.dashArrayFront.clear();
        for (let i = 0; i < options.dashArray.length; i++) {
          this.dashArrayFront.push(options.dashArray[i]);
        }
      }
      if (options.angleMarkerRadiusPercent !== undefined) {
        this.angleMarkerRadiusPercent = options.angleMarkerRadiusPercent;
      }
    } else if (options.panel == StyleEditPanels.Back) {
      // Set the back options
      // options.dynamicBackStyle is boolean, so we need to explicitly check for undefined otherwise
      // when it is false, this doesn't execute and this.dynamicBackStyle is not set
      if (options.dynamicBackStyle !== undefined) {
        this.dynamicBackStyle = options.dynamicBackStyle;
      }
      // overwrite the back options only in the case the dynamic style is not enabled
      if (!this.dynamicBackStyle) {
        if (options.strokeWidthPercent !== undefined) {
          this.strokeWidthPercentBack = options.strokeWidthPercent;
        }
        if (options.fillColor !== undefined) {
          this.fillColorBack = options.fillColor;
        }
        if (options.strokeColor !== undefined) {
          this.strokeColorBack = options.strokeColor;
        }
        if (options.dashArray !== undefined) {
          // clear the dashArray
          this.dashArrayBack.clear();
          for (let i = 0; i < options.dashArray.length; i++) {
            this.dashArrayBack.push(options.dashArray[i]);
          }
        }
        if (options.angleMarkerRadiusPercent !== undefined) {
          this.angleMarkerRadiusPercent = options.angleMarkerRadiusPercent;
        }
      }
    }
    // Now apply the style and size
    this.stylize(DisplayStyle.ApplyCurrentVariables);
    this.adjustSize();
  }

  /**
   * Return the current style state
   */
  currentStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        const dashArrayFront = [] as number[];
        if (this.dashArrayFront.length > 0) {
          this.dashArrayFront.forEach(v => dashArrayFront.push(v));
        }
        return {
          panel: panel,
          strokeWidthPercent: this.strokeWidthPercentFront,
          strokeColor: this.strokeColorFront,
          fillColor: this.fillColorFront,
          dashArray: dashArrayFront,
          angleMarkerRadiusPercent: this.angleMarkerRadiusPercent
        };
        break;
      }
      case StyleEditPanels.Back: {
        const dashArrayBack = [] as number[];
        if (this.dashArrayBack.length > 0) {
          this.dashArrayBack.forEach(v => dashArrayBack.push(v));
        }
        return {
          panel: panel,
          strokeWidthPercent: this.strokeWidthPercentBack,
          strokeColor: this.strokeColorBack,
          fillColor: this.fillColorBack,
          dashArray: dashArrayBack,
          dynamicBackStyle: this.dynamicBackStyle,
          angleMarkerRadiusPercent: this.angleMarkerRadiusPercent
        };
      }
      default:
      case StyleEditPanels.Label: {
        return {
          panel: panel
        };
      }
    }
  }
  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front: {
        const dashArrayFront = [] as number[];
        if (SETTINGS.angleMarker.drawn.dashArray.front.length > 0) {
          SETTINGS.angleMarker.drawn.dashArray.front.forEach(v =>
            dashArrayFront.push(v)
          );
        }
        return {
          panel: panel,
          strokeWidthPercent: 100,
          fillColor: SETTINGS.angleMarker.drawn.fillColor.front,
          strokeColor: SETTINGS.angleMarker.drawn.strokeColor.front,
          dashArray: dashArrayFront,
          angleMarkerRadiusPercent: 100
        };
      }
      case StyleEditPanels.Back: {
        const dashArrayBack = [] as number[];

        if (SETTINGS.angleMarker.drawn.dashArray.back.length > 0) {
          SETTINGS.angleMarker.drawn.dashArray.back.forEach(v =>
            dashArrayBack.push(v)
          );
        }
        return {
          panel: panel,

          strokeWidthPercent: SETTINGS.angleMarker.dynamicBackStyle
            ? Nodule.contrastStrokeWidthPercent(100)
            : 100,

          strokeColor: SETTINGS.angleMarker.dynamicBackStyle
            ? Nodule.contrastStrokeColor(
                SETTINGS.angleMarker.drawn.strokeColor.front
              )
            : SETTINGS.angleMarker.drawn.strokeColor.back,

          fillColor: SETTINGS.angleMarker.dynamicBackStyle
            ? Nodule.contrastFillColor(
                SETTINGS.angleMarker.drawn.fillColor.front
              )
            : SETTINGS.angleMarker.drawn.fillColor.back,

          dashArray: dashArrayBack,

          dynamicBackStyle: SETTINGS.angleMarker.dynamicBackStyle,
          angleMarkerRadiusPercent: 100
        };
      }
      default:
      case StyleEditPanels.Label: {
        return {
          panel: panel
        };
      }
    }
  }

  /**
   * Sets the variables for stroke width glowing/not
   */
  adjustSize(): void {
    this.frontCirclePath.linewidth =
      (AngleMarker.currentAngleMarkerStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;

    this.backCirclePath.linewidth =
      (AngleMarker.currentAngleMarkerStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;

    this.glowingFrontCirclePath.linewidth =
      (AngleMarker.currentGlowingAngleMarkerStrokeWidthFront *
        this.strokeWidthPercentFront) /
      100;

    this.glowingBackCirclePath.linewidth =
      (AngleMarker.currentGlowingAngleMarkerStrokeWidthBack *
        (this.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(this.strokeWidthPercentFront)
          : this.strokeWidthPercentBack)) /
      100;

    // adjust the radius of the angle marker by setting the
    this._angleMarkerRadius =
      (this._angleMarkerRadius * this.angleMarkerRadiusPercent) / 100;

    this.setAngleMarkerFromThreeVectors(
      this._startVector,
      this._vertexVector,
      this._endVector,
      this._angleMarkerRadius
    );
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the angle marker
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual Two.js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual Two.js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual Two.js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // Use the SETTINGS temporary options to directly modify the Two.js objects.

        //FRONT
        // if (SETTINGS.angleMarker.temp.fillColor.front === "noFill") {
        //   this.frontFill.noFill();
        // } else {
        //   this.frontGradientColor.color = SETTINGS.angleMarker.temp.fillColor.front;
        //   this.frontFill.fill = this.frontGradient;
        // }
        if (SETTINGS.angleMarker.temp.strokeColor.front === "noStroke") {
          this.frontCirclePath.noStroke();
        } else {
          this.frontCirclePath.stroke =
            SETTINGS.angleMarker.temp.strokeColor.front;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this.frontCirclePath.linewidth =
          AngleMarker.currentAngleMarkerStrokeWidthFront;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.angleMarker.drawn.dashArray.front.length > 0) {
          this.frontCirclePath.dashes.clear();
          SETTINGS.angleMarker.drawn.dashArray.front.forEach(v => {
            this.frontCirclePath.dashes.push(v);
          });
        }
        //BACK
        // if (SETTINGS.angleMarker.temp.fillColor.back === "noFill") {
        //   this.backFill.noFill();
        // } else {
        //   this.backGradientColor.color = SETTINGS.angleMarker.temp.fillColor.back;
        //   this.backFill.fill = this.backGradient;
        // }
        if (SETTINGS.angleMarker.temp.strokeColor.back === "noStroke") {
          this.backCirclePath.noStroke();
        } else {
          this.backCirclePath.stroke =
            SETTINGS.angleMarker.temp.strokeColor.back;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this.backCirclePath.linewidth =
          AngleMarker.currentAngleMarkerStrokeWidthBack;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.angleMarker.drawn.dashArray.back.length > 0) {
          this.backCirclePath.dashes.clear();
          SETTINGS.angleMarker.drawn.dashArray.back.forEach(v => {
            this.backCirclePath.dashes.push(v);
          });
        }
        // The temporary display is never highlighted
        this.glowingFrontCirclePath.visible = false;
        this.glowingBackCirclePath.visible = false;
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.

        // FRONT
        // if (this.fillColorFront === "noFill") {
        //   this.frontFill.noFill();
        // } else {
        //   this.frontGradientColor.color = this.fillColorFront;
        //   this.frontFill.fill = this.frontGradient;
        // }

        if (this.strokeColorFront === "noStroke") {
          this.frontCirclePath.noStroke();
        } else {
          this.frontCirclePath.stroke = this.strokeColorFront;
        }
        // strokeWidthPercent is applied by adjustSize()
        if (this.dashArrayFront.length > 0) {
          this.frontCirclePath.dashes.clear();
          this.dashArrayFront.forEach(v => {
            this.frontCirclePath.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.frontCirclePath.dashes.clear();
          this.frontCirclePath.dashes.push(0);
        }
        // BACK
        // if (this.dynamicBackStyle) {
        //   if (Nodule.contrastFillColor(this.fillColorFront) === "noFill") {
        //     this.backFill.noFill();
        //   } else {
        //     this.backGradientColor.color = Nodule.contrastFillColor(
        //       this.fillColorFront
        //     );
        //     this.backFill.fill = this.backGradient;
        //   }
        // } else {
        //   if (this.fillColorBack === "noFill") {
        //     this.backFill.noFill();
        //   } else {
        //     this.backGradientColor.color = this.fillColorBack;
        //     this.backFill.fill = this.backGradient;
        //   }
        // }

        if (this.dynamicBackStyle) {
          if (
            Nodule.contrastStrokeColor(this.strokeColorFront) === "noStroke"
          ) {
            this.backCirclePath.noStroke();
          } else {
            this.backCirclePath.stroke = Nodule.contrastStrokeColor(
              this.strokeColorFront
            );
          }
        } else {
          if (this.strokeColorBack === "noStroke") {
            this.backCirclePath.noStroke();
          } else {
            this.backCirclePath.stroke = this.strokeColorBack;
          }
        }

        // strokeWidthPercent applied by adjustSizer()
        if (this.dashArrayBack.length > 0) {
          this.backCirclePath.dashes.clear();
          this.dashArrayBack.forEach(v => {
            this.backCirclePath.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.backCirclePath.dashes.clear();
          this.backCirclePath.dashes.push(0);
        }

        // UPDATE the glowing object

        // Glowing Front
        // no fillColor for glowing circles
        this.glowingFrontCirclePath.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()
        // Copy the front dash properties to the glowing object
        if (this.dashArrayFront.length > 0) {
          this.glowingFrontCirclePath.dashes.clear();
          this.dashArrayFront.forEach(v => {
            this.glowingFrontCirclePath.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.glowingFrontCirclePath.dashes.clear();
          this.glowingFrontCirclePath.dashes.push(0);
        }

        // Glowing Back
        // no fillColor for glowing circles
        this.glowingBackCirclePath.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()
        // Copy the back dash properties to the glowing object
        if (this.dashArrayBack.length > 0) {
          this.glowingBackCirclePath.dashes.clear();
          this.dashArrayBack.forEach(v => {
            this.glowingBackCirclePath.dashes.push(v);
          });
        } else {
          // the array length is zero and no dash array should be set
          this.glowingBackCirclePath.dashes.clear();
          this.glowingBackCirclePath.dashes.push(0);
        }
        break;
      }
    }
  }
}
