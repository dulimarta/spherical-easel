/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_ELLIPSE_FRONT_STYLE,
  DEFAULT_ELLIPSE_BACK_STYLE
} from "@/types/Styles";
//import Two from "two.js";
import { Path } from "two.js/src/path";
import { Stop } from "two.js/src/effects/stop";
import { RadialGradient } from "two.js/src/effects/radial-gradient";
import { Anchor } from "two.js/src/anchor";
import { Group } from "two.js/src/group";
import { FillStyle, svgArcObject, toSVGType } from "@/types";
import Settings from "@/views/Settings.vue";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
// const Z_AXIS = new Vector3(0, 0, 1);
const transformMatrix = new Matrix4();
const SUBDIVISIONS = SETTINGS.ellipse.numPoints;

/**
 * For drawing surface ellipse. A ellipse consists of two paths (front and back)
 * for a total of 2N subdivisions.
 * We initially assign the same number of segments/subdivisions to each path,
 * but as the ellipse is being deformed the number of subdivisions on each path
 * may change: longer path will hold more subdivision points (while keeping the
 * total points 2N so we don't create/remove new points)
 */
export default class Ellipse extends Nodule {
  /**
   * The foci of the ellipse
   */
  private _focus1Vector: Vector3 = new Vector3();
  private _focus2Vector: Vector3 = new Vector3();

  /**
   * The parameters a,b that define the the ellipse in standard position (foci in the x-z plane, at (-sin(d),0,cos(d)) and (sin(d),0,cos(d)), so
   * the center is at (0,0,1), d = 1/2 angle(F1,F2)), half the length of axis (of the ellipse) that projects onto the  x-axis is a,
   * half the length of the axis (of the ellipse) that projects on the y-axis is b, using the spherical Pythagorean Theorem cos(d)*cos(b)=cos(a)
   */
  private _a = 0;
  private _b = 0;
  /**
  /**
   *
   * NOTE: Once the above variables are set, the updateDisplay() will correctly render the ellipse,
   * These are the only pieces of information that are need to do the rendering. All other
   * calculations in this class are only for the purpose of rendering the ellipse.
   */

  /**
   * The vector E(t), tMin and tMax for tMin <= t <= tMax E(t)= parameterization traces out the ellipse
   */
  private parameterization = new Vector3();

  private _tMin: number;
  private _tMax: number;
  private _closed: boolean; // true if E(tMin)=E(tMax)
  private _periodic: boolean; // true if E(t) = E(t + (tMax-tMin)) for all t

  /**
   * A matrix that transforms the ellipse from standard position to the ellipse being plotted just before scaled to the radius of the plotting sphere (i.e. on the unit sphere)
   */
  private _ellipseFrame: Matrix4 = new Matrix4();
  /**
   * The parameterization of the ellipse on the sphere in standard position.
   * @param t the parameter between 0 and 2 PI
   * @returns
   */
  public E(t: number): Vector3 {
    return this.parameterization.set(
      Math.sin(this._a) * Math.cos(t),
      Math.sin(this._b) * Math.sin(t),
      (this._a > Math.PI / 2 ? -1 : 1) *
        Math.sqrt(
          Math.cos(this._a) * Math.cos(this._a) +
            Math.sin(this._a - this._b) *
              Math.sin(this._a + this._b) *
              Math.sin(t) *
              Math.sin(t)
        )
    );
  }
  /**
   * The TwoJS objects to display the front/back parts and their glowing counterparts.
   */
  protected frontPart: Path;
  protected backPart: Path;
  protected glowingFrontPart: Path;
  protected glowingBackPart: Path;

  /**
   * The TwoJS objects to display the front/back fill. These are different than the front/back parts
   *  because when the circle is dragged between the front and back, the fill region includes some
   *  of the boundary circle and is therefore different from the front/back parts.
   */
  protected frontFill: Path;
  protected backFill: Path;
  protected frontFillInUse = true;
  protected backFillInUse = false;

  /**Create a storage path for unused anchors in the case that the boundary circle doesn't intersect the circle*/
  private fillStorageAnchors: Anchor[] = [];

  /**
   * The styling variables for the drawn circle. The user can modify these.
   */
  // Front
  private glowingStrokeColorFront = SETTINGS.ellipse.glowing.strokeColor.front;
  // Back -- use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
  private glowingStrokeColorBack = SETTINGS.ellipse.glowing.strokeColor.back;

  /**
   * The stops and gradient for front/back fill
   */
  private frontGradientColorCenter = new Stop(
    0,
    SETTINGS.style.fill.frontWhite,
    1
  );
  private frontGradientColor = new Stop(
    SETTINGS.style.fill.gradientPercent,
    SETTINGS.ellipse.drawn.fillColor.front,
    1
  );

  private frontGradient = new RadialGradient(
    SETTINGS.style.fill.center.x,
    SETTINGS.style.fill.center.y,
    SETTINGS.boundaryCircle.radius,
    [this.frontGradientColorCenter, this.frontGradientColor],
    SETTINGS.style.fill.lightSource.x,
    SETTINGS.style.fill.lightSource.y
  );

  private backGradientColorCenter = new Stop(
    0,
    SETTINGS.style.fill.backGray,
    1
  );
  private backGradientColor = new Stop(
    SETTINGS.style.fill.gradientPercent,
    SETTINGS.ellipse.drawn.fillColor.front,
    1
  );

  private backGradient = new RadialGradient(
    -SETTINGS.style.fill.center.x,
    -SETTINGS.style.fill.center.y,
    SETTINGS.boundaryCircle.radius,
    [this.backGradientColorCenter, this.backGradientColor],
    -SETTINGS.style.fill.lightSource.x,
    -SETTINGS.style.fill.lightSource.y
  );

  /** Initialize the current line width that is adjust by the zoom level and the user widthPercent */
  static currentEllipseStrokeWidthFront =
    SETTINGS.ellipse.drawn.strokeWidth.front;
  static currentEllipseStrokeWidthBack =
    SETTINGS.ellipse.drawn.strokeWidth.back;
  static currentGlowingEllipseStrokeWidthFront =
    SETTINGS.ellipse.drawn.strokeWidth.front +
    SETTINGS.ellipse.glowing.edgeWidth;
  static currentGlowingEllipseStrokeWidthBack =
    SETTINGS.ellipse.drawn.strokeWidth.back +
    SETTINGS.ellipse.glowing.edgeWidth;

  /**
   * Update all the current stroke widths
   * @param factor The ratio of the current magnification factor over the old magnification factor
   */
  static updateCurrentStrokeWidthForZoom(factor: number): void {
    Ellipse.currentEllipseStrokeWidthFront *= factor;
    Ellipse.currentEllipseStrokeWidthBack *= factor;
    Ellipse.currentGlowingEllipseStrokeWidthFront *= factor;
    Ellipse.currentGlowingEllipseStrokeWidthBack *= factor;
  }

