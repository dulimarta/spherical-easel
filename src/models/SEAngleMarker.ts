import { SEExpression } from "./SEExpression";
import { SEPoint } from "./SEPoint";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
import AngleMarker from "@/plottables/AngleMarker";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { ObjectState } from "@/types";
import SETTINGS from "@/global-settings";
import {
  DEFAULT_ANGLE_MARKER_BACK_STYLE,
  DEFAULT_ANGLE_MARKER_FRONT_STYLE
} from "@/types/Styles";
import { Labelable } from "@/types";
import { SELabel } from "@/models/SELabel";
import { SEStore } from "@/store";
import { AngleMode } from "@/types";
import i18n from "@/i18n";

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_ANGLE_MARKER_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_ANGLE_MARKER_BACK_STYLE)
]);

export class SEAngleMarker extends SEExpression
  implements Visitable, Labelable {
  /**
   * The plottable (TwoJS) AngleMarker associated with this model AngleMarker
   */
  public ref: AngleMarker;
  /**
   * Pointer to the label of this SEAngleMarker
   */
  public label?: SELabel;
  /**
   * The model SE object that is the first parent of this angle marker (line, line segment, point). This is never undefined.
   */
  private _firstSEParent: SELine | SESegment | SEPoint;

  /**
   * The model SE object that is the second parent of this angle marker (line, line segment, point). This is never undefined.
   */
  private _secondSEParent: SELine | SESegment | SEPoint;

  /**
   * The model SE object that is the third parent of this angle marker (point or undefined). This is undefined when the two other
   * parents are both lines or both line segments.
   */
  private _thirdSEParent: SEPoint | undefined = undefined;

  // The type of SENodules that make up the angle
  private mode = AngleMode.NONE;

  /**
   * Used during this.move(): A matrix that is used to indicate the *change* in position of the
   * angleMarker on the sphere.
   */
  private changeInPositionRotationMatrix: Matrix4 = new Matrix4();
  /** Use in the rotation matrix during a move event */
  private desiredZAxis = new Vector3();

  /**
   * The angle marker is a segment of a circle of radius AngleMarker.currentAngleMarkerRadius and center _vertexVector from _startVector to _endVector
   * This is always drawn counterclockwise when seen from outside of the sphere. The angle from vertexVector to start/end Vector should
   * always be AngleMarker.currentAngleMarkerRadius (note that the AngleMarker can scale this to create angleMarkers of different sizes,
   * but the SEAngleMarker is always the default radius)
   */
  private _vertexVector = new Vector3(); // Set this vector to the origin so that the I can tell during the update method if this is the first time through the update routine
  private _startVector = new Vector3();
  private _endVector = new Vector3();

  /**
   * When first creating the angle marker from two lines, if we have to multiply the cross of first parent normal and
   * second parent normal (in that order always) by -1 to get the intersection on the front of the sphere
   * initially, then we *always* have to multiply by -1 to get the correct location.
   */
  private _vertexDirectionScalar = 1;

  /**
   * Used in the update method to compute the orthonormal frame for setting _start/_end Vector
   */
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();
  private tmpVector3 = new Vector3();
  private tmpVector4 = new Vector3();
  private tmpVector5 = new Vector3();

  /**
   * Temporary vectors used in the measureAngle function
   */
  private measureTmpVector1 = new Vector3();
  private measureTmpVector2 = new Vector3();
  private measureTmpVector3 = new Vector3();

  /**
   * The number of this angle marker when it was created (i.e. this is the number of angle markers have created so far)
   */
  private _angleMarkerNumber = 0;

  /** The measure of the angle */
  private _measure = 0;
  /**
   * Create a model SEAngleMarker using:
   * @param angMar The plottable TwoJS Object associated to this object
   * @param firstParent The model SE object that is the first parent of the angle marker
   * @param secondParent The model SE object that is the second parent of the angle marker
   * @param thirdParent The model SE object that is the third parent of the angle marker (defined only if the other two parents are SEPoints)
   */
  constructor(
    angMar: AngleMarker,
    mode: AngleMode,
    firstSEParent: SELine | SESegment | SEPoint,
    secondSEParent: SELine | SESegment | SEPoint,
    thirdSEParent?: SEPoint | undefined
  ) {
    super(); // this.name is set to a measurement token M### in the super constructor
    this.ref = angMar;
    this._firstSEParent = firstSEParent;
    this._secondSEParent = secondSEParent;
    this._thirdSEParent = thirdSEParent;
    this.mode = mode;

    this._valueDisplayMode = SETTINGS.angleMarker.initialValueDisplayMode;
    // SEAngleMarker is both an expression and a plottable (the only one?)
    // As an expression to be used in the calculation this.name must be "M###" so that it
    // can be referenced by the user and found by the parser
    // however we don't want the initial shortName of the angle marker's label to be displayed with a "M###"
    //  so we record the angleMarkerNumber and then in SELabel, we set the short name of the Label using this field.
    // The M### name is defined in the SEExpression constructor
    SEAngleMarker.ANGLEMARKER_COUNT++;
    this._angleMarkerNumber = SEAngleMarker.ANGLEMARKER_COUNT;
  }

  customStyles(): Set<string> {
    return styleSet;
  }

  get angleMarkerNumber(): number {
    return this._angleMarkerNumber;
  }

  get angleMode(): AngleMode {
    return this.mode;
  }

  public get value(): number {
    return this.measureAngle(
      this._startVector,
      this._vertexVector,
      this._endVector
    );
  }

  public get noduleDescription(): string {
    if (this._thirdSEParent !== undefined) {
      return String(
        i18n.t(`objectTree.anglePoints`, {
          p1: this._firstSEParent.label?.ref.shortUserName,
          p2: this._secondSEParent.label?.ref.shortUserName,
          p3: this._thirdSEParent.label?.ref.shortUserName,
          val: this._measure
        })
      );
    } else {
      if (
        this._firstSEParent instanceof SESegment &&
        this._secondSEParent instanceof SESegment
      ) {
        return String(
          i18n.t(`objectTree.angleSegments`, {
            seg1: this._firstSEParent.label?.ref.shortUserName,
            seg2: this._secondSEParent.label?.ref.shortUserName,
            val: this._measure
          })
        );
      } else if (
        this._firstSEParent instanceof SELine &&
        this._secondSEParent instanceof SELine
      ) {
        return String(
          i18n.t(`objectTree.angleLines`, {
            line1: this._firstSEParent.label?.ref.shortUserName,
            line2: this._secondSEParent.label?.ref.shortUserName,
            val: this._measure
          })
        );
      } else if (
        this._firstSEParent instanceof SELine &&
        this._secondSEParent instanceof SESegment
      ) {
        return String(
          i18n.t(`objectTree.angleLineSegment`, {
            line1: this._firstSEParent.label?.ref.shortUserName,
            line2: this._secondSEParent.label?.ref.shortUserName,
            val: this._measure
          })
        );
      } else {
        return String(
          i18n.t(`objectTree.angleSegmentLine`, {
            line1: this._firstSEParent.label?.ref.shortUserName,
            line2: this._secondSEParent.label?.ref.shortUserName,
            val: this._measure
          })
        );
      }
    }
  }

  public get noduleItemText(): string {
    return (
      this.name + ": " + this.label?.ref.shortUserName + ` ${this.prettyValue}`
    );
  }

  get firstSEParent(): SELine | SESegment | SEPoint {
    return this._firstSEParent;
  }
  get secondSEParent(): SELine | SESegment | SEPoint {
    return this._secondSEParent;
  }

  get vertexVector(): Vector3 {
    return this._vertexVector;
  }
  get startVector(): Vector3 {
    return this._startVector;
  }
  get endVector(): Vector3 {
    return this._endVector;
  }

  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    const angleToVertex = unitIdealVector.angleTo(this._vertexVector);

    // if the unitIdealVector is very close to the vertex vector return true
    if (
      angleToVertex <
      SETTINGS.angleMarker.hitIdealDistance / currentMagnificationFactor
    ) {
      return true;
    } else if (
      angleToVertex >
      this.ref.angleMarkerRadius +
        SETTINGS.angleMarker.hitIdealDistance / currentMagnificationFactor
    ) {
      // The unitIdealVector is not in the circle with center vertexVector (plus a little tolerance)
      // console.debug("not hit");
      // const tmp = this.closestVector(unitIdealVector);
      // const tmp2 = this.closestVector(tmp);
      // console.debug(tmp.angleTo(tmp2));
      // this.closestVector(unitIdealVector);
      return false;
    } else {
      // The unitIdealVector is in the circle, now figure out if it is in the segment of the circle
      // That is, figure out if the angle from the startVector to the idealUnit is less than the angle
      // to the endVector
      const ang1 = this.measureAngle(
        this._startVector,
        this._vertexVector,
        unitIdealVector
      );
      //const ang1 = 1.25;

      const ang2 = this.measureAngle(
        this._startVector,
        this._vertexVector,
        this._endVector
      );

      // console.debug(ang1 <= ang2 ? "hit" : "nothit");
      // const tmp = this.closestVector(unitIdealVector);
      // const tmp2 = this.closestVector(tmp);
      // console.debug(tmp.angleTo(tmp2));
      return ang1 <= ang2;

      // if ang1 is very close to 2Pi, or
      //    ang1 is less or equal to ang2  or
      //    ang1 is a bit bigger than ang2
      // declare a hit

      // use right triangle trig to make sure that the distance to the nearest point on the angleMarker is small
      //
      // tan(a)=tan(A)sin(b)
      //
      // b is the angleToVertex (distance from vertex to unitIdeal), a is the side we
      // want to be less than SETTINGS.angleMarker.hitIdealDistance / currentMagnificationFactor, A is the
      // angle 2Pi-ang1 or ang1-ang2

      // return (
      //   ang1 <= ang2 ||
      //   Math.atan(Math.tan(2 * Math.PI - ang1) * Math.sin(angleToVertex)) <
      //     SETTINGS.angleMarker.hitIdealDistance / currentMagnificationFactor ||
      //   (ang1 > ang2 &&
      //     Math.atan(Math.tan(ang1 - ang2) * Math.sin(angleToVertex)) <
      //       SETTINGS.angleMarker.hitIdealDistance / currentMagnificationFactor)
      // );
    }
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this._exists = this._firstSEParent.exists && this._secondSEParent.exists;

    // If the third parent is not null it should exist in order for the angle marker to exist
    // I could use this.mode === AngleMode, but then I would have to cast all the parents to SEPoints
    // each time I used them
    if (
      this._secondSEParent instanceof SEPoint &&
      this._firstSEParent instanceof SEPoint &&
      this._thirdSEParent instanceof SEPoint
    ) {
      this._exists = this._exists && this._thirdSEParent.exists;
      // If either (1st and 2nd) or (2nd and 3rd)  pair are the same or nearly antipodal points then this angle marker doesn't exist
      this._exists =
        this._exists &&
        !this.tmpVector1
          .crossVectors(
            this._firstSEParent.locationVector,
            this._secondSEParent.locationVector
          )
          .isZero(
            SETTINGS.nearlyAntipodalIdeal / SEStore.zoomMagnificationFactor
          ) &&
        !this.tmpVector1
          .crossVectors(
            this._thirdSEParent.locationVector,
            this._secondSEParent.locationVector
          )
          .isZero(
            SETTINGS.nearlyAntipodalIdeal / SEStore.zoomMagnificationFactor
          );
    }

    //update _vertexVector , _startVector , _endVector using _angleMarkerRadius (which is set in the )
    if (this._exists) {
      // cases depending on the type of parents
      //  1) three points,
      //  2) two lines,
      //  3) two line segments with a common endpoint,
      //  4) a line and an line segment with an endpoint on the line
      if (
        this._secondSEParent instanceof SEPoint &&
        this._firstSEParent instanceof SEPoint &&
        this._thirdSEParent instanceof SEPoint
      ) {
        // This uses a method in the AngleMarker plottable object (setAngleMarkerFromThreeVectors) because this is the only case in which a
        // temporary angleMarker is displayed.  This method is used both here and in the AngleHandler.
        // This avoids having duplicate code. setAngleMarkerFromThreeVectors is in AngleMarker instead of SEAngleMarker because
        // it needs to be used by the temporary angle marker before SEAngleMarker exists
        // This returns the _start,_vertex,_end vectors and sets those same vectors in AngleMarker
        const vectorList = this.ref.setAngleMarkerFromThreeVectors(
          this._firstSEParent.locationVector,
          this._secondSEParent.locationVector,
          this._thirdSEParent.locationVector,
          this.ref.angleMarkerRadius
        );
        this._startVector.copy(vectorList[0]);
        this._vertexVector.copy(vectorList[1]);
        this._endVector.copy(vectorList[2]);
      } else if (
        this._secondSEParent instanceof SELine &&
        this._firstSEParent instanceof SELine
      ) {
        // In this case both parents are SELines
        // First set the vertexVector
        // the common point defining the line is *always* the _vertex vector
        if (
          this._firstSEParent.startSEPoint ===
            this._secondSEParent.startSEPoint ||
          this._firstSEParent.startSEPoint === this._secondSEParent.endSEPoint
        ) {
          // the common point defining the line is *always* the _vertex vector
          this._vertexVector.copy(
            this._firstSEParent.startSEPoint.locationVector
          );
        } else if (
          this._firstSEParent.endSEPoint ===
            this._secondSEParent.startSEPoint ||
          this._firstSEParent.endSEPoint === this._secondSEParent.endSEPoint
        ) {
          // the common point defining the line is *always* the _vertex vector
          this._vertexVector.copy(
            this._firstSEParent.endSEPoint.locationVector
          );
        } else if (
          // Check to see if this is the first time through this update method (if the vertexVector is zero)
          // and the lines do not have a defining point in common
          this._vertexVector.x === 0 &&
          this._vertexVector.y === 0 &&
          this._vertexVector.z === 0
        ) {
          // the vertex of the angle marker is one of the intersection points of the lines
          this._vertexVector
            .crossVectors(
              this._firstSEParent.normalVector,
              this._secondSEParent.normalVector
            )
            .normalize();
          if (this._vertexVector.z < 0) {
            //choose the intersection point that is on the front of the sphere
            this._vertexVector.multiplyScalar(-1);
            // remember this choice and multiply the _vertex vector by it *every* time we recompute it
            this._vertexDirectionScalar = -1;
          } else {
            this._vertexDirectionScalar = 1;
          }
        } else {
          this._vertexVector
            .crossVectors(
              this._firstSEParent.normalVector,
              this._secondSEParent.normalVector
            )
            .multiplyScalar(this._vertexDirectionScalar)
            .normalize();
        }

        //Second set the start vector
        this.tmpVector1
          .crossVectors(this._vertexVector, this._firstSEParent.normalVector)
          .normalize(); // tmpVector1 is perpendicular to vertexVector in the plane of the first parent line
        this._startVector.set(0, 0, 0);
        this._startVector.addScaledVector(
          this._vertexVector,
          Math.cos(this.ref.angleMarkerRadius)
        );
        this._startVector
          .addScaledVector(
            this.tmpVector1,
            Math.sin(this.ref.angleMarkerRadius)
          )
          .normalize();

        // Third set the end vector
        this.tmpVector1
          .crossVectors(this._vertexVector, this._secondSEParent.normalVector)
          .normalize(); // tmpVector1 is perpendicular to vertexVector in the plane of the second parent line

        // If the angle from the half-plane containing the _startVector ( i.e. the bounded by the line containing the _vertexVector in the plane contain the _vertex, _start vectors)
        // to the half-plane containing this.tmpVector1 is bigger than Pi then tmpVector1 needs to be multiplied by -1 because the
        // angle between two lines is never bigger than pi
        if (
          this.measureAngle(
            this._startVector,
            this._vertexVector,
            this.tmpVector1
          ) > Math.PI
        ) {
          this.tmpVector1.multiplyScalar(-1);
        }
        // now compute the _end vector
        this._endVector.set(0, 0, 0);
        this._endVector.addScaledVector(
          this._vertexVector,
          Math.cos(this.ref.angleMarkerRadius)
        );
        this._endVector
          .addScaledVector(
            this.tmpVector1,
            Math.sin(this.ref.angleMarkerRadius)
          )
          .normalize();

        // Record the new vertex/start/end vectors in the plottable element
        this.ref.vertexVector = this._vertexVector;
        this.ref.startVector = this._startVector;
        this.ref.endVector = this._endVector;
      } else if (
        this._secondSEParent instanceof SESegment &&
        this._firstSEParent instanceof SESegment
      ) {
        // In this case both parents are SESegments
        // first figure out which endpoint in in common, for that is the vertexVector
        // Also this tells which endpoint of _firstSEParent (either start/endSEPoint) is not the
        // _vertexVector. so set _startVector and _endVector TEMPORARILY
        // Make sure that _startVector and _endVector determine the correct half-plane.  When either
        // the first or second parent are longer than pi, you have to reverse these temporary settings.
        if (
          this._firstSEParent.startSEPoint.locationVector.equals(
            this._secondSEParent.startSEPoint.locationVector
          )
        ) {
          this._vertexVector.copy(
            this._firstSEParent.startSEPoint.locationVector
          );
          //temporarily set the _startVector and _endVector
          this._startVector
            .copy(this._firstSEParent.endSEPoint.locationVector)
            .multiplyScalar(this._firstSEParent.arcLength > Math.PI ? -1 : 1);
          this._endVector
            .copy(this._secondSEParent.endSEPoint.locationVector)
            .multiplyScalar(this._secondSEParent.arcLength > Math.PI ? -1 : 1);
        } else if (
          this._firstSEParent.startSEPoint.locationVector.equals(
            this._secondSEParent.endSEPoint.locationVector
          )
        ) {
          this._vertexVector.copy(
            this._firstSEParent.startSEPoint.locationVector
          );
          //temporarily set the _startVector and _endVector
          this._startVector
            .copy(this._firstSEParent.endSEPoint.locationVector)
            .multiplyScalar(this._firstSEParent.arcLength > Math.PI ? -1 : 1);
          this._endVector
            .copy(this._secondSEParent.startSEPoint.locationVector)
            .multiplyScalar(this._secondSEParent.arcLength > Math.PI ? -1 : 1);
        } else if (
          this._firstSEParent.endSEPoint.locationVector.equals(
            this._secondSEParent.startSEPoint.locationVector
          )
        ) {
          this._vertexVector.copy(
            this._firstSEParent.endSEPoint.locationVector
          );
          //temporarily set the _startVector and _endVector
          this._startVector
            .copy(this._firstSEParent.startSEPoint.locationVector)
            .multiplyScalar(this._firstSEParent.arcLength > Math.PI ? -1 : 1);
          this._endVector
            .copy(this._secondSEParent.endSEPoint.locationVector)
            .multiplyScalar(this._secondSEParent.arcLength > Math.PI ? -1 : 1);
        } else if (
          this._firstSEParent.endSEPoint.locationVector.equals(
            this._secondSEParent.endSEPoint.locationVector
          )
        ) {
          this._vertexVector.copy(
            this._firstSEParent.endSEPoint.locationVector
          );
          //temporarily set the _startVector and _endVector
          this._startVector
            .copy(this._firstSEParent.startSEPoint.locationVector)
            .multiplyScalar(this._firstSEParent.arcLength > Math.PI ? -1 : 1);
          this._endVector
            .copy(this._secondSEParent.startSEPoint.locationVector)
            .multiplyScalar(this._secondSEParent.arcLength > Math.PI ? -1 : 1);
        }
        //Second set the start vector
        this.tmpVector1
          .crossVectors(this._vertexVector, this._firstSEParent.normalVector)
          .normalize(); // tmpVector1 is perpendicular to vertexVector in the plane of the first parent line
        // we need to be sure that this.tmpVector1 is in the correct half-plane (i.e the plane spanned by
        // this._vertexVector and (the temporarily set) this._startVector, divided by the line containing the this._vertexVector)
        // this.tmpVector1 must be in same half plane (the temporarily set) this._startVector. As tmpVector
        // is perpendicular to
        // _vertexVector, to be in the same half-plane as (the temporarily set) this._startVector, dot(_start,tmpVector1) must be positive
        //
        const dotProd = this.tmpVector1.dot(this._startVector);
        if (Math.abs(dotProd) < SETTINGS.tolerance) {
          // in this case _firstSEParent is a line segment of length Pi
          // make sure that tmpVector1 is on this segment by checking the distance to the closestVector
          if (
            this._firstSEParent
              .closestVector(this.tmpVector1)
              .angleTo(this.tmpVector1) > SETTINGS.tolerance
          ) {
            this.tmpVector1.multiplyScalar(-1);
          }
        } else if (dotProd < 0) {
          this.tmpVector1.multiplyScalar(-1);
        }
        // if longer than pi reverse the _start
        // if (this._firstSEParent.arcLength > Math.PI) {
        //   this._startVector.multiplyScalar(-1);
        // }

        // Now that tmpVector1 is set correctly use it to properly set the _startVector
        this._startVector.set(0, 0, 0);
        this._startVector.addScaledVector(
          this._vertexVector,
          Math.cos(this.ref.angleMarkerRadius)
        );
        this._startVector
          .addScaledVector(
            this.tmpVector1,
            Math.sin(this.ref.angleMarkerRadius)
          )
          .normalize();

        // Third set the end vector
        this.tmpVector1
          .crossVectors(this._vertexVector, this._secondSEParent.normalVector)
          .normalize(); // tmpVector1 is perpendicular to vertexVector in the plane of the second parent line
        // we need to be sure that this.tmpVector1 is in the correct half-plane (i.e the plane spanned by
        // this._vertexVector and (the temporarily set) this._endVector, divided by the line containing the this._vertexVector)
        // this.tmpVector1 must be in same half plane (the temporarily set) this._endVector. As tmpVector
        // is perpendicular to
        // _vertexVector, to be in the same half-plane as (the temporarily set) this._endVector, dot(_end,tmpVector1) must be positive
        //
        const dotProd1 = this.tmpVector1.dot(this._endVector);
        if (Math.abs(dotProd1) < SETTINGS.tolerance) {
          // in this case _secondSEParent is a line segment of length Pi
          // make sure that tmpVector1 is on this segment by checking the distance to the closestVector
          if (
            this._secondSEParent
              .closestVector(this.tmpVector1)
              .angleTo(this.tmpVector1) > SETTINGS.tolerance
          ) {
            this.tmpVector1.multiplyScalar(-1);
          }
        } else if (dotProd1 < 0) {
          this.tmpVector1.multiplyScalar(-1);
        }
        // Now that tmpVector1 is set correctly use it to properly set the _endVector
        this._endVector.set(0, 0, 0);
        this._endVector.addScaledVector(
          this._vertexVector,
          Math.cos(this.ref.angleMarkerRadius)
        );
        this._endVector
          .addScaledVector(
            this.tmpVector1,
            Math.sin(this.ref.angleMarkerRadius)
          )
          .normalize();

        // if longer than pi reverse the _start
        // if (this._secondSEParent.arcLength > Math.PI) {
        //   this._endVector.multiplyScalar(-1);
        // }
        // Record the new vertex/start/end vectors in the plottable element
        this.ref.vertexVector = this._vertexVector;
        this.ref.startVector = this._startVector;
        this.ref.endVector = this._endVector;
      } else if (
        (this._secondSEParent instanceof SESegment &&
          this._firstSEParent instanceof SELine) ||
        (this._secondSEParent instanceof SELine &&
          this._firstSEParent instanceof SESegment)
      ) {
        // In this case one parent is SESegment and the other is SELine
        // first figure out which endpoint of the line segment is on the SELine
        // We already know that one of the endpoints of SESegment is on SELine
        // because the angle handler checked this so we don't care if the
        // endpoint of the segment is a point on the line or a point defining the line
        if (this._secondSEParent instanceof SESegment) {
          if (
            Math.abs(
              this._secondSEParent.startSEPoint.locationVector.dot(
                this._firstSEParent.normalVector
              )
            ) < SETTINGS.tolerance
          ) {
            this._vertexVector.copy(
              this._secondSEParent.startSEPoint.locationVector
            );
            // set the _endVector *direction* to pointing in the same direction as the segment is drawn
            // To this see is correct check out the updateDisplay method in Segment.ts and the desiredYAxis vector
            this.tmpVector1
              .crossVectors(
                this._secondSEParent.normalVector,
                this._vertexVector
              )
              .multiplyScalar(this._secondSEParent.arcLength > Math.PI ? -1 : 1)
              .normalize(); // tmpVector1 is perpendicular to vertexVector in the plane of the segment
          } else if (
            Math.abs(
              this._secondSEParent.endSEPoint.locationVector.dot(
                this._firstSEParent.normalVector
              )
            ) < SETTINGS.tolerance
          ) {
            this._vertexVector.copy(
              this._secondSEParent.endSEPoint.locationVector
            );
            // set the _endVector *direction* to pointing in the same direction as the segment is drawn
            // To this see is correct check out the updateDisplay method in Segment.ts and the desiredYAxis vector
            this.tmpVector1
              .crossVectors(
                this._vertexVector,
                this._secondSEParent.normalVector
              )
              .multiplyScalar(this._secondSEParent.arcLength > Math.PI ? -1 : 1)
              .normalize(); // tmpVector1 is perpendicular to vertexVector in the plane of the segment
          }

          this._endVector.set(0, 0, 0);
          this._endVector.addScaledVector(
            this._vertexVector,
            Math.cos(this.ref.angleMarkerRadius)
          );
          this._endVector
            .addScaledVector(
              this.tmpVector1,
              Math.sin(this.ref.angleMarkerRadius)
            )
            .normalize();

          // Now set the _startVector
          this.tmpVector2
            .crossVectors(this._vertexVector, this._firstSEParent.normalVector)
            .normalize(); // tmpVector2 is perpendicular to vertexVector in the plane of the second parent line

          // If the angle from the half-plane containing the _startVector ( i.e. the bounded by the line containing the _vertexVector in the plane contain the _vertex, _start vectors)
          // to the half-plane containing this.tmpVector2 is bigger than Pi then tmpVector2 needs to be multiplied by -1 because the
          // angle between two lines is never bigger than pi
          if (
            this.measureAngle(
              this.tmpVector2,
              this._vertexVector,
              this._endVector
            ) > Math.PI
          ) {
            this.tmpVector2.multiplyScalar(-1);
          }

          this._startVector.set(0, 0, 0);
          this._startVector.addScaledVector(
            this._vertexVector,
            Math.cos(this.ref.angleMarkerRadius)
          );
          this._startVector
            .addScaledVector(
              this.tmpVector2,
              Math.sin(this.ref.angleMarkerRadius)
            )
            .normalize();
        } else if (this._firstSEParent instanceof SESegment) {
          if (
            Math.abs(
              this._firstSEParent.startSEPoint.locationVector.dot(
                this._secondSEParent.normalVector
              )
            ) < SETTINGS.nearlyAntipodalIdeal
          ) {
            // set the vertex vector
            this._vertexVector.copy(
              this._firstSEParent.startSEPoint.locationVector
            );
            // set the _startVector *direction* to pointing in the same direction as the segment is drawn
            // To this see is correct check out the updateDisplay method in Segment.ts and the desiredYAxis vector
            this.tmpVector1
              .crossVectors(
                this._firstSEParent.normalVector,
                this._vertexVector
              )
              .multiplyScalar(this._firstSEParent.arcLength > Math.PI ? -1 : 1)
              .normalize(); // tmpVector1 is perpendicular to vertexVector in the plane of the segment
          } else if (
            Math.abs(
              this._firstSEParent.endSEPoint.locationVector.dot(
                this._secondSEParent.normalVector
              )
            ) < SETTINGS.nearlyAntipodalIdeal
          ) {
            this._vertexVector.copy(
              this._firstSEParent.endSEPoint.locationVector
            );
            // set the _startVector *direction* to pointing in the same direction as the segment is drawn
            // To this see is correct check out the updateDisplay method in Segment.ts and the desiredYAxis vector
            this.tmpVector1
              .crossVectors(
                this._vertexVector,
                this._firstSEParent.normalVector
              )
              .multiplyScalar(this._firstSEParent.arcLength > Math.PI ? -1 : 1)
              .normalize(); // tmpVector1 is perpendicular to vertexVector in the plane of the segment
          }

          this._startVector.set(0, 0, 0);
          this._startVector.addScaledVector(
            this._vertexVector,
            Math.cos(this.ref.angleMarkerRadius)
          );
          this._startVector
            .addScaledVector(
              this.tmpVector1,
              Math.sin(this.ref.angleMarkerRadius)
            )
            .normalize();

          // Now set the _endVector
          this.tmpVector2
            .crossVectors(this._vertexVector, this._secondSEParent.normalVector)
            .normalize(); // tmpVector2 is perpendicular to vertexVector in the plane of the second parent line

          // If the angle from the half-plane containing the _startVector ( i.e. the bounded by the line containing the _vertexVector in the plane contain the _vertex, _start vectors)
          // to the half-plane containing this.tmpVector2 is bigger than Pi then tmpVector2 needs to be multiplied by -1 because the
          // angle between two lines is never bigger than pi
          if (
            this.measureAngle(
              this._startVector,
              this._vertexVector,
              this.tmpVector2
            ) > Math.PI
          ) {
            this.tmpVector2.multiplyScalar(-1);
          }
          this._endVector.set(0, 0, 0);
          this._endVector.addScaledVector(
            this._vertexVector,
            Math.cos(this.ref.angleMarkerRadius)
          );
          this._endVector
            .addScaledVector(
              this.tmpVector2,
              Math.sin(this.ref.angleMarkerRadius)
            )
            .normalize();
        }

        // Record the new vertex/start/end vectors in the plottable element
        this.ref.vertexVector = this._vertexVector;
        this.ref.startVector = this._startVector;
        this.ref.endVector = this._endVector;
      }
      // update the measure
      this._measure = this.measureAngle(
        this._startVector,
        this._vertexVector,
        this._endVector
      );

      // display the new angleMarker
      this.ref.updateDisplay();
    }

    // When this updates send its value to the label of the angleMarker
    if (this.label && this._exists) {
      this.label.ref.value = [this.value];
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // These angle markers are completely determined by their line/segment/point parents and an update on the parents
    // will cause this angleMarker to be put into the correct location. So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Anglemarker with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "angleMarker", object: this });
    }

    this.setOutOfDate(false);
    this.updateKids(objectState, orderedSENoduleList);
  }

  /**
   * Return the vector on the SEAngleMarker that is closest to the unitIdealVector
   * @param unitIdealVector A vector on the unit sphere
   */
  public closestVector(unitIdealVector: Vector3): Vector3 {
    //First check if the unitIdealVector is the vertexVector or its antipodal
    // if (
    //   this.tmpVector1.subVectors(this._vertexVector, unitIdealVector).length() <
    //   SETTINGS.nearlyAntipodalIdeal
    // ) {
    //   return this._vertexVector;
    // }
    // if (
    //   this.tmpVector1.addVectors(this._vertexVector, unitIdealVector).length() <
    //   SETTINGS.nearlyAntipodalIdeal
    // ) {
    //   return this._endVector; // arbitrary choice, unitIdealVector is essentially equidistant from all the circular parts of the angle marker
    // }

    // if the unitIdealVector leads to a hit then return the unitIdealVector
    // console.debug("x before hit ", this._startVector.x);
    if (this.isHitAt(unitIdealVector, SEStore.zoomMagnificationFactor)) {
      // console.debug("hit");
      // console.debug("x after - hit ", this._startVector.x);
      return unitIdealVector;
    }
    // console.debug("x after - nohit", this._startVector.x);
    //return this._vertexVector;
    // WHAT IS BELOW MIGHT BE USEFUL FOR A FUTURE SESEGMENTOFCIRCLE object, but is too precise because the
    // angle marker is so small

    // the angle measure FROM the half-plane (startHalfPlane) with edge the line containing vertexVector and containing origin of sphere, startVector, vertexVector
    // TO the half-plane (endHalfPlane) with edge the line containing vertexVector and containing origin of sphere, endVector, vertexVector
    // Result is between 0 and 2 Pi
    const angleMarkerAngle = this.measureAngle(
      this._startVector,
      this._vertexVector,
      this._endVector
    );
    // console.debug("ang ", angleMarkerAngle);
    // the angle measure FROM startHalfPlane TO the half-plane (unitIdealHalfPlane) with edge the line containing vertexVector and
    // containing origin of sphere, unitIdealVector, vertexVector.  Result is between 0 and 2 Pi
    const unitIdealAngle = this.measureAngle(
      this._startVector,
      this._vertexVector,
      unitIdealVector
    );
    // console.debug(unitIdealAngle);

    // Divide into two cases: non-convex angle markers versus convex ones. See the picture in
    // the Google Drive folder for a break down of the closest point regions
    //console.debug("angles", unitIdealAngle, angleMarkerAngle);
    // In both cases if unitIdealAngle is less than angleMarkerAngle, project onto the circular
    // part of the angleMarker
    if (unitIdealAngle <= angleMarkerAngle) {
      // console.debug("proj circ part");

      // project onto the circular part of the angle marker
      this.tmpVector1
        .crossVectors(this._vertexVector, unitIdealVector)
        .normalize(); // perpendicular to both vertexVector and unitIdealVector
      this.tmpVector1
        .crossVectors(this.tmpVector1, this._vertexVector)
        .normalize(); // perpendicular to vertexVector and in the unitIdealHalfPlane
      this.tmpVector2.set(0, 0, 0);
      this.tmpVector2.addScaledVector(
        this._vertexVector,
        Math.cos(this.ref.angleMarkerRadius)
      );

      this.tmpVector2.addScaledVector(
        this.tmpVector1,
        Math.sin(this.ref.angleMarkerRadius)
      );

      return this.tmpVector2.normalize();
    } else if (angleMarkerAngle <= Math.PI) {
      // the angleMarker is convex

      // In order to determine the region where vertexVector is the closest point I need to compute the location where the perpendicular bisector of the segment
      // from vertex to end vector and the perpendicular bisector of the segment from vertex to start, intersect (the intersection *not* in the angle marker)

      this.tmpVector1
        .addVectors(this._vertexVector, this._endVector)
        .normalize(); // the midpoint of the segment from vertex to end vector
      this.tmpVector2.crossVectors(this._vertexVector, this._endVector); // a point on the perpendicular bisector of the segment from vertex to end vector
      this.tmpVector3
        .crossVectors(this.tmpVector1, this.tmpVector2)
        .normalize(); // a vector perpendicular to the plane of the perpendicular bisector of the segment from vertex to end vector

      this.tmpVector1
        .addVectors(this._startVector, this._vertexVector)
        .normalize(); // the midpoint of the segment from vertex to start vector
      this.tmpVector2.crossVectors(this._startVector, this._vertexVector); // a point on the perpendicular bisector of the segment from vertex to start vector
      this.tmpVector4
        .crossVectors(this.tmpVector2, this.tmpVector1)
        .normalize(); // a vector perpendicular to the plane of the perpendicular bisector of the segment from vertex to start vector

      this.tmpVector5
        .crossVectors(this.tmpVector3, this.tmpVector4)
        .normalize(); // the intersection point we are looking for
      // make sure that the intersection is *not* in the angleMarker
      if (this._vertexVector.dot(this.tmpVector5) > 0) {
        this.tmpVector5.multiplyScalar(-1);
      }

      // If the unitIdealVector is in the triangular region project onto the segment from vertexVector to endVector
      if (
        this.inRegion(
          this._vertexVector,
          this._endVector,
          this.tmpVector1
            .crossVectors(this._vertexVector, this._endVector)
            .normalize(),
          unitIdealVector
        )
      ) {
        // console.debug("project onto vertex to end segment");
        return this.projectToSegment(
          this._vertexVector,
          this._endVector,
          unitIdealVector
        );
      } else if (
        this.inRegion(
          this._startVector,
          this._vertexVector,
          this.tmpVector1
            .crossVectors(this._startVector, this._vertexVector)
            .normalize(),
          unitIdealVector
        )
      ) {
        // console.debug("project onto vertex to start segment");
        return this.projectToSegment(
          this._vertexVector,
          this._startVector,
          unitIdealVector
        );
      } else if (
        this.inRegion(
          this._vertexVector,
          this.tmpVector1
            .crossVectors(this._vertexVector, this._endVector)
            .normalize(),
          this.tmpVector2
            .crossVectors(this._startVector, this._vertexVector)
            .normalize(),
          unitIdealVector
        ) ||
        this.inRegion(
          this.tmpVector1
            .crossVectors(this._vertexVector, this._endVector)
            .normalize(),
          this.tmpVector5, // the intersection of the perpendicular bisectors of segments vertex/start and vertex/end that is not in the angleMarker
          this.tmpVector2
            .crossVectors(this._startVector, this._vertexVector)
            .normalize(),
          unitIdealVector
        )
      ) {
        // console.debug("project onto vertex ");
        return this._vertexVector;
      } else if (
        this.inRegion(
          this._endVector,
          this.tmpVector2
            .set(0, 0, 0)
            .addScaledVector(this._vertexVector, -1)
            .normalize(), //antipode of the vertex vector
          this.tmpVector1
            .crossVectors(this._vertexVector, this._endVector)
            .normalize(),
          unitIdealVector
        ) ||
        this.inRegion(
          this.tmpVector1
            .crossVectors(this._vertexVector, this._endVector)
            .normalize(),
          this.tmpVector2
            .set(0, 0, 0)
            .addScaledVector(this._vertexVector, -1)
            .normalize(), //antipode of the vertex vector
          this.tmpVector5, // the intersection of the perpendicular bisectors of segments vertex/start and vertex/end that is not in the angleMarker
          unitIdealVector
        )
      ) {
        // console.debug("project onto end ");
        return this._endVector;
      } else {
        // console.debug("project onto start ");
        return this._startVector;
      }
    } else {
      // the angleMarker is non-convex

      // In order to determine the region where vertexVector is the closest point I need to compute the location where the perpendicular (through
      // end vector) to the segment
      // from vertex to end vector and the perpendicular (through the start vector) to the segment from vertex to start, intersect
      // (the intersection closest to the angle marker)

      this.tmpVector1.crossVectors(this._vertexVector, this._endVector); // a vector on the perpendicular (through endVector) of the segment from vertex to end vector (this is on ALL perpendiculars to the segment)
      this.tmpVector2
        .crossVectors(this._endVector, this.tmpVector1)
        .normalize(); // a vector perpendicular to the plane of the perpendicular (through the endVector) to the segment from vertex to end vector

      this.tmpVector1.crossVectors(this._startVector, this._vertexVector); // a vector on the perpendicular (through startVector) of the segment from vertex to start vector (this is on ALL perpendiculars to the segment)
      this.tmpVector3
        .crossVectors(this.tmpVector1, this._startVector)
        .normalize(); // a vector perpendicular to the plane of the perpendicular (through the endVector) to the segment from vertex to end vector

      this.tmpVector5
        .crossVectors(this.tmpVector2, this.tmpVector3)
        .normalize(); // the intersection point we are looking for
      // make sure that the intersection is pointing away from the vertex vector (THIS BREAKS DOWN IF angleMarkerRadius is bigger than Pi/2)
      if (this._vertexVector.dot(this.tmpVector5) > 0) {
        this.tmpVector5.multiplyScalar(-1);
      }

      // If the unitIdealVector is in the triangular region project onto the segment from vertexVector to endVector
      if (
        this.inRegion(
          this._vertexVector,
          this._endVector,
          this.tmpVector5,
          unitIdealVector
        )
      ) {
        return this.projectToSegment(
          this._vertexVector,
          this._endVector,
          unitIdealVector
        );
      } else if (
        this.inRegion(
          this._startVector,
          this._vertexVector,
          this.tmpVector5,
          unitIdealVector
        )
      ) {
        return this.projectToSegment(
          this._vertexVector,
          this._startVector,
          unitIdealVector
        );
      } else if (unitIdealAngle <= angleMarkerAngle / 2 + Math.PI) {
        return this._endVector;
      } else {
        return this._startVector;
      }
    }
  }

  /**
   * Return the vector near the SEAngleMarkers (within SETTINGS.angleMarker.maxLabelDistance) that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestLabelLocationVector(idealUnitSphereVector: Vector3): Vector3 {
    // First find the closest point on the angleMarker to the idealUnitSphereVector
    this.tmpVector1.copy(this.closestVector(idealUnitSphereVector));

    // If the idealUnitSphereVector is within the tolerance of the closest point, do nothing, otherwise return the vector in the plane
    //  of the idealUnitSphereVector and the closest point that is at the tolerance distance away.
    if (
      this.tmpVector1.angleTo(idealUnitSphereVector) <
      SETTINGS.angleMarker.maxLabelDistance / SEStore.zoomMagnificationFactor
    ) {
      return idealUnitSphereVector;
    } else {
      // tmpVector2 is the normal to the plane of the closest point vector and the idealUnitVector
      // This can't be zero because tmpVector1 can be the closest on the circle to idealUnitSphereVector and parallel with ideanUnitSphereVector
      this.tmpVector2
        .crossVectors(idealUnitSphereVector, this.tmpVector1)
        .normalize();
      // compute the toVector (so that tmpVector2= toVector, tmpVector1= fromVector, tmpVector2 form an orthonormal frame)
      this.tmpVector3.crossVectors(this.tmpVector1, this.tmpVector2).normalize;
      // return cos(SETTINGS.segment.maxLabelDistance)*fromVector/tmpVec + sin(SETTINGS.segment.maxLabelDistance)*toVector/tmpVec2
      this.tmpVector3.multiplyScalar(
        Math.sin(
          SETTINGS.angleMarker.maxLabelDistance /
            SEStore.zoomMagnificationFactor
        )
      );
      this.tmpVector3
        .addScaledVector(
          this.tmpVector1,
          Math.cos(
            SETTINGS.angleMarker.maxLabelDistance /
              SEStore.zoomMagnificationFactor
          )
        )
        .normalize();
      return this.tmpVector3;
    }
  }

  accept(v: Visitor): void {
    v.actionOnAngleMarker(this);
  }

  /**
   * Given (distinct) unit startVector, unitIdealVector and vertexVector, where angle between vertexVector and startVector and
   * the angle from the vertexVector to the unitIdealVector is not pi, this method returns the angle between
   * the half-plane P1 (the plane containing origin of sphere, startVector, vertexVector with edge the line
   * containing vertexVector and the half that contains the startVector) and half-plane P2 (the plane containing origin of sphere,
   * unitIdealVector, vertexVector with edge the line containing vertexVector and the half that contains the unitIdealVector). The
   * angle is measured starting at the startVector half-plane measured to the unitIdealVector half-plane using the right-hand rule. That is
   * put your right at the vertexVector with your thumb pointing away from the origin of the sphere, align your fingers with the
   * start half-plane and then curl your finger to the unitIdealVector half-plane. The angle swept out by your fingers is the returned angle. This
   * will return an angle from 0 to 2Pi.
   * @param startVector distinct unit vector and not the antipode of vertexVector
   * @param vertexVector distinct unit vector
   * @param unitIdealVector distinct unit vector and not the antipode of vertexVector
   * @returns an angle in [0,2pi)
   */
  private measureAngle(
    srtVector: Vector3,
    vrtxVector: Vector3,
    unitVector: Vector3
  ): number {
    //  Project the idealUnitVector and the srtVector onto the plane perpendicular to the vrtxVector
    // through the origin of sphere then use the atan2 function (with the projections of start and unitIdeal vector)
    // to figure out the angle
    //
    // Project the unitVector and the srtVector onto the plane, Q, perpendicular to the vrtxVector
    //  Proj_Q(vec) = vec - (vec.vrtxVector)vrtxVector (vrtxVector is unit)
    // console.debug("x before ", this._startVector.x);
    this.measureTmpVector1.set(0, 0, 0);
    this.measureTmpVector1.copy(unitVector);
    this.measureTmpVector1.addScaledVector(
      vrtxVector,
      -1 * vrtxVector.dot(unitVector)
    );

    this.measureTmpVector2.set(0, 0, 0);
    this.measureTmpVector2.copy(srtVector);
    this.measureTmpVector2.addScaledVector(
      vrtxVector,
      -1 * vrtxVector.dot(srtVector)
    );

    // The vector this.measureTmpVector2.normalize is the vector that is positive unit x-axis that determine the coordinates on the plane Q
    // so that the projection of the start vector is on the positive x-axis
    this.measureTmpVector2.normalize();

    // the positive unit y-axis vector is the cross product of the unit positive z axis (vrtxVector) and the unit
    // positive x-axis (this.measureTmpVector2)
    this.measureTmpVector3.set(0, 0, 0);
    this.measureTmpVector3
      .crossVectors(vrtxVector, this.measureTmpVector2)
      .normalize();

    //NOTE: the syntax for atan2 is atan2(y,x) and the return is in (-pi,pi]!!!!!
    const val = Math.atan2(
      this.measureTmpVector3.dot(this.measureTmpVector1),
      this.measureTmpVector2.dot(this.measureTmpVector1)
    ).modTwoPi();
    // console.debug(val, "x after ", this._startVector.x);
    return val;
  }

  /**
   * Is testVec in the triangle with the given vertices. The interior of the triangle is determined by a person walking with their head away from the
   * origin of the sphere walking counterclockwise around the triangle (seen from outside the sphere). Their left hand is the inside of the triangle. None of the vertices of the triangle
   * are antipodal and all segments of the triangle have length less than Pi
   * @param vec1 First vertex of the triangle (unit vector)
   * @param vec2 Second vertex of the triangle (unit vector)
   * @param vec3 Third vertex of the triangle (unit vector)
   * @param testVec The vector in question (unit vector)
   */
  private inRegion(
    vec1: Vector3,
    vec2: Vector3,
    vec3: Vector3,
    testVec: Vector3
  ): boolean {
    const perpVec1 = new Vector3(0, 0, 0); // vector perpendicular to the segment from vec1 to vec2
    const perpVec2 = new Vector3(0, 0, 0); // vector perpendicular to the segment from vec2 to vec3
    const perpVec3 = new Vector3(0, 0, 0); // vector perpendicular to the segment from vec3 to vec1

    perpVec1.crossVectors(vec1, vec2);
    perpVec2.crossVectors(vec2, vec3);
    perpVec3.crossVectors(vec3, vec1);

    return (
      perpVec1.dot(testVec) >= 0 &&
      perpVec2.dot(testVec) >= 0 &&
      perpVec3.dot(testVec) >= 0
    );
  }

  /**
   * Project the vec to the segment (with length less than Pi) from start to end vectors.
   *  If this method is called we *****KNOW****** that the closest point on the segment to vec is on the segment
   * @param start // The start of the segment (unit vector & not antipodal to end)
   * @param end  // The end of the segment (unit vector & not antipodal to start)
   * @param vec  // The vector to project onto the segment (unit vector) --
   * @returns a vector on the line segment from start to end
   */
  private projectToSegment(
    start: Vector3,
    end: Vector3,
    vec: Vector3
  ): Vector3 {
    const perp = new Vector3(); // a vector perpendicular to the segment from start to end
    perp.crossVectors(start, end).normalize();

    // make sure that perp and vec are on the same side of the line containing the segment
    if (perp.dot(vec) < 0) {
      perp.multiplyScalar(-1);
    }

    const tmpVector = new Vector3();
    tmpVector.crossVectors(perp, vec); // a vector perpendicular to both perp and vec

    // check the case when vec and perp are parallel
    if (tmpVector.length() < SETTINGS.nearlyAntipodalIdeal) {
      return start.add(end).normalize(); // all vectors on the segment are equidistant from vec so arbitrarily choose the midpoint of the segment
    }

    // const tmpVec2 = tmpVector.normalize().cross(perp);
    // console.debug(
    //   "triangle inequality ",
    //   start.angleTo(end) - (tmpVec2.angleTo(start) + tmpVec2.angleTo(end))
    // );
    return tmpVector.normalize().cross(perp);
  }

  // Override the isLabelable method in SEExpression
  public isLabelable(): boolean {
    return true;
  }
}
