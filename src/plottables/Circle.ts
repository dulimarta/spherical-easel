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
import EventBus from "@/eventHandlers/EventBus";
import SE from "@/store/se-module";
import { CirclePosition, ProjectedEllipseData } from "@/types";

const desiredXAxis = new Vector3();
const desiredYAxis = new Vector3();
const desiredZAxis = new Vector3();
// const Z_AXIS = new Vector3(0, 0, 1);
const transformMatrix = new Matrix4();

export default class Circle extends Nodule {
  /**
   * The center vector of the circle in ideal unit sphere
   */
  private _centerVector = new Vector3();

  /**
   * The radius (in radians) of the spherical circle on the ideal unit sphere
   */
  private _circleRadius = 0;

  /**
   *
   * NOTE: Once the above two variables are set, the updateDisplay() will correctly render the circle.
   * These are the only pieces of information that are need to do the rendering. All other
   * calculations in this class are only for the purpose of rendering the circle.
   */

  /**
   *  This the data the describes the projected circle.
   */
  private projectedCircleData: ProjectedEllipseData;

  /**
   * Vuex global state
   */
  protected store = AppStore;

  /**
   * The TwoJS objects to display the front/back parts and their glowing counterparts.
   */
  // When the radius is less than or equal to Pi/2 this is the front circle edge and fill
  // Can be an entire ellipse or empty = not visible
  private frontCirclePart: Two.Ellipse;
  private glowingFrontCirclePart: Two.Ellipse; // glowing version has the same points as frontCirclePart
  // When the radius is less than or equal to Pi/2 this is the back circle edge and fill
  // Can be an entire ellipse or empty = not visible
  private backCirclePart: Two.Ellipse;
  private glowingBackCirclePart: Two.Ellipse; // glowing version has the same points as backCirclePart

  // When the circle intersects the boundary circle or has radius bigger than Pi/2
  // the interior is split into two pieces: front and back.
  // Each of the front and back is We would need something like a compound path
  // which is not a feature of Two.JS so we have to form the part with the pieces above and then
  // copy the anchor locations into the fill paths -- these can be the whole front of the sphere with a
  // hole missing -- and then fill them.
  // These each contain at most SETTINGS.circle.boundaryPoints + SETTING.circle.numPoints anchors (When the path is an entire front/back with a hole in it)
  private frontFill: Two.Path;
  private backFill: Two.Path;
  /**Create a storage pool for unused anchors in front/backFill in the case that the boundary circle intersects the circle*/
  private frontFillStorageAnchors: Two.Anchor[] = [];
  private backFillStorageAnchors: Two.Anchor[] = [];

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
   * For temporary calculation with ThreeJS objects
   */
  private tmpVector = new Vector3(0, 0, 1);
  private tmpMatrix = new Matrix4();
  private tmp1Vector = new Two.Vector(0, 0);
  private tmp2Vector = new Two.Vector(0, 0);

