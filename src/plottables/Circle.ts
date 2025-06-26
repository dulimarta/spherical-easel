/** @format */

import { Vector3, Vector2, Matrix4 } from "three";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_CIRCLE_FRONT_STYLE,
  DEFAULT_CIRCLE_BACK_STYLE
} from "@/types/Styles";
import { Arc } from "two.js/extras/jsm/arc";
import { Group } from "two.js/src/group";
import { Stop } from "two.js/src/effects/stop";
import { RadialGradient } from "two.js/src/effects/radial-gradient";
import { Anchor } from "two.js/src/anchor";
import { Path } from "two.js/src/path";
import { FillStyle, svgArcObject, toSVGType } from "@/types";

// The number of vertices used to draw an arc of a projected circle
const SUBDIVISIONS = SETTINGS.circle.numPoints;
// The radius of the sphere on the screen
const radius = SETTINGS.boundaryCircle.radius;

/**
 * For drawing surface circle. A circle consists of two paths (front and back) and two fills (front and back)
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
   * NOTE: Once the above two variables are set, the updateDisplay() will correctly render the circle.
   * These are the only pieces of information that are need to do the rendering. All other
   * calculations in this class are only for the purpose of rendering the circle.
   */

  /**
   * The TwoJS objects to display the front/back parts and their glowing counterparts.
   */
  protected _frontPart: Arc;
  protected _backPart: Arc;
  protected _glowingFrontPart: Arc;
  protected _glowingBackPart: Arc;

  /**
   * The TwoJS objects to display the front/back fill. These are different than the front/back parts
   *  because when the circle is dragged between the front and back, the fill region includes some
   *  of the boundary circle and is therefore different from the front/back parts.
   */
  protected _frontFill: Path;
  protected _backFill: Path;

  /**
   * The normal vector and circle radius determines the rotation, distance to center and major/minor axis length of the projected ellipse
   */
  private _rotation: number = 0; //equal -Math.atan2(this._normalVector.x, this._normalVector.y); This is the amount to rotate the ellipse about its center

  private _halfMinorAxis: number = 0; //equal to (Sin[_beta + r] - Sin[_beta - r])/2
  private _halfMajorAxis: number = 0; // equal to Sqrt[2 - Cos[r]^2]/Sqrt[Cot[r]^2 + 2]
  private _beta: number = 0; // equal to acos(this._centerVector.z), the angle between the north pole <0,0,1> and the center vector
  private _center = new Anchor(0, 0); // equal to  (boundary circle radius)* < (Sin[_beta + r] + Sin[_beta - r])/2, 0 >,  and then rotated by Math.atan2(this._centerVector.y, this._centerVector.x)).

  // The boundaryParameter (and -boundaryParameter are the parameter values where the circle crosses the boundaryCircle
  // set to zero when circle doesn't cross the boundaryCircle
  // The circle crosses the boundary if and only if Pi/2 < r + \[Beta] < 3 Pi/2 and Pi/2 < \[Beta] - r < Pi/2
  private _boundaryParameter: number = 0; // equal to ArcCos[Cot[r] Cot[_beta]]

  // Booleans to determine if the front/back fill/not are in use, useful in the display
  // the front/back Part/Fill are all independent for example, when the circle is a hole on the front, the backPart is NOT in use but the backFill IS in use.
  private _frontPartInUse = true;
  private _backPartInUse = false;
  private _frontFillInUse = true;
  private _backFillInUse = false;

  // Booleans that will help decide when to update the frontFill or backFill when the they are the entire front or back
  // if the (front|back)Fill is the entire (front|back) and it will be again in updateDisplay, then don't update it
  private _frontFillIsEntireFront = false;
  private _backFillIsEntireBack = false;

  // The equation of the projected ellipse is translate the ellipse
  //
  //   {shortAxis[r, _beta ]*Cos[t], longAxis[r]*Sin[t]}
  //
  // by
  //
  //   {centerDist[r, _beta ], 0}
  //
  // then rotate by angle \Theta which is
  //
  // rot[\[Theta]] . ({shortAxis[r, _beta ]*Cos[t], longAxis[r]*Sin[t]} + {centerDist[r, _beta ], 0})
  //
  // Which is equal to
  //
  //   Cos[t]*Cos[_beta]*Cos[\[Theta]]*Sin[r] +
  //       Cos[r]*Cos[\[Theta]]*Sin[_beta] +
  //      ( Sqrt[2 - Cos[r]^2]*Sin[t]*Sin[\[Theta]] )/Sqrt[2 + Cot[r]^2],
  //
  //  ( Sqrt[2 - Cos[r]^2]*Cos[\[Theta]]*Sin[t] )/Sqrt[2 + Cot[r]^2] -
  //      ( Cos[t]*Cos[_beta]*Sin[r] + Cos[r]*Sin[_beta] )*Sin[\[Theta]]
  //
  // This is this.pointOnProjectedEllipse

  /**Create a storage path for unused anchors in the case that the boundary circle doesn't intersect the circle*/
  private fillStorageAnchors: Anchor[] = [];
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

  private frontGradientColorCenter = new Stop(
    0,
    SETTINGS.style.fill.frontWhite,
    1
  );
  private frontGradientColor = new Stop(
    SETTINGS.style.fill.gradientPercent,
    SETTINGS.circle.drawn.fillColor.front,
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
    SETTINGS.circle.drawn.fillColor.back,
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

  //////////////////// Temp to explore gradients
  // private frontGradientColor = new Stop(0.6, "black", 1);

  // private frontGradientColorCenter0 = new Stop(0.25, "green", 1);
  // private frontGradientColorCenter = new Stop(0.5, "red", 1);
  // private frontGradientColor1 = new Stop(0.6, "blue", 1);

  // private frontGradient = new RadialGradient(
  //  0.25,
  //   0.25,
  //   0.5,
  //   [this.frontGradientColorCenter0,this.frontGradientColorCenter, this.frontGradientColor1]
  // );

  ////////////////////

  // SUBDIVISIONS number of equally spaced coordinates on the boundary circle
  static boundaryVertices: [number[]] = [[]];
  // Be sure that this array is populated only once
  static setBoundaryVerticesHasBeenCalled = false;
  static setBoundaryVertices(): void {
    if (!Circle.setBoundaryVerticesHasBeenCalled) {
      Circle.boundaryVertices.splice(0);
      for (let k = 0; k < SUBDIVISIONS; k++) {
        const angle1 = (k / SUBDIVISIONS) * 2 * Math.PI;
        Circle.boundaryVertices.push([
          SETTINGS.boundaryCircle.radius * Math.cos(angle1),
          SETTINGS.boundaryCircle.radius * Math.sin(angle1)
        ]);
      }
      Circle.setBoundaryVerticesHasBeenCalled = true;
    }
  }

  /** Initialize the current circle width that is adjust by the zoom level and the user widthPercent */
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

  constructor(noduleName: string = "None") {
    super(noduleName);
    // Set the boundary vertices (only populates Circle.boundaryVertices once)
    Circle.setBoundaryVertices();

    this.frontGradient.units = "userSpaceOnUse"; // this means that the gradient uses the coordinates of the layer (but centered on the projection of the circle)
    this.backGradient.units = "userSpaceOnUse";

    // Create the glowing/back/fill parts.
    this._frontPart = new Arc(0, 0, 0, 0, 0, 0, SUBDIVISIONS);
    this._glowingFrontPart = new Arc(0, 0, 0, 0, 0, 0, SUBDIVISIONS);
    this._backPart = new Arc(0, 0, 0, 0, 0, 0, SUBDIVISIONS);
    this._glowingBackPart = new Arc(0, 0, 0, 0, 0, 0, SUBDIVISIONS);

    // Set the styles that are always true
    // The front/back parts have no fill because that is handled by the front/back fill
    // The front/back fill have no stroke because that is handled by the front/back part
    this._frontPart.noFill();
    this._backPart.noFill();
    this._glowingFrontPart.noFill();
    this._glowingBackPart.noFill();

    //Turn off the glowing display initially but leave it on so that the temporary objects show up
    this._frontPart.visible = true;
    this._backPart.visible = true;
    this._glowingBackPart.visible = false;
    this._glowingFrontPart.visible = false;

    // In total there are a maximum of 3*SUBDIVISIONS + 2 anchors in use on _fillFill and _backFill
    // when the circle is a hole on the front/back
    // This happens when the circle is a hole on the front or back.
    // The front/back requires 2*SUBDIVISIONS + 2 anchors (one SUBDIVISIONS to trace the circle, one SUBDIVISIONS to trace the boundary,
    // two for the extra anchors to close up the annular region on the circle and another on the boundary)
    // The back/front requires SUBDIVISIONS anchors
    //
    // When the circle intersects the boundary circle there are 4*SUBDIVISIONS anchors in use on the _frontFill and _backFill
    //  There are SUBDIVISIONS on the arc of the circle and on the boundary so 2*SUBDIVISIONS for each _frontFill and _backFill

    for (let k = 0; k < 4 * SUBDIVISIONS; k++) {
      this.fillStorageAnchors.push(new Anchor(0, 0));
    }

    //it doesn't matter that no anchors are assigned to the front/backFill because they will assigned from the fillStorageAnchors
    this._frontFill = new Path([], /* closed */ true, /* curve */ false);
    this._backFill = new Path([], /* closed */ true, /* curve */ false);

    // Set the styles that are always true
    // The front/back fill have no stroke because that is handled by the front/back part
    this._frontFill.noStroke();
    this._backFill.noStroke();

    //Turn on the display initially so it shows up for the temporary circle
    this._frontFill.visible = true;
    this._backFill.visible = true;

    //set the fill gradient color correctly (especially the opacity which is set separately than the color -- not set by the opacity of the fillColor)
    this.frontGradientColor.color = SETTINGS.circle.drawn.fillColor.front;
    this.backGradientColor.color = SETTINGS.circle.dynamicBackStyle
      ? Nodule.contrastFillColor(SETTINGS.circle.drawn.fillColor.front)
      : SETTINGS.circle.drawn.fillColor.back;
    this.styleOptions.set(StyleCategory.Front, DEFAULT_CIRCLE_FRONT_STYLE);
    this.styleOptions.set(StyleCategory.Back, DEFAULT_CIRCLE_BACK_STYLE);
  }
  /**
   * This method updates the TwoJS objects (frontPart, frontFill, ...) for display
   * This is only accurate if the centerVector and radius are correct so only
   * call this method once those variables are updated.
   */
  public updateDisplay(): void {
    //#region circleDisplay
    //Set all the parameters that control the size and location of the projected ellipse (but not the part of the ellipse that is drawn)
    this._beta = Math.acos(this._centerVector.z);
    this._rotation = -Math.atan2(this._centerVector.x, this._centerVector.y);
    this._halfMinorAxis =
      (Math.sin(this._beta + this._circleRadius) -
        Math.sin(this._beta - this._circleRadius)) /
      2;
    this._halfMajorAxis =
      Math.sqrt(2 - Math.cos(this._circleRadius) ** 2) /
      Math.sqrt(Nodule.ctg(this._circleRadius) ** 2 + 2);
    this._center.x =
      (SETTINGS.boundaryCircle.radius *
        (Math.sin(this._beta + this._circleRadius) +
          Math.sin(this._beta - this._circleRadius))) /
      2;
    this._center.y = 0; // y component is always zero

    // Now rotate the center vector
    this._center.rotate(Math.atan2(this._centerVector.y, this._centerVector.x)); //DO NOT Rotate the center vector at the same time you set it equal to this._frontPart.position, this causes unexpected results

    //Copy the updated information into the glowing/not front/back parts

    // make sure the height and width are never zero, otherwise you get an SVG error about a NaN
    const tempHalfMinorAxis =
      Math.abs(this._halfMinorAxis) < SETTINGS.tolerance
        ? 0.00001
        : 2 * radius * this._halfMinorAxis;
    const tempHalfMajorAxis =
      Math.abs(this._halfMajorAxis) < SETTINGS.tolerance
        ? 0.00001
        : 2 * radius * this._halfMajorAxis;
    this._frontPart.height = tempHalfMinorAxis;
    this._frontPart.width = tempHalfMajorAxis;
    this._frontPart.rotation = this._rotation;
    this._frontPart.position = this._center;

    this._backPart.height = tempHalfMinorAxis;
    this._backPart.width = tempHalfMajorAxis;
    this._backPart.position = this._center;
    this._backPart.rotation = this._rotation;

    this._glowingFrontPart.height = tempHalfMinorAxis;
    this._glowingFrontPart.width = tempHalfMajorAxis;
    this._glowingFrontPart.position = this._center;
    this._glowingFrontPart.rotation = this._rotation;

    this._glowingBackPart.height = tempHalfMinorAxis;
    this._glowingBackPart.width = tempHalfMajorAxis;
    this._glowingBackPart.position = this._center;
    this._glowingBackPart.rotation = this._rotation;

    // variables that indicate where the extremes of the circle are
    const my_diff = this._beta - this._circleRadius; // my_diff is the angular distance from the north pole to the closest point on the circle
    const my_sum = this._beta + this._circleRadius; // my_sum is the angular distance from the north pole to the furthest point on the circle

    // get the local transformation matrix of the circle (should be the same for all parts glowing/not front/back)
    const localMatrix = this._frontPart.matrix; //local matrix works for just the position, rotation, and scale of that object in its local frame

    if (
      -Math.PI / 2 < my_diff &&
      my_diff < Math.PI / 2 &&
      !(Math.PI / 2 < my_sum && my_sum < (3 * Math.PI) / 2)
    ) {
      // the circle edge is entirely on the front")
      this._frontPart.startAngle = 0;
      this._frontPart.endAngle = 2 * Math.PI;
      this._frontPart.closed = true;
      this._glowingFrontPart.startAngle = 0;
      this._glowingFrontPart.endAngle = 2 * Math.PI;
      this._glowingFrontPart.closed = true;

      // Set the front/back part/fill use
      this._frontPartInUse = true;
      this._frontFillInUse = true;
      this._backPartInUse = false;
      // this._backFillInUse could be either true or false
      this._frontFillIsEntireFront = false;
      // this._backFillIsEntireBack could be either true or false
      if (Nodule.globalFillStyle != FillStyle.NoFill) {
        // Begin to set the frontFill that is common to both cases
        // Bring all the front anchor points to a common pool
        // console.log("this.fillStorageAnchors", this.fillStorageAnchors)
        // console.log("this._frontFill.vertices", this._frontFill.vertices.splice(0))
        this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
        // don't dump the anchors of the back fill into the common pool if there is a chance that the backFill is the entire back and might not need to be updated.
        if (!this._backFillIsEntireBack) {
          this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));
        }

        // In this case the frontFillVertices are the same as the frontPartVertices
        this._frontPart.vertices.findLast((v: Anchor, ind: number) => {
          const coords = localMatrix.multiply(v.x, v.y, 1);
          const vertex = this.fillStorageAnchors.pop();
          if (vertex !== undefined) {
            vertex.x = coords[0];
            vertex.y = coords[1];
            this._frontFill.vertices.push(vertex);
          } else {
            throw new Error(
              "Circle: not enough anchors in the pool to trace the circle on the front."
            );
          }
        });

        if (this.centerVector.z > 0) {
          // The interior of the circle is entirely contained on the front")
          // Nothing needs to be added to the frontFill

          // backFill
          this._backFillInUse = false;
          this._backFillIsEntireBack = false;
          this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));
        } else {
          //  the circle is a hole on the front, the back is entirely covered")

          // Finish setting the frontFill
          // We need 2*SUBDIVISION +2 anchors for the annular region on the front. Currently there are SUBDIVISION in the front fill
          // Add an anchor to close the inner region
          const vert = this.fillStorageAnchors.pop();
          if (vert != undefined) {
            vert.x = this._frontFill.vertices[0].x;
            vert.y = this._frontFill.vertices[0].y;
            this._frontFill.vertices.push(vert);
          } else {
            throw new Error(
              "Circle: not enough anchors in the pool to trace the circle on the front."
            );
          }
          // Now there are SUBDIVISION + 1 in the front fill

          // now the frontFillVertices must trace out the boundary vertices
          // To help with the rendering, start tracing the boundary circle directly across from the last vertex on the circle (which
          // is the same as the one at index zero)
          let coords = localMatrix.multiply(
            this._frontPart.vertices[0].x,
            this._frontPart.vertices[0].y,
            1
          );
          let frontStartTraceIndex = Math.ceil(
            Math.atan2(coords[1], coords[0]).modTwoPi() /
              ((2 * Math.PI) / SUBDIVISIONS)
          );
          // The use of math.ceil means that frontStartTraceIndex could be equal to SUBDIVISIONS, so reduce mod SUBDIVISIONS
          frontStartTraceIndex =
            ((frontStartTraceIndex % SUBDIVISIONS) + SUBDIVISIONS) %
            SUBDIVISIONS;

          //Move the boundary vertices array so that the first index one is geometrically close to the start and end of the vertices tracing the circular "hole"
          Circle.boundaryVertices.rotate(frontStartTraceIndex);

          Circle.boundaryVertices.findLast(v => {
            const vert = this.fillStorageAnchors.pop();
            if (vert != undefined) {
              vert.x = v[0];
              vert.y = v[1];
              this._frontFill.vertices.push(vert);
            } else {
              throw new Error(
                "Circle: not enough anchors in the pool to trace the circle on the front."
              );
            }
          });

          // Make sure that the last entry in the frontFill is the first from the boundary vertices to close up the annular region
          const vert1 = this.fillStorageAnchors.pop();
          const len = Circle.boundaryVertices.length;
          if (vert1 != undefined) {
            vert1.x = Circle.boundaryVertices[len - 1][0];
            vert1.y = Circle.boundaryVertices[len - 1][1];
            this._frontFill.vertices.push(vert1);
          } else {
            throw new Error(
              "Circle: not enough anchors in the pool to trace the circle on the front."
            );
          }
          //un-rotate the boundary vertices to their initial state
          Circle.boundaryVertices.rotate(-frontStartTraceIndex);

          // Set the backFill
          this._backFillInUse = true;
          // In this case set the backFillVertices to the entire boundary circle of the sphere (unless it is already the entire back so that it doesn't need to be updated)
          if (!this._backFillIsEntireBack) {
            this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));
            Circle.boundaryVertices.forEach(v => {
              const vertex = this.fillStorageAnchors.pop();
              if (vertex !== undefined) {
                vertex.x = v[0];
                vertex.y = v[1];
                this._backFill.vertices.push(vertex);
              } else {
                throw new Error(
                  "Circle: not enough anchors in the pool to trace the circle on the back."
                );
              }
            });
            this._backFillIsEntireBack = true;
          }
        }
      }
    } else if (
      !(-Math.PI / 2 < my_diff && my_diff < Math.PI / 2) &&
      Math.PI / 2 < my_sum &&
      my_sum < (3 * Math.PI) / 2
    ) {
      //  the circle edge is entirely on the back")
      this._backPart.startAngle = 0;
      this._backPart.endAngle = 2 * Math.PI;
      this._backPart.closed = true;
      this._glowingBackPart.startAngle = 0;
      this._glowingBackPart.endAngle = 2 * Math.PI;
      this._glowingBackPart.closed = true;

      // Set the front/back part/fill use
      this._frontPartInUse = false;
      // this._frontFillInUse could be true or false;
      this._backPartInUse = true;
      this._backFillInUse = true;
      // this._frontFillIsEntireFront could be true or false;
      this._backFillIsEntireBack = false;
      if (Nodule.getFillStyle() != FillStyle.NoFill) {
        // Begin to set the back Fill that is common to both cases
        // Bring all the front anchor points to a common pool
        this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));
        // don't dump the anchors of the front fill into the common pool if there is a chance that the frontFill is the entire front and might not need to be updated.
        if (!this._frontFillIsEntireFront) {
          this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
        }

        // In this case the backFillVertices are the same as the backPartVertices
        // get the local transformation matrix of the circle (should be the same for all parts glowing/not front/back)
        const localMatrix = this._backPart.matrix; //local matrix works for just the position, rotation, and scale of that object in its local frame
        this._backPart.vertices.forEach((v: Anchor, ind: number) => {
          //if (ind < 20) {
          const coords = localMatrix.multiply(v.x, v.y, 1);
          const vertex = this.fillStorageAnchors.pop();
          if (vertex !== undefined) {
            vertex.x = coords[0];
            vertex.y = coords[1];
            this._backFill.vertices.push(vertex);
          } else {
            throw new Error(
              "Circle: not enough anchors in the pool to trace the circle on the back."
            );
          }
          //}
        });

        if (this.centerVector.z < 0) {
          // console.log(
          //   "The interior of the circle is entirely contained on the back"
          // );
          // Nothing needs to be added to the backFill
          // backFill
          this._frontFillInUse = false;
          this._frontFillIsEntireFront = false;
          this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
        } else {
          // console.log(
          //   "the circle is a hole on the back, the front is entirely covered"
          // );

          // Set the backFill
          // We need 3*SUBDIVISION +2 anchors for the annular region on the back. Currently there are SUBDIVISION in the back fill
          // Add an anchor to close the inner region
          const vert = this.fillStorageAnchors.pop();
          if (vert != undefined) {
            vert.x = this._backFill.vertices[0].x;
            vert.y = this._backFill.vertices[0].y;
            this._backFill.vertices.push(vert);
          } else {
            throw new Error(
              "Circle: not enough anchors in the pool to trace the circle on the back."
            );
          }
          // Now there are SUBDIVISION + 1 in the back fill

          // now the backFillVertices must trace out the boundary vertices
          // To help with the rendering, start tracing the boundary circle directly across from the last vertex on the circle (which
          // is the same as the one at index zero
          let coords = localMatrix.multiply(
            this._backPart.vertices[0].x,
            this._backPart.vertices[0].y,
            1
          );

          let backStartTraceIndex = Math.ceil(
            Math.atan2(coords[1], coords[0]).modTwoPi() /
              ((2 * Math.PI) / SUBDIVISIONS)
          );

          // The use of math.ceil means that frontStartTraceIndex could be equal to SUBDIVISIONS, so reduce mod SUBDIVISIONS
          backStartTraceIndex =
            ((backStartTraceIndex % SUBDIVISIONS) + SUBDIVISIONS) %
            SUBDIVISIONS;

          //Move the boundary vertices array so that the first index one is geometrically close to the start and end of the vertices tracing the circular "hole"
          Circle.boundaryVertices.rotate(backStartTraceIndex);

          Circle.boundaryVertices.findLast(v => {
            const vert = this.fillStorageAnchors.pop();
            if (vert != undefined) {
              vert.x = v[0];
              vert.y = v[1];
              this._backFill.vertices.push(vert);
            } else {
              throw new Error(
                "Circle: not enough anchors in the pool to trace the circle on the back."
              );
            }
          });

          // Make sure that the last entry in the backFill is the first from the boundary vertices to close up the annular region
          const vert1 = this.fillStorageAnchors.pop();
          const len3 = Circle.boundaryVertices.length;
          if (vert1 != undefined) {
            vert1.x = Circle.boundaryVertices[len3 - 1][0];
            vert1.y = Circle.boundaryVertices[len3 - 1][1];
            this._backFill.vertices.push(vert1);
          } else {
            throw new Error(
              "Circle: not enough anchors in the pool to trace the circle on the back."
            );
          }

          //un-rotate and reverse the boundary vertices to their initial state
          Circle.boundaryVertices.rotate(-backStartTraceIndex);

          // Set the frontFill
          this._frontFillInUse = true;
          // In this case set the frontFillVertices to the entire boundary circle of the sphere (unless it is already the entire front so that it doesn't need to be updated)
          if (!this._frontFillIsEntireFront) {
            this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
            Circle.boundaryVertices.forEach(v => {
              const vertex = this.fillStorageAnchors.pop();
              if (vertex !== undefined) {
                vertex.x = v[0];
                vertex.y = v[1];
                this._frontFill.vertices.push(vertex);
              } else {
                throw new Error(
                  "Circle: not enough anchors in the pool to trace the circle on the front."
                );
              }
            });
            this._frontFillIsEntireFront = true;
          }
        }
      }
    } else if (
      -Math.PI / 2 < my_diff &&
      my_diff < Math.PI / 2 &&
      Math.PI / 2 < my_sum &&
      my_sum < (3 * Math.PI) / 2
    ) {
      // the circle edge intersects the boundary circle");
      this._frontPartInUse = true;
      this._backPartInUse = true;
      this._frontFillInUse = true;
      this._backFillInUse = true;
      this._frontFillIsEntireFront = false;
      this._backFillIsEntireBack = false;

      // None of the parts are closed.
      this._frontPart.closed = false;
      this._backPart.closed = false;
      this._glowingFrontPart.closed = false;
      this._glowingBackPart.closed = false;

      this._boundaryParameter = Math.acos(
        Nodule.ctg(this._circleRadius) * Nodule.ctg(this._beta)
      );

      // set the display of the edge (drawn counterclockwise)
      // add/subtract ?*Pi/2 because two.js draws ellipse arcs differently than Mathematica
      this._frontPart.startAngle = (-3 * Math.PI) / 2 + this._boundaryParameter;
      this._glowingFrontPart.startAngle =
        (-3 * Math.PI) / 2 + this._boundaryParameter;
      this._frontPart.endAngle = Math.PI / 2 - this._boundaryParameter;
      this._glowingFrontPart.endAngle = Math.PI / 2 - this._boundaryParameter;
      this._backPart.startAngle = Math.PI / 2 - this._boundaryParameter;
      this._glowingBackPart.startAngle = Math.PI / 2 - this._boundaryParameter;
      this._backPart.endAngle = Math.PI / 2 + this._boundaryParameter;
      this._glowingBackPart.endAngle = Math.PI / 2 + this._boundaryParameter;

      if (Nodule.globalFillStyle != FillStyle.NoFill) {
        const startPoint = Circle.pointOnProjectedEllipse(
          this._centerVector,
          this._circleRadius,
          this._boundaryParameter
        );
        //find the angular width of the part of the boundary circle to be copied
        // Compute the angle from the positive x axis to the last frontPartVertex
        //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
        const startAngle = Math.atan2(startPoint[1], startPoint[0]);

        const endPoint = Circle.pointOnProjectedEllipse(
          this._centerVector,
          this._circleRadius,
          -this._boundaryParameter
        );
        // Compute the angle from the positive x axis to the first frontPartVertex
        //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
        const endAngle = Math.atan2(endPoint[1], endPoint[0]);

        // Compute the angular width of the section of the boundary circle to add to the front/back fill
        // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
        let angularWidth = endAngle - startAngle;
        if (angularWidth < 0) {
          angularWidth += 2 * Math.PI;
        }

        //eEnd by creating the boundary points
        const boundaryPoints = Nodule.boundaryCircleCoordinates(
          startPoint,
          SUBDIVISIONS,
          [-startPoint[1], startPoint[0]], // Always go counterclockwise ,
          angularWidth
        );

        // clear the old front and back fill into the storage
        this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
        this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));

        // now add boundary points to the front and back fill
        boundaryPoints.forEach(v => {
          const vertex1 = this.fillStorageAnchors.pop();
          if (vertex1 !== undefined) {
            vertex1.x = v[0];
            vertex1.y = v[1];
          } else {
            throw new Error(
              "Circle: not enough anchors in the pool to trace the circle on the front."
            );
          }
          this._frontFill.vertices.push(vertex1);

          const vertex2 = this.fillStorageAnchors.pop();
          if (vertex2 !== undefined) {
            vertex2.x = v[0];
            vertex2.y = v[1];
          } else {
            throw new Error(
              "Circle: not enough anchors in the pool to trace the circle on the back."
            );
          }
          this._backFill.vertices.push(vertex2);
        });

        // Now add the points from the front edge to the front fill
        this._frontPart.vertices.forEach((v: Anchor) => {
          const coords = localMatrix.multiply(v.x, v.y, 1);
          const vertex = this.fillStorageAnchors.pop();
          if (vertex !== undefined) {
            vertex.x = coords[0];
            vertex.y = coords[1];
            this._frontFill.vertices.push(vertex);
          } else {
            throw new Error(
              "Circle: not enough anchors in the pool to trace the circle on the front."
            );
          }
        });
        // Now add the points from the back edges to the back fill
        this._backPart.vertices.findLast((v: Anchor) => {
          const coords = localMatrix.multiply(v.x, v.y, 1);
          const vertex = this.fillStorageAnchors.pop();
          if (vertex !== undefined) {
            vertex.x = coords[0];
            vertex.y = coords[1];
            this._backFill.vertices.push(vertex);
          } else {
            throw new Error(
              "Circle: not enough anchors in the pool to trace the circle on the back."
            );
          }
        });
      }
    }
  }

  /**
   * Set or Get the center of the circle vector. (Used by circle handler to set these values for the temporary circle)
   */
  set centerVector(position: Vector3) {
    this._centerVector.copy(position).normalize(); // must be on the unit sphere
  }
  get centerVector(): Vector3 {
    return this._centerVector;
  }

  /**
   * Set or Get the radius of the circle. (Used by circle handler to set these values for the temporary circle)
   */
  set circleRadius(arcLengthRadius: number) {
    this._circleRadius = arcLengthRadius;
  }
  get circleRadius(): number {
    return this._circleRadius;
  }

  glowingDisplay(): void {
    if (this._frontPartInUse) {
      this._frontPart.visible = true;
      this._glowingFrontPart.visible = true;
    } else {
      this._frontPart.visible = false;
      this._glowingFrontPart.visible = false;
    }

    if (this._frontFillInUse) {
      this._frontFill.visible = true;
    } else {
      this._frontFill.visible = false;
    }

    if (this._backPartInUse) {
      this._backPart.visible = true;
      this._glowingBackPart.visible = true;
    } else {
      this._backPart.visible = false;
      this._glowingBackPart.visible = false;
    }

    if (this._backFillInUse) {
      this._backFill.visible = true;
    } else {
      this._backFill.visible = false;
    }
  }

  normalDisplay(): void {
    this._glowingFrontPart.visible = false;
    if (this._frontPartInUse) {
      this._frontPart.visible = true;
    } else {
      this._frontPart.visible = false;
    }

    if (this._frontFillInUse) {
      this._frontFill.visible = true;
    } else {
      this._frontFill.visible = false;
    }

    this._glowingBackPart.visible = false;
    if (this._backPartInUse) {
      this._backPart.visible = true;
    } else {
      this._backPart.visible = false;
    }

    if (this._backFillInUse) {
      this._backFill.visible = true;
    } else {
      this._backFill.visible = false;
    }
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this._frontPart.visible = false;
      this._backPart.visible = false;
      this._frontFill.visible = false;
      this._backFill.visible = false;
      this._glowingBackPart.visible = false;
      this._glowingFrontPart.visible = false;
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
  //     this.glowingStrokeColorFront = SETTINGS.circle.glowing.strokeColor.front;
  //     this.glowingStrokeColorBack = SETTINGS.circle.glowing.strokeColor.back;
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
    this._frontFill.addTo(layers[LAYER.foregroundFills]);
    this._frontPart.addTo(layers[LAYER.foreground]);
    this._glowingFrontPart.addTo(layers[LAYER.foregroundGlowing]);
    this._backFill.addTo(layers[LAYER.backgroundFills]);
    this._backPart.addTo(layers[LAYER.background]);
    this._glowingBackPart.addTo(layers[LAYER.backgroundGlowing]);
  }

  removeFromLayers(/*layers: Group[]*/): void {
    this._frontPart.remove();
    this._frontFill.remove();
    this._glowingFrontPart.remove();
    this._backPart.remove();
    this._backFill.remove();
    this._glowingBackPart.remove();
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
      type: "circle"
    };
    // Add the gradient to the gradient dictionary (if used)
    if (Nodule.globalFillStyle === FillStyle.ShadeFill) {
      if (this._frontFillInUse) {
        returnSVGObject.frontGradientDictionary =
          Nodule.createSVGGradientDictionary(
            this.frontGradient,
            this.frontGradientColorCenter,
            this.frontGradientColor
          );
      }

      if (this._backFillInUse) {
        returnSVGObject.backGradientDictionary =
          Nodule.createSVGGradientDictionary(
            this.backGradient,
            this.backGradientColorCenter,
            this.backGradientColor
          );
      }
    }

    // collect the front style of the circle
    if (this._frontFillInUse) {
      returnSVGObject.frontStyleDictionary = Nodule.createSVGStyleDictionary({
        fillObject: this._frontFill,
        strokeObject: this._frontPart
      });
    }
    // collect the front style of the circle
    if (this._backFillInUse) {
      returnSVGObject.backStyleDictionary = Nodule.createSVGStyleDictionary({
        fillObject: this._backFill,
        strokeObject: this._backPart
      });
    }

    // variables that indicate where the extremes of the circle are
    const my_diff = this._beta - this._circleRadius; // my_diff is the angular distance from the north pole to the closest point on the circle
    const my_sum = this._beta + this._circleRadius; // my_sum is the angular distance from the north pole to the furthest point on the circle
    // get the local transformation matrix of the circle (should be the same for all parts glowing/not front/back)
    const localMatrix = this._frontPart.matrix; //local matrix works for just the position, rotation, and scale of that object in its local frame (The front and back matrices are the same)

    if (
      -Math.PI / 2 < my_diff &&
      my_diff < Math.PI / 2 &&
      Math.PI / 2 < my_sum &&
      my_sum < (3 * Math.PI) / 2
    ) {
      // the circle edge intersects the boundary circle
      // This is the parameter of the intersection point
      this._boundaryParameter = Math.acos(
        Nodule.ctg(this._circleRadius) * Nodule.ctg(this._beta)
      );

      const startPoint = Circle.pointOnProjectedEllipse(
        this._centerVector,
        this._circleRadius,
        this._boundaryParameter
      ).map(num => num * SETTINGS.boundaryCircle.radius);

      const endPoint = Circle.pointOnProjectedEllipse(
        this._centerVector,
        this._circleRadius,
        -this._boundaryParameter
      ).map(num => num * SETTINGS.boundaryCircle.radius);

      // to decide which part of the ellipse to draw when the angle from the centerVector to the startPoint is PI/2
      // the part drawn changes.
      const ang = this._centerVector.angleTo(
        new Vector3(startPoint[0], startPoint[1], 0)
      );

      const frontEllipseDisplayFlags: [0 | 1, 0 | 1] =
        ang > Math.PI / 2 ? [0, 0] : [1, 0];
      const frontCircleDisplayFlags: [0 | 1, 0 | 1] =
        ang > Math.PI / 2 ? [1, 0] : [0, 0];
      const backEllipseDisplayFlags: [0 | 1, 0 | 1] =
        ang > Math.PI / 2 ? [1, 1] : [0, 1];
      const backCircleDisplayFlags: [0 | 1, 0 | 1] =
        ang > Math.PI / 2 ? [1, 0] : [0, 0];

      // form  svg arc objects
      const ellipseArc: svgArcObject = {
        startPt: { x: startPoint[0], y: startPoint[1] },
        radiiXYWithSpace:
          Math.abs(this._halfMajorAxis) * SETTINGS.boundaryCircle.radius +
          "," +
          Math.abs(this._halfMinorAxis) * SETTINGS.boundaryCircle.radius +
          " ",
        rotationDegrees: this._frontPart.rotation.toDegrees(),
        displayShort0OrLong1: frontEllipseDisplayFlags[0],
        displayCCW0OrCW1: frontEllipseDisplayFlags[1],
        endPt: { x: endPoint[0], y: endPoint[1] }
      };
      const circleArc: svgArcObject = {
        startPt: { x: endPoint[0], y: endPoint[1] },
        radiiXYWithSpace:
          SETTINGS.boundaryCircle.radius +
          "," +
          SETTINGS.boundaryCircle.radius +
          " ",
        rotationDegrees: 0,
        displayShort0OrLong1: frontCircleDisplayFlags[0],
        displayCCW0OrCW1: frontCircleDisplayFlags[1],
        endPt: { x: startPoint[0], y: startPoint[1] }
      };
      let svgFrontString = '<path d="';
      svgFrontString += Nodule.svgArcString(ellipseArc, true);
      svgFrontString += Nodule.svgArcString(circleArc);
      svgFrontString += ' Z"/>';

      returnSVGObject.layerSVGArray.push([
        LAYER.foregroundFills,
        svgFrontString
      ]);

      // update the flags for the back
      ellipseArc.displayShort0OrLong1 = backEllipseDisplayFlags[0];
      ellipseArc.displayCCW0OrCW1 = backEllipseDisplayFlags[1];
      circleArc.displayShort0OrLong1 = backCircleDisplayFlags[0];
      circleArc.displayCCW0OrCW1 = backCircleDisplayFlags[1];

      let svgBackString = '<path d="';
      svgBackString += Nodule.svgArcString(ellipseArc, true);
      svgBackString += Nodule.svgArcString(circleArc);
      svgBackString += ' Z"/>';

      returnSVGObject.layerSVGArray.push([
        LAYER.backgroundFills,
        svgBackString
      ]);

      // let svgFrontString =
      //   '<path d="M ' + startPoint[0] + "," + startPoint[1] + " A";
      // svgFrontString +=
      //   Math.abs(this._halfMajorAxis) * SETTINGS.boundaryCircle.radius +
      //   "," +
      //   Math.abs(this._halfMinorAxis) * SETTINGS.boundaryCircle.radius +
      //   " ";
      // svgFrontString += this._frontPart.rotation.toDegrees() + " "; //rotate the ellipse part
      // svgFrontString += frontEllipseDisplayFlags; // Control the part of the ellipse drawn
      // svgFrontString += endPoint[0] + "," + endPoint[1] + " A"; // The ellipse part is done
      // svgFrontString +=
      //   SETTINGS.boundaryCircle.radius +
      //   "," +
      //   SETTINGS.boundaryCircle.radius +
      //   " ";
      // svgFrontString += 0 + " "; // no rotation
      // svgFrontString += frontCircleDisplayFlags; // Control the part of the boundary circle drawn
      // svgFrontString += startPoint[0] + "," + startPoint[1] + " "; // The circle part is done
      // svgFrontString += ' Z"/>';

      // let svgBackString =
      //   '<path d="M ' + startPoint[0] + "," + startPoint[1] + " A";
      // svgBackString +=
      //   Math.abs(this._halfMajorAxis) * SETTINGS.boundaryCircle.radius +
      //   "," +
      //   Math.abs(this._halfMinorAxis) * SETTINGS.boundaryCircle.radius +
      //   " ";
      // svgBackString += this._frontPart.rotation.toDegrees() + " "; //rotate the ellipse part
      // svgBackString += backEllipseDisplayFlags; // Control the part of the ellipse drawn
      // svgBackString += endPoint[0] + "," + endPoint[1] + " A"; // The ellipse part is done
      // svgBackString +=
      //   SETTINGS.boundaryCircle.radius +
      //   "," +
      //   SETTINGS.boundaryCircle.radius +
      //   " ";
      // svgBackString += 0 + " "; // no rotation
      // svgBackString += backCircleDisplayFlags; // Control the part of the boundary circle drawn
      // svgBackString += startPoint[0] + "," + startPoint[1] + " "; // The circle part is done
      // svgBackString += ' Z"/>';

      // returnSVGObject.layerSVGArray.push([
      //   LAYER.backgroundFills,
      //   svgBackString
      // ]);
      return [returnSVGObject];
    } else {
      // the circle edge is entirely on the front or the circle edge is entirely on the back")
      let fillLayer = LAYER.foregroundFills;
      let edgeLayer = LAYER.foreground;
      if (
        !(-Math.PI / 2 < my_diff && my_diff < Math.PI / 2) &&
        Math.PI / 2 < my_sum &&
        my_sum < (3 * Math.PI) / 2
      ) {
        fillLayer = LAYER.backgroundFills;
        edgeLayer = LAYER.background;
      }
      if (
        (this._centerVector.z > 0 && edgeLayer == LAYER.foreground) ||
        (this._centerVector.z < 0 && edgeLayer == LAYER.background)
      ) {
        // The interior of the circle is entirely contained on the front or back
        let svgString =
          '<ellipse cx="0" cy="0" rx="' +
          Math.abs(this._halfMajorAxis) * SETTINGS.boundaryCircle.radius +
          '" ry="' +
          Math.abs(this._halfMinorAxis) * SETTINGS.boundaryCircle.radius +
          '" ';
        svgString +=
          Circle.svgTransformMatrixString(
            this._rotation,
            1,
            edgeLayer == LAYER.background
              ? this._backPart.position.x
              : this._frontPart.position.x,
            edgeLayer == LAYER.background
              ? this._backPart.position.y
              : this._frontPart.position.y
          ) + " />";

        returnSVGObject.layerSVGArray.push([edgeLayer, svgString]);
      } else {
        // console.log("HOLE");
        //  the circle is a hole on the front or back, the back/front is entirely covered

        // Find two points on the ellipse that are close but not the same, draw the long ellipse between them
        const untransformedEllipseStartPoint =
          edgeLayer == LAYER.background
            ? this._backPart.vertices[this._backPart.vertices.length - 2]
            : this._frontPart.vertices[this._frontPart.vertices.length - 2];
        const ellipseStartPoint = localMatrix.multiply(
          untransformedEllipseStartPoint.x,
          untransformedEllipseStartPoint.y,
          1
        );

        const untransformedEllipseEndPoint =
          edgeLayer == LAYER.background
            ? this._backPart.vertices[0]
            : this._frontPart.vertices[0];
        const ellipseEndPoint = localMatrix.multiply(
          untransformedEllipseEndPoint.x,
          untransformedEllipseEndPoint.y,
          1
        );

        // Find two point on the boundary circle that are across from the start of the ellipse
        // two points not the same, but close
        // Do some trig, law of sines to figure out an angle and then pick the angle at the center (0,0)
        const ellipseAng = Math.atan2(
          ellipseStartPoint[1] - this._center.y,
          ellipseStartPoint[0] - this._center.x
        );
        const distCircleCenterToEllipseCenter = Math.sqrt(
          this._center.x ** 2 + this._center.y ** 2
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
          fillLayer == LAYER.backgroundFills
            ? circleStartAngle - deltaAng
            : circleStartAngle + deltaAng;
        const circleEndPoint = [
          Math.cos(deltaAdjustAngle),
          Math.sin(deltaAdjustAngle)
        ].map(num => num * SETTINGS.boundaryCircle.radius);

        //create an svgArcObject
        const svgEllipseObject: svgArcObject = {
          startPt: { x: ellipseStartPoint[0], y: ellipseStartPoint[1] },
          radiiXYWithSpace:
            Math.abs(this._halfMajorAxis) * SETTINGS.boundaryCircle.radius +
            "," +
            Math.abs(this._halfMinorAxis) * SETTINGS.boundaryCircle.radius +
            " ",
          rotationDegrees: this._frontPart.rotation.toDegrees(),
          displayShort0OrLong1: 1,
          displayCCW0OrCW1: fillLayer == LAYER.backgroundFills ? 0 : 1,
          endPt: { x: ellipseEndPoint[0], y: ellipseEndPoint[1] }
        };
        const svgCircleObject: svgArcObject = {
          startPt: { x: circleStartPoint[0], y: circleStartPoint[1] },
          radiiXYWithSpace:
            SETTINGS.boundaryCircle.radius +
            "," +
            SETTINGS.boundaryCircle.radius +
            " ",
          rotationDegrees: 0,
          displayShort0OrLong1: 1,
          displayCCW0OrCW1: fillLayer == LAYER.backgroundFills ? 1 : 0,
          endPt: { x: circleEndPoint[0], y: circleEndPoint[1] }
        };
        let svgString = '<path d="';
        svgString += Nodule.svgArcString(svgEllipseObject, true);
        svgString +=
          "L" + ellipseStartPoint[0] + "," + ellipseStartPoint[1] + " "; // close the ellipse, with a line to the start
        svgString += Nodule.svgArcString(svgCircleObject, true);
        svgString +=
          "L" + circleStartPoint[0] + "," + circleStartPoint[1] + " "; // close the circle, with a line to the start
        svgString +=
          "M" + ellipseStartPoint[0] + "," + ellipseStartPoint[1] + " "; // move (not line) to the start ellipse
        svgString += '"/>';

        returnSVGObject.layerSVGArray.push([fillLayer, svgString]);

        // now add the back/foreground fill which is a circle of radius boundary circle
        let svgEntireCircleString =
          '<circle cx="0" cy="0" r="' + SETTINGS.boundaryCircle.radius + '" />';
        returnSVGObject.layerSVGArray.push([
          fillLayer == LAYER.backgroundFills
            ? LAYER.foregroundFills
            : LAYER.backgroundFills,
          svgEntireCircleString
        ]);
      }
    }
    return [returnSVGObject];
  }

  defaultStyleState(panel: StyleCategory): StyleOptions {
    switch (panel) {
      case StyleCategory.Front:
        return DEFAULT_CIRCLE_FRONT_STYLE;

      case StyleCategory.Back:
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
    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    const backStyle = this.styleOptions.get(StyleCategory.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this._frontPart.linewidth =
      (Circle.currentCircleStrokeWidthFront * frontStrokeWidthPercent) / 100;
    this._backPart.linewidth =
      (Circle.currentCircleStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this._glowingFrontPart.linewidth =
      (Circle.currentGlowingCircleStrokeWidthFront * frontStrokeWidthPercent) /
      100;
    this._glowingBackPart.linewidth =
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
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables:
        // Use the SETTINGS temporary options to directly modify the js objects.

        //FRONT
        if (
          Nodule.rgbaIsNoFillOrNoStroke(SETTINGS.circle.temp.fillColor.front) ||
          Nodule.globalFillStyle == FillStyle.NoFill
        ) {
          this._frontFill.noFill();
        } else {
          if (Nodule.globalFillStyle) {
            this.frontGradientColor.color =
              SETTINGS.circle.temp.fillColor.front;
            this._frontFill.fill = this.frontGradient;
          } else {
            this._frontFill.fill = SETTINGS.circle.temp.fillColor.front;
          }
        }
        if (
          Nodule.rgbaIsNoFillOrNoStroke(SETTINGS.circle.temp.strokeColor.front)
        ) {
          this._frontPart.noStroke();
        } else {
          this._frontPart.stroke = SETTINGS.circle.temp.strokeColor.front;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this._frontPart.linewidth = Circle.currentCircleStrokeWidthFront;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.circle.drawn.dashArray.useOnFront) {
          if (SETTINGS.circle.drawn.dashArray.front.length > 0) {
            this._frontPart.dashes.clear();
            SETTINGS.circle.drawn.dashArray.front.forEach(v => {
              this._frontPart.dashes.push(v);
            });
            if (SETTINGS.circle.drawn.dashArray.reverse.front) {
              this._frontPart.dashes.reverse();
            }
          }
        }
        //BACK
        if (
          Nodule.rgbaIsNoFillOrNoStroke(SETTINGS.circle.temp.fillColor.back) ||
          Nodule.globalFillStyle == FillStyle.NoFill
        ) {
          this._backFill.noFill();
        } else {
          if (Nodule.globalFillStyle) {
            this.backGradientColor.color = SETTINGS.circle.temp.fillColor.back;
            this._backFill.fill = this.backGradient;
          } else {
            this._backFill.fill = SETTINGS.circle.temp.fillColor.back;
          }
        }
        if (
          Nodule.rgbaIsNoFillOrNoStroke(SETTINGS.circle.temp.strokeColor.back)
        ) {
          this._backPart.noStroke();
        } else {
          this._backPart.stroke = SETTINGS.circle.temp.strokeColor.back;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this._backPart.linewidth = Circle.currentCircleStrokeWidthBack;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.circle.drawn.dashArray.useOnBack) {
          if (SETTINGS.circle.drawn.dashArray.back.length > 0) {
            this._backPart.dashes.clear();
            SETTINGS.circle.drawn.dashArray.back.forEach(v => {
              this._backPart.dashes.push(v);
            });
            if (SETTINGS.circle.drawn.dashArray.reverse.back) {
              this._backPart.dashes.reverse();
            }
          }
        }

        // The temporary display is never highlighted
        this._glowingFrontPart.visible = false;
        this._glowingBackPart.visible = false;
        break;

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the js objects.

        // FRONT
        const frontStyle = this.styleOptions.get(StyleCategory.Front);
        if (
          Nodule.rgbaIsNoFillOrNoStroke(frontStyle?.fillColor) ||
          Nodule.globalFillStyle == FillStyle.NoFill
        ) {
          this._frontFill.noFill();
        } else {
          if (Nodule.globalFillStyle == FillStyle.ShadeFill) {
            this.frontGradientColor.color =
              frontStyle?.fillColor ?? SETTINGS.circle.drawn.fillColor.front;
            this._frontFill.fill = this.frontGradient;
          } else {
            this._frontFill.fill =
              frontStyle?.fillColor ?? SETTINGS.circle.drawn.fillColor.front;
          }
        }

        if (Nodule.rgbaIsNoFillOrNoStroke(frontStyle?.strokeColor)) {
          this._frontPart.noStroke();
        } else {
          this._frontPart.stroke =
            frontStyle?.strokeColor ?? SETTINGS.circle.drawn.strokeColor.front;
        }
        // strokeWidthPercent is applied by adjustSize()

        if (
          frontStyle?.useDashPattern &&
          frontStyle?.dashArray &&
          frontStyle.reverseDashArray != undefined
        ) {
          this._frontPart.dashes.clear();
          this._frontPart.dashes.push(...frontStyle.dashArray);
          if (frontStyle.reverseDashArray) {
            this._frontPart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._frontPart.dashes.clear();
          this._frontPart.dashes.push(0);
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
            this._backFill.noFill();
          } else {
            if (Nodule.globalFillStyle == FillStyle.ShadeFill) {
              this.backGradientColor.color = Nodule.contrastFillColor(
                frontStyle?.fillColor ?? SETTINGS.circle.drawn.fillColor.back
              );
              this._backFill.fill = this.backGradient;
            } else {
              this._backFill.fill = Nodule.contrastFillColor(
                frontStyle?.fillColor ?? SETTINGS.circle.drawn.fillColor.back
              );
            }
          }
        } else {
          if (
            Nodule.rgbaIsNoFillOrNoStroke(backStyle?.fillColor) ||
            Nodule.globalFillStyle == FillStyle.NoFill
          ) {
            this._backFill.noFill();
          } else {
            if (Nodule.globalFillStyle) {
              this.backGradientColor.color =
                backStyle?.fillColor ?? SETTINGS.circle.drawn.fillColor.back;
              this._backFill.fill = this.backGradient;
            } else {
              this._backFill.fill = Nodule.contrastFillColor(
                backStyle?.fillColor ?? SETTINGS.circle.drawn.fillColor.back
              );
            }
          }
        }

        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.rgbaIsNoFillOrNoStroke(
              Nodule.contrastStrokeColor(frontStyle?.strokeColor)
            )
          ) {
            this._backPart.noStroke();
          } else {
            this._backPart.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? SETTINGS.circle.drawn.strokeColor.front
            );
          }
        } else {
          if (Nodule.rgbaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this._backPart.noStroke();
          } else {
            this._backPart.stroke =
              backStyle?.strokeColor ?? SETTINGS.circle.drawn.strokeColor.back;
          }
        }

        // strokeWidthPercent applied by adjustSizer()

        if (
          backStyle?.useDashPattern &&
          backStyle?.dashArray &&
          backStyle.reverseDashArray != undefined
        ) {
          this._backPart.dashes.clear();
          this._backPart.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this._backPart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._backPart.dashes.clear();
          this._backPart.dashes.push(0);
        }

        // UPDATE the glowing object

        // Glowing Front
        // no fillColor for glowing circles
        this._glowingFrontPart.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (
          frontStyle?.useDashPattern &&
          frontStyle?.dashArray &&
          frontStyle.reverseDashArray != undefined
        ) {
          this._glowingFrontPart.dashes.clear();
          this._glowingFrontPart.dashes.push(...frontStyle.dashArray);
          if (frontStyle.reverseDashArray) {
            this._glowingFrontPart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._glowingFrontPart.dashes.clear();
          this._glowingFrontPart.dashes.push(0);
        }

        // Glowing Back
        // no fillColor for glowing circles
        this._glowingBackPart.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (
          backStyle?.useDashPattern &&
          backStyle?.dashArray &&
          backStyle.reverseDashArray != undefined
        ) {
          this._glowingBackPart.dashes.clear();
          this._glowingBackPart.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this._glowingBackPart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._glowingBackPart.dashes.clear();
          this._glowingBackPart.dashes.push(0);
        }
        break;
      }
    }
  }
}
