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
import { EllipsePosition } from "@/types";

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
   *  This the Euclidean radius of the circle in the plane of the spherical circle. It is always Math.sin(this.radius).
   */
  private projectedRadius = 0;

  /**
   * Vuex global state
   */
  protected store = AppStore; //

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
  private tmpVector = new Vector3();
  private tmpMatrix = new Matrix4();
  private tmp1Vector = new Two.Vector(0, 0);
  private tmp2Vector = new Two.Vector(0, 0);

  constructor() {
    super();
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
      200,
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
    this.frontCirclePart.visible = true;
    this.backCirclePart.visible = true;
    this.glowingBackCirclePart.visible = false;
    this.glowingFrontCirclePart.visible = false;

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
    const projectedEllipseData = Nodule.projectedEllipseData(
      this._centerVector,
      this._circleRadius
    );
    //console.log(projectedEllipseData);
    // console.log("tilt angle", projectedEllipseData.tiltAngle);
    // console.log("start angle", projectedEllipseData.frontStartAngle);
    // console.log("end angle", projectedEllipseData.frontEndAngle);
    // console.log(
    //   "2, 10, pi/4 percent",
    //   Nodule.convertEllipseAngleToPercent(2, 10, Math.PI / 4)
    // );
    // console.log("unit normal z", this._normalVector.z);

    // Update the center of the ellipse
    this.frontCirclePart.translation.x = projectedEllipseData.centerX;
    this.frontCirclePart.translation.y = projectedEllipseData.centerY;
    this.backCirclePart.translation.x = projectedEllipseData.centerX;
    this.backCirclePart.translation.y = projectedEllipseData.centerY;

    //update the width and height of the ellipse
    this.frontCirclePart.width =
      2 * projectedEllipseData.minorAxis * SETTINGS.boundaryCircle.radius;
    this.glowingFrontCirclePart.width =
      2 * projectedEllipseData.minorAxis * SETTINGS.boundaryCircle.radius;
    this.frontCirclePart.height =
      2 * projectedEllipseData.majorAxis * SETTINGS.boundaryCircle.radius;
    this.glowingFrontCirclePart.height =
      2 * projectedEllipseData.majorAxis * SETTINGS.boundaryCircle.radius;
    this.backCirclePart.width =
      2 * projectedEllipseData.majorAxis * SETTINGS.boundaryCircle.radius;
    this.glowingBackCirclePart.width =
      2 * projectedEllipseData.majorAxis * SETTINGS.boundaryCircle.radius;
    this.backCirclePart.height =
      2 * projectedEllipseData.minorAxis * SETTINGS.boundaryCircle.radius;
    this.glowingBackCirclePart.height =
      2 * projectedEllipseData.minorAxis * SETTINGS.boundaryCircle.radius;
    // rotate the ellipse so that the start of the beginning is at the highest y coordinate for the back (when tilt=0) and the lowest y-coordinate for the front (when tilt=0)
    // this is because Two.js doesn't have a command like ellipse(centerX,centerY,majorAxis,minorAxis,startAngle,endAngle
    // that allows the user to draw the ellipse from startAngle to endAngle
    this.frontCirclePart.rotation =
      projectedEllipseData.tiltAngle + Math.PI / 2; // minus pi/2 to move the start point of the beginning/ending to the lowest point (without the tilt angle) i.e. (0,-minorAxis)
    this.glowingFrontCirclePart.rotation =
      projectedEllipseData.tiltAngle + Math.PI / 2;

    this.backCirclePart.rotation = projectedEllipseData.tiltAngle - Math.PI / 2; // plus pi/2 to move the start point of the beginning/ending to the highest point (without the tilt angle) i.e. (0,+minorAxis)
    this.glowingBackCirclePart.rotation =
      projectedEllipseData.tiltAngle - Math.PI / 2;
    // Here we have to update the two.js instance in SphereFrame.vue so that this.(front|end)CirclePart.renderer.vertices are set properly
    EventBus.fire("update-two-instance", {}); // IS THIS AN ASYNCHRONOUS CALL? If so, the renderer.vertices won't necessarily be correct

    // Create the front/back fill pools
    const frontPool: Two.Anchor[] = [];
    frontPool.push(...this.frontFill.vertices.splice(0));
    frontPool.push(...this.frontFillStorageAnchors.splice(0));
    const backPool: Two.Anchor[] = [];
    backPool.push(...this.backFill.vertices.splice(0));
    backPool.push(...this.backFillStorageAnchors.splice(0));
    // console.log("pool size initially", pool.length);

    if (
      projectedEllipseData.position === EllipsePosition.SplitBetweenFrontAndBack
    ) {
      //front(start|end)angle is the start/end angle draw if the ellipse was drawn with axes parallel to the x/y axes
      // and the center at (0,0)
      const frontStartTemp = Nodule.convertEllipseAngleToPercent(
        projectedEllipseData.majorAxis,
        projectedEllipseData.minorAxis,
        projectedEllipseData.frontStartAngle
      );

      const frontEndTemp = Nodule.convertEllipseAngleToPercent(
        projectedEllipseData.majorAxis,
        projectedEllipseData.minorAxis,
        projectedEllipseData.frontEndAngle
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

      // add the vertices on the projected circle edge
      const localMatrix = this.frontFill.matrix;
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
      // the circle is entirely on the front or back
      if (
        projectedEllipseData.position ===
        EllipsePosition.ContainedEntirelyOnFront
      ) {
        this.frontCirclePart.closed = true; // Do I need to do this as frontCirclePart is an ellipse?
        //copy the vertices of the projected circle into the front fill
        const localMatrix = this.frontFill.matrix;
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
        const localMatrix = this.backFill.matrix;
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
        ////
      }
      this.backFill.closed = true;
      this.frontFill.closed = true;
    }
    // return any unused anchors to storage
    this.frontFillStorageAnchors.push(...frontPool.splice(0));
    this.backFillStorageAnchors.push(...backPool.splice(0));

    // Parts becomes closed when the entire circle is on
    // this.frontCirclePart.closed = backLen === 0;
    // this.backCirclePart.closed = frontLen === 0;
    // this.glowingFrontCirclePart.closed = backLen === 0;
    // this.glowingBackCirclePart.closed = frontLen === 0;

    //Now build the front/back fill objects based on the front/back parts

    // console.log(
    //   "sum of front and back part",
    //   this.frontPart.vertices.length + this.backPart.vertices.length
    // );
    // Bring all the anchor points to a common pool
    // Each front/back fill path will pull anchor points from
    // this pool as needed
    // any remaining are put in storage
    // const pool: Two.Anchor[] = [];
    // pool.push(...this.frontFill.vertices.splice(0));
    // pool.push(...this.backFill.vertices.splice(0));
    // pool.push(...this.fillStorageAnchors.splice(0));
    // console.log("pool size initially", pool.length);

    // let posIndexFill = 0;
    // let negIndexFill = 0;
    // let boundaryPoints: number[][] = [];
    // The circle interior is only on the front of the sphere
    // if (backLen === 0 && this._circleRadius < Math.PI / 2) {
    // In this case the frontFillVertices are the same as the frontVertices
    // this.frontCirclePart.vertices.forEach((v: Two.Anchor, index: number) => {
    //   if (posIndexFill === this.frontFill.vertices.length) {
    //     //add a vector from the pool
    //     this.frontFill.vertices.push(pool.pop()!);
    //   }
    //   this.frontFill.vertices[posIndexFill].x = v.x;
    //   this.frontFill.vertices[posIndexFill].y = v.y;
    //   posIndexFill++;
    // });
    // put remaining vertices in the storage
    // this.fillStorageAnchors.push(...pool.splice(0));
    //} // The circle interior is split between front and back
    // else if (backLen !== 0 && frontLen !== 0) {
    //find the angular width of the part of the boundary circle to be copied
    // Compute the angle from the positive x axis to the last frontPartVertex
    //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
    // const startAngle = Math.atan2(
    //   this.frontCirclePart.vertices[frontLen - 1].y,
    //   this.frontCirclePart.vertices[frontLen - 1].x
    // );

    // Compute the angle from the positive x axis to the first frontPartVertex
    //NOTE: the syntax for atan2 is atan2(y,x)!!!!!
    // const endAngle = Math.atan2(
    //   this.frontCirclePart.vertices[0].y,
    //   this.frontCirclePart.vertices[0].x
    // );

    // Compute the angular width of the section of the boundary circle to add to the front/back fill
    // This can be positive if traced counterclockwise or negative if traced clockwise( add 2 Pi to make positive)
    // let angularWidth = endAngle - startAngle;
    // if (angularWidth < 0) {
    //   angularWidth += 2 * Math.PI;
    // }
    //console.log(angularWidth);
    // When tracing the boundary circle we start from fromVector = this.frontPart.vertices[frontLen - 1]
    // const fromVector = [
    //   this.frontCirclePart.vertices[frontLen - 1].x,
    //   this.frontCirclePart.vertices[frontLen - 1].y
    // ];
    // then
    // trace in the direction of a toVector that is perpendicular to this.frontPart.vertices[frontLen - 1]
    // and points in the same direction as this.frontPart.vertices[0]
    // let toVector = [-fromVector[1], fromVector[0]];

    // If the toVector doesn't point in the same direction as the first vector in frontPart then reverse the toVector
    //   if (
    //     toVector[0] * this.frontCirclePart.vertices[0].x +
    //       toVector[1] * this.frontCirclePart.vertices[0].y <
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
    //     SETTINGS.circle.numPoints + 1,
    //     toVector,
    //     angularWidth
    //   );

    //   // Build the frontFill- first add the frontPart.vertices
    //   this.frontCirclePart.vertices.forEach(node => {
    //     if (posIndexFill === this.frontFill.vertices.length) {
    //       //add a vector from the pool
    //       this.frontFill.vertices.push(pool.pop()!);
    //     }
    //     this.frontFill.vertices[posIndexFill].x = node.x;
    //     this.frontFill.vertices[posIndexFill].y = node.y;
    //     posIndexFill++;
    //   });
    //   // add the boundary points
    //   boundaryPoints.forEach(node => {
    //     if (posIndexFill === this.frontFill.vertices.length) {
    //       //add a vector from the pool
    //       this.frontFill.vertices.push(pool.pop()!);
    //     }
    //     this.frontFill.vertices[posIndexFill].x = node[0];
    //     this.frontFill.vertices[posIndexFill].y = node[1];
    //     posIndexFill++;
    //   });
    //   // console.log("posIndex", posIndexFill, " of ", 4 * SETTINGS.circle.numPoints + 2);
    //   // console.log("pool size", pool.length);
    //   // Build the backFill- first add the backPart.vertices
    //   this.backCirclePart.vertices.forEach(node => {
    //     if (negIndexFill === this.backFill.vertices.length) {
    //       //add a vector from the pool
    //       this.backFill.vertices.push(pool.pop()!);
    //     }
    //     this.backFill.vertices[negIndexFill].x = node.x;
    //     this.backFill.vertices[negIndexFill].y = node.y;
    //     negIndexFill++;
    //   });
    //   // console.log("negIndex", negIndexFill, " of ", 4 * SETTINGS.circle.numPoints + 2);
    //   // console.log("pool size", pool.length);
    //   // add the boundary points (but in reverse!)
    //   boundaryPoints.reverse().forEach(node => {
    //     if (negIndexFill === this.backFill.vertices.length) {
    //       //add a vector from the pool
    //       this.backFill.vertices.push(pool.pop()!);
    //     }
    //     this.backFill.vertices[negIndexFill].x = node[0];
    //     this.backFill.vertices[negIndexFill].y = node[1];
    //     negIndexFill++;
    //   });

    //   // put remaining vertices in the storage (there shouldn't be any in this case)
    //   this.fillStorageAnchors.push(...pool.splice(0));
    // }
    // // The circle interior is only on the back of the sphere
    // else if (frontLen === 0 && this._circleRadius < Math.PI / 2) {
    //   //
    //   // In this case the backFillVertices are the same as the backVertices
    //   this.backCirclePart.vertices.forEach((v: Two.Anchor, index: number) => {
    //     if (negIndexFill === this.backFill.vertices.length) {
    //       //add a vector from the pool
    //       this.backFill.vertices.push(pool.pop()!);
    //     }
    //     this.backFill.vertices[negIndexFill].x = v.x;
    //     this.backFill.vertices[negIndexFill].y = v.y;
    //     negIndexFill++;
    //   });
    //   // put remaining vertices in the storage
    //   this.fillStorageAnchors.push(...pool.splice(0));
    // }
    // // The circle interior covers the entire front half of the sphere and is a 'hole' on the back
    // else if (frontLen === 0 && this._circleRadius > Math.PI / 2) {
    //   // In this case set the frontFillVertices to the entire boundary circle which are the boundaryCircleVertices, but only add half of them
    //   // so that only SUBDIVISION number of vectors are used. (We need 3*SUBDIVISION +2 for the annular region on the back)
    //   this.boundaryCircleVertices.reverse().forEach((v, ind) => {
    //     if (ind % 2 === 0) {
    //       if (posIndexFill === this.frontFill.vertices.length) {
    //         //add a vector from the pool
    //         this.frontFill.vertices.push(pool.pop()!);
    //       }
    //       this.frontFill.vertices[posIndexFill].x = v.x;
    //       this.frontFill.vertices[posIndexFill].y = v.y;
    //       posIndexFill++;
    //     }
    //   });

    //   // In this case the backFillVertices must trace out first the boundary circle (boundaryCircleVertices) and then
    //   //  the circle, to trace an annular region.  To help with the rendering, start tracing
    //   //  the boundary circle directly across from the vertex on the circle at index zero
    //   const backStartTraceIndex = Math.floor(
    //     Math.atan2(
    //       this.backCirclePart.vertices[0].y,
    //       this.backCirclePart.vertices[0].x
    //     ).modTwoPi() /
    //       (Math.PI / SETTINGS.circle.numPoints)
    //   );

    //   this.boundaryCircleVertices
    //     .reverse()
    //     .rotate(backStartTraceIndex)
    //     .forEach((v, ind) => {
    //       // Again add every other one so that only SUBDIVISION vectors are used in the first part of backFill
    //       if (ind % 2 === 0) {
    //         if (negIndexFill === this.backFill.vertices.length) {
    //           //add a vector from the pool
    //           this.backFill.vertices.push(pool.pop()!);
    //         }
    //         this.backFill.vertices[negIndexFill].x = v.x;
    //         this.backFill.vertices[negIndexFill].y = v.y;
    //         negIndexFill++;
    //       }
    //     });

    //   //return the original vertices to there initial state (notice that they were reversed twice)
    //   this.boundaryCircleVertices.rotate(-backStartTraceIndex);

    //   // Make sure that the next entry in the backFill is the first to closed up the annular region
    //   const vert1 = pool.pop()!;
    //   vert1.x = this.backFill.vertices[0].x;
    //   vert1.y = this.backFill.vertices[0].y;
    //   this.backFill.vertices.push(vert1);
    //   negIndexFill++;

    //   // now add the backPart vertices
    //   this.backCirclePart.vertices.forEach((v: Two.Anchor, index: number) => {
    //     if (negIndexFill === this.backFill.vertices.length) {
    //       //add a vector from the pool
    //       this.backFill.vertices.push(pool.pop()!);
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
    // // The circle interior covers the entire back half of the sphere and is a 'hole' on the front
    // else if (backLen === 0 && this._circleRadius > Math.PI / 2) {
    //   // In this case set the backFillVertices to the entire boundary circle of the sphere which are the boundaryCircleVertices, but only add half of them
    //   // so that only SUBDIVISION number of vectors are used. (We need 3*SUBDIVISION +2 for the annular region on the front)
    //   this.boundaryCircleVertices.reverse().forEach((v, ind) => {
    //     if (ind % 2 === 0) {
    //       if (negIndexFill === this.backFill.vertices.length) {
    //         //add a vector from the pool
    //         this.backFill.vertices.push(pool.pop()!);
    //       }
    //       this.backFill.vertices[negIndexFill].x = v.x;
    //       this.backFill.vertices[negIndexFill].y = v.y;
    //       negIndexFill++;
    //     }
    //   });

    //   // In this case the frontFillVertices must trace out first the boundary circle (boundaryCircleVertices) and then
    //   //  the circle, to trace an annular region.  To help with the rendering, start tracing
    //   //  the boundary circle directly across from the vertex on the circle at index zero
    //   const frontStartTraceIndex = Math.floor(
    //     Math.atan2(
    //       this.frontCirclePart.vertices[0].y,
    //       this.frontCirclePart.vertices[0].x
    //     ).modTwoPi() /
    //       (Math.PI / SETTINGS.circle.numPoints)
    //   );

    //   this.boundaryCircleVertices
    //     .reverse()
    //     .rotate(frontStartTraceIndex)
    //     .forEach((v, ind) => {
    //       // Again add every other one so that only SUBDIVISION vectors are used in the first part of frontFill
    //       if (ind % 2 === 0) {
    //         if (posIndexFill === this.frontFill.vertices.length) {
    //           //add a vector from the pool
    //           this.frontFill.vertices.push(pool.pop()!);
    //         }
    //         this.frontFill.vertices[posIndexFill].x = v.x;
    //         this.frontFill.vertices[posIndexFill].y = v.y;
    //         posIndexFill++;
    //       }
    //     });
    //   //return/rotate the original vertices to there initial state (notice that they were reversed twice)
    //   this.boundaryCircleVertices.rotate(-frontStartTraceIndex);

    //   // Make sure that the next entry in the frontFill is the first to closed up the annular region
    //   const vert1 = pool.pop()!;
    //   vert1.x = this.frontFill.vertices[0].x;
    //   vert1.y = this.frontFill.vertices[0].y;
    //   this.frontFill.vertices.push(vert1);
    //   posIndexFill++;

    //   // now add the frontPart vertices
    //   this.frontCirclePart.vertices.forEach((v: Two.Anchor, index: number) => {
    //     if (posIndexFill === this.frontFill.vertices.length) {
    //       //add a vector from the pool
    //       this.frontFill.vertices.push(pool.pop()!);
    //     }
    //     this.frontFill.vertices[posIndexFill].x = v.x;
    //     this.frontFill.vertices[posIndexFill].y = v.y;
    //     posIndexFill++;
    //   });

    //   // Make sure that the next entry in the frontFill is the first to closed up the annular region
    //   const vert2 = pool.pop()!;
    //   vert2.x = this.frontCirclePart.vertices[0].x;
    //   vert2.y = this.frontCirclePart.vertices[0].y;
    //   this.frontFill.vertices.push(vert2);

    //   // put remaining vertices in the storage (There shouldn't be any in this case)
    //   this.fillStorageAnchors.push(...pool.splice(0));
    //}
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
  // boundaryCircleCoordinates(
  //   startPt: number[],
  //   numPoints: number,
  //   yAxis: number[],
  //   angularLength: number
  // ): number[][] {
  //   const xAxisVector = new Vector3(startPt[0], startPt[1], 0).normalize();
  //   const yAxisVector = new Vector3(yAxis[0], yAxis[1], 0).normalize();
  //   const returnArray = [];

  //   for (let i = 0; i < numPoints; i++) {
  //     this.tmpVector.set(0, 0, 0);
  //     this.tmpVector.addScaledVector(
  //       xAxisVector,
  //       Math.cos((i + 1) * (angularLength / (numPoints + 1)))
  //     );
  //     this.tmpVector.addScaledVector(
  //       yAxisVector,
  //       Math.sin((i + 1) * (angularLength / (numPoints + 1)))
  //     );
  //     // now scale to the radius of the boundary circle
  //     this.tmpVector.normalize().multiplyScalar(SETTINGS.boundaryCircle.radius);

  //     returnArray.push([this.tmpVector.x, this.tmpVector.y]);
  //   }
  //   return returnArray;
  // }

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
    this.frontCirclePart.visible = true;
    this.glowingFrontCirclePart.visible = true;
    this.frontFill.visible = true;
  }
  backGlowingDisplay(): void {
    this.backCirclePart.visible = true;
    this.glowingBackCirclePart.visible = true;
    this.backFill.visible = true;
  }
  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }
  frontNormalDisplay(): void {
    this.frontCirclePart.visible = true;
    this.glowingFrontCirclePart.visible = false;
    this.frontFill.visible = true;
  }
  backNormalDisplay(): void {
    this.backCirclePart.visible = true;
    this.glowingBackCirclePart.visible = false;
    this.backFill.visible = true;
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

    dup.frontCirclePart = this.frontCirclePart.clone();
    dup.backCirclePart = this.frontCirclePart.clone();
    dup.glowingFrontCirclePart = this.glowingFrontCirclePart.clone();
    dup.glowingBackCirclePart = this.glowingBackCirclePart.clone();
    // Duplicate the non-glowing parts
    // dup.frontCirclePart.closed = this.frontCirclePart.closed;
    // dup.frontCirclePart.rotation = this.frontCirclePart.rotation;
    // dup.frontCirclePart.translation.copy(this.frontCirclePart.translation);
    // dup.backCirclePart.closed = this.backCirclePart.closed;
    // dup.backCirclePart.rotation = this.backCirclePart.rotation;
    // dup.backCirclePart.translation.copy(this.backCirclePart.translation);

    // Duplicate the glowing parts
    // dup.glowingFrontCirclePart.closed = this.glowingFrontCirclePart.closed;
    // dup.glowingFrontCirclePart.rotation = this.glowingFrontCirclePart.rotation;
    // dup.glowingFrontCirclePart.translation.copy(
    //   this.glowingFrontCirclePart.translation
    // );
    // dup.glowingBackCirclePart.closed = this.glowingBackCirclePart.closed;
    // dup.glowingBackCirclePart.rotation = this.glowingBackCirclePart.rotation;
    // dup.glowingBackCirclePart.translation.copy(
    //   this.glowingBackCirclePart.translation
    // );

    // // The clone (i.e. dup) initially has equal number of vertices for the front and back part
    // //  so adjust to match `this`. If one of the this.front or this.back has more vertices then
    // //  the corresponding dup part, then remove the excess vertices from the one with more and
    // //  move them to the other
    // while (
    //   dup.frontCirclePart.vertices.length > this.frontCirclePart.vertices.length
    // ) {
    //   // Transfer from frontPart to backPart
    //   dup.backCirclePart.vertices.push(dup.frontCirclePart.vertices.pop()!);
    //   dup.glowingBackCirclePart.vertices.push(
    //     dup.glowingFrontCirclePart.vertices.pop()!
    //   );
    // }
    // while (
    //   dup.backCirclePart.vertices.length > this.backCirclePart.vertices.length
    // ) {
    //   // Transfer from backPart to frontPart
    //   dup.frontCirclePart.vertices.push(dup.backCirclePart.vertices.pop()!);
    //   dup.glowingFrontCirclePart.vertices.push(
    //     dup.glowingBackCirclePart.vertices.pop()!
    //   );
    // }
    // // After the above two while statement execute this. glowing/not front/back and dup. glowing/not front/back are the same length
    // // Now we can copy the vertices from the this.front/back to the dup.front/back
    // dup.frontCirclePart.vertices.forEach((v: Two.Anchor, pos: number) => {
    //   v.copy(this.frontCirclePart.vertices[pos]);
    // });
    // dup.backCirclePart.vertices.forEach((v: Two.Anchor, pos: number) => {
    //   v.copy(this.backCirclePart.vertices[pos]);
    // });
    // dup.glowingFrontCirclePart.vertices.forEach(
    //   (v: Two.Anchor, pos: number) => {
    //     v.copy(this.glowingFrontCirclePart.vertices[pos]);
    //   }
    // );
    // dup.glowingBackCirclePart.vertices.forEach((v: Two.Anchor, pos: number) => {
    //   v.copy(this.glowingBackCirclePart.vertices[pos]);
    // });

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
