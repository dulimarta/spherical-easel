import {
  Vector3,
  Matrix4,
  PolarGridHelper,
  DynamicCopyUsage,
  DoubleSide
} from "three";
import Two, { Color } from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "./Nodule";
import {
  StyleOptions,
  StyleEditPanels,
  DEFAULT_SEGMENT_FRONT_STYLE,
  DEFAULT_SEGMENT_BACK_STYLE
} from "@/types/Styles";
import { ProjectedSegmentData, SegmentPosition } from "@/types";
import { SEStore } from "@/store";

// The number of vectors used to render the one part of the segment (like the frontPart, frontExtra, etc.)
const SUBDIVS = SETTINGS.segment.numPoints;
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
  /** The start vector of the segment on the unit Sphere*/
  public _endVector = new Vector3();

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

  /**
   *  This the data the describes the position of the segment.
   */
  private segmentData: ProjectedSegmentData = {
    tiltAngle: 0, // between -Pi/2 and pi/2, the angle between the line containing the major axis (after tilting) and the x axis
    minorAxis: 0, //half the minor diameter parallel to the y axis (prior to tilting)
    majorAxis: 0, //half the major diameter parallel to thee x axis (prior to tilting)
    position: SegmentPosition.ContainedEntirelyOnFront, // contained entirely in front/back or split
    frontStartAngle: 0, // To trace the part of the ellipse (the projected segment) that is on the front start with this angle and end with the other.
    frontEndAngle: 0,
    backStartAngle: 0, // To trace the part of the ellipse (the projected segment) that is on the back start with this angle and end with the other.
    backEndAngle: 0,
    frontExtraStartAngle: 0, // To trace the part of the ellipse (the projected segment) that is on the front extra (in the SplitFrontBackFront case) start with this angle and end with the other.
    frontExtraEndAngle: 0,
    backExtraStartAngle: 0, // To trace the part of the ellipse (the projected segment) that is on the back extra (in the SplitBackFrontBack case) start with this angle and end with the other.
    backExtraEndAngle: 0
  };

  /** Two values that help in polygon when tracing a collection of segments */
  private _firstVertexIsOnFront = false;
  private _lastVertexIsOnFront = false;

  /** A temporary matrix maps a segment in standard position to the current position so we can determine which points are on the back and which are on the front*/
  private transformMatrix = new Matrix4();

  /**
   * A line segment of length longer than \pi has two pieces on one face of the sphere (say the front)
   * and on piece on the other face of the sphere (say the back). This means that any line segment
   * can have two front parts or two back parts. The frontExtra and backExtra are variables to represent those
   * extra parts. There are glowing counterparts for each part.
   */
  private _frontPart: Two.Ellipse;
  private _frontExtra: Two.Ellipse;
  private _backPart: Two.Ellipse;
  private _backExtra: Two.Ellipse;
  private glowingFrontPart: Two.Ellipse;
  private glowingFrontExtra: Two.Ellipse;
  private glowingBackPart: Two.Ellipse;
  private glowingBackExtra: Two.Ellipse;

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

  // Temporary ThreeJS objects for computing
  private tmpMatrix = new Matrix4();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();
  private desiredXAxis = new Vector3();
  private desiredYAxis = new Vector3();

  /**
   * Create a plottable segment from three pieces of information: startVector, normalVector, arcLength
   * NOTE: normal x start gives the direction in which the segment is drawn
   */
  constructor() {
    // Initialize the Two.Group
    super();

    // Create parts segment

    this._frontPart = new Two.Ellipse(0, 0, 50, 50, SETTINGS.segment.numPoints);
    // Create the other parts cloning the front part
    this.glowingFrontPart = new Two.Ellipse(
      0,
      0,
      50,
      100,
      SETTINGS.segment.numPoints
    );
    this._frontExtra = new Two.Ellipse(
      0,
      0,
      100,
      100,
      SETTINGS.segment.numPoints
    );
    this.glowingFrontExtra = new Two.Ellipse(
      0,
      0,
      50,
      100,
      SETTINGS.segment.numPoints
    );
    this._backPart = new Two.Ellipse(0, 0, 50, 100, SETTINGS.segment.numPoints);
    this.glowingBackPart = new Two.Ellipse(
      0,
      0,
      150,
      150,
      SETTINGS.segment.numPoints
    );
    this._backExtra = new Two.Ellipse(
      0,
      0,
      200,
      200,
      SETTINGS.segment.numPoints
    );
    this.glowingBackExtra = new Two.Ellipse(
      0,
      0,
      50,
      100,
      SETTINGS.segment.numPoints
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

    // Set the style that never changes -- Fill and closed
    this._frontPart.noFill();
    this.glowingFrontPart.noFill();
    this._backPart.noFill();
    this.glowingBackPart.noFill();
    this._frontExtra.noFill();
    this.glowingFrontExtra.noFill();
    this._backExtra.noFill();
    this.glowingBackExtra.noFill();

    this._frontPart.closed = false;
    this.glowingFrontPart.closed = false;
    this._backPart.closed = false;
    this.glowingBackPart.closed = false;
    this._frontExtra.closed = false;
    this.glowingFrontExtra.closed = false;
    this._backExtra.closed = false;
    this.glowingBackExtra.closed = false;

    this.styleOptions.set(StyleEditPanels.Front, DEFAULT_SEGMENT_FRONT_STYLE);
    this.styleOptions.set(StyleEditPanels.Back, DEFAULT_SEGMENT_BACK_STYLE);
  }

  frontGlowingDisplay(): void {
    const layers = SEStore.layers;
    if (this.segmentData.position === SegmentPosition.SplitFrontBackFront) {
      this._frontPart.addTo(layers[LAYER.foreground]);
      this.glowingFrontPart.addTo(layers[LAYER.foregroundGlowing]);
      this._frontExtra.addTo(layers[LAYER.foreground]);
      this.glowingFrontExtra.addTo(layers[LAYER.foregroundGlowing]);
    } else if (
      this.segmentData.position === SegmentPosition.SplitBackFrontBack ||
      this.segmentData.position === SegmentPosition.ContainedEntirelyOnFront ||
      this.segmentData.position === SegmentPosition.SplitFrontToBack ||
      this.segmentData.position === SegmentPosition.SplitBackToFront
    ) {
      this._frontPart.addTo(layers[LAYER.foreground]);
      this.glowingFrontPart.addTo(layers[LAYER.foregroundGlowing]);
      this._frontExtra.remove();
      this.glowingFrontExtra.remove();
    } else {
      // contained entirely on the back
      this._frontPart.remove();
      this.glowingFrontPart.remove();
      this._frontExtra.remove();
      this.glowingFrontExtra.remove();
    }
  }

  backGlowingDisplay(): void {
    const layers = SEStore.layers;
    if (this.segmentData.position === SegmentPosition.SplitBackFrontBack) {
      this._backPart.addTo(layers[LAYER.background]);
      this.glowingBackPart.addTo(layers[LAYER.backgroundGlowing]);
      this._backExtra.addTo(layers[LAYER.background]);
      this.glowingBackExtra.addTo(layers[LAYER.backgroundGlowing]);
    } else if (
      this.segmentData.position === SegmentPosition.SplitFrontBackFront ||
      this.segmentData.position === SegmentPosition.ContainedEntirelyOnBack ||
      this.segmentData.position === SegmentPosition.SplitFrontToBack ||
      this.segmentData.position === SegmentPosition.SplitBackToFront
    ) {
      this._backPart.addTo(layers[LAYER.background]);
      this.glowingBackPart.addTo(layers[LAYER.backgroundGlowing]);
      this._backExtra.remove();
      this.glowingBackExtra.remove();
    } else {
      // contained entirely on the front
      this._backPart.remove();
      this.glowingBackPart.remove();
      this._backExtra.remove();
      this.glowingBackExtra.remove();
    }
  }

  backNormalDisplay(): void {
    const layers = SEStore.layers;
    if (this.segmentData.position === SegmentPosition.SplitBackFrontBack) {
      this._backPart.addTo(layers[LAYER.background]);
      this.glowingBackPart.remove();
      this._backExtra.addTo(layers[LAYER.background]);
      this.glowingBackExtra.remove();
    } else if (
      this.segmentData.position === SegmentPosition.SplitFrontBackFront ||
      this.segmentData.position === SegmentPosition.ContainedEntirelyOnBack ||
      this.segmentData.position === SegmentPosition.SplitFrontToBack ||
      this.segmentData.position === SegmentPosition.SplitBackToFront
    ) {
      this._backPart.addTo(layers[LAYER.background]);
      this.glowingBackPart.remove();
      this._backExtra.remove();
      this.glowingBackExtra.remove();
    } else {
      // contained entirely on the front
      this._backPart.remove();
      this.glowingBackPart.remove();
      this._backExtra.remove();
      this.glowingBackExtra.remove();
    }
  }

  frontNormalDisplay(): void {
    const layers = SEStore.layers;
    if (this.segmentData.position === SegmentPosition.SplitFrontBackFront) {
      this._frontPart.addTo(layers[LAYER.foreground]);
      this.glowingFrontPart.remove();
      this._frontExtra.addTo(layers[LAYER.foreground]);
      this.glowingFrontExtra.remove();
    } else if (
      this.segmentData.position === SegmentPosition.SplitBackFrontBack ||
      this.segmentData.position === SegmentPosition.ContainedEntirelyOnFront ||
      this.segmentData.position === SegmentPosition.SplitFrontToBack ||
      this.segmentData.position === SegmentPosition.SplitBackToFront
    ) {
      this._frontPart.addTo(layers[LAYER.foreground]);
      this.glowingFrontPart.remove();
      this._frontExtra.remove();
      this.glowingFrontExtra.remove();
    } else {
      // contained entirely on the back
      this._frontPart.remove();
      this.glowingFrontPart.remove();
      this._frontExtra.remove();
      this.glowingFrontExtra.remove();
    }
  }

  normalDisplay(): void {
    this.frontNormalDisplay();
    this.backNormalDisplay();
  }

  glowingDisplay(): void {
    this.frontGlowingDisplay();
    this.backGlowingDisplay();
  }

  /**
   * Reorient the unit circle in 3D and then project the points to 2D
   * This method updates the TwoJS objects (frontPart, frontExtra, ...) for display
   * This is only accurate if the normal, start, arcLength are correct so only
   * call this method once those vectors are updated.
   */
  public updateDisplay(): void {
    const projectedSegmentData = Nodule.projectedCircleData(
      this._normalVector, // When the radius is pi/2, either normal vector (ie. multiply this one by -1) will result in the same data
      Math.PI / 2 // the radius of a line is always Pi/2
    );
    this.segmentData.majorAxis = projectedSegmentData.majorAxis;
    this.segmentData.minorAxis = projectedSegmentData.minorAxis;
    this.segmentData.tiltAngle = projectedSegmentData.tiltAngle;

    // no need to update the center of the ellipse because for segments it is always (0,0)

    // Set some variables that are helpful when drawing polygons
    if (this._startVector.z > 0) {
      this._firstVertexIsOnFront = true;
    } else {
      this._firstVertexIsOnFront = false;
    }
    if (this._endVector.z > 0) {
      this._lastVertexIsOnFront = true;
    } else {
      this._lastVertexIsOnFront = false;
    }

    // Set the segmentPosition of the segment and determine the angles for each part
    const startAngle = (
      Math.atan2(this._startVector.y, this._startVector.x) -
      projectedSegmentData.tiltAngle
    ).modTwoPi();
    const endAngle = (
      Math.atan2(this._endVector.y, this._endVector.x) -
      projectedSegmentData.tiltAngle
    ).modTwoPi();
    const startAnglePercent = Nodule.convertEllipseAngleToPercent(
      this.segmentData.minorAxis,
      this.segmentData.majorAxis,
      startAngle
    );
    const endAnglePercent = Nodule.convertEllipseAngleToPercent(
      this.segmentData.minorAxis,
      this.segmentData.majorAxis,
      endAngle
    );

    // Convert angles to percents
    let frontPartStart = 0;
    let frontPartEnd = 0;
    let backPartStart = 0;
    let backPartEnd = 0;
    let frontExtraStart = 0;
    let frontExtraEnd = 0;
    let backExtraStart = 0;
    let backExtraEnd = 0;

    if (this._firstVertexIsOnFront && this._lastVertexIsOnFront) {
      if (this._arcLength > Math.PI) {
        this.segmentData.position = SegmentPosition.SplitFrontBackFront;
        if (projectedSegmentData.frontStartAngle < SETTINGS.tolerance) {
          // the entire front is from 0 and pi and the back is from pi to 2pi
          this.segmentData.frontStartAngle = 0;
          frontPartStart = 0;

          this.segmentData.frontEndAngle =
            startAngle < endAngle ? startAngle : endAngle;
          frontPartEnd =
            startAngle < endAngle ? startAnglePercent : endAnglePercent;

          this.segmentData.frontExtraStartAngle =
            startAngle < endAngle ? endAngle : startAngle;
          frontExtraStart =
            startAngle < endAngle ? endAnglePercent : startAnglePercent;
          this.segmentData.frontEndAngle = Math.PI;
          frontExtraEnd = 0.5;

          this.segmentData.backStartAngle = Math.PI;
          backPartStart = 0.5;
          this.segmentData.backEndAngle = 2 * Math.PI;
          backPartEnd = 1.0;
        } else {
          // the entire back is from 0 and pi and the front is from pi to 2pi
          this.segmentData.backStartAngle = 0;
          backPartStart = 0;

          this.segmentData.backEndAngle = Math.PI;
          backPartEnd = 0.5;

          this.segmentData.frontStartAngle = Math.PI;
          frontPartStart = 0.5;

          this.segmentData.frontEndAngle =
            startAngle < endAngle ? startAngle : endAngle;
          frontPartEnd =
            startAngle < endAngle ? startAnglePercent : endAnglePercent;

          this.segmentData.frontExtraStartAngle =
            startAngle < endAngle ? endAngle : startAngle;
          frontExtraStart =
            startAngle < endAngle ? endAnglePercent : startAnglePercent;

          this.segmentData.frontEndAngle = 2 * Math.PI;
          frontExtraEnd = 1.0;
        }
      } else {
        this.segmentData.position = SegmentPosition.ContainedEntirelyOnFront;

        this.segmentData.frontStartAngle =
          startAngle < endAngle ? startAngle : endAngle;
        frontPartStart =
          startAngle < endAngle ? startAnglePercent : endAnglePercent;

        this.segmentData.frontEndAngle =
          startAngle < endAngle ? endAngle : startAngle;
        frontPartEnd =
          startAngle < endAngle ? endAnglePercent : startAnglePercent;
      }
    } else if (!this._firstVertexIsOnFront && !this._lastVertexIsOnFront) {
      if (this._arcLength > Math.PI) {
        this.segmentData.position = SegmentPosition.SplitBackFrontBack;
        if (projectedSegmentData.frontStartAngle < SETTINGS.tolerance) {
          // the entire front is from 0 and pi and the back is from pi to 2pi
          this.segmentData.frontStartAngle = 0;
          frontPartStart = 0;

          this.segmentData.frontEndAngle = Math.PI;
          frontPartEnd = 0.5;

          this.segmentData.backExtraStartAngle = Math.PI;
          backExtraStart = 0.5;

          this.segmentData.backExtraEndAngle =
            startAngle < endAngle ? startAngle : endAngle;
          backExtraEnd =
            startAngle < endAngle ? startAnglePercent : endAnglePercent;

          this.segmentData.backStartAngle =
            startAngle < endAngle ? endAngle : startAngle;
          backPartStart =
            startAngle < endAngle ? endAnglePercent : startAnglePercent;

          this.segmentData.backEndAngle = 2 * Math.PI;
          backPartEnd = 1.0;
        } else {
          // the entire back is from 0 and pi and the front is from pi to 2pi
          this.segmentData.frontStartAngle = Math.PI;
          frontPartStart = 0.5;

          this.segmentData.frontEndAngle = 2 * Math.PI;
          frontPartEnd = 1.0;

          this.segmentData.backExtraStartAngle = 0;
          backExtraStart = 0;

          this.segmentData.backExtraEndAngle =
            startAngle < endAngle ? startAngle : endAngle;
          backExtraEnd =
            startAngle < endAngle ? startAnglePercent : endAnglePercent;

          this.segmentData.backStartAngle =
            startAngle < endAngle ? endAngle : startAngle;
          backPartStart =
            startAngle < endAngle ? endAnglePercent : startAnglePercent;

          this.segmentData.backEndAngle = Math.PI;
          backPartEnd = 0.5;
        }
      } else {
        this.segmentData.position = SegmentPosition.ContainedEntirelyOnBack;

        this.segmentData.backStartAngle =
          startAngle < endAngle ? startAngle : endAngle;
        backPartStart =
          startAngle < endAngle ? startAnglePercent : endAnglePercent;

        this.segmentData.backEndAngle =
          startAngle < endAngle ? endAngle : startAngle;
        backPartEnd =
          startAngle < endAngle ? endAnglePercent : startAnglePercent;
      }
    } else {
      // Is the point at angle 0 or Pi on the segment?
      //NOTE: tmpVector1 = (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
      // gives the direction in which the segment is drawn
      this.tmpVector1
        .crossVectors(this._normalVector, this._startVector)
        .multiplyScalar(this._arcLength > Math.PI ? -1 : 1);
      // cos(arcLength/4)*startVector + sin(arcLength/4)* tmpVector1 is  point on the segment 1/4 of the way along it
      // Find the angle of this point in the project ellipse
      this.tmpVector1.multiplyScalar(Math.sin(this._arcLength / 4));
      this.tmpVector1.addScaledVector(
        this._startVector,
        Math.cos(this._arcLength / 4)
      );

      const quarterVectorIsOnFront = this.tmpVector1.z > 0;
      const quarterAngle = (
        Math.atan2(this.tmpVector1.y, this.tmpVector1.x) -
        projectedSegmentData.tiltAngle
      ).modTwoPi();
      if (this._firstVertexIsOnFront && !this._lastVertexIsOnFront) {
        this.segmentData.position = SegmentPosition.SplitFrontToBack;

        if (projectedSegmentData.frontStartAngle < SETTINGS.tolerance) {
          // the entire front is from 0 and pi and the back is from pi to 2pi
          if (
            (quarterVectorIsOnFront && startAngle < quarterAngle) ||
            (!quarterVectorIsOnFront && quarterAngle < endAngle)
          ) {
            // Region #1 on SegmentCasesEllipseRewrite
            this.segmentData.frontStartAngle = startAngle;
            frontPartStart = startAnglePercent;

            this.segmentData.frontEndAngle = Math.PI;
            frontPartEnd = 0.5;

            this.segmentData.backStartAngle = Math.PI;
            backPartStart = 0.5;

            this.segmentData.backEndAngle = endAngle;
            backPartEnd = endAnglePercent;
          } else {
            // Region #2 on SegmentCasesEllipseRewrite
            this.segmentData.frontStartAngle = 0;
            frontPartStart = 0;

            this.segmentData.frontEndAngle = startAngle;
            frontPartEnd = startAnglePercent;

            this.segmentData.backStartAngle = endAngle;
            backPartStart = endAnglePercent;

            this.segmentData.backEndAngle = 2 * Math.PI;
            backPartEnd = 1.0;
          }
        } else {
          // the entire back is from 0 and pi and the front is from pi to 2pi
          if (
            (quarterVectorIsOnFront && quarterAngle < startAngle) ||
            (!quarterVectorIsOnFront && endAngle < quarterAngle)
          ) {
            // Region #3 on SegmentCasesEllipseRewrite
            this.segmentData.frontStartAngle = Math.PI;
            frontPartStart = 0.5;

            this.segmentData.frontEndAngle = startAngle;
            frontPartEnd = startAnglePercent;

            this.segmentData.backStartAngle = endAngle;
            backPartStart = endAnglePercent;

            this.segmentData.backEndAngle = Math.PI;
            backPartEnd = 0.5;
          } else {
            // Region #4 on SegmentCasesEllipseRewrite
            this.segmentData.frontStartAngle = startAngle;
            frontPartStart = startAnglePercent;

            this.segmentData.frontEndAngle = 2 * Math.PI;
            frontPartEnd = 1.0;

            this.segmentData.backStartAngle = 0;
            backPartStart = 0;

            this.segmentData.backEndAngle = endAngle;
            backPartEnd = endAnglePercent;
          }
        }
      } else {
        this.segmentData.position = SegmentPosition.SplitBackToFront;
        if (projectedSegmentData.frontStartAngle < SETTINGS.tolerance) {
          // the entire front is from 0 and pi and the back is from pi to 2pi
          if (
            (!quarterVectorIsOnFront && quarterAngle < startAngle) ||
            (quarterVectorIsOnFront && endAngle < quarterAngle)
          ) {
            // Region #5 on SegmentCasesEllipseRewrite
            this.segmentData.frontStartAngle = endAngle;
            frontPartStart = endAnglePercent;

            this.segmentData.frontEndAngle = Math.PI;
            frontPartEnd = 0.5;

            this.segmentData.backStartAngle = Math.PI;
            backPartStart = 0.5;

            this.segmentData.backEndAngle = startAngle;
            backPartEnd = startAnglePercent;
          } else {
            // Region #6 on SegmentCasesEllipseRewrite
            this.segmentData.frontStartAngle = 0;
            frontPartStart = 0;

            this.segmentData.frontEndAngle = endAngle;
            frontPartEnd = endAnglePercent;

            this.segmentData.backStartAngle = startAngle;
            backPartStart = startAnglePercent;

            this.segmentData.backEndAngle = 2 * Math.PI;
            backPartEnd = 1.0;
          }
        } else {
          // the entire back is from 0 and pi and the front is from pi to 2pi
          if (
            (!quarterVectorIsOnFront && startAngle < quarterAngle) ||
            (quarterVectorIsOnFront && quarterAngle < endAngle)
          ) {
            // Region #7 on SegmentCasesEllipseRewrite
            this.segmentData.backStartAngle = startAngle;
            backPartStart = startAnglePercent;

            this.segmentData.backEndAngle = Math.PI;
            backPartEnd = 0.5;

            this.segmentData.frontStartAngle = Math.PI;
            frontPartStart = 0.5;

            this.segmentData.frontEndAngle = endAngle;
            frontPartEnd = endAnglePercent;
          } else {
            // Region #8 on SegmentCasesEllipseRewrite
            this.segmentData.backStartAngle = 0;
            backPartStart = 0;

            this.segmentData.backEndAngle = startAngle;
            backPartEnd = startAnglePercent;

            this.segmentData.frontStartAngle = endAngle;
            frontPartStart = endAnglePercent;

            this.segmentData.frontEndAngle = 2 * Math.PI;
            frontPartEnd = 1.0;
          }
        }
      }
    }

    if (this.segmentData.position !== SegmentPosition.ContainedEntirelyOnBack) {
      this._frontPart.width = 2 * projectedSegmentData.majorAxis;
      this._frontPart.height = 2 * projectedSegmentData.minorAxis;
      this._frontPart.beginning = frontPartStart;
      this._frontPart.ending = frontPartEnd;
      this._frontPart.rotation = projectedSegmentData.tiltAngle;

      this.glowingFrontPart.width = 2 * projectedSegmentData.majorAxis;
      this.glowingFrontPart.height = 2 * projectedSegmentData.minorAxis;
      this.glowingFrontPart.beginning = frontPartStart;
      this.glowingFrontPart.ending = frontPartEnd;
      this.glowingFrontPart.rotation = projectedSegmentData.tiltAngle;
    }
    if (this.segmentData.position === SegmentPosition.SplitFrontBackFront) {
      this._frontExtra.width = 2 * projectedSegmentData.majorAxis;
      this._frontExtra.height = 2 * projectedSegmentData.minorAxis;
      this._frontExtra.beginning = frontExtraStart;
      this._frontExtra.ending = frontExtraEnd;
      this._frontExtra.rotation = projectedSegmentData.tiltAngle;

      this.glowingFrontExtra.width = 2 * projectedSegmentData.majorAxis;
      this.glowingFrontExtra.height = 2 * projectedSegmentData.minorAxis;
      this.glowingFrontExtra.beginning = frontExtraStart;
      this.glowingFrontExtra.ending = frontExtraEnd;
      this.glowingFrontExtra.rotation = projectedSegmentData.tiltAngle;
    }
    if (
      this.segmentData.position !== SegmentPosition.ContainedEntirelyOnFront
    ) {
      this._backPart.width = 2 * projectedSegmentData.majorAxis;
      this._backPart.height = 2 * projectedSegmentData.minorAxis;
      this._backPart.beginning = backPartStart;
      this._backPart.ending = backPartEnd;
      this._backPart.rotation = projectedSegmentData.tiltAngle;

      this.glowingBackPart.width = 2 * projectedSegmentData.majorAxis;
      this.glowingBackPart.height = 2 * projectedSegmentData.minorAxis;
      this.glowingBackPart.beginning = backPartStart;
      this.glowingBackPart.ending = backPartEnd;
      this.glowingBackPart.rotation = projectedSegmentData.tiltAngle;
    }
    if (this.segmentData.position === SegmentPosition.SplitBackFrontBack) {
      this._backExtra.width = 2 * projectedSegmentData.majorAxis;
      this._backExtra.height = 2 * projectedSegmentData.minorAxis;
      this._backExtra.beginning = backExtraStart;
      this._backExtra.ending = backExtraEnd;
      this._backExtra.rotation = projectedSegmentData.tiltAngle;

      this.glowingBackExtra.width = 2 * projectedSegmentData.majorAxis;
      this.glowingBackExtra.height = 2 * projectedSegmentData.minorAxis;
      this.glowingBackExtra.beginning = backExtraStart;
      this.glowingBackExtra.ending = backExtraEnd;
      this.glowingBackExtra.rotation = projectedSegmentData.tiltAngle;
    }
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
   * Set the unit vector that is the start of the segment. The start and normal and end
   * vector and arcLength must be correctly set before calling the updateDisplay() method on this segment.
   * NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
   *  gives the direction in which the segment is drawn
   */
  set startVector(idealUnitStartVector: Vector3) {
    this._startVector.copy(idealUnitStartVector).normalize();
  }

  /**
   * Set the unit vector that is the end of the segment. The start and normal and end
   * vector and arcLength must be correctly set before calling the updateDisplay() method on this segment.
   * NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
   *  gives the direction in which the segment is drawn
   */
  set endVector(idealUnitStartVector: Vector3) {
    this._endVector.copy(idealUnitStartVector).normalize();
  }

  /**
   * Set the unit vector that is the normal of the segment. The start and normal and end
   * vector and arcLength must be correctly set before calling the updateDisplay() method on this segment.
   * NOTE: (normalVector x startVector)*(this._arcLength > Math.PI ? -1 : 1)
   *  gives the direction in which the segment is drawn
   */
  set normalVector(idealUnitNormalVector: Vector3) {
    this._normalVector.copy(idealUnitNormalVector).normalize();
  }

  get frontPart(): Two.Path {
    return this._frontPart;
  }
  get backPart(): Two.Path {
    return this._backPart;
  }
  get frontPartExtra(): Two.Path {
    return this._frontExtra;
  }
  get backPartExtra(): Two.Path {
    return this._backExtra;
  }
  get firstVertexIsOnFront(): boolean {
    return this._firstVertexIsOnFront;
  }
  get lastVertexIsOnFront(): boolean {
    return this._lastVertexIsOnFront;
  }

  lengthOfFrontPartDisplayed(): number {
    if (this.segmentData.position !== SegmentPosition.ContainedEntirelyOnBack) {
      return this._frontPart.renderer.vertices.length;
    } else {
      return 0;
    }
  }

  lengthOfBackPartDisplayed(): number {
    if (
      this.segmentData.position !== SegmentPosition.ContainedEntirelyOnFront
    ) {
      return this._backPart.renderer.vertices.length;
    } else {
      return 0;
    }
  }

  lengthOfFrontExtraDisplayed(): number {
    if (this.segmentData.position === SegmentPosition.SplitFrontBackFront) {
      return this._frontExtra.renderer.vertices.length;
    } else {
      return 0;
    }
  }

  lengthOfBackExtraDisplayed(): number {
    if (this.segmentData.position === SegmentPosition.SplitBackFrontBack) {
      return this._backExtra.renderer.vertices.length;
    } else {
      return 0;
    }
  }

  setVisible(flag: boolean): void {
    if (!flag) {
      this._frontPart.remove();
      this.glowingFrontPart.remove();
      this._frontExtra.remove();
      this.glowingFrontExtra.remove();
      this._backPart.remove();
      this.glowingBackPart.remove();
      this._backExtra.remove();
      this.glowingBackExtra.remove();
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
    const dup = new Segment();
    //Copy arcLength and start/end/normal vectors
    dup._arcLength = this._arcLength;
    dup._startVector.copy(this._startVector);
    dup._normalVector.copy(this._normalVector);
    dup._endVector.copy(this._endVector);

    // copy the segment data
    dup.segmentData.frontStartAngle = this.segmentData.frontStartAngle;
    dup.segmentData.frontEndAngle = this.segmentData.frontEndAngle;
    dup.segmentData.frontExtraEndAngle = this.segmentData.frontExtraEndAngle;
    dup.segmentData.frontExtraStartAngle =
      this.segmentData.frontExtraStartAngle;

    dup.segmentData.backStartAngle = this.segmentData.backStartAngle;
    dup.segmentData.backEndAngle = this.segmentData.backEndAngle;
    dup.segmentData.backExtraEndAngle = this.segmentData.backExtraEndAngle;
    dup.segmentData.backExtraStartAngle = this.segmentData.backExtraStartAngle;

    dup.segmentData.majorAxis = this.segmentData.majorAxis;
    dup.segmentData.minorAxis = this.segmentData.minorAxis;
    dup.segmentData.tiltAngle = this.segmentData.tiltAngle;
    dup.segmentData.position = this.segmentData.position;

    // no need to copy the center, it is always (0,0)

    dup._frontPart.rotation = this._frontPart.rotation;
    dup._frontPart.width = this._frontPart.width;
    dup._frontPart.height = this._frontPart.height;
    dup._frontPart.beginning = this._frontPart.beginning;
    dup._frontPart.ending = this._frontPart.ending;
    dup._frontPart.visible = this._frontPart.visible;

    dup.glowingFrontPart.rotation = this.glowingFrontPart.rotation;
    dup.glowingFrontPart.width = this.glowingFrontPart.width;
    dup.glowingFrontPart.height = this.glowingFrontPart.height;
    dup.glowingFrontPart.beginning = this.glowingFrontPart.beginning;
    dup.glowingFrontPart.ending = this.glowingFrontPart.ending;
    dup.glowingFrontPart.remove();

    dup._frontExtra.rotation = this._frontExtra.rotation;
    dup._frontExtra.width = this._frontExtra.width;
    dup._frontExtra.height = this._frontExtra.height;
    dup._frontExtra.beginning = this._frontExtra.beginning;
    dup._frontExtra.ending = this._frontExtra.ending;
    dup._frontExtra.visible = this._frontExtra.visible;

    dup.glowingFrontExtra.rotation = this.glowingFrontExtra.rotation;
    dup.glowingFrontExtra.width = this.glowingFrontExtra.width;
    dup.glowingFrontExtra.height = this.glowingFrontExtra.height;
    dup.glowingFrontExtra.beginning = this.glowingFrontExtra.beginning;
    dup.glowingFrontExtra.ending = this.glowingFrontExtra.ending;
    dup.glowingFrontExtra.remove();

    dup._backPart.rotation = this._backPart.rotation;
    dup._backPart.width = this._backPart.width;
    dup._backPart.height = this._backPart.height;
    dup._backPart.beginning = this._backPart.beginning;
    dup._backPart.ending = this._backPart.ending;
    dup._backPart.visible = this._backPart.visible;

    dup.glowingBackPart.rotation = this.glowingBackPart.rotation;
    dup.glowingBackPart.width = this.glowingBackPart.width;
    dup.glowingBackPart.height = this.glowingBackPart.height;
    dup.glowingBackPart.beginning = this.glowingBackPart.beginning;
    dup.glowingBackPart.ending = this.glowingBackPart.ending;
    dup.glowingBackPart.remove();

    dup._backExtra.rotation = this._backExtra.rotation;
    dup._backExtra.width = this._backExtra.width;
    dup._backExtra.height = this._backExtra.height;
    dup._backExtra.beginning = this._backExtra.beginning;
    dup._backExtra.ending = this._backExtra.ending;
    dup._backExtra.visible = this._backExtra.visible;

    dup.glowingBackExtra.rotation = this.glowingBackExtra.rotation;
    dup.glowingBackExtra.width = this.glowingBackExtra.width;
    dup.glowingBackExtra.height = this.glowingBackExtra.height;
    dup.glowingBackExtra.beginning = this.glowingBackExtra.beginning;
    dup.glowingBackExtra.ending = this.glowingBackExtra.ending;
    dup.glowingBackExtra.remove();

    return dup as this;
  }

  removeAllPartsFromLayers(): void {
    this._frontPart.remove();
    this._frontExtra.remove();
    this._backPart.remove();
    this._backExtra.remove();
    this.glowingFrontPart.remove();
    this.glowingFrontExtra.remove();
    this.glowingBackPart.remove();
    this.glowingBackExtra.remove();
  }

  /**
   * Return the default style state
   */
  defaultStyleState(panel: StyleEditPanels): StyleOptions {
    switch (panel) {
      case StyleEditPanels.Front:
        return DEFAULT_SEGMENT_FRONT_STYLE;
      case StyleEditPanels.Back:
        return DEFAULT_SEGMENT_BACK_STYLE;
      default:
      case StyleEditPanels.Label: {
        return {};
      }
    }
  }
  /**
   * Sets the variables for stroke width glowing/not front/back/extra
   */
  adjustSize(): void {
    const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
    const backStyle = this.styleOptions.get(StyleEditPanels.Back);
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
    this.glowingFrontPart.linewidth =
      (Segment.currentGlowingSegmentStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;
    this.glowingBackPart.linewidth =
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
    this.glowingFrontExtra.linewidth =
      (Segment.currentGlowingSegmentStrokeWidthFront *
        frontStrokeWidthPercent) /
      100;
    this.glowingBackExtra.linewidth =
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
   *    1) The temporary variables from SETTINGS.point.temp are copied into the actual Two.js objects
   *    2) The pointScaleFactor is copied from the Point.pointScaleFactor (which accounts for the Zoom magnification) into the actual Two.js objects
   *
   * Apply CurrentVariables means that all current values of the private style variables are copied into the actual Two.js objects
   */
  stylize(flag: DisplayStyle): void {
    switch (flag) {
      case DisplayStyle.ApplyTemporaryVariables: {
        // Use the SETTINGS temporary options to directly modify the Two.js objects.

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
        this.glowingFrontPart.remove();
        this.glowingBackPart.remove();
        this.glowingFrontExtra.remove();
        this.glowingBackExtra.remove();
        break;
      }

      case DisplayStyle.ApplyCurrentVariables: {
        // Use the current variables to directly modify the Two.js objects.

        // FRONT PART
        const frontStyle = this.styleOptions.get(StyleEditPanels.Front);
        // no fillColor
        if (Nodule.hlsaIsNoFillOrNoStroke(frontStyle?.strokeColor)) {
          this._frontPart.noStroke();
        } else {
          this._frontPart.stroke = frontStyle?.strokeColor as Two.Color;
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
        if (Nodule.hlsaIsNoFillOrNoStroke(frontStyle?.strokeColor)) {
          this._frontExtra.noStroke();
        } else {
          this._frontExtra.stroke = frontStyle?.strokeColor as Two.Color;
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
        const backStyle = this.styleOptions.get(StyleEditPanels.Back);
        // no fillColor

        if (backStyle?.dynamicBackStyle) {
          if (
            Nodule.hlsaIsNoFillOrNoStroke(
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
          if (Nodule.hlsaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this._backPart.noStroke();
          } else {
            this._backPart.stroke = backStyle?.strokeColor as Two.Color;
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
            Nodule.hlsaIsNoFillOrNoStroke(
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
          if (Nodule.hlsaIsNoFillOrNoStroke(backStyle?.strokeColor)) {
            this._backExtra.noStroke();
          } else {
            this._backExtra.stroke = backStyle?.strokeColor as Two.Color;
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

        // Glowing Front Extra
        // no fillColor
        this.glowingFrontExtra.stroke = this.glowingStrokeColorFront;
        // strokeWidthPercent applied by adjustSize()

        // Copy the front dash properties to the glowing object
        if (
          frontStyle?.dashArray &&
          frontStyle?.reverseDashArray !== undefined &&
          frontStyle.dashArray.length > 0
        ) {
          this.glowingFrontExtra.dashes.clear();
          this.glowingFrontExtra.dashes.push(...frontStyle.dashArray);
          if (frontStyle.reverseDashArray) {
            this.glowingFrontExtra.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.glowingFrontExtra.dashes.clear();
          this.glowingFrontExtra.dashes.push(0);
        }

        // Glowing Back
        // no fillColor
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

        // Glowing Back Extra
        // no fillColor
        this.glowingBackExtra.stroke = this.glowingStrokeColorBack;
        // strokeWidthPercent applied by adjustSize()

        // Copy the back dash properties to the glowing object
        if (
          backStyle?.dashArray &&
          backStyle?.reverseDashArray !== undefined &&
          backStyle.dashArray.length > 0
        ) {
          this.glowingBackExtra.dashes.clear();
          this.glowingBackExtra.dashes.push(...backStyle.dashArray);
          if (backStyle.reverseDashArray) {
            this.glowingBackExtra.dashes.reverse();
          }
        } else {
          // the array length is zero and no dash array should be set
          this.glowingBackExtra.dashes.clear();
          this.glowingBackExtra.dashes.push(0);
        }

        break;
      }
    }
  }
}
