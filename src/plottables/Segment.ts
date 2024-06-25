import { Vector3, Matrix4 } from "three";
//import Two from "two.js";
import { Path } from "two.js/src/path";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_SEGMENT_FRONT_STYLE,
  DEFAULT_SEGMENT_BACK_STYLE
} from "@/types/Styles";
import { Arc } from "two.js/extras/jsm/arc";
import { Anchor } from "two.js/src/anchor";
import { Group } from "two.js/src/group";

// The number of vectors used to render the one part of the segment (like the frontPart, frontExtra, etc.)
const SUBDIVS = SETTINGS.segment.numPoints;
// The radius of the sphere on the screen
const radius = SETTINGS.boundaryCircle.radius;
/**
 * A line segment
 *
 * @export
 * @class Segment
 * @extends Nodule
 */
export default class Segment extends Nodule {
  /** The start vector of the segment on the unit Sphere*/
  public _startVector = new Vector3();
  /** A vector perpendicular to the plane containing the segment (unit vector)
   * NOTE: normal x start gives the direction in which the segment is drawn
   */
  public _normalVector = new Vector3();
  /** The arc length of the segment*/
  private _arcLength = 0;
  /**
   * NOTE: Once the above three variables are set, the updateDisplay() will correctly render the segment.
   * These are the only pieces of information that are need to do the rendering. All other
   * calculations in this class are only for the purpose of rendering the segment.
   * NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
   *  gives the direction in which the segment is drawn
   */

  /** Values that help in polygon when tracing a collection of segments */
  private _firstVertexIsOnFront = false;
  private _lastVertexIsOnFront = false;

  /**
   * A line segment of length longer than \pi has two pieces on one face of the sphere (say the front)
   * and on piece on the other face of the sphere (say the back). This means that any line segment
   * can have two front parts or two back parts. The frontExtra and backExtra are variables to represent those
   * extra parts. There are glowing counterparts for each part.
   */
  private _frontPart: Arc;
  private _frontExtra: Arc;
  private _backPart: Arc;
  private _backExtra: Arc;
  private _glowingFrontPart: Arc;
  private _glowingFrontExtra: Arc;
  private _glowingBackPart: Arc;
  private _glowingBackExtra: Arc;

  /** The normal vector determines the rotation and minor axis length of the displayed ellipse */
  private _rotation: number;
  private _halfMinorAxis: number;

  //Export to SVG we need to know the ending point of the segment and the intermediate point(s) where the segment crosses sides of the sphere.
  private _endVector = new Vector3();
  // The intermediate points (if used) are (cos(_rotation),(_rotation)) or/and (-cos(_rotation),-sin(_rotation))
  // Ww also need to know which arc to use, which is determined by the sign of the start and end parameters
  private _startParameter = 0;
  private _endParameter = 0;

  // Each part of the segment has a starting parameter and an ending parameter (set to zero when not in use)
  private _frontPartStartAngle: number = 0;
  private _frontPartEndAngle: number = 0;
  private _backPartStartAngle: number = 0;
  private _backPartEndAngle: number = 0;
  private _frontExtraStartAngle: number = 0;
  private _frontExtraEndAngle: number = 0;
  private _backExtraStartAngle: number = 0;
  private _backExtraEndAngle: number = 0;
  // Glowing counterparts are the same as their non-glowing ones, so don't keep a second set of these variables.

  // Booleans that help Polygon determine if those parts of the segment are in use
  private _frontPartInUse: boolean = false;
  private _frontExtraInUse: boolean = false;
  private _backPartInUse: boolean = false;
  private _backExtraInUse: boolean = false;

  //Vector to help set the parameters of the segment
  private toVector = new Vector3(); // The segment starts at _startVector and goes toward toVector, toVector is always 90 degrees from the _startVector
  private tempVector = new Vector3(); // Temp vector for figuring out end/mid Vectors

  /**
   * The styling variables for the drawn segment. The user can modify these.
   */
  // Front
  private glowingStrokeColorFront = SETTINGS.segment.glowing.strokeColor.front;
  // Back-- use the default non-dynamic back style options so that when the user disables the dynamic back style these options are displayed
  private glowingStrokeColorBack = SETTINGS.segment.glowing.strokeColor.back;

