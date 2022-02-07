/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
import Two, { Color, RadialGradient } from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_CIRCLE_FRONT_STYLE,
  DEFAULT_CIRCLE_BACK_STYLE
} from "@/types/Styles";
import AppStore from "@/store";
import SE from "@/store/se-module";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
// const Z_AXIS = new Vector3(0, 0, 1);
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
   * The center vector of the circle in ideal unit sphere
   */
  private _centerVector = new Vector3();

  /**
   * The radius (in radians) of the circle on the ideal unit sphere
   */
  private _circleRadius = 0;

  /**
   *
   * NOTE: Once the above two variables are set, the updateDisplay() will correctly render the circle.
   * These are the only pieces of information that are need to do the rendering. All other
   * calculations in this class are only for the purpose of rendering the circle.
   */

  /**
   *  This the radius projected to the plane of the circle. It is always Math.sin(this.radius).
   */
  private projectedRadius = 0;

  /**
   * Vuex global state
   */
  protected store = AppStore; //

  /**
   * The TwoJS objects to display the front/back parts and their glowing counterparts.
   */
  private frontPart: Two.Path;
  private backPart: Two.Path;
  private glowingFrontPart: Two.Path;
  private glowingBackPart: Two.Path;

  /**
   * The TwoJS objects to display the front/back fill. These are different than the front/back parts
   *  because when the circle is dragged between the front and back, the fill region includes some
   *  of the boundary circle and is therefore different from the front/back parts.
   */
  private frontFill: Two.Path;
  private backFill: Two.Path;

  /**Create a storage path for unused anchors in the case that the boundary circle doesn't intersect the circle*/
  private fillStorageAnchors: Two.Anchor[] = [];

  /**
   * The styling variables for the drawn circle. The user can modify these.
   */
  // Front
  private glowingStrokeColorFront = SETTINGS.circle.glowing.strokeColor.front;
  // Back -- use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
  private glowingStrokeColorBack = SETTINGS.circle.glowing.strokeColor.back;

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
    SETTINGS.circle.drawn.fillColor.front,
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
    SETTINGS.circle.drawn.fillColor.back,
    1
  );
  private backGradient = new Two.RadialGradient(
    -SETTINGS.fill.lightSource.x,
    -SETTINGS.fill.lightSource.y,
    2 * SETTINGS.boundaryCircle.radius,
    [this.backGradientColorCenter, this.backGradientColor]
  );

  /** Initialize the current line width that is adjust by the zoom level and the user widthPercent */
  static currentCircleStrokeWidthFront =
    SETTINGS.circle.drawn.strokeWidth.front;
  static currentCircleStrokeWidthBack = SETTINGS.circle.drawn.strokeWidth.back;
  static currentGlowingCircleStrokeWidthFront =
    SETTINGS.circle.drawn.strokeWidth.front + SETTINGS.circle.glowing.edgeWidth;
  static currentGlowingCircleStrokeWidthBack =
    SETTINGS.circle.drawn.strokeWidth.back + SETTINGS.circle.glowing.edgeWidth;

  /**
   * Update all the current stroke widths
   * @param factor The ratio of the current magnification factor over the old magnification factor
   */
  static updateCurrentStrokeWidthForZoom(factor: number): void {
    Circle.currentCircleStrokeWidthFront *= factor;
    Circle.currentCircleStrokeWidthBack *= factor;
    Circle.currentGlowingCircleStrokeWidthFront *= factor;
    Circle.currentGlowingCircleStrokeWidthBack *= factor;
  }

  /**
   * This is the list of original vertices of a circle in the XY plane of radius
   * SETTINGS.boundaryCircle.radius. There are 2*SETTINGS.circle.subdivisions of these vertices
   */
  private originalVertices: Vector2[];

  /**
   * For temporary calculation with ThreeJS objects
   */
  private tmpVector = new Vector3();
  private tmpMatrix = new Matrix4();

  constructor() {
    super();

    // Create the array to hold the points that make up the boundary circle
    this.originalVertices = [];
    // As the circle is moved around the vertices are passed between the front and back parts, but it
    // is always true that frontVertices.length + backVertices.length = 2*SUBDIVISIONS
    // As the circle is moved around the some of the frontVertices are the same as the ones on the
    // frontFillVertices, but it is always true that frontVertices.length + number of non-front Vertices in
    // frontFillVertices = SUBDIVISIONS
    // The non-frontVertices are ones on the boundary circle.
    // Similar for the back vertices. Initially the length of back/front FillVertices must be SUBDIVISIONS.
    const frontVertices: Two.Vector[] = [];
    for (let k = 0; k < SUBDIVISIONS; k++) {
      // Create Two.Vectors for the paths that will be cloned later
      frontVertices.push(new Two.Vector(0, 0));

      //create the original vertices (the ones that are on the boundary of the circle) and will be transformed to the target circle
      const angle1 = ((2 * k) / SUBDIVISIONS) * Math.PI;
      const angle2 = ((2 * k + 1) / SUBDIVISIONS) * Math.PI;
      this.originalVertices.push(
        new Vector2(
          SETTINGS.boundaryCircle.radius * Math.cos(angle1),
          SETTINGS.boundaryCircle.radius * Math.sin(angle1)
        )
      );
      this.originalVertices.push(
        new Vector2(
          SETTINGS.boundaryCircle.radius * Math.cos(angle2),
          SETTINGS.boundaryCircle.radius * Math.sin(angle2)
        )
      );
    }
    this.frontPart = new Two.Path(
      frontVertices,
      /*closed*/ false,
      /*curve*/ false
    );

    // Clone the glowing/back/fill parts.
    this.glowingFrontPart = this.frontPart.clone();
    this.backPart = this.frontPart.clone();
    this.glowingBackPart = this.frontPart.clone();

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this.frontPart.id), {
      type: "circle",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this.backPart.id), {
      type: "circle",
      side: "back",
      fill: false,
      part: ""
    });

    // Set the styles that are always true
    // The front/back parts have no fill because that is handled by the front/back fill
    // The front/back fill have no stroke because that is handled by the front/back part
    this.frontPart.noFill();
    this.backPart.noFill();
    this.glowingFrontPart.noFill();
    this.glowingBackPart.noFill();

    //Turn off the glowing display initially but leave it on so that the temporary objects show up
    this.frontPart.visible = true;
    this.backPart.visible = true;
    this.glowingBackPart.visible = false;
    this.glowingFrontPart.visible = false;

    // Now organize the fills
    // In total there are 4*SUBDIVISIONS+2 (The +2 two for the extra vertices to close up the annular region with the radius is
    // bigger than Pi/2 and there is no front/back part and the circle is a 'hole')
    // anchors across both fill regions and the anchorStorage (storage is used when the circle doesn't cross a boundary).

    const verticesFill: Two.Vector[] = [];
    for (let k = 0; k < 2 * SUBDIVISIONS + 1; k++) {
      verticesFill.push(new Two.Vector(0, 0));
    }
    this.frontFill = new Two.Path(
      verticesFill,
      /* closed */ true,
      /* curve */ false
    );

    // create the back part
    this.backFill = this.frontFill.clone();

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this.frontFill.id), {
      type: "circle",
      side: "front",
      fill: true,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this.backFill.id), {
      type: "circle",
      side: "back",
      fill: true,
      part: ""
    });

    // Set the styles that are always true
    // The front/back fill have no stroke because that is handled by the front/back part
    this.frontFill.noStroke();
    this.backFill.noStroke();

    //Turn on the display initially so it shows up for the temporary circle
    this.frontFill.visible = true;
    this.backFill.visible = true;

    //set the fill gradient color correctly (especially the opacity which is set separately than the color -- not set by the opacity of the fillColor)
    this.frontGradientColor.color = SETTINGS.circle.drawn.fillColor.front;
    this.backGradientColor.color = SETTINGS.circle.dynamicBackStyle
      ? Nodule.contrastFillColor(SETTINGS.circle.drawn.fillColor.front)
      : SETTINGS.circle.drawn.fillColor.back;
    this.styleOptions.set(StyleEditPanels.Front, DEFAULT_CIRCLE_FRONT_STYLE);
    this.styleOptions.set(StyleEditPanels.Back, DEFAULT_CIRCLE_BACK_STYLE);
  }
  /**
   * Reorient the unit circle in 3D and then project the points to 2D
   * This method updates the TwoJS objects (frontPart, frontExtra, ...) for display
   * This is only accurate if the centerVector and radius are correct so only
   * call this method once those variables are updated.
   */
  public updateDisplay(): void {
    //#region circleDisplay
    // Create a matrix4 in the three.js package (called transformMatrix) that maps a circle in standard position (i.e. the
    //  original circle with vertices forming a circle in the plane z=0 of radius SETTINGS.boundaryCircle.radius) onto
    //  the one in the target desired (updated) position (i.e. the target circle).

    // First set up the coordinate system of the target circle
    // The vector to the circle center is ALSO the normal direction of the circle
    desiredZAxis.copy(this._centerVector).normalize();
    // Any vector perpendicular the desired z axis can be the desired x axis
    desiredXAxis
      .set(-this._centerVector.y, this._centerVector.x, 0)
      .normalize();
    // Use the cross product to create the vector perpendicular to both the desired z and x axis
    desiredYAxis.crossVectors(desiredZAxis, desiredXAxis);

    // Set up the local coordinates from for the circle,
    //  transformMatrix will now map (1,0,0) to the point on the desired x axis a unit from the origin in the positive direction.
    transformMatrix.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);

    //Now appropriately translate and scale the circle in standard position to the one in the desired location

    // translate along the Z of the local coordinate frame
    // The standard circle plane (z=0) is below the plane of the target circle so translate the plane z=0 to the
    // the target circle plane
    const distanceFromOrigin = Math.cos(this._circleRadius);
    this.tmpMatrix.makeTranslation(
      0,
      0,
      distanceFromOrigin * SETTINGS.boundaryCircle.radius
    );
    transformMatrix.multiply(this.tmpMatrix);

    // The target circle is scaled version of the original circle (but now in the plane of the target circle)
    // so scale XYZ space in the XY directions by the projected radius (z direction by 1)
    // this will make the original circle (in the plane of the target circle) finally coincide with the target circle
    this.tmpMatrix.makeScale(this.projectedRadius, this.projectedRadius, 1);
    transformMatrix.multiply(this.tmpMatrix); // transformMatrix now maps the original circle to the target circle
    //#endregion circleDisplay

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
    this.originalVertices.forEach((v: Vector2, pos: number) => {
      this.tmpVector.set(v.x, v.y, 0);
      this.tmpVector.applyMatrix4(transformMatrix);

      // When the Z-coordinate is negative, the vertex belongs the
      // the back side of the sphere
      if (this.tmpVector.z > 0) {
        if (firstPos === -1) firstPos = pos;
        if (posIndex >= frontLen) {
          // Steal one element from the backPart
          const extra = this.backPart.vertices.pop();
          const glowExtra = this.glowingBackPart.vertices.pop();
          if (extra && glowExtra) {
            this.frontPart.vertices.push(extra);
            this.glowingFrontPart.vertices.push(glowExtra);
            backLen--;
            frontLen++;
          }
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
          const glowingExtra = this.glowingFrontPart.vertices.pop();
          if (extra && glowingExtra) {
            this.backPart.vertices.push(extra);
            this.glowingBackPart.vertices.push(glowingExtra);
            frontLen--;
            backLen++;
          }
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

    // console.log(
    //   "sum of front and back part",
    //   this.frontPart.vertices.length + this.backPart.vertices.length
    // );
    // Bring all the anchor points to a common pool
    // Each front/back fill path will pull anchor points from
    // this pool as needed
    // any remaining are put in storage
    const pool: Two.Anchor[] = [];
    pool.push(...this.frontFill.vertices.splice(0));
    pool.push(...this.backFill.vertices.splice(0));
    pool.push(...this.fillStorageAnchors.splice(0));
    // console.log("pool size initially", pool.length);

    let posIndexFill = 0;
    let negIndexFill = 0;
    let boundaryPoints: number[][] = [];
    // The circle interior is only on the front of the sphere
    if (backLen === 0 && this._circleRadius < Math.PI / 2) {
      // In this case the frontFillVertices are the same as the frontVertices
      this.frontPart.vertices.forEach((v: Two.Anchor, index: number) => {
        if (posIndexFill === this.frontFill.vertices.length) {
          //add a vector from the pool
          this.frontFill.vertices.push(pool.pop()!);
        }
        this.frontFill.vertices[posIndexFill].x = v.x;
        this.frontFill.vertices[posIndexFill].y = v.y;
        posIndexFill++;
      });
      // put remaining vertices in the storage
      this.fillStorageAnchors.push(...pool.splice(0));
    } // The circle interior is split between front and back
    else if (backLen !== 0 && frontLen !== 0) {
      //find the angular width of the part of the boundary circle to be copied
      // Compute the angle from the positive x axis to the last frontPartVertex
      //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
      const startAngle = Math.atan2(
        this.frontPart.vertices[frontLen - 1].y,
        this.frontPart.vertices[frontLen - 1].x
      );

      // Compute the angle from the positive x axis to the first frontPartVertex
      //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
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
      const fromVector = [
        this.frontPart.vertices[frontLen - 1].x,
        this.frontPart.vertices[frontLen - 1].y
      ];
      // then
      // trace in the direction of a toVector that is perpendicular to this.frontPart.vertices[frontLen - 1]
      // and points in the same direction as this.frontPart.vertices[0]
      let toVector = [-fromVector[1], fromVector[0]];

      // If the toVector doesn't point in the same direction as the first vector in frontPart then reverse the toVector
      if (
        toVector[0] * this.frontPart.vertices[0].x +
          toVector[1] * this.frontPart.vertices[0].y <
        0
      ) {
        toVector = [-toVector[0], -toVector[1]];
      }

      // If the arcRadius is bigger than Pi/2 then reverse the toVector
      if (this._circleRadius > Math.PI / 2) {
        toVector = [-toVector[0], -toVector[1]];
      }
      // Create the boundary points
      boundaryPoints = this.boundaryCircleCoordinates(
        fromVector,
        SUBDIVISIONS + 1,
        toVector,
        angularWidth
      );

      // Build the frontFill- first add the frontPart.vertices
      this.frontPart.vertices.forEach(node => {
        if (posIndexFill === this.frontFill.vertices.length) {
          //add a vector from the pool
          this.frontFill.vertices.push(pool.pop()!);
        }
        this.frontFill.vertices[posIndexFill].x = node.x;
        this.frontFill.vertices[posIndexFill].y = node.y;
        posIndexFill++;
      });
      // add the boundary points
      boundaryPoints.forEach(node => {
        if (posIndexFill === this.frontFill.vertices.length) {
          //add a vector from the pool
          this.frontFill.vertices.push(pool.pop()!);
        }
        this.frontFill.vertices[posIndexFill].x = node[0];
        this.frontFill.vertices[posIndexFill].y = node[1];
        posIndexFill++;
      });
      // console.log("posIndex", posIndexFill, " of ", 4 * SUBDIVISIONS + 2);
      // console.log("pool size", pool.length);
      // Build the backFill- first add the backPart.vertices
      this.backPart.vertices.forEach(node => {
        if (negIndexFill === this.backFill.vertices.length) {
          //add a vector from the pool
          this.backFill.vertices.push(pool.pop()!);
        }
        this.backFill.vertices[negIndexFill].x = node.x;
        this.backFill.vertices[negIndexFill].y = node.y;
        negIndexFill++;
      });
      // console.log("negIndex", negIndexFill, " of ", 4 * SUBDIVISIONS + 2);
      // console.log("pool size", pool.length);
      // add the boundary points (but in reverse!)
      boundaryPoints.reverse().forEach(node => {
        if (negIndexFill === this.backFill.vertices.length) {
          //add a vector from the pool
          this.backFill.vertices.push(pool.pop()!);
        }
        this.backFill.vertices[negIndexFill].x = node[0];
        this.backFill.vertices[negIndexFill].y = node[1];
        negIndexFill++;
      });

      // put remaining vertices in the storage (there shouldn't be any in this case)
      this.fillStorageAnchors.push(...pool.splice(0));
    }
    // The circle interior is only on the back of the sphere
    else if (frontLen === 0 && this._circleRadius < Math.PI / 2) {
      //
      // In this case the backFillVertices are the same as the backVertices
      this.backPart.vertices.forEach((v: Two.Anchor, index: number) => {
        if (negIndexFill === this.backFill.vertices.length) {
          //add a vector from the pool
          this.backFill.vertices.push(pool.pop()!);
        }
        this.backFill.vertices[negIndexFill].x = v.x;
        this.backFill.vertices[negIndexFill].y = v.y;
        negIndexFill++;
      });
      // put remaining vertices in the storage
      this.fillStorageAnchors.push(...pool.splice(0));
    }
    // The circle interior covers the entire front half of the sphere and is a 'hole' on the back
    else if (frontLen === 0 && this._circleRadius > Math.PI / 2) {
      // In this case set the frontFillVertices to the entire boundary circle which are the originalVertices, but only add half of them
      // so that only SUBDIVISION number of vectors are used. (We need 3*SUBDIVISION +2 for the annular region on the back)
      this.originalVertices.reverse().forEach((v, ind) => {
        if (ind % 2 === 0) {
          if (posIndexFill === this.frontFill.vertices.length) {
            //add a vector from the pool
            this.frontFill.vertices.push(pool.pop()!);
          }
          this.frontFill.vertices[posIndexFill].x = v.x;
          this.frontFill.vertices[posIndexFill].y = v.y;
          posIndexFill++;
        }
      });

      // In this case the backFillVertices must trace out first the boundary circle (originalVertices) and then
      //  the circle, to trace an annular region.  To help with the rendering, start tracing
      //  the boundary circle directly across from the vertex on the circle at index zero
      const backStartTraceIndex = Math.floor(
        Math.atan2(
          this.backPart.vertices[0].y,
          this.backPart.vertices[0].x
        ).modTwoPi() /
          (Math.PI / SUBDIVISIONS)
      );

      this.originalVertices
        .reverse()
        .rotate(backStartTraceIndex)
        .forEach((v, ind) => {
          // Again add every other one so that only SUBDIVISION vectors are used in the first part of backFill
          if (ind % 2 === 0) {
            if (negIndexFill === this.backFill.vertices.length) {
              //add a vector from the pool
              this.backFill.vertices.push(pool.pop()!);
            }
            this.backFill.vertices[negIndexFill].x = v.x;
            this.backFill.vertices[negIndexFill].y = v.y;
            negIndexFill++;
          }
        });

      //return the original vertices to there initial state (notice that they were reversed twice)
      this.originalVertices.rotate(-backStartTraceIndex);

      // Make sure that the next entry in the backFill is the first to closed up the annular region
      const vert1 = pool.pop()!;
      vert1.x = this.backFill.vertices[0].x;
      vert1.y = this.backFill.vertices[0].y;
      this.backFill.vertices.push(vert1);
      negIndexFill++;

      // now add the backPart vertices
      this.backPart.vertices.forEach((v: Two.Anchor, index: number) => {
        if (negIndexFill === this.backFill.vertices.length) {
          //add a vector from the pool
          this.backFill.vertices.push(pool.pop()!);
        }
        this.backFill.vertices[negIndexFill].x = v.x;
        this.backFill.vertices[negIndexFill].y = v.y;
        negIndexFill++;
      });

      // Make sure that the next entry in the backFill is the first to closed up the annular region
      const vert2 = pool.pop()!;
      vert2.x = this.backFill.vertices.slice(-1)[0].x;
      vert2.y = this.backFill.vertices.slice(-1)[0].y;
      this.backFill.vertices.push(vert2);

      // put remaining vertices in the storage (There shouldn't be any in this case)
      this.fillStorageAnchors.push(...pool.splice(0));
    }
    // The circle interior covers the entire back half of the sphere and is a 'hole' on the front
    else if (backLen === 0 && this._circleRadius > Math.PI / 2) {
      // In this case set the backFillVertices to the entire boundary circle of the sphere which are the originalVertices, but only add half of them
      // so that only SUBDIVISION number of vectors are used. (We need 3*SUBDIVISION +2 for the annular region on the front)
      this.originalVertices.reverse().forEach((v, ind) => {
        if (ind % 2 === 0) {
          if (negIndexFill === this.backFill.vertices.length) {
            //add a vector from the pool
            this.backFill.vertices.push(pool.pop()!);
          }
          this.backFill.vertices[negIndexFill].x = v.x;
          this.backFill.vertices[negIndexFill].y = v.y;
          negIndexFill++;
        }
      });

      // In this case the frontFillVertices must trace out first the boundary circle (originalVertices) and then
      //  the circle, to trace an annular region.  To help with the rendering, start tracing
      //  the boundary circle directly across from the vertex on the circle at index zero
      const frontStartTraceIndex = Math.floor(
        Math.atan2(
          this.frontPart.vertices[0].y,
          this.frontPart.vertices[0].x
        ).modTwoPi() /
          (Math.PI / SUBDIVISIONS)
      );

      this.originalVertices
        .reverse()
        .rotate(frontStartTraceIndex)
        .forEach((v, ind) => {
          // Again add every other one so that only SUBDIVISION vectors are used in the first part of frontFill
          if (ind % 2 === 0) {
            if (posIndexFill === this.frontFill.vertices.length) {
              //add a vector from the pool
              this.frontFill.vertices.push(pool.pop()!);
            }
            this.frontFill.vertices[posIndexFill].x = v.x;
            this.frontFill.vertices[posIndexFill].y = v.y;
            posIndexFill++;
          }
        });
      //return/rotate the original vertices to there initial state (notice that they were reversed twice)
      this.originalVertices.rotate(-frontStartTraceIndex);

      // Make sure that the next entry in the frontFill is the first to closed up the annular region
      const vert1 = pool.pop()!;
      vert1.x = this.frontFill.vertices[0].x;
      vert1.y = this.frontFill.vertices[0].y;
      this.frontFill.vertices.push(vert1);
      posIndexFill++;

      // now add the frontPart vertices
      this.frontPart.vertices.forEach((v: Two.Anchor, index: number) => {
        if (posIndexFill === this.frontFill.vertices.length) {
          //add a vector from the pool
          this.frontFill.vertices.push(pool.pop()!);
        }
        this.frontFill.vertices[posIndexFill].x = v.x;
        this.frontFill.vertices[posIndexFill].y = v.y;
        posIndexFill++;
      });

      // Make sure that the next entry in the frontFill is the first to closed up the annular region
      const vert2 = pool.pop()!;
      vert2.x = this.frontPart.vertices[0].x;
      vert2.y = this.frontPart.vertices[0].y;
      this.frontFill.vertices.push(vert2);

      // put remaining vertices in the storage (There shouldn't be any in this case)
      this.fillStorageAnchors.push(...pool.splice(0));
    }
  }

  /**
   * startPt is a point on the the boundary of the display circle,
   * this method returns an ordered list of numPoints points from startPoint for and
   * angular length of angularLength in the direction of yAxis.
   * This returns an array of point on the boundary circle so that the angle subtended at the origin between
   * any two consecutive ones is equal and equal to the angle between the first returned to startPt. The last one is
   * a equal measure less than angularLength
   *
   * yAxis is perpendicular to startPt
   */
  boundaryCircleCoordinates(
    startPt: number[],
    numPoints: number,
    yAxis: number[],
    angularLength: number
  ): number[][] {
    const xAxisVector = new Vector3(startPt[0], startPt[1], 0).normalize();
    const yAxisVector = new Vector3(yAxis[0], yAxis[1], 0).normalize();
    const returnArray = [];

    for (let i = 0; i < numPoints; i++) {
      this.tmpVector.set(0, 0, 0);
      this.tmpVector.addScaledVector(
        xAxisVector,
        Math.cos((i + 1) * (angularLength / (numPoints + 1)))
      );
      this.tmpVector.addScaledVector(
        yAxisVector,
        Math.sin((i + 1) * (angularLength / (numPoints + 1)))
      );
      // now scale to the radius of the boundary circle
      this.tmpVector.normalize().multiplyScalar(SETTINGS.boundaryCircle.radius);

      returnArray.push([this.tmpVector.x, this.tmpVector.y]);
    }
    return returnArray;
  }

  /**
   * Set or Get the center of the circle vector. (Used by circle handler to set these values for the temporary circle)
   */
  set centerVector(position: Vector3) {
    this._centerVector.copy(position);
  }
  get centerVector(): Vector3 {
    return this._centerVector;
  }

  /**
   * Set or Get the radius of the circle. (Used by circle handler to set these values for the temporary circle)
   */
  set circleRadius(arcLengthRadius: number) {
    this._circleRadius = arcLengthRadius;
    this.projectedRadius = Math.sin(arcLengthRadius);
  }
  get circleRadius(): number {
    return this._circleRadius;
  }

  frontGlowingDisplay(): void {
    this.frontPart.visible = true;
    this.glowingFrontPart.visible = true;
    this.frontFill.visible = true;
  }
  backGlowingDisplay(): void {
    this.backPart.visible = true;
    this.glowingBackPart.visible = true;
    this.backFill.visible = true;
  }
  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }
  frontNormalDisplay(): void {
    this.frontPart.visible = true;
    this.glowingFrontPart.visible = false;
    this.frontFill.visible = true;
  }
  backNormalDisplay(): void {
    this.backPart.visible = true;
    this.glowingBackPart.visible = false;
    this.backFill.visible = true;
  }
  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontPart.visible = false;
      this.backPart.visible = false;
      this.frontFill.visible = false;
      this.backFill.visible = false;
      this.glowingBackPart.visible = false;
      this.glowingFrontPart.visible = false;
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
      this.glowingStrokeColorFront = SETTINGS.circle.glowing.strokeColor.front;
      this.glowingStrokeColorBack = SETTINGS.circle.glowing.strokeColor.back;
    }
    // apply the new color variables to the object
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }
  /**
   * This method is used to copy the temporary circle created with the Circle Tool (in the midground) into a
   * permanent one in the scene (in the foreground).
   */
  clone(): this {
    // Use the constructor for this class to create a template to copy over the
    // values from the current (the `this`) Circle object
    const dup = new Circle();
    dup._centerVector.copy(this._centerVector);
    dup._circleRadius = this._circleRadius;

    // Duplicate the non-glowing parts
    dup.frontPart.closed = this.frontPart.closed;
    dup.frontPart.rotation = this.frontPart.rotation;
    dup.frontPart.translation.copy(this.frontPart.translation);
    dup.backPart.closed = this.backPart.closed;
    dup.backPart.rotation = this.backPart.rotation;
    dup.backPart.translation.copy(this.backPart.translation);

    // Duplicate the glowing parts
    dup.glowingFrontPart.closed = this.glowingFrontPart.closed;
    dup.glowingFrontPart.rotation = this.glowingFrontPart.rotation;
    dup.glowingFrontPart.translation.copy(this.glowingFrontPart.translation);
    dup.glowingBackPart.closed = this.glowingBackPart.closed;
    dup.glowingBackPart.rotation = this.glowingBackPart.rotation;
    dup.glowingBackPart.translation.copy(this.glowingBackPart.translation);

    // The clone (i.e. dup) initially has equal number of vertices for the front and back part
    //  so adjust to match `this`. If one of the this.front or this.back has more vertices then
    //  the corresponding dup part, then remove the excess vertices from the one with more and
    //  move them to the other
    while (dup.frontPart.vertices.length > this.frontPart.vertices.length) {
      // Transfer from frontPart to backPart
      dup.backPart.vertices.push(dup.frontPart.vertices.pop()!);
      dup.glowingBackPart.vertices.push(dup.glowingFrontPart.vertices.pop()!);
    }
    while (dup.backPart.vertices.length > this.backPart.vertices.length) {
      // Transfer from backPart to frontPart
      dup.frontPart.vertices.push(dup.backPart.vertices.pop()!);
      dup.glowingFrontPart.vertices.push(dup.glowingBackPart.vertices.pop()!);
    }
    // After the above two while statement execute this. glowing/not front/back and dup. glowing/not front/back are the same length
    // Now we can copy the vertices from the this.front/back to the dup.front/back
    dup.frontPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.frontPart.vertices[pos]);
    });
    dup.backPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.backPart.vertices[pos]);
    });
    dup.glowingFrontPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.glowingFrontPart.vertices[pos]);
    });
    dup.glowingBackPart.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.glowingBackPart.vertices[pos]);
    });

    //Clone the front/back fill
    // #frontFill + #backFill + #storage = constant at all times
    const poolFill = [];
    poolFill.push(...dup.frontFill.vertices.splice(0));
    poolFill.push(...dup.backFill.vertices.splice(0));
    poolFill.push(...dup.fillStorageAnchors.splice(0));

    while (dup.frontFill.vertices.length < this.frontFill.vertices.length) {
      dup.frontFill.vertices.push(poolFill.pop()!);
    }
    while (dup.backFill.vertices.length < this.backFill.vertices.length) {
      dup.backFill.vertices.push(poolFill.pop()!);
    }
    dup.fillStorageAnchors.push(...poolFill.splice(0));

    dup.frontFill.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.frontFill.vertices[pos]);
    });

    dup.backFill.vertices.forEach((v: Two.Anchor, pos: number) => {
      v.copy(this.backFill.vertices[pos]);
    });

    return dup as this;
  }

  /**
   * Adds the front/back/glowing/not parts to the correct layers
   * @param layers
   */
  addToLayers(layers: Two.Group[]): void {
    // These must always be executed even if the front/back part is empty
    // Otherwise when they become non-empty they are not displayed
    this.frontFill.addTo(layers[LAYER.foregroundFills]);
    this.frontPart.addTo(layers[LAYER.foreground]);
    this.glowingFrontPart.addTo(layers[LAYER.foregroundGlowing]);
    this.backFill.addTo(layers[LAYER.backgroundFills]);
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

  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_CIRCLE_FRONT_STYLE;

      case StyleEditPanels.Back:
        if (SETTINGS.circle.dynamicBackStyle) {
          return {
            ...DEFAULT_CIRCLE_BACK_STYLE,
            strokeWidthPercent: Nodule.contrastStrokeWidthPercent(100),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.circle.drawn.strokeColor.front
            ),
            fillColor: Nodule.contrastFillColor(
              SETTINGS.circle.drawn.fillColor.front
            )
          };
        } else return DEFAULT_CIRCLE_BACK_STYLE;
      default:
        return {};
    }
  }

  /**
   * Sets the variables for stroke width glowing/not
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this.frontPart.linewidth =
      (Circle.currentCircleStrokeWidthFront * frontStrokeWidthPercent) / 100;
    this.backPart.linewidth =
      (Circle.currentCircleStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this.glowingFrontPart.linewidth =
      (Circle.currentGlowingCircleStrokeWidthFront * frontStrokeWidthPercent) /
      100;
    this.glowingBackPart.linewidth =
      (Circle.currentGlowingCircleStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the circle
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
        if (
          Nodule.hlsaIsNoFillOrNoStroke(SETTINGS.circle.temp.fillColor.front)
        ) {
          this.frontFill.noFill();
        } else {
          this.frontGradientColor.color = SETTINGS.circle.temp.fillColor.front;
          this.frontFill.fill = this.frontGradient;
        }
        if (
          Nodule.hlsaIsNoFillOrNoStroke(SETTINGS.circle.temp.strokeColor.front)
        ) {
          this.frontPart.noStroke();
        } else {
          this.frontPart.stroke = SETTINGS.circle.temp.strokeColor.front;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this.frontPart.linewidth = Circle.currentCircleStrokeWidthFront;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.circle.drawn.dashArray.front.length > 0) {
          this.frontPart.dashes.clear();
          SETTINGS.circle.drawn.dashArray.front.forEach(v => {
            this.frontPart.dashes.push(v);
          });
          if (SETTINGS.circle.drawn.dashArray.reverse.front) {
            this.frontPart.dashes.reverse();
          }
        }
        //BACK
        if (
          Nodule.hlsaIsNoFillOrNoStroke(SETTINGS.circle.temp.fillColor.back)
        ) {
          this.backFill.noFill();
        } else {
          this.backGradientColor.color = SETTINGS.circle.temp.fillColor.back;
          this.backFill.fill = this.backGradient;
        }
        if (
          Nodule.hlsaIsNoFillOrNoStroke(SETTINGS.circle.temp.strokeColor.back)
        ) {
          this.backPart.noStroke();
        } else {
          this.backPart.stroke = SETTINGS.circle.temp.strokeColor.back;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this.backPart.linewidth = Circle.currentCircleStrokeWidthBack;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.circle.drawn.dashArray.back.length > 0) {
          this.backPart.dashes.clear();
          SETTINGS.circle.drawn.dashArray.back.forEach(v => {
            this.backPart.dashes.push(v);
          });
          if (SETTINGS.circle.drawn.dashArray.reverse.back) {
            this.backPart.dashes.reverse();
          }
        }

        // The temporary display is never highlighted
        this.glowingFrontPart.visible = false;
        this.glowingBackPart.visible = false;
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.

        // FRONT
        const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
        if (Nodule.hlsaIsNoFillOrNoStroke(frontStyle?.fillColor)) {
          this.frontFill.noFill();
        } else {
          this.frontGradientColor.color = frontStyle?.fillColor ?? "black";
          this.frontFill.fill = this.frontGradient;
        }

        if (Nodule.hlsaIsNoFillOrNoStroke(frontStyle?.strokeColor)) {
          this.frontPart.noStroke();
        } else {
          this.frontPart.stroke = frontStyle?.strokeColor as Two.Color;
        }
        // strokeWidthPercent is applied by adjustSize()

        if (frontStyle?.dashArray && frontStyle.dashArray.length > 0) {
          this.frontPart.dashes.clear();
          this.frontPart.dashes.push(...frontStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this.frontPart.dashes.clear();
          this.frontPart.dashes.push(0);
        }
        // BACK
        const backStyle = this.styleOptions.get(StyleEditPanels.Back);
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hlsaIsNoFillOrNoStroke(
              Nodule.contrastFillColor(frontStyle?.fillColor)
            )
          ) {
            this.backFill.noFill();
          } else {
            this.backGradientColor.color = Nodule.contrastFillColor(
              frontStyle?.fillColor ?? "black"
            );

            this.backFill.fill = this.backGradient;
          }
        } else {
          if (Nodule.hlsaIsNoFillOrNoStroke(backStyle?.fillColor)) {
            this.backFill.noFill();
          } else {
            this.backGradientColor.color = backStyle?.fillColor ?? "black";
            console.log("here 2");
            this.backFill.fill = this.backGradient;
          }
        }

        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hlsaIsNoFillOrNoStroke(
              Nodule.contrastStrokeColor(frontStyle?.strokeColor)
            )
          ) {
            this.backPart.noStroke();
          } else {
            this.backPart.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
          }
        } else {
          if (Nodule.hlsaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this.backPart.noStroke();
          } else {
            this.backPart.stroke = backStyle?.strokeColor ?? "black";
          }
        }

        // strokeWidthPercent applied by adjustSizer()

        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this.backPart.dashes.clear();
          this.backPart.dashes.push(...backStyle.dashArray);
          if (backStyle.dashArray) {
            this.backPart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.backPart.dashes.clear();
          this.backPart.dashes.push(0);
        }

        // UPDATE the glowing object

        // Glowing Front
        // no fillColor for glowing circles
        this.glowingFrontPart.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle.dashArray.length > 0
        ) {
          this.glowingFrontPart.dashes.clear();
          this.glowingFrontPart.dashes.push(...frontStyle.dashArray);
          if (frontStyle.reverseDashArray) {
            this.glowingFrontPart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.glowingFrontPart.dashes.clear();
          this.glowingFrontPart.dashes.push(0);
        }

        // Glowing Back
        // no fillColor for glowing circles
        this.glowingBackPart.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this.glowingBackPart.dashes.clear();
          this.glowingBackPart.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this.glowingBackPart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.glowingBackPart.dashes.clear();
          this.glowingBackPart.dashes.push(0);
        }
        break;
      }
    }
  }
}
