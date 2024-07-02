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
import Two from "two.js";
import { Vector } from "two.js/src/vector";

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
  private _rotation: number = 0; //equal -Math.atan2(this._normalVector.x, this._normalVector.y);
  private _halfMinorAxis: number = 0; //equal to (Sin[_beta + r] - Sin[_beta - r])/2
  private _halfMajorAxis: number = 0; // equal to Sqrt[2 - Cos[r]^2]/Sqrt[Cot[r]^2 + 2]
  private _beta: number = 0; // equal to arccos(this._centerVector.z), the angle between the north pole <0,0,1> and the center vector
  private _center = new Two.Vector(0, 0); // equal to  < (Sin[_beta + r] + Sin[_beta - r])/2, 0 >, the amount the ellipse must be translated before rotation.

  // when the circle intersects the boundary only part of each front/back of the projected ellipse is displayed
  private _projectedEllipseStartAngle = 0;
  private _projectedEllipseEndAngle = 0;

  // The starting parameter and an ending parameter are the parameter values where the circle crosses the boundaryCircle
  // set to zero when circle doesn't cross the boundaryCircle
  // The circle crosses the boundary if and only if Pi/2 < r + \[Beta] < 3 Pi/2 and Pi/2 < \[Beta] - r < Pi/2
  private _boundaryParameter1: number = 0; // equal to ArcCos[Cot[r] Cot[_beta]]
  private _boundaryParameter2: number = 0; // equal to -ArcCos[Cot[r] Cot[_beta]]

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
  private frontGradientColorCenter = new Stop(0, SETTINGS.fill.frontWhite, 1);
  private frontGradientColor = new Stop(
    2 * SETTINGS.boundaryCircle.radius,
    SETTINGS.circle.drawn.fillColor.front,
    1
  );

  private frontGradient = new RadialGradient(
    SETTINGS.fill.lightSource.x,
    SETTINGS.fill.lightSource.y,
    1 * SETTINGS.boundaryCircle.radius,
    [this.frontGradientColorCenter, this.frontGradientColor]
  );

  private backGradientColorCenter = new Stop(0, SETTINGS.fill.backGray, 1);
  private backGradientColor = new Stop(
    1 * SETTINGS.boundaryCircle.radius,
    SETTINGS.circle.drawn.fillColor.back,
    1
  );
  private backGradient = new RadialGradient(
    -SETTINGS.fill.lightSource.x,
    -SETTINGS.fill.lightSource.y,
    2 * SETTINGS.boundaryCircle.radius,
    [this.backGradientColorCenter, this.backGradientColor]
  );

  // SUBDIVISIONS number of equally spaced coordinates on the boundary circle
  static boundaryVertices: [number[]];
  // Be sure that this array is populated only once
  static setBoundaryVerticesHasBeenCalled = false;
  static setBoundaryVertices(): void {
    if (!Circle.setBoundaryVerticesHasBeenCalled) {
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

  // The cotangent function
  static ctg(x: number): number {
    return 1 / Math.tan(x);
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

    // Create the glowing/back/fill parts.
    this._frontPart = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      Math.PI,
      2 * Math.PI,
      SUBDIVISIONS
    );

    this._frontPart = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      Math.PI,
      2 * Math.PI,
      SUBDIVISIONS
    );

    this._glowingFrontPart = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      Math.PI,
      2 * Math.PI,
      SUBDIVISIONS
    );

    this._backPart = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      Math.PI,
      2 * Math.PI,
      SUBDIVISIONS
    );

    this._glowingBackPart = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      Math.PI,
      2 * Math.PI,
      SUBDIVISIONS
    );

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this._frontPart.id), {
      type: "circle",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this._backPart.id), {
      type: "circle",
      side: "back",
      fill: false,
      part: ""
    });

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

    // Now organize the fills
    // In total there are a maximum of 3*SUBDIVISIONS + 2 anchors in use
    // This happens when the circle is a hole on the front or back.
    // The front/back requires 2*SUBDIVISIONS + 2 anchors (one SUBDIVISIONS to trace the circle, one SUBDIVISIONS to trace the boundary,
    // two for the extra anchors to close up the annular region)
    // The back/front requires SUBDIVISIONS anchors

    const verticesFill: Anchor[] = [];
    for (let k = 0; k < 3 * SUBDIVISIONS + 2; k++) {
      this.fillStorageAnchors.push(new Anchor(0, 0));
    }
    this._frontFill = new Path(
      [], //it doesn't matter that no anchors are assigned to the frontFill because they will assigned from the fillStorageAnchors
      /* closed */ true,
      /* curve */ false
    );
    // create the back part
    this._backFill = new Path([], /* closed */ true, /* curve */ false);

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this._frontFill.id), {
      type: "circle",
      side: "front",
      fill: true,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this._backFill.id), {
      type: "circle",
      side: "back",
      fill: true,
      part: ""
    });

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
      Math.sqrt(Circle.ctg(this._circleRadius) ** 2 + 2);
    this._center.x =
      (Math.sin(this._beta + this._circleRadius) +
        Math.sin(this._beta - this._circleRadius)) /
      2; // y component is always zero

    //Copy the updated information into the glowing/not front/back parts
    this._frontPart.height = 2 * this._halfMinorAxis;
    this._frontPart.width = 2 * this._halfMajorAxis;
    this._frontPart.position = this._center; // Is this needed? Does this happen before the rotation is applied?
    this._frontFill.rotation = this._rotation; // Does this rotate about the origin?

    this._backPart.height = 2 * this._halfMinorAxis;
    this._backPart.width = 2 * this._halfMajorAxis;
    this._backPart.position = this._center;
    this._backFill.rotation = this._rotation;

    this._glowingFrontPart.height = 2 * this._halfMinorAxis;
    this._glowingFrontPart.width = 2 * this._halfMajorAxis;
    this._glowingFrontPart.position = this._center;
    this._glowingFrontPart.rotation = this._rotation;

    this._glowingBackPart.height = 2 * this._halfMinorAxis;
    this._glowingBackPart.width = 2 * this._halfMajorAxis;
    this._glowingBackPart.position = this._center;
    this._glowingBackPart.rotation = this._rotation;

    // variables that indicate where the extremes of the circle are
    const my_diff = this._beta - this._circleRadius; // my_diff is the angular distance from the north pole to the closest point on the circle
    const my_sum = this._beta + this._circleRadius; // my_sum is the angular distance from the north pole to the furthest point on the circle

    // Now reset the parameters used to control the display of the ellipse
    this._projectedEllipseStartAngle = 0;
    this._projectedEllipseEndAngle = 2 * Math.PI;
    this._frontPartInUse = false;
    this._backPartInUse = false;

    //  // Bring all the anchor points to a common pool
    //  // Each front/back fill path will pull anchor points from
    //  // this pool as needed
    //

    if (
      -Math.PI / 2 < my_diff &&
      my_diff < Math.PI / 2 &&
      !(Math.PI / 2 < my_sum && my_sum < (3 * Math.PI) / 2)
    ) {
      // the circle edge is entirely on the front

      // Set the front/back part/fill use
      this._frontPartInUse = true;
      this._frontFillInUse = true;
      this._backPartInUse = false;
      // this._backFillInUse could be either true or false
      this._frontFillIsEntireFront = false;
      // this._backFillIsEntireBack could be either true or false

      this._frontPart.startAngle = this._projectedEllipseStartAngle;
      this._frontPart.endAngle = this._projectedEllipseEndAngle;
      this._frontPart.closed = true; //Is this necessary?

      // Begin to set the frontFill that is common to both cases
      // Bring all the front anchor points to a common pool
      this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
      //this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));

      // In this case the frontFillVertices are the same as the frontVertices
      // get the local transformation matrix of the circle (should be the same for all parts glowing/not front/back)
      const localMatrix = this._frontPart.matrix; //local matrix works for just the position, rotation, and scale of that object in its local frame
      this._frontPart.vertices.forEach((v: Anchor) => {
        var coords = localMatrix.multiply(v.x, v.y, 1);
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
        // The interior of the circle is contained on the front
        // Nothing needs to be added to the frontFill
        // backFill
        this._backFillInUse = false;
        this._backFillIsEntireBack = false;
        this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));
      } else {
        // the circle is a hole on the front, the back is entirely covered
        this._backFillInUse = true;

        // Set the frontFill
        // We need 3*SUBDIVISION +2 anchors for the annular region on the front. Currently there are SUBDIVISION in the front fill
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
        // is the same as the one at index zero
        const frontStartTraceIndex = Math.floor(
          Math.atan2(
            this._frontPart.vertices[0].y,
            this._frontPart.vertices[0].x
          ).modTwoPi() /
            ((2 * Math.PI) / SUBDIVISIONS)
        );

        Circle.boundaryVertices
          .reverse()
          .rotate(frontStartTraceIndex)
          .forEach(v => {
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
        //un-rotate and reverse the boundary vertices to their initial state
        Circle.boundaryVertices.rotate(-frontStartTraceIndex).reverse();

        // Make sure that the last entry in the frontFill is the first from the boundary vertices to close up the annular region
        const vert1 = this.fillStorageAnchors.pop();
        if (vert1 != undefined) {
          vert1.x = this._frontFill.vertices[SUBDIVISIONS + 1].x;
          vert1.y = this._frontFill.vertices[SUBDIVISIONS + 1].y;
          this._frontFill.vertices.push(vert);
        } else {
          throw new Error(
            "Circle: not enough anchors in the pool to trace the circle on the front."
          );
        }

        // Set the backFill
        // In this case set the backFillVertices to the entire boundary circle of the sphere (unless it is already the entire back already)
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
    } else if (
      !(-Math.PI / 2 < my_diff && my_diff < Math.PI / 2) &&
      Math.PI / 2 < my_sum &&
      my_sum < (3 * Math.PI) / 2
    ) {
      // the circle is entirely on the back

      // Set the front/back part/fill use
      this._frontPartInUse = false;
      // this._frontFillInUse could be true or false;
      this._backPartInUse = true;
      this._backFillInUse = true;
      // this._frontFillIsEntireFront could be true or false;
      this._backFillIsEntireBack = false;

      this._backPart.startAngle = this._projectedEllipseStartAngle;
      this._backPart.endAngle = this._projectedEllipseEndAngle;
      this._backPart.closed = true; //Is this necessary?

      // Begin to set the back Fill that is common to both cases
      // Bring all the front anchor points to a common pool
      this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));
      //this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));

      // In this case the backFillVertices are the same as the backVertices
      // get the local transformation matrix of the circle (should be the same for all parts glowing/not front/back)
      const localMatrix = this._backPart.matrix; //local matrix works for just the position, rotation, and scale of that object in its local frame
      this._backPart.vertices.forEach((v: Anchor) => {
        var coords = localMatrix.multiply(v.x, v.y, 1);
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

      if (this.centerVector.z < 0) {
        // The interior or the circle is contained on the back
        // Nothing needs to be added to the backFill
        // backFill
        this._frontFillInUse = false;
        this._frontFillIsEntireFront = false;
        this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
      } else {
        // the circle is a hole on the back, the front is entirely covered
        this._frontFillInUse = true;

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
        const backStartTraceIndex = Math.floor(
          Math.atan2(
            this._backPart.vertices[0].y,
            this._backPart.vertices[0].x
          ).modTwoPi() /
            ((2 * Math.PI) / SUBDIVISIONS)
        );

        Circle.boundaryVertices
          .reverse()
          .rotate(backStartTraceIndex)
          .forEach(v => {
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
        //un-rotate and reverse the boundary vertices to their initial state
        Circle.boundaryVertices.rotate(-backStartTraceIndex).reverse();

        // Make sure that the last entry in the backFill is the first from the boundary vertices to close up the annular region
        const vert1 = this.fillStorageAnchors.pop();
        if (vert1 != undefined) {
          vert1.x = this._backFill.vertices[SUBDIVISIONS + 1].x;
          vert1.y = this._backFill.vertices[SUBDIVISIONS + 1].y;
          this._backFill.vertices.push(vert);
        } else {
          throw new Error(
            "Circle: not enough anchors in the pool to trace the circle on the back."
          );
        }

        // Set the frontFill
        // In this case set the frontFillVertices to the entire boundary circle of the sphere (unless it is already the entire front already)
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
    } else if (
      -Math.PI / 2 < my_diff &&
      my_diff < Math.PI / 2 &&
      Math.PI / 2 < my_sum &&
      my_sum < (3 * Math.PI) / 2
    ) {
      // the circle edge intersects the boundary circle
      this._frontPartInUse = true;
      this._backPartInUse = true;
      this._frontFillIsEntireFront = false;
      this._backFillIsEntireBack = false;

      this._boundaryParameter1 = Math.acos(
        Circle.ctg(this._circleRadius) * Circle.ctg(this._beta)
      );
      this._boundaryParameter2 = -Math.acos(
        Circle.ctg(this._circleRadius) * Circle.ctg(this._beta)
      );

      // set the display of the edge
      this._frontPart.startAngle = this._boundaryParameter1;
      this._frontPart.endAngle = this._boundaryParameter2;
      this._backPart.startAngle = this._boundaryParameter2;
      this._backPart.endAngle = this._boundaryParameter1;

      const startPoint = this.pointOnProjectedEllipse(this._boundaryParameter1);
      //find the angular width of the part of the boundary circle to be copied
      // Compute the angle from the positive x axis to the last frontPartVertex
      //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
      const startAngle = Math.atan2(startPoint[0], startPoint[1]);

      const endPoint = this.pointOnProjectedEllipse(this._boundaryParameter2);
      // Compute the angle from the positive x axis to the first frontPartVertex
      //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
      const endAngle = Math.atan2(endPoint[0], endPoint[1]);

      // Compute the angular width of the section of the boundary circle to add to the front/back fill
      // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
      let angularWidth = endAngle - startAngle;
      if (angularWidth < 0) {
        angularWidth += 2 * Math.PI;
      }

      // Which way to go around the boundary circle isn't clear from this information alone. Use the radius to determine the angularWidth and the direction
      let toVector = [];
      if (this._circleRadius < Math.PI / 2) {
        //go the short way around the boundary i.e. angular width should be less than Pi
        if (angularWidth > Math.PI) {
          angularWidth = 2 * Math.PI - angularWidth;
        }
        // set the direction
        toVector[0] = -startPoint[1];
        toVector[1] = startPoint[0];
      } else {
        //go the long way around
        if (angularWidth < Math.PI) {
          angularWidth = 2 * Math.PI - angularWidth;
        }
        toVector[0] = startPoint[1];
        toVector[1] = -startPoint[0];
      }

      // Start by creating the boundary points
      let boundaryPoints = Circle.boundaryCircleCoordinates(
        startPoint,
        SUBDIVISIONS,
        toVector,
        angularWidth
      );

      // clear the old front and back fill into the storage
      this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
      this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));

      // now add boundary points to the front and back fill
      boundaryPoints.forEach(v => {
        const vertex = this.fillStorageAnchors.pop();
        if (vertex !== undefined) {
          vertex.x = v[0];
          vertex.y = v[1];
        } else {
          throw new Error(
            "Circle: not enough anchors in the pool to trace the circle on the front."
          );
        }
        this._frontFill.vertices.push(vertex);
        this._backFill.vertices.push(vertex);
      });

      // Now add the points from the front edge to the front fill
      this._frontPart.vertices.forEach((v: Anchor) => {
        const vertex = this.fillStorageAnchors.pop();
        if (vertex !== undefined) {
          vertex.x = v.x;
          vertex.y = v.y;
          this._frontFill.vertices.push(vertex);
        } else {
          throw new Error(
            "Circle: not enough anchors in the pool to trace the circle on the front."
          );
        }
      });
      // Now add the points from the back edges to the back fill
      this._backPart.vertices.forEach((v: Anchor) => {
        const vertex = this.fillStorageAnchors.pop();
        if (vertex !== undefined) {
          vertex.x = v.x;
          vertex.y = v.y;
          this._backFill.vertices.push(vertex);
        } else {
          throw new Error(
            "Circle: not enough anchors in the pool to trace the circle on the front."
          );
        }
      });

    }

    // let posIndexFill = 0;
    // let negIndexFill = 0;
    // let boundaryPoints: number[][] = [];
    // // The circle interior is only on the front of the sphere
    // if (backLen === 0 && this._circleRadius < Math.PI / 2) {
    //   // In this case the frontFillVertices are the same as the frontVertices
    //   this._frontPart.vertices.forEach((v: Anchor) => {
    //     if (posIndexFill === this._frontFill.vertices.length) {
    //       //add a vector from the pool
    //       this._frontFill.vertices.push(pool.pop()!);
    //     }
    //     this._frontFill.vertices[posIndexFill].x = v.x;
    //     this._frontFill.vertices[posIndexFill].y = v.y;
    //     posIndexFill++;
    //   });
    //   // put remaining vertices in the storage
    //   this.fillStorageAnchors.push(...pool.splice(0));
    // } // The circle interior is split between front and back
    // else if (backLen !== 0 && frontLen !== 0) {
    //   //find the angular width of the part of the boundary circle to be copied
    //   // Compute the angle from the positive x axis to the last frontPartVertex
    //   //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
    //   const startAngle = Math.atan2(
    //     this._frontPart.vertices[frontLen - 1].y,
    //     this._frontPart.vertices[frontLen - 1].x
    //   );

    //   // Compute the angle from the positive x axis to the first frontPartVertex
    //   //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
    //   const endAngle = Math.atan2(
    //     this._frontPart.vertices[0].y,
    //     this._frontPart.vertices[0].x
    //   );

    //   // Compute the angular width of the section of the boundary circle to add to the front/back fill
    //   // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
    //   let angularWidth = endAngle - startAngle;
    //   if (angularWidth < 0) {
    //     angularWidth += 2 * Math.PI;
    //   }
    //   //console.log(angularWidth);
    //   // When tracing the boundary circle we start from fromVector = this.frontPart.vertices[frontLen - 1]
    //   const fromVector = [
    //     this._frontPart.vertices[frontLen - 1].x,
    //     this._frontPart.vertices[frontLen - 1].y
    //   ];
    //   // then
    //   // trace in the direction of a toVector that is perpendicular to this.frontPart.vertices[frontLen - 1]
    //   // and points in the same direction as this.frontPart.vertices[0]
    //   let toVector = [-fromVector[1], fromVector[0]];

    //   // If the toVector doesn't point in the same direction as the first vector in frontPart then reverse the toVector
    //   if (
    //     toVector[0] * this._frontPart.vertices[0].x +
    //       toVector[1] * this._frontPart.vertices[0].y <
    //     0
    //   ) {
    //     toVector = [-toVector[0], -toVector[1]];
    //   }

    //   // If the arcRadius is bigger than Pi/2 then reverse the toVector
    //   if (this._circleRadius > Math.PI / 2) {
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
    //   this._frontPart.vertices.forEach((node: Anchor) => {
    //     if (posIndexFill === this._frontFill.vertices.length) {
    //       //add a vector from the pool
    //       this._frontFill.vertices.push(pool.pop()!);
    //     }
    //     this._frontFill.vertices[posIndexFill].x = node.x;
    //     this._frontFill.vertices[posIndexFill].y = node.y;
    //     posIndexFill++;
    //   });
    //   // add the boundary points
    //   boundaryPoints.forEach(node => {
    //     if (posIndexFill === this._frontFill.vertices.length) {
    //       //add a vector from the pool
    //       this._frontFill.vertices.push(pool.pop()!);
    //     }
    //     this._frontFill.vertices[posIndexFill].x = node[0];
    //     this._frontFill.vertices[posIndexFill].y = node[1];
    //     posIndexFill++;
    //   });
    //   // console.log("posIndex", posIndexFill, " of ", 4 * SUBDIVISIONS + 2);
    //   // console.log("pool size", pool.length);
    //   // Build the backFill- first add the backPart.vertices
    //   this._backPart.vertices.forEach((node: Anchor) => {
    //     if (negIndexFill === this._backFill.vertices.length) {
    //       //add a vector from the pool
    //       this._backFill.vertices.push(pool.pop()!);
    //     }
    //     this._backFill.vertices[negIndexFill].x = node.x;
    //     this._backFill.vertices[negIndexFill].y = node.y;
    //     negIndexFill++;
    //   });
    //   // console.log("negIndex", negIndexFill, " of ", 4 * SUBDIVISIONS + 2);
    //   // console.log("pool size", pool.length);
    //   // add the boundary points (but in reverse!)
    //   boundaryPoints.reverse().forEach(node => {
    //     if (negIndexFill === this._backFill.vertices.length) {
    //       //add a vector from the pool
    //       this._backFill.vertices.push(pool.pop()!);
    //     }
    //     this._backFill.vertices[negIndexFill].x = node[0];
    //     this._backFill.vertices[negIndexFill].y = node[1];
    //     negIndexFill++;
    //   });

    //   // put remaining vertices in the storage (there shouldn't be any in this case)
    //   this.fillStorageAnchors.push(...pool.splice(0));
    // }
    // // The circle interior is only on the back of the sphere
    // else if (frontLen === 0 && this._circleRadius < Math.PI / 2) {
    //   //
    //   // In this case the backFillVertices are the same as the backVertices
    //   this._backPart.vertices.forEach((v: Anchor, index: number) => {
    //     if (negIndexFill === this._backFill.vertices.length) {
    //       //add a vector from the pool
    //       this._backFill.vertices.push(pool.pop()!);
    //     }
    //     this._backFill.vertices[negIndexFill].x = v.x;
    //     this._backFill.vertices[negIndexFill].y = v.y;
    //     negIndexFill++;
    //   });
    //   // put remaining vertices in the storage
    //   this.fillStorageAnchors.push(...pool.splice(0));
    // }
    // // The circle interior covers the entire front half of the sphere and is a 'hole' on the back
    // else if (frontLen === 0 && this._circleRadius > Math.PI / 2) {
    //   // In this case set the frontFillVertices to the entire boundary circle which are the originalVertices, but only add half of them
    //   // so that only SUBDIVISION number of vectors are used. (We need 3*SUBDIVISION +2 for the annular region on the back)
    //   this.originalVertices.reverse().forEach((v, ind) => {
    //     if (ind % 2 === 0) {
    //       if (posIndexFill === this._frontFill.vertices.length) {
    //         //add a vector from the pool
    //         this._frontFill.vertices.push(pool.pop()!);
    //       }
    //       this._frontFill.vertices[posIndexFill].x = v.x;
    //       this._frontFill.vertices[posIndexFill].y = v.y;
    //       posIndexFill++;
    //     }
    //   });

    //   // In this case the backFillVertices must trace out first the boundary circle (originalVertices) and then
    //   //  the circle, to trace an annular region.  To help with the rendering, start tracing
    //   //  the boundary circle directly across from the vertex on the circle at index zero
    //   const backStartTraceIndex = Math.floor(
    //     Math.atan2(
    //       this._backPart.vertices[0].y,
    //       this._backPart.vertices[0].x
    //     ).modTwoPi() /
    //       (Math.PI / SUBDIVISIONS)
    //   );

    //   this.originalVertices
    //     .reverse()
    //     .rotate(backStartTraceIndex)
    //     .forEach((v, ind) => {
    //       // Again add every other one so that only SUBDIVISION vectors are used in the first part of backFill
    //       if (ind % 2 === 0) {
    //         if (negIndexFill === this._backFill.vertices.length) {
    //           //add a vector from the pool
    //           this._backFill.vertices.push(pool.pop()!);
    //         }
    //         this._backFill.vertices[negIndexFill].x = v.x;
    //         this._backFill.vertices[negIndexFill].y = v.y;
    //         negIndexFill++;
    //       }
    //     });

    //   //return the original vertices to there initial state (notice that they were reversed twice)
    //   this.originalVertices.rotate(-backStartTraceIndex);

    //   // Make sure that the next entry in the backFill is the first to closed up the annular region
    //   const vert1 = pool.pop()!;
    //   vert1.x = this._backFill.vertices[0].x;
    //   vert1.y = this._backFill.vertices[0].y;
    //   this._backFill.vertices.push(vert1);
    //   negIndexFill++;

    //   // now add the backPart vertices
    //   this._backPart.vertices.forEach((v: Anchor, index: number) => {
    //     if (negIndexFill === this._backFill.vertices.length) {
    //       //add a vector from the pool
    //       this._backFill.vertices.push(pool.pop()!);
    //     }
    //     this._backFill.vertices[negIndexFill].x = v.x;
    //     this._backFill.vertices[negIndexFill].y = v.y;
    //     negIndexFill++;
    //   });

    //   // Make sure that the next entry in the backFill is the first to closed up the annular region
    //   const vert2 = pool.pop()!;
    //   vert2.x = this._backFill.vertices.slice(-1)[0].x;
    //   vert2.y = this._backFill.vertices.slice(-1)[0].y;
    //   this._backFill.vertices.push(vert2);

    //   // put remaining vertices in the storage (There shouldn't be any in this case)
    //   this.fillStorageAnchors.push(...pool.splice(0));
    // }
    // // The circle interior covers the entire back half of the sphere and is a 'hole' on the front
    // else if (backLen === 0 && this._circleRadius > Math.PI / 2) {
    //   // In this case set the backFillVertices to the entire boundary circle of the sphere which are the originalVertices, but only add half of them
    //   // so that only SUBDIVISION number of vectors are used. (We need 3*SUBDIVISION +2 for the annular region on the front)
    //   this.originalVertices.reverse().forEach((v, ind) => {
    //     if (ind % 2 === 0) {
    //       if (negIndexFill === this._backFill.vertices.length) {
    //         //add a vector from the pool
    //         this._backFill.vertices.push(pool.pop()!);
    //       }
    //       this._backFill.vertices[negIndexFill].x = v.x;
    //       this._backFill.vertices[negIndexFill].y = v.y;
    //       negIndexFill++;
    //     }
    //   });

    //   // In this case the frontFillVertices must trace out first the boundary circle (originalVertices) and then
    //   //  the circle, to trace an annular region.  To help with the rendering, start tracing
    //   //  the boundary circle directly across from the vertex on the circle at index zero
    //   const frontStartTraceIndex = Math.floor(
    //     Math.atan2(
    //       this._frontPart.vertices[0].y,
    //       this._frontPart.vertices[0].x
    //     ).modTwoPi() /
    //       (Math.PI / SUBDIVISIONS)
    //   );

    //   this.originalVertices
    //     .reverse()
    //     .rotate(frontStartTraceIndex)
    //     .forEach((v, ind) => {
    //       // Again add every other one so that only SUBDIVISION vectors are used in the first part of frontFill
    //       if (ind % 2 === 0) {
    //         if (posIndexFill === this._frontFill.vertices.length) {
    //           //add a vector from the pool
    //           this._frontFill.vertices.push(pool.pop()!);
    //         }
    //         this._frontFill.vertices[posIndexFill].x = v.x;
    //         this._frontFill.vertices[posIndexFill].y = v.y;
    //         posIndexFill++;
    //       }
    //     });
    //   //return/rotate the original vertices to there initial state (notice that they were reversed twice)
    //   this.originalVertices.rotate(-frontStartTraceIndex);

    //   // Make sure that the next entry in the frontFill is the first to closed up the annular region
    //   const vert1 = pool.pop()!;
    //   vert1.x = this._frontFill.vertices[0].x;
    //   vert1.y = this._frontFill.vertices[0].y;
    //   this._frontFill.vertices.push(vert1);
    //   posIndexFill++;

    //   // now add the frontPart vertices
    //   this._frontPart.vertices.forEach((v: Anchor, index: number) => {
    //     if (posIndexFill === this._frontFill.vertices.length) {
    //       //add a vector from the pool
    //       this._frontFill.vertices.push(pool.pop()!);
    //     }
    //     this._frontFill.vertices[posIndexFill].x = v.x;
    //     this._frontFill.vertices[posIndexFill].y = v.y;
    //     posIndexFill++;
    //   });

    //   // Make sure that the next entry in the frontFill is the first to closed up the annular region
    //   const vert2 = pool.pop()!;
    //   vert2.x = this._frontPart.vertices[0].x;
    //   vert2.y = this._frontPart.vertices[0].y;
    //   this._frontFill.vertices.push(vert2);

    //   // put remaining vertices in the storage (There shouldn't be any in this case)
    //   this.fillStorageAnchors.push(...pool.splice(0));
    // }
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
  }
  get circleRadius(): number {
    return this._circleRadius;
  }

  /**
   * For the ellipse which is the projection of the circle onto the view plane (in the unit circle)
   * @param t
   * @returns Return the coordinates of a point with parameter value t
   */
  pointOnProjectedEllipse(t: number): Array<number> {
    return [
      Math.cos(t) *
        Math.cos(this._beta) *
        Math.cos(this._rotation) *
        Math.sin(this._circleRadius) +
        Math.cos(this._circleRadius) *
          Math.cos(this._rotation) *
          Math.sin(this._beta) +
        (Math.sqrt(2 - Math.cos(this._circleRadius) ** 2) *
          Math.sin(t) *
          Math.sin(this._rotation)) /
          Math.sqrt(2 + Circle.ctg(this._circleRadius) ** 2),

      (Math.sqrt(2 - Math.cos(this._circleRadius) ** 2) *
        Math.cos(this._rotation) *
        Math.sin(t)) /
        Math.sqrt(2 + Circle.ctg(this._circleRadius) ** 2) -
        (Math.cos(t) * Math.cos(this._beta) * Math.sin(this._circleRadius) +
          Math.cos(this._circleRadius) * Math.sin(this._beta)) *
          Math.sin(this._rotation)
    ];
  }
  // frontGlowingDisplay(): void {
  //   this._frontPart.visible = true;
  //   this._glowingFrontPart.visible = true;
  //   this._frontFill.visible = true;
  // }
  // backGlowingDisplay(): void {
  //   this._backPart.visible = true;
  //   this._glowingBackPart.visible = true;
  //   this._backFill.visible = true;
  // }

  glowingDisplay(): void {
    // this.frontGlowingDisplay();
    // this.backGlowingDisplay();
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
  // frontNormalDisplay(): void {
  //   this._frontPart.visible = true;
  //   this._glowingFrontPart.visible = false;
  //   this._frontFill.visible = true;
  // }
  // backNormalDisplay(): void {
  //   this._backPart.visible = true;
  //   this._glowingBackPart.visible = false;
  //   this._backFill.visible = true;
  //}

  normalDisplay(): void {
    // this.frontNormalDisplay();
    // this.backNormalDisplay();
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
   * This method is used to copy the temporary circle created with the Circle Tool  into a
   * permanent one in the scene .
   */
  clone(): this {
    // Use the constructor for this class to create a template to copy over the
    // values from the current (the `this`) Circle object
    const dup = new Circle(this.name);
    dup._centerVector.copy(this._centerVector);
    dup._circleRadius = this._circleRadius;
    dup.updateDisplay(); // This sets all the necessary parameters in dup

    //Clone the front/back fill
    // #frontFill + #backFill + #storage = constant at all times
    // const poolFill = [];
    // poolFill.push(...dup._frontFill.vertices.splice(0));
    // poolFill.push(...dup._backFill.vertices.splice(0));
    // poolFill.push(...dup.fillStorageAnchors.splice(0));

    // while (dup._frontFill.vertices.length < this._frontFill.vertices.length) {
    //   dup._frontFill.vertices.push(poolFill.pop()!);
    // }
    // while (dup._backFill.vertices.length < this._backFill.vertices.length) {
    //   dup._backFill.vertices.push(poolFill.pop()!);
    // }
    // dup.fillStorageAnchors.push(...poolFill.splice(0));

    // dup._frontFill.vertices.forEach((v: Anchor, pos: number) => {
    //   v.copy(this._frontFill.vertices[pos]);
    // });

    // dup._backFill.vertices.forEach((v: Anchor, pos: number) => {
    //   v.copy(this._backFill.vertices[pos]);
    // });

    return dup as this;
  }

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
          Nodule.hslaIsNoFillOrNoStroke(SETTINGS.circle.temp.fillColor.front)
        ) {
          this._frontFill.noFill();
        } else {
          this.frontGradientColor.color = SETTINGS.circle.temp.fillColor.front;
          this._frontFill.fill = this.frontGradient;
        }
        if (
          Nodule.hslaIsNoFillOrNoStroke(SETTINGS.circle.temp.strokeColor.front)
        ) {
          this._frontPart.noStroke();
        } else {
          this._frontPart.stroke = SETTINGS.circle.temp.strokeColor.front;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this._frontPart.linewidth = Circle.currentCircleStrokeWidthFront;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.circle.drawn.dashArray.front.length > 0) {
          this._frontPart.dashes.clear();
          SETTINGS.circle.drawn.dashArray.front.forEach(v => {
            this._frontPart.dashes.push(v);
          });
          if (SETTINGS.circle.drawn.dashArray.reverse.front) {
            this._frontPart.dashes.reverse();
          }
        }
        //BACK
        if (
          Nodule.hslaIsNoFillOrNoStroke(SETTINGS.circle.temp.fillColor.back)
        ) {
          this._backFill.noFill();
        } else {
          this.backGradientColor.color = SETTINGS.circle.temp.fillColor.back;
          this._backFill.fill = this.backGradient;
        }
        if (
          Nodule.hslaIsNoFillOrNoStroke(SETTINGS.circle.temp.strokeColor.back)
        ) {
          this._backPart.noStroke();
        } else {
          this._backPart.stroke = SETTINGS.circle.temp.strokeColor.back;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this._backPart.linewidth = Circle.currentCircleStrokeWidthBack;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.circle.drawn.dashArray.back.length > 0) {
          this._backPart.dashes.clear();
          SETTINGS.circle.drawn.dashArray.back.forEach(v => {
            this._backPart.dashes.push(v);
          });
          if (SETTINGS.circle.drawn.dashArray.reverse.back) {
            this._backPart.dashes.reverse();
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
        if (Nodule.hslaIsNoFillOrNoStroke(frontStyle?.fillColor)) {
          this._frontFill.noFill();
        } else {
          this.frontGradientColor.color =
            frontStyle?.fillColor ?? SETTINGS.circle.drawn.fillColor.front;
          this._frontFill.fill = this.frontGradient;
        }

        if (Nodule.hslaIsNoFillOrNoStroke(frontStyle?.strokeColor)) {
          this._frontPart.noStroke();
        } else {
          this._frontPart.stroke =
            frontStyle?.strokeColor ?? SETTINGS.circle.drawn.strokeColor.front;
        }
        // strokeWidthPercent is applied by adjustSize()

        if (frontStyle?.dashArray && frontStyle.dashArray.length > 0) {
          this._frontPart.dashes.clear();
          this._frontPart.dashes.push(...frontStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this._frontPart.dashes.clear();
          this._frontPart.dashes.push(0);
        }
        // BACK
        const backStyle = this.styleOptions.get(StyleCategory.Back);
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hslaIsNoFillOrNoStroke(
              Nodule.contrastFillColor(frontStyle?.fillColor)
            )
          ) {
            this._backFill.noFill();
          } else {
            this.backGradientColor.color = Nodule.contrastFillColor(
              frontStyle?.fillColor ?? SETTINGS.circle.drawn.fillColor.back
            );

            this._backFill.fill = this.backGradient;
          }
        } else {
          if (Nodule.hslaIsNoFillOrNoStroke(backStyle?.fillColor)) {
            this._backFill.noFill();
          } else {
            this.backGradientColor.color =
              backStyle?.fillColor ?? SETTINGS.circle.drawn.fillColor.back;
            this._backFill.fill = this.backGradient;
          }
        }

        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hslaIsNoFillOrNoStroke(
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
          if (Nodule.hslaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this._backPart.noStroke();
          } else {
            this._backPart.stroke =
              backStyle?.strokeColor ?? SETTINGS.circle.drawn.strokeColor.back;
          }
        }

        // strokeWidthPercent applied by adjustSizer()

        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this._backPart.dashes.clear();
          this._backPart.dashes.push(...backStyle.dashArray);
          if (backStyle.dashArray) {
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
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle.dashArray.length > 0
        ) {
          this._glowingFrontPart.dashes.clear();
          this._glowingFrontPart.dashes.push(...frontStyle.dashArray);
          // I think the following three lines do a double reverse()
          // if (frontStyle.reverseDashArray) {
          //   this.glowingFrontPart.dashes.reverse();
          // }
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
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
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
