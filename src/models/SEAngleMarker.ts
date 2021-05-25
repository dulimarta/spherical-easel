import { SEMeasurement } from "./SEMeasurement";
import { SEPoint } from "./SEPoint";
import { SELine } from "./SELine";
import { SESegment } from "./SESegment";
import AngleMarker from "@/plottables/AngleMarker";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { AngleMarkerState } from "@/types";
import SETTINGS from "@/global-settings";
import { Styles } from "@/types/Styles";
import { UpdateMode, UpdateStateType } from "@/types";
import { Labelable } from "@/types";
import { SELabel } from "@/models/SELabel";
import { SEPointOnOneDimensional } from "./SEPointOnOneDimensional";
import AppStore from "@/store";

enum AngleMode {
  NONE,
  LINES,
  POINTS,
  SEGMENTS,
  LINEANDSEGMENT,
  SEGMENTSORLINEANDSEGMENT
}

const styleSet = new Set([
  Styles.strokeColor,
  Styles.strokeWidthPercent,
  Styles.dashArray,
  Styles.fillColor,
  Styles.opacity,
  Styles.dynamicBackStyle,
  Styles.angleMarkerRadiusPercent
]);

export class SEAngleMarker extends SEMeasurement
  implements Visitable, Labelable {
  /**
   * The plottable (TwoJS) AngleMarker associated with this model AngleMarker
   */
  public ref!: AngleMarker;
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
   * Used in the isHitAt method
   */
  private projectionVector = new Vector3();
  private originOfPlaneP = new Vector3();
  private originOfPlanePToUnitIdealVector = new Vector3();
  private unitPositiveXAxis = new Vector3();
  private unitPositiveYAxis = new Vector3();

  /**
   * The angle marker is a segment of a circle of radius SETTINGS.angleMarker.defaultRadius and center _vertexVector from _startVector to _endVector
   * This is always drawn counterclockwise when seen from outside of the sphere. The angle from vertexVector to start/end Vector should
   * always be SETTINGS.angleMarker.defaultRadius (note that the AngleMarker can scale this to create angleMarkers of different sizes,
   * but the SEAngleMarker is always the default radius)
   */
  private _vertexVector = new Vector3(0, 0, 0); // Set this vector to the origin so that the I can tell during the update method if this is the first time through the update routine
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
   * Vuex global state
   */
  protected store = AppStore; //

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
    super();
    this.ref = angMar;
    this._firstSEParent = firstSEParent;
    this._secondSEParent = secondSEParent;
    this._thirdSEParent = thirdSEParent;
    this.mode = mode;
    SEAngleMarker.ANGLEMARKER_COUNT++;
    this.name = `Am-${SEAngleMarker.ANGLEMARKER_COUNT}`;
    if (thirdSEParent !== undefined) {
      this.name =
        this.name +
        `-Angle(${firstSEParent.name},${secondSEParent.name},${thirdSEParent.name}):${this.prettyValue}`;
    } else {
      this.name =
        this.name +
        `-Angle(${firstSEParent.name},${secondSEParent.name}):${this.prettyValue}`;
    }
  }

  customStyles(): Set<Styles> {
    return styleSet;
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

  public get prettyValue(): string {
    return (this.value / Math.PI).toFixed(2) + "\u{1D7B9}";
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
      SETTINGS.angleMarker.defaultRadius +
        SETTINGS.angleMarker.hitIdealDistance / currentMagnificationFactor
    ) {
      // The unitIdealVector is not in the circle with center vertexVector (plus a little tolerance)
      return false;
    } else {
      // The unitIdealVector is in the circle, now figure out if it is in the segment of the circle
      // That is, figure out if the angle from the startVector to the idealUnit is less than the angle
      // to the endVector (with some tolerance)
      const ang1 = this.measureAngle(
        this._startVector,
        this._vertexVector,
        unitIdealVector
      );
      const ang2 = this.measureAngle(
        this._startVector,
        this._vertexVector,
        this._endVector
      );

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

      return (
        ang1 <= ang2 ||
        Math.atan(Math.tan(2 * Math.PI - ang1) * Math.sin(angleToVertex)) <
          SETTINGS.angleMarker.hitIdealDistance / currentMagnificationFactor ||
        (ang1 > ang2 &&
          Math.atan(Math.tan(ang1 - ang2) * Math.sin(angleToVertex)) <
            SETTINGS.angleMarker.hitIdealDistance / currentMagnificationFactor)
      );
    }
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
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
          .isZero(SETTINGS.nearlyAntipodalIdeal) &&
        !this.tmpVector1
          .crossVectors(
            this._thirdSEParent.locationVector,
            this._secondSEParent.locationVector
          )
          .isZero(SETTINGS.nearlyAntipodalIdeal);
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
          SETTINGS.angleMarker.defaultRadius
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
          Math.cos(SETTINGS.angleMarker.defaultRadius)
        );
        this._startVector
          .addScaledVector(
            this.tmpVector1,
            Math.sin(SETTINGS.angleMarker.defaultRadius)
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
          Math.cos(SETTINGS.angleMarker.defaultRadius)
        );
        this._endVector
          .addScaledVector(
            this.tmpVector1,
            Math.sin(SETTINGS.angleMarker.defaultRadius)
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
          Math.cos(SETTINGS.angleMarker.defaultRadius)
        );
        this._startVector
          .addScaledVector(
            this.tmpVector1,
            Math.sin(SETTINGS.angleMarker.defaultRadius)
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
          Math.cos(SETTINGS.angleMarker.defaultRadius)
        );
        this._endVector
          .addScaledVector(
            this.tmpVector1,
            Math.sin(SETTINGS.angleMarker.defaultRadius)
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
            this._secondSEParent.startSEPoint.locationVector.dot(
              this._firstSEParent.normalVector
            ) < SETTINGS.tolerance
          ) {
            this._vertexVector.copy(
              this._secondSEParent.startSEPoint.locationVector
            );
          } else if (
            this._secondSEParent.endSEPoint.locationVector.dot(
              this._firstSEParent.normalVector
            ) < SETTINGS.tolerance
          ) {
            this._vertexVector.copy(
              this._secondSEParent.endSEPoint.locationVector
            );
          }
          // set the _endVector direction to pointing in the same direction as the segment is drawn
          this.tmpVector1
            .crossVectors(this._vertexVector, this._secondSEParent.normalVector)
            .normalize(); // tmpVector1 is perpendicular to vertexVector in the plane of the segment
          if (this._secondSEParent.arcLength < Math.PI) {
            // Make sure that this.tmpVector1 is points in the direction that the segment is drawn
            this.tmpVector1.multiplyScalar(-1);
          }

          this._endVector.set(0, 0, 0);
          this._endVector.addScaledVector(
            this._vertexVector,
            Math.cos(SETTINGS.angleMarker.defaultRadius)
          );
          this._endVector
            .addScaledVector(
              this.tmpVector1,
              Math.sin(SETTINGS.angleMarker.defaultRadius)
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
            Math.cos(SETTINGS.angleMarker.defaultRadius)
          );
          this._startVector
            .addScaledVector(
              this.tmpVector2,
              Math.sin(SETTINGS.angleMarker.defaultRadius)
            )
            .normalize();
        } else if (this._firstSEParent instanceof SESegment) {
          if (
            this._firstSEParent.startSEPoint.locationVector.dot(
              this._firstSEParent.normalVector
            ) < SETTINGS.nearlyAntipodalIdeal
          ) {
            this._vertexVector.copy(
              this._firstSEParent.startSEPoint.locationVector
            );
          } else if (
            this._firstSEParent.endSEPoint.locationVector.dot(
              this._firstSEParent.normalVector
            ) < SETTINGS.nearlyAntipodalIdeal
          ) {
            this._vertexVector.copy(
              this._firstSEParent.endSEPoint.locationVector
            );
          }
          // set the _startVector direction to pointing in the same direction as the segment is drawn
          this.tmpVector1
            .crossVectors(this._vertexVector, this._firstSEParent.normalVector)
            .normalize(); // tmpVector1 is perpendicular to vertexVector in the plane of the segment
          if (this._firstSEParent.arcLength < Math.PI) {
            // Make sure that this.tmpVector1 is points in the direction that the segment is drawn
            this.tmpVector1.multiplyScalar(-1);
          }

          this._startVector.set(0, 0, 0);
          this._startVector.addScaledVector(
            this._vertexVector,
            Math.cos(SETTINGS.angleMarker.defaultRadius)
          );
          this._startVector
            .addScaledVector(
              this.tmpVector1,
              Math.sin(SETTINGS.angleMarker.defaultRadius)
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
            Math.cos(SETTINGS.angleMarker.defaultRadius)
          );
          this._endVector
            .addScaledVector(
              this.tmpVector2,
              Math.sin(SETTINGS.angleMarker.defaultRadius)
            )
            .normalize();
        }

        // Record the new vertex/start/end vectors in the plottable element
        this.ref.vertexVector = this._vertexVector;
        this.ref.startVector = this._startVector;
        this.ref.endVector = this._endVector;
      }

      // display the new angleMarker with the updated values
      this.ref.updateDisplay();
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // These angle markers are completely determined by their line/segment/point parents and an update on the parents
    // will cause this circle to be put into the correct location. Therefore there is no need to
    // store it in the stateArray for undo move. Only store for delete

    if (state.mode == UpdateMode.RecordStateForDelete) {
      const angleMarkerState: AngleMarkerState = {
        kind: "angleMarker",
        object: this
        // vertexVectorX: this._vertexVector.x,
        // vertexVectorY: this._vertexVector.y,
        // vertexVectorZ: this._vertexVector.z,
        // startVectorX: this._startVector.x,
        // startVectorY: this._startVector.y,
        // startVectorZ: this._startVector.z,
        // endVectorX: this._endVector.x,
        // endVectorY: this._endVector.y,
        // endVectorZ: this._endVector.z
      };
      state.stateArray.push(angleMarkerState);
    }
    //update the name to include the new value
    const pos = this.name.lastIndexOf("):");
    this.name = this.name.substring(0, pos + 2) + this.prettyValue;

    this.updateKids(state);
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

    // if the unitIdealVector lead to a hit then return the unitIdealVector
    if (
      this.isHitAt(unitIdealVector, this.store.state.zoomMagnificationFactor)
    ) {
      return unitIdealVector;
    }
    return this._vertexVector;
    // WHAT IS BELOW MIGHT BE USEFUL FOR A FUTURE SESEGMENTOFCIRCLE object, but is to precise because the
    // angle marker is so small
    //
    //
    // // the angle measure FROM the half-plane (startHalfPlane) with edge the line containing vertexVector and containing origin of sphere, startVector, vertexVector
    // // TO the half-plane (endHalfPlane) with edge the line containing vertexVector and containing origin of sphere, endVector, vertexVector
    // // Result is between 0 and 2 Pi
    // const angleMarkerAngle = this.measureAngle(
    //   this._startVector,
    //   this._vertexVector,
    //   this._endVector
    // );

    // // the angle measure FROM startHalfPlane TO the half-plane (unitIdealHalfPlane) with edge the line containing vertexVector and
    // // containing origin of sphere, unitIdealVector, vertexVector.  Result is between 0 and 2 Pi
    // const unitIdealAngle = this.measureAngle(
    //   this._startVector,
    //   this._vertexVector,
    //   unitIdealVector
    // );

    // // Divide into two cases: non-convex angle markers versus convex ones. See the picture in
    // // the Google Drive folder for a break down of the closest point regions
    // //console.log("angle", unitIdealAngle, angleMarkerAngle);
    // // In both cases if unitIdealAngle is less than angleMarkerAngle, project onto the circular
    // // part of the angleMarker
    // if (unitIdealAngle <= angleMarkerAngle) {
    //   //console.log("project on circular part");

    //   // project onto the circular part of the angle marker
    //   this.tmpVector1
    //     .crossVectors(this._vertexVector, unitIdealVector)
    //     .normalize(); // perpendicular to both vertexVector and unitIdealVector
    //   this.tmpVector1
    //     .crossVectors(this.tmpVector1, this._vertexVector)
    //     .normalize(); // perpendicular to vertexVector and in the unitIdealHalfPlane
    //   this.tmpVector2.set(0, 0, 0);
    //   this.tmpVector2.addScaledVector(
    //     this._vertexVector,
    //     Math.cos(
    //       SETTINGS.angleMarker.defaultRadius /
    //         this.store.state.zoomMagnificationFactor
    //     )
    //   );
    //   this.tmpVector2.addScaledVector(
    //     this.tmpVector1,
    //     Math.sin(
    //       SETTINGS.angleMarker.defaultRadius /
    //         this.store.state.zoomMagnificationFactor
    //     )
    //   );
    //   return this.tmpVector2;
    // } else if (angleMarkerAngle <= Math.PI) {
    //   // the angleMarker is convex

    //   // In order to determine the region where vertexVector is the closest point I need to compute the location where the perpendicular bisector of the segment
    //   // from vertex to end vector and the perpendicular bisector of the segment from vertex to start, intersect (the intersection *not* in the angle marker)

    //   this.tmpVector1
    //     .addVectors(this._vertexVector, this._endVector)
    //     .normalize(); // the midpoint of the segment from vertex to end vector
    //   this.tmpVector2.crossVectors(this._vertexVector, this._endVector); // a point on the perpendicular bisector of the segment from vertex to end vector
    //   this.tmpVector3
    //     .crossVectors(this.tmpVector1, this.tmpVector2)
    //     .normalize(); // a vector perpendicular to the plane of the perpendicular bisector of the segment from vertex to end vector

    //   this.tmpVector1
    //     .addVectors(this._vertexVector, this._startVector)
    //     .normalize(); // the midpoint of the segment from vertex to start vector
    //   this.tmpVector2.crossVectors(this._startVector, this._vertexVector); // a point on the perpendicular bisector of the segment from vertex to start vector
    //   this.tmpVector4
    //     .crossVectors(this.tmpVector2, this.tmpVector1)
    //     .normalize(); // a vector perpendicular to the plane of the perpendicular bisector of the segment from vertex to start vector

    //   this.tmpVector5
    //     .crossVectors(this.tmpVector3, this.tmpVector4)
    //     .normalize(); // the intersection point we are looking for
    //   // make sure that the intersection is *not* in the angleMarker
    //   if (this._vertexVector.dot(this.tmpVector5) > 0) {
    //     this.tmpVector5.multiplyScalar(-1);
    //   }

    //   // If the unitIdealVector is in the triangular region project onto the segment from vertexVector to endVector
    //   if (
    //     this.inRegion(
    //       this._vertexVector,
    //       this._endVector,
    //       this.tmpVector1.crossVectors(this._vertexVector, this._endVector),
    //       unitIdealVector
    //     )
    //   ) {
    //     return this.projectToSegment(
    //       this._vertexVector,
    //       this._endVector,
    //       unitIdealVector
    //     );
    //   } else if (
    //     this.inRegion(
    //       this._startVector,
    //       this._vertexVector,
    //       this.tmpVector1.crossVectors(this._startVector, this._vertexVector),
    //       unitIdealVector
    //     )
    //   ) {
    //     return this.projectToSegment(
    //       this._vertexVector,
    //       this._startVector,
    //       unitIdealVector
    //     );
    //   } else if (
    //     this.inRegion(
    //       this._vertexVector,
    //       this.tmpVector1.crossVectors(this._vertexVector, this._endVector),
    //       this.tmpVector2.crossVectors(this._startVector, this._vertexVector),
    //       unitIdealVector
    //     ) ||
    //     this.inRegion(
    //       this.tmpVector1.crossVectors(this._vertexVector, this._endVector),
    //       this.tmpVector5, // the intersection of the perpendicular bisectors of segments vertex/start and vertex/end that is not in the angleMarker
    //       this.tmpVector2.crossVectors(this._startVector, this._vertexVector),
    //       unitIdealVector
    //     )
    //   ) {
    //     return this._vertexVector;
    //   } else if (
    //     this.inRegion(
    //       this._endVector,
    //       this.tmpVector2.set(0, 0, 0).addScaledVector(this._vertexVector, -1), //antipode of the vertex vector
    //       this.tmpVector1.crossVectors(this._vertexVector, this._endVector),
    //       unitIdealVector
    //     ) ||
    //     this.inRegion(
    //       this.tmpVector1.crossVectors(this._vertexVector, this._endVector),
    //       this.tmpVector2.set(0, 0, 0).addScaledVector(this._vertexVector, -1), //antipode of the vertex vector
    //       this.tmpVector5, // the intersection of the perpendicular bisectors of segments vertex/start and vertex/end that is not in the angleMarker
    //       unitIdealVector
    //     )
    //   ) {
    //     return this._endVector;
    //   } else {
    //     return this._startVector;
    //   }
    // } else {
    //   // the angleMarker is non-convex

    //   // In order to determine the region where vertexVector is the closest point I need to compute the location where the perpendicular (through
    //   // end vector) to the segment
    //   // from vertex to end vector and the perpendicular (through the start vector) to the segment from vertex to start, intersect
    //   // (the intersection closest to the angle marker)

    //   this.tmpVector1.crossVectors(this._vertexVector, this._endVector); // a vector on the perpendicular (through endVector) of the segment from vertex to end vector (this is on ALL perpendiculars to the segment)
    //   this.tmpVector2
    //     .crossVectors(this._endVector, this.tmpVector1)
    //     .normalize(); // a vector perpendicular to the plane of the perpendicular (through the endVector) to the segment from vertex to end vector

    //   this.tmpVector1.crossVectors(this._startVector, this._vertexVector); // a vector on the perpendicular (through startVector) of the segment from vertex to start vector (this is on ALL perpendiculars to the segment)
    //   this.tmpVector3
    //     .crossVectors(this.tmpVector1, this._startVector)
    //     .normalize(); // a vector perpendicular to the plane of the perpendicular (through the endVector) to the segment from vertex to end vector

    //   this.tmpVector5
    //     .crossVectors(this.tmpVector2, this.tmpVector3)
    //     .normalize(); // the intersection point we are looking for
    //   // make sure that the intersection is pointing away from the vertex vector (THIS BREAKS DOWN IF angleMarkerRadius is bigger than Pi/2)
    //   if (this._vertexVector.dot(this.tmpVector5) > 0) {
    //     this.tmpVector5.multiplyScalar(-1);
    //   }

    //   // If the unitIdealVector is in the triangular region project onto the segment from vertexVector to endVector
    //   if (
    //     this.inRegion(
    //       this._vertexVector,
    //       this._endVector,
    //       this.tmpVector5,
    //       unitIdealVector
    //     )
    //   ) {
    //     return this.projectToSegment(
    //       this._vertexVector,
    //       this._endVector,
    //       unitIdealVector
    //     );
    //   } else if (
    //     this.inRegion(
    //       this._startVector,
    //       this._vertexVector,
    //       this.tmpVector5,
    //       unitIdealVector
    //     )
    //   ) {
    //     return this.projectToSegment(
    //       this._vertexVector,
    //       this._startVector,
    //       unitIdealVector
    //     );
    //   } else if (unitIdealAngle <= angleMarkerAngle / 2 + Math.PI) {
    //     return this._endVector;
    //   } else {
    //     return this._startVector;
    //   }
    // }
  }

  /**
   * Return the vector near the SEAngleMarkers (within SETTINGS.angleMarker.maxLabelDistance) that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestLabelLocationVector(idealUnitSphereVector: Vector3): Vector3 {
    // First find the closest point on the segment to the idealUnitSphereVector
    this.tmpVector1.copy(this.closestVector(idealUnitSphereVector));

    // If the idealUnitSphereVector is within the tolerance of the closest point, do nothing, otherwise return the vector in the plane
    //  of the idealUnitSphereVector and the closest point that is at the tolerance distance away.
    if (
      this.tmpVector1.angleTo(idealUnitSphereVector) <
      SETTINGS.angleMarker.maxLabelDistance
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
        Math.sin(SETTINGS.angleMarker.maxLabelDistance)
      );
      return this.tmpVector3
        .addScaledVector(
          this.tmpVector1,
          Math.cos(SETTINGS.angleMarker.maxLabelDistance)
        )
        .normalize();
    }
  }
  accept(v: Visitor): void {
    // v.actionOnAngleMarker(this);
  }

  /**
   * Return the normal vector to the plane containing the line that is perpendicular to this circle through the
   * sePoint, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned). This is only used if we can use the perpendicular through point tool
   * on this object. For AngleMarker we don't ever need to compute the perpendicular.
   *
   * @param sePointVector A point on the line normal to this circle
   */
  // public getNormalToLineThru(
  //   sePointVector: Vector3,
  //   oldNormal: Vector3
  // ): Vector3 {
  //   this.projectionVector.crossVectors(
  //     sePointVector,
  //     this._centerSEPoint.locationVector
  //   );
  //   // Check to see if the projectionVector is zero (i.e the center point and given point are parallel -- ether
  //   // nearly antipodal or in the same direction)
  //   if (this.projectionVector.isZero()) {
  //     // In this case any line containing the sePoint will be perpendicular to the circle, but
  //     //  we want to choose one line whose normal is near the oldNormal which was choosen to be normal
  //     //  to the plane of the center and circle points, so choose that again.
  //     this.projectionVector.crossVectors(
  //       this._centerSEPoint.locationVector,
  //       this._circleSEPoint.locationVector
  //     );
  //   }
  //   return this.projectionVector.normalize();
  // }

  /**
   * Move the the circle by moving the free points it depends on
   * Simply forming a rotation matrix mapping the previous to current sphere and applying
   * that rotation to the center and circle points of defining the circle.
   * Only needed if the object is a free object, but angleMarkers are not free
   * @param previousSphereVector Vector3 previous location on the unit ideal sphere of the mouse
   * @param currentSphereVector Vector3 current location on the unit ideal sphere of the mouse
   */
  // public move(
  //   previousSphereVector: Vector3,
  //   currentSphereVector: Vector3
  // ): void {
  //   const rotationAngle = previousSphereVector.angleTo(currentSphereVector);

  //   // If the rotation is big enough preform the rotation
  //   if (Math.abs(rotationAngle) > SETTINGS.rotate.minAngle) {
  //     // The axis of rotation
  //     this.desiredZAxis
  //       .crossVectors(previousSphereVector, currentSphereVector)
  //       .normalize();
  //     // Form the matrix that performs the rotation
  //     this.changeInPositionRotationMatrix.makeRotationAxis(
  //       this.desiredZAxis,
  //       rotationAngle
  //     );
  //     this.originOfPlaneP
  //       .copy(this.centerSEPoint.locationVector)
  //       .applyMatrix4(this.changeInPositionRotationMatrix);
  //     this.centerSEPoint.locationVector = this.originOfPlaneP;
  //     this.projectionVector
  //       .copy(this.circleSEPoint.locationVector)
  //       .applyMatrix4(this.changeInPositionRotationMatrix);
  //     this.circleSEPoint.locationVector = this.projectionVector;
  //     // Update both points, because we might need to update their kids!
  //     // First mark the kids out of date so that the update method does a topological sort
  //     this.circleSEPoint.markKidsOutOfDate();
  //     this.centerSEPoint.markKidsOutOfDate();
  //     this.circleSEPoint.update({
  //       mode: UpdateMode.DisplayOnly,
  //       stateArray: []
  //     });
  //     this.centerSEPoint.update({
  //       mode: UpdateMode.DisplayOnly,
  //       stateArray: []
  //     });
  //   }
  // }

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
   * @param startVector distinct unit vector and not the anitpode of vertexVector
   * @param vertexVector distinct unit vector
   * @param unitIdealVector distinct unit vector and not the anitpode of vertexVector
   * @returns an angle in [0,2pi)
   */
  private measureAngle(
    startVector: Vector3,
    vertexVector: Vector3,
    unitIdealVector: Vector3
  ): number {
    //  Project the idealUnitVector and the startVector onto the plane perpendicular to the vertexVector
    // through the origin of sphere then use the atan2 function (with the projections of start and unitIdeal vector)
    // to figure out the angle
    //
    // Project the unitIdealVector and the startVector onto the plane, Q, perpendicular to the vertexVector
    //  Proj_Q(vec) = vec - (vec.vertexVector)vertexVector (vertexVector is unit)

    this.measureTmpVector1.copy(unitIdealVector);
    this.measureTmpVector1.addScaledVector(
      vertexVector,
      -1 * vertexVector.dot(unitIdealVector)
    );

    this.measureTmpVector2.copy(startVector);
    this.measureTmpVector2.addScaledVector(
      vertexVector,
      -1 * vertexVector.dot(startVector)
    );

    // The vector measureTmpVector2.normalize is the vector that is positive unit x-axis that determine the coordinates on the plane Q
    // so that the projection of the start vector is on the positive x-axis
    this.measureTmpVector2.normalize();

    // the positive unit y-axis vector is the cross product of the unit positive z axis (vertexVector) and the unit
    // positive x-axis (measureTmpVector2)
    this.measureTmpVector3
      .crossVectors(vertexVector, this.measureTmpVector2)
      .normalize();

    //NOTE: the syntax for atan2 is atan2(y,x) and the return is in (-pi,pi]!!!!!
    return Math.atan2(
      this.measureTmpVector3.dot(this.measureTmpVector1),
      this.measureTmpVector2.dot(this.measureTmpVector1)
    ).modTwoPi();
  }

  // WHAT IS BELOW MIGHT BE USEFUL FOR A FUTURE SESEGMENTOFCIRCLE object, but is to precise because the
  // angle marker is so small
  //
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

  // WHAT IS BELOW MIGHT BE USEFUL FOR A FUTURE SESEGMENTOFCIRCLE object, but is to precise because the
  // angle marker is so small
  //
  /**
   * Project the vec to the segment (with length less than Pi) from start to end vectors.
   *  If this method is called we KNOW that the closest point on the segment to vec is on the segment
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

    return tmpVector.normalize().cross(perp);
  }

  // Override the isLabelable method in SEExpression
  public isLabelable(): boolean {
    return true;
  }
}