  /** Initialize the current line width that is adjusted by the zoom level and the user widthPercent */
  static currentSegmentStrokeWidthFront =
    SETTINGS.segment.drawn.strokeWidth.front;
  static currentSegmentStrokeWidthBack =
    SETTINGS.segment.drawn.strokeWidth.back;
  static currentGlowingSegmentStrokeWidthFront =
    SETTINGS.segment.drawn.strokeWidth.front +
    SETTINGS.segment.glowing.edgeWidth;
  static currentGlowingSegmentStrokeWidthBack =
    SETTINGS.segment.drawn.strokeWidth.back +
    SETTINGS.segment.glowing.edgeWidth;

  /**
   * Update all the current stroke widths
   * @param factor The ratio of the current magnification factor over the old magnification factor
   */
  static updateCurrentStrokeWidthForZoom(factor: number): void {
    Segment.currentSegmentStrokeWidthFront *= factor;
    Segment.currentSegmentStrokeWidthBack *= factor;
    Segment.currentGlowingSegmentStrokeWidthFront *= factor;
    Segment.currentGlowingSegmentStrokeWidthBack *= factor;
  }

  /**
   * Create a plottable segment from three pieces of information: startVector, normalVector, arcLength
   * NOTE: normal x start gives the direction in which the segment is drawn
   */
  constructor(noduleName: string = "None") {
    // Initialize the Group
    super(noduleName);

    this._frontPart = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      Math.PI,
      2 * Math.PI,
      SUBDIVS
    );
    this._glowingFrontPart = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      Math.PI,
      2 * Math.PI,
      SUBDIVS
    );
    this._backPart = new Arc(0, 0, 2 * radius, 2 * radius, 0, Math.PI, SUBDIVS);
    this._glowingBackPart = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      0,
      Math.PI,
      SUBDIVS
    );
    this._frontExtra = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      Math.PI,
      2 * Math.PI,
      SUBDIVS
    );
    this._glowingFrontExtra = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      Math.PI,
      2 * Math.PI,
      SUBDIVS
    );
    this._backExtra = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      0,
      Math.PI,
      SUBDIVS
    );
    this._glowingBackExtra = new Arc(
      0,
      0,
      2 * radius,
      2 * radius,
      0,
      Math.PI,
      SUBDIVS
    );

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this._frontPart.id), {
      type: "segment",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this._frontExtra.id), {
      type: "segment",
      side: "front",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this._backPart.id), {
      type: "segment",
      side: "back",
      fill: false,
      part: ""
    });
    Nodule.idPlottableDescriptionMap.set(String(this._backExtra.id), {
      type: "segment",
      side: "back",
      fill: false,
      part: ""
    });

    // Set the style that never changes -- Fill
    this._frontPart.noFill();
    this._glowingFrontPart.noFill();
    this._backPart.noFill();
    this._glowingBackPart.noFill();
    this._frontExtra.noFill();
    this._glowingFrontExtra.noFill();
    this._backExtra.noFill();
    this._glowingBackExtra.noFill();

    // The segment is not initially glowing but leave the regular parts visible for the temporary objects
    this._frontPart.visible = true;
    this._glowingFrontPart.visible = false;
    this._backPart.visible = true;
    this._glowingBackPart.visible = false;
    this._frontExtra.visible = true;
    this._glowingFrontExtra.visible = false;
    this._backExtra.visible = true;
    this._glowingBackExtra.visible = false;

    // set the normal vector
    this._normalVector = new Vector3();
    //Let \[Beta]  be the angle between the north pole NP= <0,0,1> and the unit normal vector (with z coordinate positive), then cos(\[Beta]) is half the minor axis.
    //Note:
    //  0 <= \[Beta] <= \[Pi]/2.
    //  _normalVector.z = NP._normalVector = |NP||_normalVector|cos(\[Beta])= cos(\[Beta])
    this._halfMinorAxis = this._normalVector.z;

    this._rotation = 0; //Initially the normal vector is <0,0,1> so the rotation is 0 in general the rotation angle is
    //Let \[Theta] be the angle between the vector <0,1> and <n_x,n_y>, then \[Theta] is the angle of rotation. Note that \[Theta] = -ATan2(n_x,n_y) (measured counterclockwise)

    this.styleOptions.set(StyleCategory.Front, DEFAULT_SEGMENT_FRONT_STYLE);
    this.styleOptions.set(StyleCategory.Back, DEFAULT_SEGMENT_BACK_STYLE);
  }

  /**
   * This is only accurate if the normalVector, startVector, arcLength are correct so only
   * call this method once those variables are updated.
   */
  public updateDisplay(): void {
    this._halfMinorAxis = this._normalVector.z;
    this._rotation = -Math.atan2(this._normalVector.x, this._normalVector.y); // not a typo because we are measuring off of the positive y axis in the screen plane counterclockwise (the negative sign)

    //Now set the start and end parameters/angles for each of the pieces of the segment
    // Start by setting the mid- and end-Vectors
    //NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
    // gives the direction in which the segment is drawn
    // This toVector is 90 degree away from _startVector in the direction of the segment
    this.toVector
      .copy(this._normalVector)
      .cross(this._startVector)
      .multiplyScalar(this._arcLength > Math.PI ? -1 : 1)
      .normalize();

    // endVector = cos(arcLength)*startVector+sin(arcLength)*toVector
    this._endVector
      .copy(this._startVector)
      .multiplyScalar(Math.cos(this._arcLength));
    this.tempVector
      .copy(this.toVector)
      .multiplyScalar(Math.sin(this._arcLength));
    this._endVector.add(this.tempVector).normalize();

    // Set the last/first vertex is on front
    this._firstVertexIsOnFront = Math.sign(this._startVector.z) == 1;
    this._lastVertexIsOnFront = Math.sign(this._endVector.z) == 1;

    // Now compute the angle/parameter of the locations of the start, mid, and end vectors
    // Start by rotating them -this._rotation
    // [Cos(theta)  -Sin(theta)] [vx]
    // [Sin(theta) cos(theta)] [vy]
    const unRotatedStartVecX =
      Math.cos(-this._rotation) * this._startVector.x -
      Math.sin(-this._rotation) * this._startVector.y;
    const unRotatedStartVecY =
      Math.sin(-this._rotation) * this._startVector.x +
      Math.cos(-this._rotation) * this._startVector.y;

    const unRotatedEndVecX =
      Math.cos(-this._rotation) * this._endVector.x -
      Math.sin(-this._rotation) * this._endVector.y;
    const unRotatedEndVecY =
      Math.sin(-this._rotation) * this._endVector.x +
      Math.cos(-this._rotation) * this._endVector.y;

    // console.log("un rot start x,y", unRotatedStartVecX, unRotatedStartVecY )
    // console.log("angle NC", Math.atan2(
    //   unRotatedStartVecY,
    //   unRotatedStartVecX
    // ))

    // Now that (unRotatedStartVecX,unRotatedStartVecY) is a point on the rotated ellipse
    //  with halfMinorAxis and 1 (half the MajorAxis) then the parameter value is
    this._startParameter = Math.atan2(
      unRotatedStartVecY / Math.abs(this._halfMinorAxis),
      unRotatedStartVecX
    );
    this._endParameter = Math.atan2(
      unRotatedEndVecY / Math.abs(this._halfMinorAxis),
      unRotatedEndVecX
    );
    // Because if E(t) = (a*cos(t),b*sin(t)) 0 <= t <= 2Pi is an ellipse and (c,d) is on E(t)
    // for some t0 then t0= atan2(d/b,c/a), but we have to adjust for how two.js draws arcs

    // make sure that start<mid<end parameter
    // console.log("start p", this._startParameter,2*Math.PI+this._startParameter,2*Math.PI-this._startParameter);
    // console.log("end p", this._endParameter,2*Math.PI+this._endParameter,2*Math.PI-this._endParameter);
    // console.log("arc l", this._arcLength);
    // console.log("rot", this._rotation)

    // Now figure out the front/back part/extra angle values and set the front/back part/extra in use booleans

    //reset all the arc parameters, this means that unused parts have their start and end angles set to zero so they are not displayed (without setting the visibility to false)
    this._frontPartStartAngle = 0;
    this._frontPartEndAngle = 0;
    this._backPartStartAngle = 0;
    this._backPartEndAngle = 0;
    this._frontExtraStartAngle = 0;
    this._frontExtraEndAngle = 0;
    this._backExtraStartAngle = 0;
    this._backExtraEndAngle = 0;
    this._frontPartInUse = false;
    this._backPartInUse = false;
    this._frontExtraInUse = false;
    this._backExtraInUse = false;

    if (
      this._firstVertexIsOnFront &&
      this._arcLength <= Math.PI &&
      this._lastVertexIsOnFront
    ) {
      // the segment starts and ends on the front
      this._frontPartInUse = true;

      this._frontPartStartAngle =
        this._startParameter < 0
          ? 2 * Math.PI + this._startParameter
          : 2 * Math.PI - this._startParameter;
      this._frontPartEndAngle =
        this._endParameter < 0
          ? 2 * Math.PI + this._endParameter
          : 2 * Math.PI - this._endParameter;
    } else if (
      !this._firstVertexIsOnFront &&
      this._arcLength <= Math.PI &&
      !this._lastVertexIsOnFront
    ) {
      // the segment starts and ends on the back
      this._backPartInUse = true;

      this._backPartStartAngle =
        this._startParameter > 0 ? this._startParameter : -this._startParameter;
      this._backPartEndAngle =
        this._endParameter > 0 ? this._endParameter : -this._endParameter;
    } else if (
      this._firstVertexIsOnFront &&
      this._arcLength <= Math.PI &&
      !this._lastVertexIsOnFront
    ) {
      // the segment starts on front and ends on the back length less than pi
      this._frontPartInUse = true;
      this._backPartInUse = true;

      this._frontPartStartAngle =
        this._startParameter < 0
          ? 2 * Math.PI + this._startParameter
          : 2 * Math.PI - this._startParameter;
      this._frontPartEndAngle = 2 * Math.PI;
      this._backPartStartAngle = 0;
      this._backPartEndAngle =
        this._endParameter > 0 ? this._endParameter : -this._endParameter;
    } else if (
      this._firstVertexIsOnFront &&
      this._arcLength > Math.PI &&
      !this._lastVertexIsOnFront
    ) {
      // the segment starts on front and ends on the back length more than pi
      this._frontPartInUse = true;
      this._backPartInUse = true;

      this._frontPartStartAngle =
        this._startParameter < 0
          ? 2 * Math.PI + this._startParameter
          : 2 * Math.PI - this._startParameter;
      this._frontPartEndAngle = this._startParameter < 0 ? Math.PI : Math.PI;
      this._backPartStartAngle = this._endParameter > 0 ? Math.PI : Math.PI;
      this._backPartEndAngle =
        this._endParameter > 0 ? this._endParameter : -this._endParameter;
    } else if (
      !this._firstVertexIsOnFront &&
      this._arcLength <= Math.PI &&
      this._lastVertexIsOnFront
    ) {
      // the segment starts on back and ends on the front length less than pi
      this._frontPartInUse = true;
      this._backPartInUse = true;

      this._frontPartStartAngle = Math.PI;
      this._frontPartEndAngle =
        this._endParameter > 0
          ? 2 * Math.PI - this._endParameter
          : 2 * Math.PI + this._endParameter;
      this._backPartStartAngle =
        this._startParameter < 0 ? -this._startParameter : this._startParameter;
      this._backPartEndAngle = Math.PI;
    } else if (
      !this._firstVertexIsOnFront &&
      this._arcLength > Math.PI &&
      this._lastVertexIsOnFront
    ) {
      // the segment starts on back and ends on the front length more than pi
      this._frontPartInUse = true;
      this._backPartInUse = true;

      this._frontPartStartAngle =
        this._endParameter > 0 ? 2 * Math.PI - this._endParameter : 0;
      this._frontPartEndAngle =
        this._endParameter > 0 ? 2 * Math.PI : this._endParameter;
      this._backPartStartAngle =
        this._startParameter < 0 ? -this._startParameter : this._startParameter;
      this._backPartEndAngle = this._startParameter < 0 ? 0 : 0;
    } else if (
      this._firstVertexIsOnFront &&
      this._arcLength > Math.PI &&
      this._lastVertexIsOnFront
    ) {
      // the segment wraps from front to back to front
      this._frontPartInUse = true;
      this._backPartInUse = true; // length pi
      this._frontExtraInUse = true;

      this._frontPartStartAngle =
        this._startParameter < 0
          ? 2 * Math.PI + this._startParameter
          : 2 * Math.PI - this._startParameter;
      this._frontPartEndAngle = Math.PI;

      this._backPartStartAngle = this._startParameter > 0 ? Math.PI : Math.PI; // this is a work around until two.js update bug is fixed
      this._backPartEndAngle = this._startParameter > 0 ? 0 : 0; // this is a work around until two.js update bug is fixed

      this._frontExtraStartAngle = 2 * Math.PI;
      this._frontExtraEndAngle =
        this._endParameter < 0
          ? 2 * Math.PI + this._endParameter
          : 2 * Math.PI - this._endParameter;
    } else if (
      !this._firstVertexIsOnFront &&
      this._arcLength > Math.PI &&
      !this._lastVertexIsOnFront
    ) {
      // the segment wraps from back to front to back
      this._frontPartInUse = true; //length pi
      this._backPartInUse = true;
      this._backExtraInUse = true;

      this._frontPartStartAngle = 2 * Math.PI; // this is a work around until two.js update bug is fixed
      this._frontPartEndAngle = Math.PI; // this is a work around until two.js update bug is fixed

      this._backPartStartAngle =
        this._startParameter < 0 ? -this._startParameter : this._startParameter;
      this._backPartEndAngle = 0;

      this._backExtraStartAngle = Math.PI;
      this._backExtraEndAngle =
        this._endParameter < 0 ? -this._endParameter : this._endParameter;
    }

    //Now copy all this information into the glowing/not front/back part/extra
    this._frontPart.startAngle = this._frontPartStartAngle;
    this._glowingFrontPart.startAngle = this._frontPartStartAngle;
    this._backPart.startAngle = this._backPartStartAngle;
    this._glowingBackPart.startAngle = this._backPartStartAngle;
    this._frontExtra.startAngle = this._frontExtraStartAngle;
    this._glowingFrontExtra.startAngle = this._frontExtraStartAngle;
    this._backExtra.startAngle = this._backExtraStartAngle;
    this._glowingBackExtra.startAngle = this._backExtraStartAngle;

    this._frontPart.endAngle = this._frontPartEndAngle;
    this._glowingFrontPart.endAngle = this._frontPartEndAngle;
    this._backPart.endAngle = this._backPartEndAngle;
    this._glowingBackPart.endAngle = this._backPartEndAngle;
    this._frontExtra.endAngle = this._frontExtraEndAngle;
    this._glowingFrontExtra.endAngle = this._frontExtraEndAngle;
    this._backExtra.endAngle = this._backExtraEndAngle;
    this._glowingBackExtra.endAngle = this._backExtraEndAngle;

    this._frontPart.rotation = this._rotation;
    this._glowingFrontPart.rotation = this._rotation;
    this._backPart.rotation = this._rotation;
    this._glowingBackPart.rotation = this._rotation;
    this._frontExtra.rotation = this._rotation;
    this._glowingFrontExtra.rotation = this._rotation;
    this._backExtra.rotation = this._rotation;
    this._glowingBackExtra.rotation = this._rotation;

    // scale to display on the screen and set the heights (widths are all 2*radius)
    this._frontPart.height = 2 * radius * this._halfMinorAxis;
    this._glowingFrontPart.height = 2 * radius * this._halfMinorAxis;
    this._backPart.height = 2 * radius * this._halfMinorAxis;
    this._glowingBackPart.height = 2 * radius * this._halfMinorAxis;
    this._frontExtra.height = 2 * radius * this._halfMinorAxis;
    this._glowingFrontExtra.height = 2 * radius * this._halfMinorAxis;
    this._backExtra.height = 2 * radius * this._halfMinorAxis;
    this._glowingBackExtra.height = 2 * radius * this._halfMinorAxis;

    //for checking to see if the segment is drawn from start to end
    // this._frontPart.ending = 0.75
    // this._frontExtra.ending = 0.75
    // this._backPart.ending = 0.75
    // this._backExtra.ending = 0.75
    // this._glowingFrontPart.ending = 0.75
    // this._glowingFrontExtra.ending = 0.75
    // this._glowingBackPart.ending = 0.75
    // this._glowingBackExtra.ending = 0.75
  }

  /**
   * Set the arcLength of the segment. The start and normal
   * vector and arcLength must be correctly set before calling the updateDisplay() method on this segment.
   *  NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
   *  gives the direction in which the segment is drawn
   */
  set arcLength(len: number) {
    this._arcLength = len;
  }
  /**
   * Set the unit vector that is the start of the segment. The start and normal
   * vector and arcLength must be correctly set before calling the updateDisplay() method on this segment.
   * NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
   *  gives the direction in which the segment is drawn
   */
  set startVector(idealUnitStartVector: Vector3) {
    this._startVector.copy(idealUnitStartVector).normalize();
  }

  /**
   * Set the unit vector that is the normal of the segment. The start and normal
   * vector and arcLength must be correctly set before calling the updateDisplay() method on this segment.
   * NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
   *  gives the direction in which the segment is drawn
   */
  set normalVector(idealUnitNormalVector: Vector3) {
    this._normalVector.copy(idealUnitNormalVector).normalize();
  }

  get frontPartInUse(): boolean {
    return this._frontPartInUse;
  }
  get frontPart(): Arc {
    return this._frontPart;
  }
  get backPartInUse(): boolean {
    return this._backPartInUse;
  }
  get backPart(): Arc {
    return this._backPart;
  }
  get frontExtraInUse(): boolean {
    return this._frontExtraInUse;
  }
  get frontExtra(): Arc {
    return this._frontExtra;
  }
  get backExtraInUse(): boolean {
    return this._backExtraInUse;
  }
  get backExtra(): Arc {
    return this._backExtra;
  }
  get firstVertexIsOnFront(): boolean {
    return this._firstVertexIsOnFront;
  }
  get lastVertexIsOnFront(): boolean {
    return this._lastVertexIsOnFront;
  }
  get startVector(): Vector3 {
    return this._startVector;
  }
  get endVector(): Vector3 {
    return this._endVector;
  }
  get startParameter(): number {
    return this._startParameter;
  }
  get endParameter(): number {
    return this._endParameter;
  }

  normalDisplay(): void {
    console.log("set normal display segment");
    if (this._frontPartInUse) {
      this._frontPart.visible = true;
      this._glowingFrontPart.visible = false;
    }
    if (this._frontExtraInUse) {
      this._frontExtra.visible = true;
      this._glowingFrontExtra.visible = false;
    }
    if (this._backPartInUse) {
      this._backPart.visible = true;
      this._glowingBackPart.visible = false;
    }
    if (this._backExtraInUse) {
      this._backExtra.visible = true;
      this._glowingBackExtra.visible = false;
    }
    //frontNormalDisplay()
    //backNormalDisplay()
  }

  glowingDisplay(): void {
    if (this._frontPartInUse) {
      this._frontPart.visible = true;
      this._glowingFrontPart.visible = true;
    }
    if (this._frontExtraInUse) {
      this._frontExtra.visible = true;
      this._glowingFrontExtra.visible = true;
    }
    if (this._backPartInUse) {
      this._backPart.visible = true;
      this._glowingBackPart.visible = true;
    }
    if (this._backExtraInUse) {
      this._backExtra.visible = true;
      this._glowingBackExtra.visible = true;
    }
    //frontGlowingDisplay()
    //backGlowingDisplay()
  }

  setVisible(flag: boolean): void {
    console.log("set visible segment");
    //First turn off all parts
    this._frontPart.visible = false;
    this._glowingFrontPart.visible = false;
    this._frontExtra.visible = false;
    this._glowingFrontExtra.visible = false;
    this._backPart.visible = false;
    this._glowingBackPart.visible = false;
    this._backExtra.visible = false;
    this._glowingBackExtra.visible = false;
    // Then if making visible true, turn on the appropriate parts
    if (flag) {
      if (this._frontPartInUse) {
        this._frontPart.visible = true;
      }
      if (this._frontExtraInUse) {
        this._frontExtra.visible = true;
      }
      if (this._backPartInUse) {
        this._backPart.visible = true;
      }
      if (this._backExtraInUse) {
        this._backExtra.visible = true;
      }
    }
    // if (!flag) {
    //   this._frontPart.visible = false;
    //   this._glowingFrontPart.visible = false;
    //   this._frontExtra.visible = false;
    //   this._glowingFrontExtra.visible = false;
    //   this._backPart.visible = false;
    //   this._glowingBackPart.visible = false;
    //   this._backExtra.visible = false;
    //   this._glowingBackExtra.visible = false;
    // } else {
    //   this.normalDisplay();
    // }
  }

  setSelectedColoring(flag: boolean): void {
    //set the new colors into the variables
    if (flag) {
      this.glowingStrokeColorFront = SETTINGS.style.selectedColor.front;
      this.glowingStrokeColorBack = SETTINGS.style.selectedColor.back;
    } else {
      this.glowingStrokeColorFront = SETTINGS.segment.glowing.strokeColor.front;
      this.glowingStrokeColorBack = SETTINGS.segment.glowing.strokeColor.back;
    }
    // apply the new color variables to the object
    this.stylize(DisplayStyle.ApplyCurrentVariables);
  }

  /**
   * Clone the segment - We have to define our own clone() function
   * The builtin clone() does not seem to work correctly
   */
  clone(): this {
    // Create a new segment and copy all this's properties into it
    const dup = new Segment(this.name);
    //Copy name and start/end/mid/normal vectors
    dup._arcLength = this._arcLength;
    dup._startVector.copy(this._startVector);
    dup._normalVector.copy(this._normalVector);
    //Once arcLength, start Vector and normal Vector are set
    // call updateDisplay to set the rotation, half minor axis, and lots of other variables
    dup.updateDisplay();
    return dup as this;
  }

  addToLayers(layers: Group[]): void {
    this._frontPart.addTo(layers[LAYER.foreground]);
    this._frontExtra.addTo(layers[LAYER.foreground]);
    this._backPart.addTo(layers[LAYER.background]);
    this._backExtra.addTo(layers[LAYER.background]);
    this._glowingFrontPart.addTo(layers[LAYER.foregroundGlowing]);
    this._glowingFrontExtra.addTo(layers[LAYER.foregroundGlowing]);
    this._glowingBackPart.addTo(layers[LAYER.backgroundGlowing]);
    this._glowingBackExtra.addTo(layers[LAYER.backgroundGlowing]);
  }

  removeFromLayers(): void {
    this._frontPart.remove();
    this._frontExtra.remove();
    this._backPart.remove();
    this._backExtra.remove();
    this._glowingFrontPart.remove();
    this._glowingFrontExtra.remove();
    this._glowingBackPart.remove();
    this._glowingBackExtra.remove();
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleCategory): StyleOptions {
    switch (panel) {
      case StyleCategory.Front:
        return DEFAULT_SEGMENT_FRONT_STYLE;
      case StyleCategory.Back:
        return DEFAULT_SEGMENT_BACK_STYLE;
      default:
      case StyleCategory.Label: {
        return {};
      }
    }
  }
  /**
   * Sets the variables for stroke width glowing/not front/back/extra
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleCategory.Front);
    const backStyle = this.styleOptions.get(StyleCategory.Back);
    const frontStrokeWidthPercent = frontStyle?.strokeWidthPercent ?? 100;
    const backStrokeWidthPercent = backStyle?.strokeWidthPercent ?? 100;
    this._frontPart.linewidth =
      (Segment.currentSegmentStrokeWidthFront * frontStrokeWidthPercent) / 100;
    this._backPart.linewidth =
      (Segment.currentSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this._glowingFrontPart.linewidth =
      (Segment.currentGlowingSegmentStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;
    this._glowingBackPart.linewidth =
      (Segment.currentGlowingSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;

    this._frontExtra.linewidth =
      (Segment.currentSegmentStrokeWidthFront * frontStrokeWidthPercent) / 100;
    this._backExtra.linewidth =
      (Segment.currentSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
    this._glowingFrontExtra.linewidth =
      (Segment.currentGlowingSegmentStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;
    this._glowingBackExtra.linewidth =
      (Segment.currentGlowingSegmentStrokeWidthBack *
        (backStyle?.dynamicBackStyle
          ? Nodule.contrastStrokeWidthPercent(frontStrokeWidthPercent)
          : backStrokeWidthPercent)) /
      100;
  }
  /**
   * Set the rendering style (flags: ApplyTemporaryVariables, ApplyCurrentVariables) of the segment
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

        // FRONT PART
        // no fillColor
        this._frontPart.stroke = SETTINGS.segment.temp.strokeColor.front;
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this._frontPart.linewidth = Segment.currentSegmentStrokeWidthFront;

        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.segment.drawn.dashArray.front.length > 0) {
          this._frontPart.dashes.clear();
          SETTINGS.segment.drawn.dashArray.front.forEach(v => {
            this._frontPart.dashes.push(v);
          });
          if (SETTINGS.segment.drawn.dashArray.reverse.front) {
            this._frontPart.dashes.reverse();
          }
        }

        // FRONT EXTRA
        // no fillColor
        this._frontExtra.stroke = SETTINGS.segment.temp.strokeColor.front;
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this._frontExtra.linewidth = Segment.currentSegmentStrokeWidthFront;

        // Copy the front dash properties from the front default drawn dash properties
        if (SETTINGS.segment.drawn.dashArray.front.length > 0) {
          this._frontExtra.dashes.clear();
          SETTINGS.segment.drawn.dashArray.front.forEach(v => {
            this._frontExtra.dashes.push(v);
          });
          if (SETTINGS.segment.drawn.dashArray.reverse.front) {
            this._frontExtra.dashes.reverse();
          }
        }
        // BACK PART
        // no fill color
        this._backPart.stroke = SETTINGS.segment.temp.strokeColor.back;
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this._backPart.linewidth = Segment.currentSegmentStrokeWidthBack;

        // Copy the back dash properties from the back default drawn dash properties
        if (SETTINGS.segment.drawn.dashArray.back.length > 0) {
          this._backPart.dashes.clear();
          SETTINGS.segment.drawn.dashArray.back.forEach(v => {
            this._backPart.dashes.push(v);
          });
          if (SETTINGS.segment.drawn.dashArray.reverse.back) {
            this._backPart.dashes.reverse();
          }
        }
        // BACK EXTRA
        // no fill color
        this._backExtra.stroke = SETTINGS.segment.temp.strokeColor.back;
        // strokeWidthPercent -- The line width is set to the current line width (which is updated for zoom magnification)
        this._backExtra.linewidth = Segment.currentSegmentStrokeWidthBack;

        // Copy the back dash properties from the back default drawn dash properties
        if (SETTINGS.segment.drawn.dashArray.back.length > 0) {
          this._backExtra.dashes.clear();
          SETTINGS.segment.drawn.dashArray.back.forEach(v => {
            this._backExtra.dashes.push(v);
          });
          if (SETTINGS.segment.drawn.dashArray.reverse.back) {
            this._backExtra.dashes.reverse();
          }
        }

        // The temporary display is never highlighted
        this._glowingFrontPart.visible = false;
        this._glowingBackPart.visible = false;
        this._glowingFrontExtra.visible = false;
        this._glowingBackExtra.visible = false;
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the js objects.

        // FRONT PART
        const frontStyle = this.styleOptions.get(StyleCategory.Front);
        // no fillColor
        if (Nodule.hslaIsNoFillOrNoStroke(frontStyle?.strokeColor)) {
          this._frontPart.noStroke();
        } else {
          this._frontPart.stroke =
            frontStyle?.strokeColor ?? SETTINGS.segment.drawn.strokeColor.front;
        }
        // strokeWidthPercent applied by adjustSize()

        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle.dashArray.length > 0
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
        // FRONT EXTRA
        // no fillColor
        if (Nodule.hslaIsNoFillOrNoStroke(frontStyle?.strokeColor)) {
          this._frontExtra.noStroke();
        } else {
          this._frontExtra.stroke =
            frontStyle?.strokeColor ?? SETTINGS.segment.drawn.strokeColor.front;
        }
        // strokeWidthPercent applied by adjustSize()

        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle.dashArray.length > 0
        ) {
          this._frontExtra.dashes.clear();
          this._frontExtra.dashes.push(...frontStyle.dashArray);
          if (frontStyle.reverseDashArray) {
            this._frontExtra.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._frontExtra.dashes.clear();
          this._frontExtra.dashes.push(0);
        }

        // BACK PART
        const backStyle = this.styleOptions.get(StyleCategory.Back);
        // no fillColor

        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hslaIsNoFillOrNoStroke(
              Nodule.contrastStrokeColor(frontStyle?.strokeColor)
            )
          ) {
            this._backPart.noStroke();
          } else {
            this._backPart.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
          }
        } else {
          if (Nodule.hslaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this._backPart.noStroke();
          } else {
            this._backPart.stroke =
              backStyle?.strokeColor ?? SETTINGS.segment.drawn.strokeColor.back;
          }
        }
        // strokeWidthPercent applied by adjustSize()

        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
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
        // BACK EXTRA
        // no fillColor
        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hslaIsNoFillOrNoStroke(
              Nodule.contrastStrokeColor(frontStyle?.strokeColor)
            )
          ) {
            this._backExtra.noStroke();
          } else {
            this._backExtra.stroke = Nodule.contrastStrokeColor(
              frontStyle?.strokeColor ?? "black"
            );
          }
        } else {
          if (Nodule.hslaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this._backExtra.noStroke();
          } else {
            this._backExtra.stroke =
              backStyle?.strokeColor ?? SETTINGS.segment.drawn.strokeColor.back;
          }
        }
        // strokeWidthPercent applied by adjustSize()

        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this._backExtra.dashes.clear();
          this._backExtra.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this._backExtra.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._backExtra.dashes.clear();
          this._backExtra.dashes.push(0);
        }

        // UPDATE the glowing width so it is always bigger than the drawn width
        // Glowing Front
        // no fillColor
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
          if (frontStyle.reverseDashArray) {
            this._glowingFrontPart.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._glowingFrontPart.dashes.clear();
          this._glowingFrontPart.dashes.push(0);
        }

        // Glowing Front Extra
        // no fillColor
        this._glowingFrontExtra.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle.dashArray.length > 0
        ) {
          this._glowingFrontExtra.dashes.clear();
          this._glowingFrontExtra.dashes.push(...frontStyle.dashArray);
          if (frontStyle.reverseDashArray) {
            this._glowingFrontExtra.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._glowingFrontExtra.dashes.clear();
          this._glowingFrontExtra.dashes.push(0);
        }

        // Glowing Back
        // no fillColor
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

        // Glowing Back Extra
        // no fillColor
        this._glowingBackExtra.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this._glowingBackExtra.dashes.clear();
          this._glowingBackExtra.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this._glowingBackExtra.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this._glowingBackExtra.dashes.clear();
          this._glowingBackExtra.dashes.push(0);
        }

        break;
      }
    }
  }
}
