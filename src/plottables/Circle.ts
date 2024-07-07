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
  private _rotation: number = 0; //equal -Math.atan2(this._normalVector.x, this._normalVector.y); This is the amount to rotate the ellipse about its center

  private _halfMinorAxis: number = 0; //equal to (Sin[_beta + r] - Sin[_beta - r])/2
  private _halfMajorAxis: number = 0; // equal to Sqrt[2 - Cos[r]^2]/Sqrt[Cot[r]^2 + 2]
  private _beta: number = 0; // equal to arccos(this._centerVector.z), the angle between the north pole <0,0,1> and the center vector
  private _center = new Two.Vector(0, 0); // equal to  (radius* < (Sin[_beta + r] + Sin[_beta - r])/2, 0 >,  and then rotated by Math.atan2(this._centerVector.y, this._centerVector.x)).

  // The boundaryParameter (and -boundaryParameter are the parameter values where the circle crosses the boundaryCircle
  // set to zero when circle doesn't cross the boundaryCircle
  // The circle crosses the boundary if and only if Pi/2 < r + \[Beta] < 3 Pi/2 and Pi/2 < \[Beta] - r < Pi/2
  private _boundaryParameter1: number = 0; // equal to ArcCos[Cot[r] Cot[_beta]]

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
    this._frontPart = new Arc(0, 0, 0, 0, 0, 0, SUBDIVISIONS);
    this._glowingFrontPart = new Arc(0, 0, 0, 0, 0, 0, SUBDIVISIONS);
    this._backPart = new Arc(0, 0, 0, 0, 0, 0, SUBDIVISIONS);
    this._glowingBackPart = new Arc(0, 0, 0, 0, 0, 0, SUBDIVISIONS);

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

    // In total there are a maximum of 3*SUBDIVISIONS + 2 anchors in use on _fillFill and _backFill
    // when the circle is a hole on the front/back
    // This happens when the circle is a hole on the front or back.
    // The front/back requires 2*SUBDIVISIONS + 2 anchors (one SUBDIVISIONS to trace the circle, one SUBDIVISIONS to trace the boundary,
    // two for the extra anchors to close up the annular region on the circle and another on the boundary)
    // The back/front requires SUBDIVISIONS anchors
    //
    // When the circle intersects the boundary circle there are 4*SUBDIVISIONS anchors in use on the _frontFill and _backFill
    //  There are SUBDIVISIONS on the arc of the circle and on the boundary so 2*SUBDIVISIONS for each _frontFill and _backFill

    for (let k = 0; k <  4*SUBDIVISIONS; k++) {
      this.fillStorageAnchors.push(new Anchor(0, 0));
    }

    //it doesn't matter that no anchors are assigned to the front/backFill because they will assigned from the fillStorageAnchors
    this._frontFill = new Path([], /* closed */ true, /* curve */ false);
    this._backFill = new Path([], /* closed */ true, /* curve */ false);
    console.log("FSA Constructor", this.fillStorageAnchors.length, this._backFill.vertices.length,this._frontFill.vertices.length)

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
      (SETTINGS.boundaryCircle.radius *
        (Math.sin(this._beta + this._circleRadius) +
          Math.sin(this._beta - this._circleRadius))) /
      2;
    this._center.y = 0; // y component is always zero

    // Now rotate the center vector
    this._center.rotate(Math.atan2(this._centerVector.y, this._centerVector.x)); //DO NOT Rotate the center vector at the same time you set it equal to this._frontPart.position, this causes unexpected results

    //Copy the updated information into the glowing/not front/back parts
    this._frontPart.height =
      2 * this._halfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._frontPart.width =
      2 * this._halfMajorAxis * SETTINGS.boundaryCircle.radius;
    this._frontPart.rotation = this._rotation;
    this._frontPart.position = this._center;

    this._backPart.height =
      2 * this._halfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._backPart.width =
      2 * this._halfMajorAxis * SETTINGS.boundaryCircle.radius;
    this._backPart.position = this._center;
    this._backPart.rotation = this._rotation;

    this._glowingFrontPart.height =
      2 * this._halfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._glowingFrontPart.width =
      2 * this._halfMajorAxis * SETTINGS.boundaryCircle.radius;
    this._glowingFrontPart.position = this._center;
    this._glowingFrontPart.rotation = this._rotation;

    this._glowingBackPart.height =
      2 * this._halfMinorAxis * SETTINGS.boundaryCircle.radius;
    this._glowingBackPart.width =
      2 * this._halfMajorAxis * SETTINGS.boundaryCircle.radius;
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
      console.log("the circle edge is entirely on the front");

      // Set the front/back part/fill use
      this._frontPartInUse = true;
      this._frontFillInUse = true;
      this._backPartInUse = false;
      // this._backFillInUse could be either true or false
      this._frontFillIsEntireFront = false;
      // this._backFillIsEntireBack could be either true or false

      this._frontPart.startAngle = 0;
      this._frontPart.endAngle = 2 * Math.PI;
      this._frontPart.closed = true; //Is this necessary?

      this._glowingFrontPart.startAngle = 0;
      this._glowingFrontPart.endAngle = 2 * Math.PI;
      this._glowingFrontPart.closed = true; //Is this necessary?

      // Begin to set the frontFill that is common to both cases
      // Bring all the front anchor points to a common pool
      this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
      if (!this._backFillIsEntireBack){
        this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));
      }
      console.log("FSA 1", this.fillStorageAnchors.length)


      // In this case the frontFillVertices are the same as the frontVertices
      this._frontPart.vertices.findLast((v: Anchor) => {
        var coords = localMatrix.multiply(v.x, v.y, 1);
        //console.log("coords", coords[0], v.x);
        const vertex = this.fillStorageAnchors.pop();
        if (vertex !== undefined) {
          vertex.x = coords[0];
          vertex.y = coords[1];
          this._frontFill.vertices.push(vertex);
          //console.log("ang", Math.atan2(coords[1],coords[2]),coords[0]**2+coords[1]**2)
        } else {
          throw new Error(
            "Circle: not enough anchors in the pool to trace the circle on the front."
          );
        }
      });

      if (this.centerVector.z > 0) {
        // The interior of the circle is contained on the front
        // Nothing needs to be added to the frontFill
        //console.log("center z >0, length of front fill", this._frontFill.vertices.length)
        // backFill
        this._backFillInUse = false;
        this._backFillIsEntireBack = false;
        this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));
        console.log("FSA 2", this.fillStorageAnchors.length)
      } else {
        console.log(
          "the circle is a hole on the front, the back is entirely covered"
        );
        this._backFillInUse = true;

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
        // console.log("inside fill vert: #, dx, dy", this._frontFill.vertices.length, this._frontFill.vertices[0].x-this._frontFill.vertices[SUBDIVISIONS ].x, this._frontFill.vertices[0].y-this._frontFill.vertices[SUBDIVISIONS ].y  )

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
          ((frontStartTraceIndex % SUBDIVISIONS) + SUBDIVISIONS) % SUBDIVISIONS;

        //Move the boundary vertices array so that the first one is
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

        // console.log("boundary fill vert: #, dx, dy", this._frontFill.vertices.length, this._frontFill.vertices[SUBDIVISIONS+1].x-this._frontFill.vertices[2*SUBDIVISIONS+1 ].x, this._frontFill.vertices[SUBDIVISIONS+1].y-this._frontFill.vertices[2*SUBDIVISIONS+1 ].y  )

        // Set the backFill
        // In this case set the backFillVertices to the entire boundary circle of the sphere (unless it is already the entire back already)
        if (!this._backFillIsEntireBack) {
          this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));
          console.log("FSA 3", this.fillStorageAnchors.length)
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
      console.log("the circle edge is entirely on the back");

      // Set the front/back part/fill use
      this._frontPartInUse = false;
      // this._frontFillInUse could be true or false;
      this._backPartInUse = true;
      this._backFillInUse = true;
      // this._frontFillIsEntireFront could be true or false;
      this._backFillIsEntireBack = false;

      this._backPart.startAngle = 0;
      this._backPart.endAngle = 2 * Math.PI;
      this._backPart.closed = true; //Is this necessary?

      this._glowingBackPart.startAngle = 0;
      this._glowingBackPart.endAngle = 2 * Math.PI;
      this._glowingBackPart.closed = true; //Is this necessary?

      // Begin to set the back Fill that is common to both cases
      // Bring all the front anchor points to a common pool
      this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));
      if (!this._frontFillIsEntireFront){
        this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
      }
      console.log("FSA 4", this.fillStorageAnchors.length)

      // In this case the backFillVertices are the same as the backVertices
      // get the local transformation matrix of the circle (should be the same for all parts glowing/not front/back)
      const localMatrix = this._backPart.matrix; //local matrix works for just the position, rotation, and scale of that object in its local frame
      this._backPart.vertices.forEach((v: Anchor, ind: number) => {
        //if (ind < 20) {
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
        //}
      });

      if (this.centerVector.z < 0) {
        // The interior or the circle is contained on the back
        // Nothing needs to be added to the backFill
        // backFill
        this._frontFillInUse = false;
        this._frontFillIsEntireFront = false;
        this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
        console.log("FSA 5", this.fillStorageAnchors.length)
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
          ((backStartTraceIndex % SUBDIVISIONS) + SUBDIVISIONS) % SUBDIVISIONS;

        //Move the boundary vertices array so that the first one is
        Circle.boundaryVertices.rotate(backStartTraceIndex);

        Circle.boundaryVertices.findLast((v, ind) => {
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
        // In this case set the frontFillVertices to the entire boundary circle of the sphere (unless it is already the entire front already)
        if (!this._frontFillIsEntireFront) {
          this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
          console.log("FSA 6", this.fillStorageAnchors.length)
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
      console.log("the circle edge intersects the boundary circle");
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

      this._boundaryParameter1 = Math.acos(
        Circle.ctg(this._circleRadius) * Circle.ctg(this._beta)
      );

      // console.log("BP1", this._boundaryParameter1);
      // console.log("BP2", -this._boundaryParameter1);
      // set the display of the edge (drawn counterclockwise)
      // add/subtract ?*Pi/2 because two.js draws ellipse arcs differently than Mathematica
      this._frontPart.startAngle =
        (-3 * Math.PI) / 2 + this._boundaryParameter1;
      this._frontPart.endAngle = Math.PI / 2 - this._boundaryParameter1;
      this._backPart.startAngle = Math.PI / 2 - this._boundaryParameter1;
      this._backPart.endAngle = Math.PI / 2 + this._boundaryParameter1;

      const startPoint = this.pointOnProjectedEllipse(this._boundaryParameter1);
      // console.log(
      //   "SP",
      //   SETTINGS.boundaryCircle.radius * startPoint[0],
      //   SETTINGS.boundaryCircle.radius * startPoint[1]
      // );
      //find the angular width of the part of the boundary circle to be copied
      // Compute the angle from the positive x axis to the last frontPartVertex
      //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
      const startAngle = Math.atan2(startPoint[1], startPoint[0]);
      // console.log("SA", startAngle);

      const endPoint = this.pointOnProjectedEllipse(-this._boundaryParameter1);
      // console.log(
      //   "EP",
      //   SETTINGS.boundaryCircle.radius * endPoint[0],
      //   SETTINGS.boundaryCircle.radius * endPoint[1]
      // );
      // Compute the angle from the positive x axis to the first frontPartVertex
      //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
      const endAngle = Math.atan2(endPoint[1], endPoint[0]);
      // console.log("EA", endAngle);
      // Compute the angular width of the section of the boundary circle to add to the front/back fill
      // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
      let angularWidth = endAngle - startAngle;
      if (angularWidth < 0) {
        angularWidth += 2 * Math.PI;
      }
      // console.log("AW", angularWidth);

      // Start by creating the boundary points
      const boundaryPoints = Nodule.boundaryCircleCoordinates(
        startPoint,
        SUBDIVISIONS,
        [-startPoint[1], startPoint[0]], // Always go counterclockwise ,
        angularWidth
      );

      // clear the old front and back fill into the storage
      this.fillStorageAnchors.push(...this._frontFill.vertices.splice(0));
      this.fillStorageAnchors.push(...this._backFill.vertices.splice(0));
      console.log("FSA 7", this.fillStorageAnchors.length)

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
    console.log("FSA End", this.fillStorageAnchors.length)
    this.fillStorageAnchors.forEach((v:Anchor) => v.clear())
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
      (Math.sqrt(2 - Math.cos(this._circleRadius) ** 2) *
        Math.cos(this._rotation) *
        Math.sin(t)) /
        Math.sqrt(2 + Circle.ctg(this._circleRadius) ** 2) -
        (Math.cos(t) * Math.cos(this._beta) * Math.sin(this._circleRadius) +
          Math.cos(this._circleRadius) * Math.sin(this._beta)) *
          Math.sin(this._rotation),
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
          Math.sqrt(2 + Circle.ctg(this._circleRadius) ** 2)
    ];
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