  /**
   * This is the list of vertices of the boundary circle in the XY plane of radius
   * SETTINGS.boundaryCircle.radius. There are 2*SETTINGS.ellipse.subdivisions of these vertices
   * This is need for the fill because sometimes the fill vertices include these.
   */
  private originalVertices: Vector2[];

  /**
   * For temporary calculation with ThreeJS objects
   */
  private tmpVector = new Vector3();
  private tmpMatrix = new Matrix4();

  constructor(noduleName: string = "None") {
    super(noduleName);

    this.frontGradient.units = "userSpaceOnUse"; // this means that the gradient uses the coordinates of the layer (but centered on the projection of the circle)
    this.backGradient.units = "userSpaceOnUse";

    this._tMax = 2 * Math.PI;
    this._tMin = 0;
    this._closed = true;
    this._periodic = true;

    // Create the array to hold the points that make up the boundary circle
    this.originalVertices = [];
    for (let k = 0; k < SUBDIVISIONS; k++) {
      //create the original vertices (the ones that are on the boundary of the circle) and will be
      //used when the ellipse is a 'hole' on the front/back to properly fill
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

    // As the ellipse is moved around the vertices are passed between the front and back parts, but it
    // is always true that frontVertices.length + backVertices.length = 2*SUBDIVISIONS
    // As the ellipse is moved around the some of the frontVertices are the same as the ones on the
    // frontFillVertices, but it is always true that frontVertices.length + number of non-front/back Vertices + backVertics.length in
    // front|back FillVertices = 4*SUBDIVISIONS+2
    // The non-front|back Vertices are ones on the boundary circle.
    const frontVertices: Anchor[] = [];
    for (let k = 0; k < SUBDIVISIONS; k++) {
      // Create Anchors for the paths that will be duplicated later
      frontVertices.push(new Anchor(0, 0));
    }
    this.frontPart = new Path(frontVertices, /*closed*/ false, /*curve*/ false);

    // Create the glowing/back/fill parts.
    this.glowingFrontPart = new Path(
      frontVertices,
      /*closed*/ false,
      /*curve*/ false
    );

    const backVertices: Anchor[] = [];
    for (let k = 0; k < SUBDIVISIONS; k++) {
      // Create Anchors for the paths that will be duplicated later
      backVertices.push(new Anchor(0, 0));
    }

    this.backPart = new Path(backVertices, /*closed*/ false, /*curve*/ false);
    this.glowingBackPart = new Path(
      backVertices,
      /*closed*/ false,
      /*curve*/ false
    );

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
    // In total there are 4*SUBDIVISIONS+2 (The +2 two for the extra vertices to close up the annular region with the a and b values are
    // bigger than Pi/2 and there is no front/back part and the ellipse is a 'hole')
    // anchors across both fill regions and the anchorStorage (storage is used when the ellipse doesn't cross a boundary).

    const verticesFrontFill: Anchor[] = [];
    for (let k = 0; k < 2 * SUBDIVISIONS + 1; k++) {
      verticesFrontFill.push(new Anchor(0, 0));
    }
    this.frontFill = new Path(
      verticesFrontFill,
      /* closed */ true,
      /* curve */ false
    );
    const verticesBackFill: Anchor[] = [];
    for (let k = 0; k < 2 * SUBDIVISIONS + 1; k++) {
      verticesBackFill.push(new Anchor(0, 0));
    }
    // create the back part
    this.backFill = new Path(
      verticesBackFill,
      /* closed */ true,
      /* curve */ false
    );

    // Set the styles that are always true
    // The front/back fill have no stroke because that is handled by the front/back part
    this.frontFill.noStroke();
    this.backFill.noStroke();

    //Turn on the display initially so it shows up for the temporary ellipse
    this.frontFill.visible = true;
    this.backFill.visible = true;

    //set the fill gradient color correctly (especially the opacity which is set separately than the color -- not set by the opacity of the fillColor)
    this.frontGradientColor.color = SETTINGS.ellipse.drawn.fillColor.front;
    this.backGradientColor.color = SETTINGS.ellipse.dynamicBackStyle
      ? Nodule.contrastFillColor(SETTINGS.ellipse.drawn.fillColor.front)
      : SETTINGS.ellipse.drawn.fillColor.back;
    this.styleOptions.set(StyleCategory.Front, DEFAULT_ELLIPSE_FRONT_STYLE);
    this.styleOptions.set(StyleCategory.Back, DEFAULT_ELLIPSE_BACK_STYLE);
  }
  /**
   * Reorient the ellipse in standard position on the unit sphere in 3D to the target ellipse (the one being drawn)
   * and then project the points to 2D (assigning to front/back depending on the sign of the z coordinate)
   * This method updates the TwoJS objects (frontPart, frontExtra, ...) for display
   * This is only accurate if the a, b, and foci(1|2)Vector are correct so only
   * call this method once those variables are updated.
   */
  public updateDisplay(): void {
    // Standard Position for an ellipse with given a and b values
    //
    //  the foci in the x-z plane, at (-sin(d),0,cos(d)) and (sin(d),0,cos(d)), so
    // the center is at (0,0,1), d = 1/2 angle(F1,F2)), half the length of axis (of the ellipse) that projects onto the  x-axis is a,
    // half the length of the axis (of the ellipse) that projects on the y-axis is b, using the spherical Pythagorean Theorem cos(d)*cos(b)=cos(a)
    //
    // Create a matrix4 in the three.js package (called transformMatrix) that maps an ellipse (with the right a and b values) in standard position to
    // the one in the target desired (updated) position (i.e. the target ellipse).

    // First set up the coordinate system of the target ellipse
    // The vector to the center of the ellipse is the z axis
    this.tmpVector
      .addVectors(this._focus1Vector, this._focus2Vector)
      .normalize();
    desiredZAxis.copy(this.tmpVector);

    // The vector perpendicular the plane containing the foci is the y axis
    this.tmpVector
      .crossVectors(this._focus1Vector, this._focus2Vector)
      .normalize();
    desiredYAxis.copy(this.tmpVector);

    // Use the cross product to create the vector perpendicular to both the desired z and x axis
    desiredXAxis.crossVectors(desiredYAxis, desiredZAxis);

    // Set up the local coordinates from for the ellipse,
    //  this._ellipseFrame will now map (1,0,0) to the point on the desired x axis a unit from the origin in the positive direction.
    this._ellipseFrame.makeBasis(desiredXAxis, desiredYAxis, desiredZAxis);

    // The target ellipse (on the sphere of radius SETTINGS.boundaryCircle.radius) is scaled version of the
    // original ellipse (which is on the unit sphere)
    // so scale XYZ space
    // this will make the original ellipse (in standard position on the sphere) finally coincide with the target ellipse
    this.tmpMatrix.makeScale(
      SETTINGS.boundaryCircle.radius,
      SETTINGS.boundaryCircle.radius,
      SETTINGS.boundaryCircle.radius
    );
    transformMatrix.multiplyMatrices(this._ellipseFrame, this.tmpMatrix);
    //transformMatrix.multiply(this.tmpMatrix); // transformMatrix now maps the original ellipse to the target ellipse

    // Recalculate the 3D coordinates of the ellipse and record the projection in the TwoJS paths
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
    let tVal = 0;
    for (let pos = 0; pos < 2 * SUBDIVISIONS; pos++) {
      // The t value
      tVal =
        this._tMin + (pos / (2 * SUBDIVISIONS)) * (this._tMax - this._tMin);

      // E(tval) is the location on the unit sphere of the ellipse in standard position
      this.tmpVector.copy(this.E(tVal));
      // Set tmpVector equal to location on the target ellipse
      this.tmpVector.applyMatrix4(transformMatrix);
      // console.debug(`tempvec ${this.tmpVector.toFixed(2)}`);
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
    }
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
    if (Nodule.globalFillStyle != FillStyle.NoFill) {
      // console.log(
      //   "sum of front and back part",
      //   this.frontPart.vertices.length + this.backPart.vertices.length
      // );
      // Bring all the anchor points to a common pool
      // Each front/back fill path will pull anchor points from
      // this pool as needed
      // any remaining are put in storage
      const pool: Anchor[] = [];
      pool.push(...this.frontFill.vertices.splice(0));
      pool.push(...this.backFill.vertices.splice(0));
      pool.push(...this.fillStorageAnchors.splice(0));
      // console.log("pool size initially", pool.length);

      let posIndexFill = 0;
      let negIndexFill = 0;
      let boundaryPoints: number[][] = [];
      // The ellipse interior is only on the front of the sphere (recall that  a and b are both either bigger than Pi/2 or both less, no mixing)
      if (backLen === 0 && this._a < Math.PI / 2) {
        this.frontFillInUse = true;
        this.backFillInUse = false;
        // In this case the frontFillVertices are the same as the frontVertices
        this.frontPart.vertices.forEach((v: Anchor) => {
          if (posIndexFill === this.frontFill.vertices.length) {
            //add a vector from the pool
            const vert = pool.pop();
            if (vert !== undefined) {
              this.frontFill.vertices.push(vert);
            } else {
              throw new Error(
                "Ellipse: not enough anchors in the pool to trace the ellipse on the front."
              );
            }
          }
          this.frontFill.vertices[posIndexFill].x = v.x;
          this.frontFill.vertices[posIndexFill].y = v.y;
          posIndexFill++;
        });
        // put remaining vertices in the storage
        this.fillStorageAnchors.push(...pool.splice(0));
      } // The ellipse interior is split between front and back
      else if (backLen !== 0 && frontLen !== 0) {
        this.frontFillInUse = true;
        this.backFillInUse = true;
        //find the angular width of the part of the boundary ellipse to be copied
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

        // Compute the angular width of the section of the boundary ellipse to add to the front/back fill
        // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
        let angularWidth = endAngle - startAngle;
        if (angularWidth < 0) {
          angularWidth += 2 * Math.PI;
        }
        //console.log(angularWidth);
        // When tracing the boundary ellipse we start from fromVector = this.frontPart.vertices[frontLen - 1]
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

        // If the a,b are bigger than Pi/2 then reverse the toVector
        if (this._a > Math.PI / 2) {
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
        this.frontPart.vertices.forEach((node: Anchor) => {
          if (posIndexFill === this.frontFill.vertices.length) {
            //add a vector from the pool
            const vert = pool.pop();
            if (vert !== undefined) {
              this.frontFill.vertices.push(vert);
            } else {
              throw new Error(
                "Ellipse: not enough anchors in the pool to trace the ellipse on the front."
              );
            }
          }
          this.frontFill.vertices[posIndexFill].x = node.x;
          this.frontFill.vertices[posIndexFill].y = node.y;
          posIndexFill++;
        });
        // add the boundary points
        boundaryPoints.forEach(node => {
          if (posIndexFill === this.frontFill.vertices.length) {
            //add a vector from the pool
            const vert = pool.pop();
            if (vert !== undefined) {
              this.frontFill.vertices.push(vert);
            } else {
              throw new Error(
                "Ellipse: not enough anchors in the pool to trace the ellipse on the front."
              );
            }
          }
          this.frontFill.vertices[posIndexFill].x = node[0];
          this.frontFill.vertices[posIndexFill].y = node[1];
          posIndexFill++;
        });
        // console.log("posIndex", posIndexFill, " of ", 4 * SUBDIVISIONS + 2);
        // console.log("pool size", pool.length);
        // Build the backFill- first add the backPart.vertices
        this.backPart.vertices.forEach((node: Anchor) => {
          if (negIndexFill === this.backFill.vertices.length) {
            //add a vector from the pool
            const vert = pool.pop();
            if (vert !== undefined) {
              this.backFill.vertices.push(vert);
            } else {
              throw new Error(
                "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
              );
            }
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
            const vert = pool.pop();
            if (vert !== undefined) {
              this.backFill.vertices.push(vert);
            } else {
              throw new Error(
                "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
              );
            }
          }
          this.backFill.vertices[negIndexFill].x = node[0];
          this.backFill.vertices[negIndexFill].y = node[1];
          negIndexFill++;
        });

        // put remaining vertices in the storage (there shouldn't be any in this case)
        this.fillStorageAnchors.push(...pool.splice(0));
      }
      // The ellipse interior is only on the back of the sphere
      else if (frontLen === 0 && this._a < Math.PI / 2) {
        this.frontFillInUse = false;
        this.backFillInUse = true;
        //
        // In this case the backFillVertices are the same as the backVertices
        this.backPart.vertices.forEach((v: Anchor) => {
          if (negIndexFill === this.backFill.vertices.length) {
            //add a vector from the pool
            const vert = pool.pop();
            if (vert !== undefined) {
              this.backFill.vertices.push(vert);
            } else {
              throw new Error(
                "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
              );
            }
          }
          this.backFill.vertices[negIndexFill].x = v.x;
          this.backFill.vertices[negIndexFill].y = v.y;
          negIndexFill++;
        });
        // put remaining vertices in the storage
        this.fillStorageAnchors.push(...pool.splice(0));
      }
      // The ellipse interior covers the entire front half of the sphere and is a 'hole' on the back
      else if (frontLen === 0 && this._a > Math.PI / 2) {
        this.frontFillInUse = true;
        this.backFillInUse = true;
        // In this case set the frontFillVertices to the entire boundary circle which are the originalVertices, but only add half of them
        // so that only SUBDIVISION number of vectors are used. (We need 3*SUBDIVISION +2 for the annular region on the back)
        this.originalVertices.reverse().forEach((v, ind) => {
          if (ind % 2 === 0) {
            if (posIndexFill === this.frontFill.vertices.length) {
              //add a vector from the pool
              const vert = pool.pop();
              if (vert !== undefined) {
                this.frontFill.vertices.push(vert);
              } else {
                throw new Error(
                  "Ellipse: not enough anchors in the pool to trace the ellipse on the front."
                );
              }
            }
            this.frontFill.vertices[posIndexFill].x = v.x;
            this.frontFill.vertices[posIndexFill].y = v.y;
            posIndexFill++;
          }
        });

        // In this case the backFillVertices must trace out first the boundary circle (originalVertices) and then
        //  the ellipse, to trace an annular region.  To help with the rendering, start tracing
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
                const vert = pool.pop();
                if (vert !== undefined) {
                  this.backFill.vertices.push(vert);
                } else {
                  throw new Error(
                    "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
                  );
                }
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
        this.backPart.vertices.forEach((v: Anchor, index: number) => {
          if (negIndexFill === this.backFill.vertices.length) {
            //add a vector from the pool
            const vert = pool.pop();
            if (vert !== undefined) {
              this.backFill.vertices.push(vert);
            } else {
              throw new Error(
                "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
              );
            }
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
      // The ellipse interior covers the entire back half of the sphere and is a 'hole' on the front
      else if (backLen === 0 && this._a > Math.PI / 2) {
        this.frontFillInUse = true;
        this.backFillInUse = true;
        // In this case set the backFillVertices to the entire boundary circle of the sphere which are the originalVertices, but only add half of them
        // so that only SUBDIVISION number of vectors are used. (We need 3*SUBDIVISION +2 for the annular region on the front)
        this.originalVertices.reverse().forEach((v, ind) => {
          if (ind % 2 === 0) {
            if (negIndexFill === this.backFill.vertices.length) {
              //add a vector from the pool
              const vert = pool.pop();
              if (vert !== undefined) {
                this.backFill.vertices.push(vert);
              } else {
                throw new Error(
                  "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
                );
              }
            }
            this.backFill.vertices[negIndexFill].x = v.x;
            this.backFill.vertices[negIndexFill].y = v.y;
            negIndexFill++;
          }
        });

        // In this case the frontFillVertices must trace out first the boundary circle (originalVertices) and then
        //  the ellipse, to trace an annular region.  To help with the rendering, start tracing
        //  the boundary circle directly across from the vertex on the ellipse at index zero
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
                const vert = pool.pop();
                if (vert !== undefined) {
                  this.frontFill.vertices.push(vert);
                } else {
                  throw new Error(
                    "Ellipse: not enough anchors in the pool to trace the ellipse on the front."
                  );
                }
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
        this.frontPart.vertices.forEach((v: Anchor, index: number) => {
          if (posIndexFill === this.frontFill.vertices.length) {
            //add a vector from the pool
            const vert = pool.pop();
            if (vert !== undefined) {
              this.frontFill.vertices.push(vert);
            } else {
              throw new Error(
                "Ellipse: not enough anchors in the pool to trace the ellipse on the front."
              );
            }
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
    const returnArray: Array<Array<number>> = [];

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
   * Set the foci vectors. (Used by ellipse handler to set these values for the temporary ellipse)
   */
  set focus1Vector(position: Vector3) {
    this._focus1Vector.copy(position);
  }
  get focus1Vector(): Vector3 {
    return this._focus1Vector;
  }
  set focus2Vector(position: Vector3) {
    this._focus2Vector.copy(position);
  }
  get focus2Vector(): Vector3 {
    return this._focus2Vector;
  }
  get ellipseFrame(): Matrix4 {
    //console.debug(`EllipseFrame ${this._ellipseFrame.toArray()}`);
    return this._ellipseFrame;
  }
  /**
   * Set the a and b parameters (Used by ellipse handler to set these values for the temporary ellipse)
   */
  set a(newA: number) {
    this._a = newA;
  }
  set b(newB: number) {
    this._b = newB;
  }

  /**
   * Get the parameters for the curve
   */
  get tMin(): number {
    return this._tMin;
  }
  get tMax(): number {
    return this._tMax;
  }
  get closed(): boolean {
    return this._closed;
  }
  get periodic(): boolean {
    return this._periodic;
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

  // setSelectedColoring(flag: boolean): void {
  //   //set the new colors into the variables
  //   if (flag) {
  //     this.glowingStrokeColorFront = SETTINGS.style.selectedColor.front;
  //     this.glowingStrokeColorBack = SETTINGS.style.selectedColor.back;
  //   } else {
  //     this.glowingStrokeColorFront = SETTINGS.ellipse.glowing.strokeColor.front;
  //     this.glowingStrokeColorBack = SETTINGS.ellipse.glowing.strokeColor.back;
  //   }
  //   // apply the new color variables to the object
  //   this.stylize(DisplayStyle.ApplyCurrentVariables);
  // }

  /**
   * Adds the front/back/glowing/not parts to the correct layers
   * @param layers
   */
  addToLayers(layers: Group[]): void {
    // These must always be executed even if the front/back part is empty
    // Otherwise when they become non-empty they are not displayed
    this.frontFill.addTo(layers[LAYER.foregroundFills]);
    this.frontPart.addTo(layers[LAYER.foreground]);
    this.glowingFrontPart.addTo(layers[LAYER.foregroundGlowing]);
    this.backFill.addTo(layers[LAYER.backgroundFills]);
    this.backPart.addTo(layers[LAYER.background]);
    this.glowingBackPart.addTo(layers[LAYER.backgroundGlowing]);
  }

  removeFromLayers(/*layers: Group[]*/): void {
    this.frontPart.remove();
    this.frontFill.remove();
    this.glowingFrontPart.remove();
    this.backPart.remove();
    this.backFill.remove();
    this.glowingBackPart.remove();
  }

  toSVG(nonScaling?: {
    stroke: boolean;
    text: boolean;
    pointRadius: boolean;
    scaleFactor: number;
  }): toSVGType[] {
    // Create an empty return type and then fill in the non-null parts
    const returnSVGObject: toSVGType = {
      frontGradientDictionary: null,
      backGradientDictionary: null,
      frontStyleDictionary: null,
      backStyleDictionary: null,
      layerSVGArray: [],
      type: "ellipse"
    };

    // Add the gradient to the gradient dictionary (if used)
    if (Nodule.globalFillStyle == FillStyle.ShadeFill) {
      if (this.frontFillInUse) {
        returnSVGObject.frontGradientDictionary =
          Nodule.createSVGGradientDictionary(
            this.frontGradient,
            this.frontGradientColorCenter,
            this.frontGradientColor
          );
      }

      if (this.backFillInUse) {
        returnSVGObject.backGradientDictionary =
          Nodule.createSVGGradientDictionary(
            this.backGradient,
            this.backGradientColorCenter,
            this.backGradientColor
          );
      }
    }

    // collect the front style
    if (this.frontFillInUse) {
      returnSVGObject.frontStyleDictionary = Nodule.createSVGStyleDictionary({
        strokeObject: this.frontPart,
        fillObject: this.frontFill
      });
    }
    // collect the front style
    if (this.backFillInUse) {
      returnSVGObject.backStyleDictionary = Nodule.createSVGStyleDictionary({
        strokeObject: this.backPart,
        fillObject: this.backFill
      });
    }
    // the ellipse edge is entirely on the front or the ellipse edge is entirely on the back")
    if (this.frontPart.closed || this.backPart.closed) {
      let layer = LAYER.foregroundFills;
      if (this.backPart.closed) {
        layer = LAYER.backgroundFills;
      }
      let part =
        layer == LAYER.foregroundFills ? this.frontPart : this.backPart;
      // In this case the frontFillVertices are the same as the frontVertices
      let svgString = '<path d="';
      part.vertices.forEach((v: Anchor, index: number) => {
        if (index == 0) {
          svgString += "M" + v.x + " " + v.y + " ";
        } else {
          svgString += "L" + v.x + " " + v.y + " ";
        }
      });
      if (this._a < Math.PI / 2) {
        // the entire interior is contained on the front or back
        svgString += 'Z "/>';
        returnSVGObject.layerSVGArray.push([layer, svgString]);
      } else {
        console.log("HOLE");
        //  the ellipse is a hole on the front or back, the back/front is entirely covered

        // Find two points on the edge that are close but not the same, draw the long ellipse between them

        const ellipseStartPoint =
          layer == LAYER.backgroundFills
            ? [this.backPart.vertices[0].x, this.backPart.vertices[0].y]
            : [this.frontPart.vertices[0].x, this.frontPart.vertices[0].y];

        // Find two point on the boundary circle that are across from the start of the ellipse
        // two points not the same, but close
        // Do some trig, law of sines to figure out an angle and then pick the angle at the center (0,0)
        this.tmpVector
          .copy(this._focus1Vector)
          .add(this._focus2Vector)
          .multiplyScalar(0.5 * SETTINGS.boundaryCircle.radius);
        const ellipseAng = Math.atan2(
          ellipseStartPoint[1] - this.tmpVector.y,
          ellipseStartPoint[0] - this.tmpVector.x
        );
        const distCircleCenterToEllipseCenter = Math.sqrt(
          this.tmpVector.x ** 2 + this.tmpVector.y ** 2
        );

        const circleStartAngle =
          ellipseAng -
          Math.asin(
            (distCircleCenterToEllipseCenter * Math.sin(Math.PI - ellipseAng)) /
              SETTINGS.boundaryCircle.radius
          );

        const deltaAng = 1 / SUBDIVISIONS;

        const circleStartPoint = [
          Math.cos(circleStartAngle),
          Math.sin(circleStartAngle)
        ].map(num => num * SETTINGS.boundaryCircle.radius);
        const deltaAdjustAngle =
          layer == LAYER.backgroundFills
            ? circleStartAngle - deltaAng
            : circleStartAngle + deltaAng;
        const circleEndPoint = [
          Math.cos(deltaAdjustAngle),
          Math.sin(deltaAdjustAngle)
        ].map(num => num * SETTINGS.boundaryCircle.radius);

        //create an svgArcObject
        const svgCircleObject: svgArcObject = {
          startPt: { x: circleStartPoint[0], y: circleStartPoint[1] },
          radiiXYWithSpace:
            SETTINGS.boundaryCircle.radius +
            " " +
            SETTINGS.boundaryCircle.radius +
            " ",
          rotationDegrees: 0,
          displayShort0OrLong1: 1,
          displayCCW0OrCW1: layer == LAYER.backgroundFills ? 1 : 0,
          endPt: { x: circleEndPoint[0], y: circleEndPoint[1] }
        };
        svgString +=
          "L" + ellipseStartPoint[0] + " " + ellipseStartPoint[1] + " "; // close the ellipse, with a line to the start
        svgString += Nodule.svgArcString(svgCircleObject, true);
        svgString +=
          "L" + circleStartPoint[0] + " " + circleStartPoint[1] + " "; // close the circle, with a line to the start
        svgString +=
          "M" + ellipseStartPoint[0] + " " + ellipseStartPoint[1] + " "; // move (not line) to the start ellipse
        svgString += '"/>';

        returnSVGObject.layerSVGArray.push([layer, svgString]);

        // now add the back/foreground fill which is a circle of radius boundary circle
        let svgEntireCircleString =
          '<circle cx="0" cy="0" r="' + SETTINGS.boundaryCircle.radius + '" />';
        returnSVGObject.layerSVGArray.push([
          layer == LAYER.backgroundFills
            ? LAYER.foregroundFills
            : LAYER.backgroundFills,
          svgEntireCircleString
        ]);
      }
    } else {
      // the ellipse intersects the boundary simply copy the fills
      //front
      let svgFrontString = '<path d="';
      this.frontFill.vertices.forEach((v: Anchor, index: number) => {
        if (index == 0) {
          svgFrontString += "M" + v.x + " " + v.y + " ";
        } else {
          svgFrontString += "L" + v.x + " " + v.y + " ";
        }
      });
      svgFrontString += 'Z "/>';
      returnSVGObject.layerSVGArray.push([
        LAYER.foregroundFills,
        svgFrontString
      ]);

      //front
      let svgBackString = '<path d="';
      this.backFill.vertices.forEach((v: Anchor, index: number) => {
        if (index == 0) {
          svgBackString += "M" + v.x + " " + v.y + " ";
        } else {
          svgBackString += "L" + v.x + " " + v.y + " ";
        }
      });
      svgBackString += 'Z "/>';
      returnSVGObject.layerSVGArray.push([
        LAYER.backgroundFills,
        svgBackString
      ]);
    }
    //  else if (!this.frontPart.closed && !this.backPart.closed) {
    //   //find the angular width of the part of the boundary ellipse to be copied
    //   // Compute the angle from the positive x axis to the last frontPartVertex
    //   //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
    //   const startAngle = Math.atan2(
    //     this.frontPart.vertices[frontLen - 1].y,
    //     this.frontPart.vertices[frontLen - 1].x
    //   );

    //   // Compute the angle from the positive x axis to the first frontPartVertex
    //   //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
    //   const endAngle = Math.atan2(
    //     this.frontPart.vertices[0].y,
    //     this.frontPart.vertices[0].x
    //   );

    //   // Compute the angular width of the section of the boundary ellipse to add to the front/back fill
    //   // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
    //   let angularWidth = endAngle - startAngle;
    //   if (angularWidth < 0) {
    //     angularWidth += 2 * Math.PI;
    //   }
    //   //console.log(angularWidth);
    //   // When tracing the boundary ellipse we start from fromVector = this.frontPart.vertices[frontLen - 1]
    //   const fromVector = [
    //     this.frontPart.vertices[frontLen - 1].x,
    //     this.frontPart.vertices[frontLen - 1].y
    //   ];
    //   // then
    //   // trace in the direction of a toVector that is perpendicular to this.frontPart.vertices[frontLen - 1]
    //   // and points in the same direction as this.frontPart.vertices[0]
    //   let toVector = [-fromVector[1], fromVector[0]];

    //   // If the toVector doesn't point in the same direction as the first vector in frontPart then reverse the toVector
    //   if (
    //     toVector[0] * this.frontPart.vertices[0].x +
    //       toVector[1] * this.frontPart.vertices[0].y <
    //     0
    //   ) {
    //     toVector = [-toVector[0], -toVector[1]];
    //   }

    //   // If the a,b are bigger than Pi/2 then reverse the toVector
    //   if (this._a > Math.PI / 2) {
    //     toVector = [-toVector[0], -toVector[1]];
    //   }
    //   // Create the boundary points
    //   boundaryPoints = this.boundaryCircleCoordinates(
    //     fromVector,
    //     SUBDIVISIONS + 1,
    //     toVector,
    //     angularWidth
    //   );

    //   // Build the frontFill- first add the frontPart.vertices
    //   this.frontPart.vertices.forEach((node: Anchor) => {
    //     if (posIndexFill === this.frontFill.vertices.length) {
    //       //add a vector from the pool
    //       const vert = pool.pop();
    //       if (vert !== undefined) {
    //         this.frontFill.vertices.push(vert);
    //       } else {
    //         throw new Error(
    //           "Ellipse: not enough anchors in the pool to trace the ellipse on the front."
    //         );
    //       }
    //     }
    //     this.frontFill.vertices[posIndexFill].x = node.x;
    //     this.frontFill.vertices[posIndexFill].y = node.y;
    //     posIndexFill++;
    //   });
    //   // add the boundary points
    //   boundaryPoints.forEach(node => {
    //     if (posIndexFill === this.frontFill.vertices.length) {
    //       //add a vector from the pool
    //       const vert = pool.pop();
    //       if (vert !== undefined) {
    //         this.frontFill.vertices.push(vert);
    //       } else {
    //         throw new Error(
    //           "Ellipse: not enough anchors in the pool to trace the ellipse on the front."
    //         );
    //       }
    //     }
    //     this.frontFill.vertices[posIndexFill].x = node[0];
    //     this.frontFill.vertices[posIndexFill].y = node[1];
    //     posIndexFill++;
    //   });
    //   // console.log("posIndex", posIndexFill, " of ", 4 * SUBDIVISIONS + 2);
    //   // console.log("pool size", pool.length);
    //   // Build the backFill- first add the backPart.vertices
    //   this.backPart.vertices.forEach((node: Anchor) => {
    //     if (negIndexFill === this.backFill.vertices.length) {
    //       //add a vector from the pool
    //       const vert = pool.pop();
    //       if (vert !== undefined) {
    //         this.backFill.vertices.push(vert);
    //       } else {
    //         throw new Error(
    //           "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
    //         );
    //       }
    //     }
    //     this.backFill.vertices[negIndexFill].x = node.x;
    //     this.backFill.vertices[negIndexFill].y = node.y;
    //     negIndexFill++;
    //   });
    //   // console.log("negIndex", negIndexFill, " of ", 4 * SUBDIVISIONS + 2);
    //   // console.log("pool size", pool.length);
    //   // add the boundary points (but in reverse!)
    //   boundaryPoints.reverse().forEach(node => {
    //     if (negIndexFill === this.backFill.vertices.length) {
    //       //add a vector from the pool
    //       const vert = pool.pop();
    //       if (vert !== undefined) {
    //         this.backFill.vertices.push(vert);
    //       } else {
    //         throw new Error(
    //           "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
    //         );
    //       }
    //     }
    //     this.backFill.vertices[negIndexFill].x = node[0];
    //     this.backFill.vertices[negIndexFill].y = node[1];
    //     negIndexFill++;
    //   });

    //   // put remaining vertices in the storage (there shouldn't be any in this case)
    //   this.fillStorageAnchors.push(...pool.splice(0));
    // }
    // // The ellipse interior is only on the back of the sphere
    // else if (this.backPart.closed && this._a < Math.PI / 2) {
    //   //
    //   // In this case the backFillVertices are the same as the backVertices
    //   this.backPart.vertices.forEach((v: Anchor) => {
    //     if (negIndexFill === this.backFill.vertices.length) {
    //       //add a vector from the pool
    //       const vert = pool.pop();
    //       if (vert !== undefined) {
    //         this.backFill.vertices.push(vert);
    //       } else {
    //         throw new Error(
    //           "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
    //         );
    //       }
    //     }
    //     this.backFill.vertices[negIndexFill].x = v.x;
    //     this.backFill.vertices[negIndexFill].y = v.y;
    //     negIndexFill++;
    //   });
    //   // put remaining vertices in the storage
    //   this.fillStorageAnchors.push(...pool.splice(0));
    // }
    // // The ellipse interior covers the entire front half of the sphere and is a 'hole' on the back
    // else if (this.backPart.closed && this._a > Math.PI / 2) {
    //   // In this case set the frontFillVertices to the entire boundary circle which are the originalVertices, but only add half of them
    //   // so that only SUBDIVISION number of vectors are used. (We need 3*SUBDIVISION +2 for the annular region on the back)
    //   this.originalVertices.reverse().forEach((v, ind) => {
    //     if (ind % 2 === 0) {
    //       if (posIndexFill === this.frontFill.vertices.length) {
    //         //add a vector from the pool
    //         const vert = pool.pop();
    //         if (vert !== undefined) {
    //           this.frontFill.vertices.push(vert);
    //         } else {
    //           throw new Error(
    //             "Ellipse: not enough anchors in the pool to trace the ellipse on the front."
    //           );
    //         }
    //       }
    //       this.frontFill.vertices[posIndexFill].x = v.x;
    //       this.frontFill.vertices[posIndexFill].y = v.y;
    //       posIndexFill++;
    //     }
    //   });

    //   // In this case the backFillVertices must trace out first the boundary circle (originalVertices) and then
    //   //  the ellipse, to trace an annular region.  To help with the rendering, start tracing
    //   //  the boundary circle directly across from the vertex on the circle at index zero
    //   const backStartTraceIndex = Math.floor(
    //     Math.atan2(
    //       this.backPart.vertices[0].y,
    //       this.backPart.vertices[0].x
    //     ).modTwoPi() /
    //       (Math.PI / SUBDIVISIONS)
    //   );

    //   this.originalVertices
    //     .reverse()
    //     .rotate(backStartTraceIndex)
    //     .forEach((v, ind) => {
    //       // Again add every other one so that only SUBDIVISION vectors are used in the first part of backFill
    //       if (ind % 2 === 0) {
    //         if (negIndexFill === this.backFill.vertices.length) {
    //           //add a vector from the pool
    //           const vert = pool.pop();
    //           if (vert !== undefined) {
    //             this.backFill.vertices.push(vert);
    //           } else {
    //             throw new Error(
    //               "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
    //             );
    //           }
    //         }
    //         this.backFill.vertices[negIndexFill].x = v.x;
    //         this.backFill.vertices[negIndexFill].y = v.y;
    //         negIndexFill++;
    //       }
    //     });

    //   //return the original vertices to there initial state (notice that they were reversed twice)
    //   this.originalVertices.rotate(-backStartTraceIndex);

    //   // Make sure that the next entry in the backFill is the first to closed up the annular region
    //   const vert1 = pool.pop()!;
    //   vert1.x = this.backFill.vertices[0].x;
    //   vert1.y = this.backFill.vertices[0].y;
    //   this.backFill.vertices.push(vert1);
    //   negIndexFill++;

    //   // now add the backPart vertices
    //   this.backPart.vertices.forEach((v: Anchor, index: number) => {
    //     if (negIndexFill === this.backFill.vertices.length) {
    //       //add a vector from the pool
    //       const vert = pool.pop();
    //       if (vert !== undefined) {
    //         this.backFill.vertices.push(vert);
    //       } else {
    //         throw new Error(
    //           "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
    //         );
    //       }
    //     }
    //     this.backFill.vertices[negIndexFill].x = v.x;
    //     this.backFill.vertices[negIndexFill].y = v.y;
    //     negIndexFill++;
    //   });

    //   // Make sure that the next entry in the backFill is the first to closed up the annular region
    //   const vert2 = pool.pop()!;
    //   vert2.x = this.backFill.vertices.slice(-1)[0].x;
    //   vert2.y = this.backFill.vertices.slice(-1)[0].y;
    //   this.backFill.vertices.push(vert2);

    //   // put remaining vertices in the storage (There shouldn't be any in this case)
    //   this.fillStorageAnchors.push(...pool.splice(0));
    // }
    // // The ellipse interior covers the entire back half of the sphere and is a 'hole' on the front
    // else if (this.frontPart.closed && this._a > Math.PI / 2) {
    //   // In this case set the backFillVertices to the entire boundary circle of the sphere which are the originalVertices, but only add half of them
    //   // so that only SUBDIVISION number of vectors are used. (We need 3*SUBDIVISION +2 for the annular region on the front)
    //   this.originalVertices.reverse().forEach((v, ind) => {
    //     if (ind % 2 === 0) {
    //       if (negIndexFill === this.backFill.vertices.length) {
    //         //add a vector from the pool
    //         const vert = pool.pop();
    //         if (vert !== undefined) {
    //           this.backFill.vertices.push(vert);
    //         } else {
    //           throw new Error(
    //             "Ellipse: not enough anchors in the pool to trace the ellipse on the back."
    //           );
    //         }
    //       }
    //       this.backFill.vertices[negIndexFill].x = v.x;
    //       this.backFill.vertices[negIndexFill].y = v.y;
    //       negIndexFill++;
    //     }
    //   });

    //   // In this case the frontFillVertices must trace out first the boundary circle (originalVertices) and then
    //   //  the ellipse, to trace an annular region.  To help with the rendering, start tracing
    //   //  the boundary circle directly across from the vertex on the ellipse at index zero
    //   const frontStartTraceIndex = Math.floor(
    //     Math.atan2(
    //       this.frontPart.vertices[0].y,
    //       this.frontPart.vertices[0].x
    //     ).modTwoPi() /
    //       (Math.PI / SUBDIVISIONS)
    //   );

    //   this.originalVertices
    //     .reverse()
    //     .rotate(frontStartTraceIndex)
    //     .forEach((v, ind) => {
    //       // Again add every other one so that only SUBDIVISION vectors are used in the first part of frontFill
    //       if (ind % 2 === 0) {
    //         if (posIndexFill === this.frontFill.vertices.length) {
    //           //add a vector from the pool
    //           const vert = pool.pop();
    //           if (vert !== undefined) {
    //             this.frontFill.vertices.push(vert);
    //           } else {
    //             throw new Error(
    //               "Ellipse: not enough anchors in the pool to trace the ellipse on the front."
    //             );
    //           }
    //         }
    //         this.frontFill.vertices[posIndexFill].x = v.x;
    //         this.frontFill.vertices[posIndexFill].y = v.y;
    //         posIndexFill++;
    //       }
    //     });
    //   //return/rotate the original vertices to there initial state (notice that they were reversed twice)
    //   this.originalVertices.rotate(-frontStartTraceIndex);

    //   // Make sure that the next entry in the frontFill is the first to closed up the annular region
    //   const vert1 = pool.pop()!;
    //   vert1.x = this.frontFill.vertices[0].x;
    //   vert1.y = this.frontFill.vertices[0].y;
    //   this.frontFill.vertices.push(vert1);
    //   posIndexFill++;

    //   // now add the frontPart vertices
    //   this.frontPart.vertices.forEach((v: Anchor, index: number) => {
    //     if (posIndexFill === this.frontFill.vertices.length) {
    //       //add a vector from the pool
    //       const vert = pool.pop();
    //       if (vert !== undefined) {
    //         this.frontFill.vertices.push(vert);
    //       } else {
    //         throw new Error(
    //           "Ellipse: not enough anchors in the pool to trace the ellipse on the front."
    //         );
    //       }
    //     }
    //     this.frontFill.vertices[posIndexFill].x = v.x;
    //     this.frontFill.vertices[posIndexFill].y = v.y;
    //     posIndexFill++;
    //   });

    //   // Make sure that the next entry in the frontFill is the first to closed up the annular region
    //   const vert2 = pool.pop()!;
    //   vert2.x = this.frontPart.vertices[0].x;
    //   vert2.y = this.frontPart.vertices[0].y;
    //   this.frontFill.vertices.push(vert2);

    //   // put remaining vertices in the storage (There shouldn't be any in this case)
    //   this.fillStorageAnchors.push(...pool.splice(0));
    // }

    return [returnSVGObject];
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleCategory): StyleOptions {
    switch (panel) {
      case StyleCategory.Front:
        return DEFAULT_ELLIPSE_FRONT_STYLE;
      case StyleCategory.Back:
        if (SETTINGS.ellipse.dynamicBackStyle)
          return {
            ...DEFAULT_ELLIPSE_BACK_STYLE,
            strokeWidthPercent: Nodule.contrastStrokeWidthPercent(100),
            strokeColor: Nodule.contrastStrokeColor(
              SETTINGS.ellipse.drawn.strokeColor.front
            ),
            fillColor: Nodule.contrastFillColor(
              SETTINGS.ellipse.drawn.fillColor.front
            )
          };
        else return DEFAULT_ELLIPSE_BACK_STYLE;

      default:
        return {};
    }
  }

  /**
   * Sets the variables for stroke width glowing/not
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    const backStyle = this.styleOptions.get(StyleCategory.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this.frontPart.linewidth =
      (Ellipse.currentEllipseStrokeWidthFront * frontStrokeWidthPercent) / 100;
    this.backPart.linewidth =
      (Ellipse.currentEllipseStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this.glowingFrontPart.linewidth =
      (Ellipse.currentGlowingEllipseStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;
    this.glowingBackPart.linewidth =
      (Ellipse.currentGlowingEllipseStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
  }

  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the ellipse
   *
   * ApplyTemporaryVariables means that
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // Use the SETTINGS temporary options to directly modify the js objects.

        //FRONT
        if (
          Nodule.rgbaIsNoFillOrNoStroke(
            SETTINGS.ellipse.temp.fillColor.front
          ) ||
          Nodule.globalFillStyle == FillStyle.NoFill
        ) {
          this.frontFill.noFill();
        } else {
          if (Nodule.globalFillStyle == FillStyle.ShadeFill) {
            this.frontGradientColor.color =
              SETTINGS.ellipse.temp.fillColor.front;
            this.frontFill.fill = this.frontGradient;
          } else {
            this.frontFill.fill = SETTINGS.ellipse.temp.fillColor.front;
          }
        }
        if (
          Nodule.rgbaIsNoFillOrNoStroke(SETTINGS.ellipse.temp.strokeColor.front)
        ) {
          this.frontPart.noStroke();
        } else {
          this.frontPart.stroke = SETTINGS.ellipse.temp.strokeColor.front;
        }
        // The ellipse width is set to the current ellipse width (which is updated for zoom magnification)
        this.frontPart.linewidth = Ellipse.currentEllipseStrokeWidthFront;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.ellipse.drawn.dashArray.useOnFront) {
          this.frontPart.dashes.clear();
          SETTINGS.ellipse.drawn.dashArray.front.forEach(v => {
            this.frontPart.dashes.push(v);
          });
          if (SETTINGS.ellipse.drawn.dashArray.reverse.front) {
            this.frontPart.dashes.reverse();
          }
        }
        //BACK
        if (
          Nodule.rgbaIsNoFillOrNoStroke(SETTINGS.ellipse.temp.fillColor.back) ||
          Nodule.globalFillStyle == FillStyle.NoFill
        ) {
          this.backFill.noFill();
        } else {
          if (Nodule.globalFillStyle == FillStyle.ShadeFill) {
            this.backGradientColor.color = SETTINGS.ellipse.temp.fillColor.back;
            this.backFill.fill = this.backGradient;
          } else {
            this.backFill.fill = SETTINGS.ellipse.temp.fillColor.back;
          }
        }
        if (
          Nodule.rgbaIsNoFillOrNoStroke(SETTINGS.ellipse.temp.strokeColor.back)
        ) {
          this.backPart.noStroke();
        } else {
          this.backPart.stroke = SETTINGS.ellipse.temp.strokeColor.back;
        }
        // The ellipse width is set to the current ellipse width (which is updated for zoom magnification)
        this.backPart.linewidth = Ellipse.currentEllipseStrokeWidthBack;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.ellipse.drawn.dashArray.useOnBack) {
          this.backPart.dashes.clear();
          SETTINGS.ellipse.drawn.dashArray.back.forEach(v => {
            this.backPart.dashes.push(v);
          });
          if (SETTINGS.ellipse.drawn.dashArray.reverse.back) {
            this.backPart.dashes.reverse();
          }
        }

        // The temporary display is never highlighted
        this.glowingFrontPart.visible = false;
        this.glowingBackPart.visible = false;
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the js objects.

        // FRONT
        const frontStyle = this.styleOptions.get(StyleCategory.Front);

        if (
          Nodule.rgbaIsNoFillOrNoStroke(frontStyle?.fillColor) ||
          Nodule.globalFillStyle == FillStyle.NoFill
        ) {
          this.frontFill.noFill();
        } else {
          if (Nodule.globalFillStyle == FillStyle.ShadeFill) {
            this.frontGradientColor.color =
              frontStyle?.fillColor ?? SETTINGS.ellipse.drawn.fillColor.front;
            this.frontFill.fill = this.frontGradient;
          } else {
            this.frontFill.fill =
              frontStyle?.fillColor ?? SETTINGS.ellipse.drawn.fillColor.front;
          }
        }
        if (Nodule.rgbaIsNoFillOrNoStroke(frontStyle?.strokeColor)) {
          this.frontPart.noStroke();
        } else {
          this.frontPart.stroke =
            frontStyle?.strokeColor ?? SETTINGS.ellipse.drawn.strokeColor.front;
        }
        // strokeWidthPercent is applied by adjustSize()

        if (
          frontStyle?.useDashPattern &&
          frontStyle?.dashArray &&
          frontStyle.reverseDashArray != undefined
        ) {
          this.frontPart.dashes.clear();
          this.frontPart.dashes.push(...frontStyle.dashArray);
          if (frontStyle.reverseDashArray) {
            this.frontPart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.frontPart.dashes.clear();
          this.frontPart.dashes.push(0);
        }
        // BACK
        const backStyle = this.styleOptions.get(StyleCategory.Back);
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.rgbaIsNoFillOrNoStroke(
              Nodule.contrastFillColor(frontStyle?.fillColor)
            ) ||
            Nodule.globalFillStyle == FillStyle.NoFill
          ) {
            this.backFill.noFill();
          } else {
            if (Nodule.globalFillStyle == FillStyle.ShadeFill) {
              this.backGradientColor.color = Nodule.contrastFillColor(
                frontStyle?.fillColor ?? "black"
              );

              this.backFill.fill = this.backGradient;
            } else {
              this.backFill.fill = Nodule.contrastFillColor(
                frontStyle?.fillColor ?? "black"
              );
            }
          }
        } else {
          if (
            Nodule.rgbaIsNoFillOrNoStroke(backStyle?.fillColor) ||
            Nodule.globalFillStyle == FillStyle.NoFill
          ) {
            this.backFill.noFill();
          } else {
            if (Nodule.globalFillStyle == FillStyle.ShadeFill) {
              this.backGradientColor.color = backStyle?.fillColor ?? "black";
              this.backFill.fill = this.backGradient;
            } else {
              this.backFill.fill = backStyle?.fillColor ?? "black";
            }
          }
        }

        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.rgbaIsNoFillOrNoStroke(
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
          if (Nodule.rgbaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this.backPart.noStroke();
          } else {
            this.backPart.stroke = backStyle?.strokeColor ?? "black";
          }
        }

        // strokeWidthPercent applied by adjustSizer()

        if (
          backStyle?.useDashPattern &&
          backStyle?.dashArray &&
          backStyle.reverseDashArray != undefined
        ) {
          this.backPart.dashes.clear();
          this.backPart.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this.backPart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.backPart.dashes.clear();
          this.backPart.dashes.push(0);
        }

        // UPDATE the glowing object

        // Glowing Front
        // no fillColor for glowing ellipses
        this.glowingFrontPart.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (
          frontStyle?.useDashPattern &&
          frontStyle?.dashArray &&
          frontStyle.reverseDashArray != undefined
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
        // no fillColor for glowing ellipses
        this.glowingBackPart.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (
          backStyle?.useDashPattern &&
          backStyle?.dashArray &&
          backStyle.reverseDashArray != undefined
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