  constructor() {
    super();
    // initialize the ellipse data (i.e. the projection of the circle to the x/y plane)
    this.projectedCircleData = Nodule.projectedCircleData(this.tmpVector, 1);
    // Create the front/back parts of the projected circle
    // no cloning because that drops the resolution
    this.frontCirclePart = new Two.Ellipse(
      0,
      0,
      200,
      100,
      SETTINGS.circle.numPoints
    );
    this.glowingFrontCirclePart = new Two.Ellipse(
      0,
      0,
      200,
      100,
      SETTINGS.circle.numPoints
    );
    this.backCirclePart = new Two.Ellipse(
      0,
      0,
      100,
      100,
      SETTINGS.circle.numPoints
    );
    this.glowingBackCirclePart = new Two.Ellipse(
      0,
      0,
      200,
      100,
      SETTINGS.circle.numPoints
    );

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this.frontCirclePart.id), {
      type: "circle",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this.backCirclePart.id), {
      type: "circle",
      side: "back",
      fill: false,
      part: ""
    });

    // Set the styles that are always true
    // glowing never has fill
    this.frontCirclePart.noFill();
    this.glowingFrontCirclePart.noFill();
    this.backCirclePart.noFill();
    this.glowingBackCirclePart.noFill();

    //Turn off the glowing display initially but leave it on so that the temporary objects show up
    // this.frontCirclePart.visible = false;
    // this.backCirclePart.visible = false;
    // this.glowingBackCirclePart.visible = false;
    // this.glowingFrontCirclePart.visible = false;

    // Now organize the fills
    // In total there at most SETTINGS.circle.boundaryPoints + SETTINGS.circle.numPoints anchors in these paths
    const verticesFill: Two.Vector[] = [];
    for (
      let k = 0;
      k < SETTINGS.circle.numBoundaryPoints + SETTINGS.circle.numPoints;
      k++
    ) {
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
    // this.frontFill.visible = true;
    // this.backFill.visible = true;

    //set the fill gradient color correctly (especially the opacity which is set separately than the color -- not set by the opacity of the fillColor)
    this.frontGradientColor.color = SETTINGS.circle.drawn.fillColor.front;
    this.backGradientColor.color = SETTINGS.circle.dynamicBackStyle
      ? Nodule.contrastFillColor(SETTINGS.circle.drawn.fillColor.front)
      : SETTINGS.circle.drawn.fillColor.back;
    this.styleOptions.set(StyleEditPanels.Front, DEFAULT_CIRCLE_FRONT_STYLE);
    this.styleOptions.set(StyleEditPanels.Back, DEFAULT_CIRCLE_BACK_STYLE);
  }
  /**
   * OLD: Reorient the unit circle in 3D and then project the points to 2D
   * This method updates the TwoJS objects (frontPart, frontExtra, ...) for display
   * This is only accurate if the centerVector and radius are correct so only
   * call this method once those variables are updated.
   */
  public updateDisplay(): void {
    //#region circleDisplay
    this.projectedCircleData = Nodule.projectedCircleData(
      this._centerVector,
      this._circleRadius
    );
    if (
      this.projectedCircleData.position ===
      CirclePosition.ContainedEntirelyOnFront
    )
      console.log("Entirely on Front");
    if (
      this.projectedCircleData.position ===
      CirclePosition.ContainedEntirelyOnBack
    )
      console.log("Entirely on Back");
    if (
      this.projectedCircleData.position ===
      CirclePosition.SplitBetweenFrontAndBack
    )
      console.log("Split Front/Back");

    //console.log(this.projectedEllipseData);
    // console.log("tilt angle", this.projectedEllipseData.tiltAngle);
    // console.log("start angle", this.projectedEllipseData.frontStartAngle);
    // console.log("end angle", this.projectedEllipseData.frontEndAngle);
    // console.log(
    //   "2, 10, pi/4 percent",
    //   Nodule.convertEllipseAngleToPercent(2, 10, Math.PI / 4)
    // );
    // console.log("unit normal z", this._normalVector.z);

    // Update the center of the ellipse
    if (
      this.projectedCircleData.position ===
        CirclePosition.ContainedEntirelyOnFront ||
      this.projectedCircleData.position ===
        CirclePosition.SplitBetweenFrontAndBack
    ) {
      this.frontCirclePart.translation.x = this.projectedCircleData.centerX;
      this.frontCirclePart.translation.y = this.projectedCircleData.centerY;
      this.glowingFrontCirclePart.translation.x =
        this.projectedCircleData.centerX;
      this.glowingFrontCirclePart.translation.y =
        this.projectedCircleData.centerY;
      //update the width and height of the ellipse
      this.frontCirclePart.width = 2 * this.projectedCircleData.minorAxis;
      this.glowingFrontCirclePart.width =
        2 * this.projectedCircleData.minorAxis;
      this.frontCirclePart.height = 2 * this.projectedCircleData.majorAxis;
      this.glowingFrontCirclePart.height =
        2 * this.projectedCircleData.majorAxis;

      // rotate the ellipse so that the start of the beginning is at the highest y coordinate for the back (when tilt=0) and the lowest y-coordinate for the front (when tilt=0)
      // this is because Two.js doesn't have a command like ellipse(centerX,centerY,majorAxis,minorAxis,startAngle,endAngle
      // that allows the user to draw the ellipse from startAngle to endAngle
      this.frontCirclePart.rotation =
        this.projectedCircleData.tiltAngle + Math.PI / 2; // minus pi/2 to move the start point of the beginning/ending to the lowest point (without the tilt angle) i.e. (0,-minorAxis)
      this.glowingFrontCirclePart.rotation =
        this.projectedCircleData.tiltAngle + Math.PI / 2;
    }

    if (
      this.projectedCircleData.position ===
        CirclePosition.ContainedEntirelyOnBack ||
      this.projectedCircleData.position ===
        CirclePosition.SplitBetweenFrontAndBack
    ) {
      this.backCirclePart.translation.x = this.projectedCircleData.centerX;
      this.backCirclePart.translation.y = this.projectedCircleData.centerY;
      this.glowingBackCirclePart.translation.x =
        this.projectedCircleData.centerX;
      this.glowingBackCirclePart.translation.y =
        this.projectedCircleData.centerY;
      //update the width and height of the ellipse
      this.backCirclePart.width = 2 * this.projectedCircleData.minorAxis;
      this.glowingBackCirclePart.width = 2 * this.projectedCircleData.minorAxis;
      this.backCirclePart.height = 2 * this.projectedCircleData.majorAxis;
      this.glowingBackCirclePart.height =
        2 * this.projectedCircleData.majorAxis;
      // rotate the ellipse so that the start of the beginning is at the highest y coordinate for the back (when tilt=0) and the lowest y-coordinate for the front (when tilt=0)
      // this is because Two.js doesn't have a command like ellipse(centerX,centerY,majorAxis,minorAxis,startAngle,endAngle
      // that allows the user to draw the ellipse from startAngle to endAngle
      this.backCirclePart.rotation =
        this.projectedCircleData.tiltAngle - Math.PI / 2; // minus pi/2 to move the start point of the beginning/ending to the highest point (without the tilt angle) i.e. (0,+minorAxis)
      this.glowingBackCirclePart.rotation =
        this.projectedCircleData.tiltAngle - Math.PI / 2;
    }

    // Create the front/back fill pools
    const frontPool: Two.Anchor[] = [];
    frontPool.push(...this.frontFill.vertices.splice(0));
    frontPool.push(...this.frontFillStorageAnchors.splice(0));
    const backPool: Two.Anchor[] = [];
    backPool.push(...this.backFill.vertices.splice(0));
    backPool.push(...this.backFillStorageAnchors.splice(0));
    // console.log("pool size initially", pool.length);

    if (
      this.projectedCircleData.position ===
      CirclePosition.SplitBetweenFrontAndBack
    ) {
      //front(start|end)angle is the start/end angle draw if the ellipse was drawn with axes parallel to the x/y axes
      // and the center at (0,0)
      const frontStartTemp = Nodule.convertEllipseAngleToPercent(
        this.projectedCircleData.majorAxis,
        this.projectedCircleData.minorAxis,
        this.projectedCircleData.frontStartAngle
      );

      const frontEndTemp = Nodule.convertEllipseAngleToPercent(
        this.projectedCircleData.majorAxis,
        this.projectedCircleData.minorAxis,
        this.projectedCircleData.frontEndAngle
      );
      let frontCircleStartPercent: number;
      let frontCircleEndPercent: number;
      let backCircleStartPercent: number;
      let backCircleEndPercent: number;
      if (frontEndTemp > frontStartTemp) {
        // less than half of the circle is on the front
        frontCircleStartPercent = 0.25 + frontStartTemp;
        frontCircleEndPercent = 1 - frontCircleStartPercent; // should be equal to 1-(0.25+frontEndTemp)
        backCircleStartPercent = 0.5 - frontEndTemp;
        backCircleEndPercent = 1 - backCircleStartPercent; // should be equal to 1-(0.75+frontStartTemp)
      } else {
        // more than half of the circle is on the front
        frontCircleStartPercent = frontStartTemp - 0.75;
        frontCircleEndPercent = 1 - frontCircleStartPercent; // should be equal to 0.75-frontEndTemp)
        backCircleStartPercent = 0.25 - frontEndTemp;
        backCircleEndPercent = 1 - backCircleStartPercent; // should be equal to frontStartTemp-0.25
      }

      this.frontCirclePart.beginning = frontCircleStartPercent;
      this.glowingFrontCirclePart.beginning = frontCircleStartPercent;
      this.frontCirclePart.ending = frontCircleEndPercent;
      this.glowingFrontCirclePart.ending = frontCircleEndPercent;

      this.backCirclePart.beginning = backCircleStartPercent;
      this.glowingBackCirclePart.beginning = backCircleStartPercent;
      this.backCirclePart.ending = backCircleEndPercent;
      this.glowingBackCirclePart.ending = backCircleEndPercent;

      // The boundaries on the projected circle are set, now set the fills (which have one edge on the boundary circle)

      // Here we have to update the two.js instance in SphereFrame.vue so that this.(front|end)CirclePart.renderer.vertices are set properly
      EventBus.fire("update-two-instance", {}); // IS THIS AN ASYNCHRONOUS CALL? If so, the renderer.vertices won't necessarily be correct

      // add the vertices on the projected circle edge
      const localMatrix = this.frontCirclePart.matrix;
      this.frontCirclePart.renderer.vertices.forEach(v => {
        const temp = localMatrix.multiply(v.x, v.y, 1);
        const anchor = frontPool.pop()!;
        anchor.x = temp.x;
        anchor.y = temp.y;
        this.frontFill.vertices.push(anchor);
      });
      this.backCirclePart.renderer.vertices.forEach(v => {
        const temp = localMatrix.multiply(v.x, v.y, 1);
        const anchor = backPool.pop()!;
        anchor.x = temp.x;
        anchor.y = temp.y;
        this.backFill.vertices.push(anchor);
      });
      // reverse the front(or back?)array so that we can add the circle boundary part from start to end
      this.frontFill.vertices.reverse();

      // Compute the angles associated with the boundary circle segment
      // Get the first vertex of the rendered part of the projected ellipse
      const frontCircleStartVector = this.frontCirclePart.renderer.vertices[0];
      // Get the last vertex of the rendered part of the projected ellipse
      const frontCircleEndVector =
        this.frontCirclePart.renderer.vertices[
          this.frontCirclePart.renderer.vertices.length - 1
        ];
      // Transform the first vertex of the rendered part of the projected ellipse using the local matrix
      //  this should be on the boundary circle
      const startThreeVec = this.frontCirclePart.matrix.multiply(
        frontCircleStartVector.x,
        frontCircleStartVector.y,
        1
      );
      // Transform the last vertex of the rendered part of the projected ellipse using the local matrix
      //  this should be on the boundary circle
      const endThreeVec = this.frontCirclePart.matrix.multiply(
        frontCircleEndVector.x,
        frontCircleEndVector.y,
        1
      );
      // Transform the first/last vertex to their angles and then to index in Nodule.boundaryCircleVertices
      let startIndex = Math.ceil(
        Math.atan2(startThreeVec.y, startThreeVec.x).modTwoPi() /
          ((2 * Math.PI) / SETTINGS.circle.numBoundaryPoints)
      );
      // if the un ceilinged startindex is bigger than SETTINGS.circle.numBoundaryPoints then it should become zero (because we are counting mod SETTINGS.circle.numBoundaryPoints )
      if (startIndex === SETTINGS.circle.numBoundaryPoints) {
        startIndex = 0;
      }

      const endIndex = Math.floor(
        Math.atan2(endThreeVec.y, endThreeVec.x).modTwoPi() /
          ((2 * Math.PI) / SETTINGS.circle.numBoundaryPoints)
      );

      let i = startIndex;
      do {
        const frontAnchor = frontPool.pop()!;
        frontAnchor.x = Nodule.boundaryCircleVertices[i][0];
        frontAnchor.y = Nodule.boundaryCircleVertices[i][1];
        this.frontFill.vertices.push(frontAnchor);

        const backAnchor = backPool.pop()!;
        backAnchor.x = Nodule.boundaryCircleVertices[i][0];
        backAnchor.y = Nodule.boundaryCircleVertices[i][1];
        this.backFill.vertices.push(backAnchor);

        if (i + 1 === SETTINGS.circle.numBoundaryPoints) {
          i = 0;
        } else {
          i++;
        }
      } while (i <= endIndex);
    } else {
      // Here we have to update the two.js instance in SphereFrame.vue so that this.(front|end)CirclePart.renderer.vertices are set properly
      EventBus.fire("update-two-instance", {}); // IS THIS AN ASYNCHRONOUS CALL? If so, the renderer.vertices won't necessarily be correct

      // the circle is entirely on the front or back
      if (
        this.projectedCircleData.position ===
        CirclePosition.ContainedEntirelyOnFront
      ) {
        this.frontCirclePart.closed = true; // Do I need to do this as frontCirclePart is an ellipse?
        //copy the vertices of the projected circle into the front fill
        const localMatrix = this.frontCirclePart.matrix;
        this.frontCirclePart.renderer.vertices.forEach(v => {
          const temp = localMatrix.multiply(v.x, v.y, 1);
          const anchor = frontPool.pop()!;
          anchor.x = temp.x;
          anchor.y = temp.y;
          this.frontFill.vertices.push(anchor);
        });
        if (this._circleRadius >= Math.PI / 2) {
          // the back fill is the entire half sphere and the circle is a hole on the front (if circleRadius  < Pi/2 then
          // there is no back fill and the projected circle is a full ellipse on the front

          // shift the vertices in Nodule.boundaryCircleVertices so that last vertex of frontFill is across from
          // the starting first Nodule.boundaryCircleVertices -- this way the frontFill (which is an annulus) is
          // draw correctly
          const lastAnchor =
            this.frontFill.vertices[this.frontFill.vertices.length - 1];
          const rotateIndex = Math.floor(
            Math.atan2(lastAnchor.y, lastAnchor.x) /
              ((2 * Math.PI) / SETTINGS.circle.numBoundaryPoints)
          );
          Nodule.boundaryCircleVertices.rotate(rotateIndex); // This makes the zero index of the new boundaryCircleVertices equal to the rotateIndex of the previous boundaryCircleVertices

          Nodule.boundaryCircleVertices.forEach(v => {
            const backAnchor = backPool.pop()!;
            backAnchor.x = v[0];
            backAnchor.y = v[1];
            this.backFill.vertices.push(backAnchor);

            const frontAnchor = frontPool.pop()!;
            frontAnchor.x = v[0];
            frontAnchor.y = v[1];
            this.frontFill.vertices.push(frontAnchor);
          });
          // now un-rotate the boundaryCircleVertices to restore the index to angle relationship
          Nodule.boundaryCircleVertices.rotate(
            SETTINGS.circle.numBoundaryPoints - rotateIndex
          );
        }
      } else {
        //the ellipse is entirely on the back
        this.backCirclePart.closed = true; // Do I need to do this as backCirclePart is an ellipse?
        //copy the vertices of the projected circle into the front fill
        const localMatrix = this.backCirclePart.matrix;
        this.backCirclePart.renderer.vertices.forEach(v => {
          const temp = localMatrix.multiply(v.x, v.y, 1);
          const anchor = backPool.pop()!;
          anchor.x = temp.x;
          anchor.y = temp.y;
          this.backFill.vertices.push(anchor);
        });
        /////
        if (this._circleRadius >= Math.PI / 2) {
          // the front fill is the entire half sphere and the circle is a hole on the back (if circleRadius  < Pi/2 then
          // there is no front fill and the projected circle is a full ellipse on the back

          // shift the vertices in Nodule.boundaryCircleVertices so that last vertex of backFill is across from
          // the starting first Nodule.boundaryCircleVertices -- this way the backFill (which is an annulus) is
          // draw correctly
          const lastAnchor =
            this.backFill.vertices[this.backFill.vertices.length - 1];
          const rotateIndex = Math.floor(
            Math.atan2(lastAnchor.y, lastAnchor.x) /
              ((2 * Math.PI) / SETTINGS.circle.numBoundaryPoints)
          );
          Nodule.boundaryCircleVertices.rotate(rotateIndex); // This makes the zero index of the new boundaryCircleVertices equal to the rotateIndex of the previous boundaryCircleVertices

          Nodule.boundaryCircleVertices.forEach(v => {
            const frontAnchor = frontPool.pop()!;
            frontAnchor.x = v[0];
            frontAnchor.y = v[1];
            this.frontFill.vertices.push(frontAnchor);

            const backAnchor = backPool.pop()!;
            backAnchor.x = v[0];
            backAnchor.y = v[1];
            this.backFill.vertices.push(backAnchor);
          });
          // now un-rotate the boundaryCircleVertices to restore the index to angle relationship
          Nodule.boundaryCircleVertices.rotate(
            SETTINGS.circle.numBoundaryPoints - rotateIndex
          );
        }
      }
      this.backFill.closed = true;
      this.frontFill.closed = true;
    }
    // return any unused fill anchors to storage
    this.frontFillStorageAnchors.push(...frontPool.splice(0));
    this.backFillStorageAnchors.push(...backPool.splice(0));
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
    //this.projectedRadius = Math.sin(arcLengthRadius);
  }
  get circleRadius(): number {
    return this._circleRadius;
  }

  frontGlowingDisplay(): void {
    if (
      this.projectedCircleData.position ===
        CirclePosition.ContainedEntirelyOnFront ||
      this.projectedCircleData.position ===
        CirclePosition.SplitBetweenFrontAndBack
    ) {
      this.frontCirclePart.visible = true;
      this.glowingFrontCirclePart.visible = true;
      this.frontFill.visible = true;
    } else {
      this.frontCirclePart.visible = false;
      this.glowingFrontCirclePart.visible = false;
      this.frontFill.visible = false;
    }
  }
  backGlowingDisplay(): void {
    if (
      this.projectedCircleData.position ===
        CirclePosition.ContainedEntirelyOnBack ||
      this.projectedCircleData.position ===
        CirclePosition.SplitBetweenFrontAndBack
    ) {
      this.backCirclePart.visible = true;
      this.glowingBackCirclePart.visible = true;
      this.backFill.visible = true;
    } else {
      this.backCirclePart.visible = false;
      this.glowingBackCirclePart.visible = false;
      this.backFill.visible = false;
    }
  }
  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }
  frontNormalDisplay(): void {
    if (
      this.projectedCircleData.position ===
        CirclePosition.ContainedEntirelyOnFront ||
      this.projectedCircleData.position ===
        CirclePosition.SplitBetweenFrontAndBack
    ) {
      this.frontCirclePart.visible = true;
      this.glowingFrontCirclePart.visible = false;
      this.frontFill.visible = true;
    } else {
      this.frontCirclePart.visible = false;
      this.glowingFrontCirclePart.visible = false;
      this.frontFill.visible = false;
    }
  }
  backNormalDisplay(): void {
    if (
      this.projectedCircleData.position ===
        CirclePosition.ContainedEntirelyOnBack ||
      this.projectedCircleData.position ===
        CirclePosition.SplitBetweenFrontAndBack
    ) {
      this.backCirclePart.visible = true;
      this.glowingBackCirclePart.visible = false;
      this.backFill.visible = true;
    } else {
      this.backCirclePart.visible = false;
      this.glowingBackCirclePart.visible = false;
      this.backFill.visible = false;
    }
  }
  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this.frontCirclePart.visible = false;
      this.backCirclePart.visible = false;
      this.frontFill.visible = false;
      this.backFill.visible = false;
      this.glowingBackCirclePart.visible = false;
      this.glowingFrontCirclePart.visible = false;
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
    //clone the front|back circle parts
    dup.updateDisplay(); // this calls the projectedCircleData method and
    // updates dup rotation/translation/width/height glowing/front/back/start/end angle
    // but not the fill because the renderer vertices are not up to date (I think)

    //Clone the front/back fill
    const frontFillPool = [];
    frontFillPool.push(...dup.frontFill.vertices.splice(0));
    frontFillPool.push(...dup.frontFillStorageAnchors.splice(0));

    const backFillPool = [];
    backFillPool.push(...dup.backFill.vertices.splice(0));
    backFillPool.push(...dup.backFillStorageAnchors.splice(0));

    while (dup.frontFill.vertices.length < this.frontFill.vertices.length) {
      dup.frontFill.vertices.push(frontFillPool.pop()!);
    }
    while (dup.backFill.vertices.length < this.backFill.vertices.length) {
      dup.backFill.vertices.push(backFillPool.pop()!);
    }
    dup.frontFillStorageAnchors.push(...frontFillPool.splice(0));
    dup.backFillStorageAnchors.push(...backFillPool.splice(0));

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
    this.frontCirclePart.addTo(layers[LAYER.foreground]);
    this.glowingFrontCirclePart.addTo(layers[LAYER.foregroundGlowing]);
    this.backFill.addTo(layers[LAYER.backgroundFills]);
    this.backCirclePart.addTo(layers[LAYER.background]);
    this.glowingBackCirclePart.addTo(layers[LAYER.backgroundGlowing]);
  }

  removeFromLayers(/*layers: Two.Group[]*/): void {
    this.frontCirclePart.remove();
    this.frontFill.remove();
    this.glowingFrontCirclePart.remove();
    this.backCirclePart.remove();
    this.backFill.remove();
    this.glowingBackCirclePart.remove();
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
    this.frontCirclePart.linewidth =
      (Circle.currentCircleStrokeWidthFront * frontStrokeWidthPercent) / 100;
    this.backCirclePart.linewidth =
      (Circle.currentCircleStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this.glowingFrontCirclePart.linewidth =
      (Circle.currentGlowingCircleStrokeWidthFront * frontStrokeWidthPercent) /
      100;
    this.glowingBackCirclePart.linewidth =
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
          this.frontCirclePart.noStroke();
        } else {
          this.frontCirclePart.stroke = SETTINGS.circle.temp.strokeColor.front;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this.frontCirclePart.linewidth = Circle.currentCircleStrokeWidthFront;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.circle.drawn.dashArray.front.length > 0) {
          this.frontCirclePart.dashes.clear();
          SETTINGS.circle.drawn.dashArray.front.forEach(v => {
            this.frontCirclePart.dashes.push(v);
          });
          if (SETTINGS.circle.drawn.dashArray.reverse.front) {
            this.frontCirclePart.dashes.reverse();
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
          this.backCirclePart.noStroke();
        } else {
          this.backCirclePart.stroke = SETTINGS.circle.temp.strokeColor.back;
        }
        // The circle width is set to the current circle width (which is updated for zoom magnification)
        this.backCirclePart.linewidth = Circle.currentCircleStrokeWidthBack;
        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.circle.drawn.dashArray.back.length > 0) {
          this.backCirclePart.dashes.clear();
          SETTINGS.circle.drawn.dashArray.back.forEach(v => {
            this.backCirclePart.dashes.push(v);
          });
          if (SETTINGS.circle.drawn.dashArray.reverse.back) {
            this.backCirclePart.dashes.reverse();
          }
        }

        // The temporary display is never highlighted
        this.glowingFrontCirclePart.visible = false;
        this.glowingBackCirclePart.visible = false;
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
          this.frontCirclePart.noStroke();
        } else {
          this.frontCirclePart.stroke = frontStyle?.strokeColor as Two.Color;
        }
        // strokeWidthPercent is applied by adjustSize()

        if (frontStyle?.dashArray && frontStyle.dashArray.length > 0) {
          this.frontCirclePart.dashes.clear();
          this.frontCirclePart.dashes.push(...frontStyle.dashArray);
        } else {
          // the array length is zero and no dash array should be set
          this.frontCirclePart.dashes.clear();
          this.frontCirclePart.dashes.push(0);
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
            this.backCirclePart.noStroke();
          } else {
            this.backCirclePart.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
          }
        } else {
          if (Nodule.hlsaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this.backCirclePart.noStroke();
          } else {
            this.backCirclePart.stroke = backStyle?.strokeColor ?? "black";
          }
        }

        // strokeWidthPercent applied by adjustSizer()

        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this.backCirclePart.dashes.clear();
          this.backCirclePart.dashes.push(...backStyle.dashArray);
          if (backStyle.dashArray) {
            this.backCirclePart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.backCirclePart.dashes.clear();
          this.backCirclePart.dashes.push(0);
        }

        // UPDATE the glowing object

        // Glowing Front
        // no fillColor for glowing circles
        this.glowingFrontCirclePart.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle.dashArray.length > 0
        ) {
          this.glowingFrontCirclePart.dashes.clear();
          this.glowingFrontCirclePart.dashes.push(...frontStyle.dashArray);
          if (frontStyle.reverseDashArray) {
            this.glowingFrontCirclePart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.glowingFrontCirclePart.dashes.clear();
          this.glowingFrontCirclePart.dashes.push(0);
        }

        // Glowing Back
        // no fillColor for glowing circles
        this.glowingBackCirclePart.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this.glowingBackCirclePart.dashes.clear();
          this.glowingBackCirclePart.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this.glowingBackCirclePart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.glowingBackCirclePart.dashes.clear();
          this.glowingBackCirclePart.dashes.push(0);
        }
        break;
      }
    }
  }
}
