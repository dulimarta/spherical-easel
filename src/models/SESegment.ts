import { SENodule } from "./SENodule";
import Segment from "@/plottables/Segment";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";
import SETTINGS from "@/global-settings";
import {
  OneDimensional,
  Labelable,
  NormalVectorAndTValue,
  ObjectState
} from "@/types";
import { SELabel } from "@/models/SELabel";
import {
  DEFAULT_SEGMENT_BACK_STYLE,
  DEFAULT_SEGMENT_FRONT_STYLE
} from "@/types/Styles";
import { SEStore } from "@/store";
import i18n from "@/i18n";

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_SEGMENT_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_SEGMENT_BACK_STYLE)
]);

export class SESegment extends SENodule
  implements Visitable, OneDimensional, Labelable {
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public ref: Segment;
  /**
   * Pointer to the label of this SESegment import { SELabel } from "@/models/SELabel";
   */
  public label?: SELabel;
  /**
   * The model SE object that is the start of the segment
   */
  private _startSEPoint: SEPoint;

  /**
   * The model SE object that is the end of the segment
   */
  private _endSEPoint: SEPoint;

  /**
   * The Vector3 normal to the plane containing the segment.
   * NOTE: normalVector x startVector*(arcLength > pi ? -1 :1) give the direction in which the segment is drawn
   */
  private _normalVector = new Vector3();
  /**
   * The arcLength of the segment
   */
  private _arcLength = 0;

  /**
   * To update from one position to another (i.e. from one update() to the next), we need to remember if the
   * SEEndPoint were nearlyAntipodal or not. See "Right here is why we need this from one update to the next!" in the
   * comments below.
   */
  private nearlyAntipodal = false;

  /* Temporary vectors to help with calculuations */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();
  private desiredZAxis = new Vector3();
  private toVector = new Vector3();

  /**
   * Create a model SESegment using:
   * @param seg  The plottable TwoJS Object associated to this object
   * @param segmentStartSEPoint The model SEPoint object that is the start of the segment
   * @param segmentNormalVector The vector3 that is perpendicular to the plane containing the segment
   * @param segmentArcLength The arcLength number of the segment
   * @param segmentEndSEPoint The model SEPoint object that is the end of the segment
   */
  constructor(
    seg: Segment,
    segmentStartSEPoint: SEPoint,
    segmentNormalVector: Vector3,
    segmentArcLength: number,
    segmentEndSEPoint: SEPoint
  ) {
    super();
    this.ref = seg;
    this._startSEPoint = segmentStartSEPoint;
    this._normalVector.copy(segmentNormalVector);
    this._arcLength = segmentArcLength;
    this._endSEPoint = segmentEndSEPoint;

    SENodule.SEGMENT_COUNT++;
    this.name = `Ls${SENodule.SEGMENT_COUNT}`;
  }

  customStyles(): Set<string> {
    return styleSet;
  }

  accept(v: Visitor): void {
    v.actionOnSegment(this);
  }

  get startSEPoint(): SEPoint {
    return this._startSEPoint;
  }

  get endSEPoint(): SEPoint {
    return this._endSEPoint;
  }

  // Used in the SegmentNormalArcLengthVisitor and MoveSegmentCommand (and move when the endpoints are antipodal)
  // Use with caution! The normal vector is normal computed from the startSEPoint and old normal vector
  set normalVector(normal: Vector3) {
    this._normalVector.copy(normal);
  }
  get normalVector(): Vector3 {
    return this._normalVector;
  }

  get arcLength(): number {
    return this._arcLength;
  }

  set arcLength(len: number) {
    this._arcLength = len;
  }

  get longerThanPi(): boolean {
    return this._arcLength > Math.PI;
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.segmentThrough`, {
        pt1: this._startSEPoint.label?.ref.shortUserName,
        pt2: this._endSEPoint.label?.ref.shortUserName,
        normalX: this._normalVector.x.toFixed(SETTINGS.decimalPrecision),
        normalY: this._normalVector.y.toFixed(SETTINGS.decimalPrecision),
        normalZ: this._normalVector.z.toFixed(SETTINGS.decimalPrecision)
      })
    );
  }

  public get noduleItemText(): string {
    return this.label?.ref.shortUserName ?? "No Label Short Name In SELine";
  }
  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    // Is the unitIdealVector is perpendicular to the normal to the plane containing the segment?
    if (
      Math.abs(unitIdealVector.dot(this._normalVector)) >
      SETTINGS.segment.hitIdealDistance / currentMagnificationFactor
    )
      return false;

    // Is the unitIdealVector inside the radius arcLength/2 circle about the midVector?
    // NOTE: normalVector x startVector *(this.arcLength > Math.PI ? -1 : 1)
    // gives the direction in which the segment is drawn
    this.toVector
      .crossVectors(this._normalVector, this._startSEPoint.locationVector)
      .multiplyScalar(this._arcLength > Math.PI ? -1 : 1);
    // midVector = tmpVector = cos(arcLength/2)*start + sin(arcLength/2)*toVector
    this.tmpVector
      .copy(this._startSEPoint.locationVector)
      .multiplyScalar(Math.cos(this._arcLength / 2));
    this.tmpVector.addScaledVector(
      this.toVector,
      Math.sin(this._arcLength / 2)
    );

    return (
      this.tmpVector.angleTo(unitIdealVector) <
      this._arcLength / 2 +
        SETTINGS.segment.hitIdealDistance / currentMagnificationFactor
    );
  }

  /**
   * Given a unit vector in the plane containing the segment, is it on the segment?
   * @param unitIdealVector A vector *on* the line containing the segment
   */
  public onSegment(unitIdealVector: Vector3): boolean {
    // if the unitIdealVector is somehow zero return false
    if (unitIdealVector.isZero(SETTINGS.tolerance)) {
      return false;
    }
    // check the endpoints
    if (
      this.tmpVector
        .subVectors(this.startSEPoint.locationVector, unitIdealVector)
        .isZero(SETTINGS.tolerance) ||
      this.tmpVector
        .subVectors(this.endSEPoint.locationVector, unitIdealVector)
        .isZero(SETTINGS.tolerance)
    ) {
      return true;
    }

    // Is the unitIdealVector inside the radius arcLength/2 circle about the midVector?
    // this.tmpVector is the midPoint vector

    // I think that this is the David Austin way, but I don't know why it is this way
    // this.toVector
    //   .crossVectors(this._normalVector, this._startSEPoint.locationVector)
    //   .multiplyScalar(this._arcLength > Math.PI ? -1 : 1)
    //   .normalize();

    this.toVector.crossVectors(
      this._normalVector,
      this._startSEPoint.locationVector
    );

    // There are two cases depending on the arcLength
    // Case 1 ArcLength < PI
    //  In this case we want dot(toVector, end) > 0
    // Case 2 ArcLength > PI
    //  In this case we want dot(toVector, end) < 0
    // Case 3 Arclength = Pi

    if (this._arcLength > Math.PI) {
      if (this.toVector.dot(this._endSEPoint.locationVector) > 0) {
        this.toVector.multiplyScalar(-1);
      }
    } else if (this._arcLength < Math.PI) {
      if (this.toVector.dot(this._endSEPoint.locationVector) < 0) {
        this.toVector.multiplyScalar(-1);
      }
    }
    // midVector = tmpVector = cos(arcLength/2)*start + sin(arcLength/2)*this.toVector
    this.tmpVector
      .copy(this._startSEPoint.locationVector)
      .multiplyScalar(Math.cos(this._arcLength / 2));
    this.tmpVector.addScaledVector(
      this.toVector,
      Math.sin(this._arcLength / 2)
    );

    return this.tmpVector.angleTo(unitIdealVector) <= this._arcLength / 2;
  }

  /**
   * Return the vector on the SESegment that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    // The normal to the plane of the normal vector to the plane containing the segment and the idealUnitVector
    this.tmpVector1.crossVectors(this._normalVector, idealUnitSphereVector);
    // Check to see if the tmpVector is zero (i.e the normal and  idealUnit vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (this.tmpVector1.isZero(SETTINGS.nearlyAntipodalIdeal)) {
      return this._endSEPoint.locationVector; // An arbitrary point will do as all points are equally far away
    } else {
      // Make the tmpVector unit
      this.tmpVector1.normalize();
      // The vector that is closest to the idealUnitSphereVector in the plane of the segment
      this.tmpVector1.cross(this._normalVector).normalize();
      // If this tmpVector is onSegment then return it, otherwise the closest endpoint is the correct return
      if (this.onSegment(this.tmpVector1)) {
        return this.tmpVector1;
      } else if (
        this.tmpVector1.angleTo(this._startSEPoint.locationVector) <
        this.tmpVector1.angleTo(this._endSEPoint.locationVector)
      ) {
        return this._startSEPoint.locationVector;
      } else {
        return this._endSEPoint.locationVector;
      }
    }
  }

  /**
   * Return the normal vector to the plane containing the line that is perpendicular to this segment through the
   * sePoint, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned)
   * @param sePoint A point on the line normal to this circle
   */
  public getNormalsToPerpendicularLinesThru(
    sePointVector: Vector3,
    oldNormal: Vector3
  ): NormalVectorAndTValue[] {
    this.tmpVector.crossVectors(sePointVector, this._normalVector);
    // Check to see if the tmpVector is zero (i.e the center point and given point are parallel -- ether
    // nearly antipodal or in the same direction)
    if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
      // In this case any line containing the sePoint will be perpendicular to the segment, but
      //  we want to choose one line whose normal is near the oldNormal
      this.tmpVector.copy(oldNormal);
    }
    return [{ normal: this.tmpVector.normalize(), tVal: NaN }];
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this._exists = this._startSEPoint.exists && this._endSEPoint.exists;

    if (this._exists) {
      //////////////// This is  essentially setArcLengthAndNormalVector from segmentHandler/////////////////
      // Compute the normal vector from the this.startVector, the (old) normal vector and this.endVector
      // Compute a temporary normal from the two points' vectors
      this.tmpVector.crossVectors(
        this._startSEPoint.locationVector,
        this._endSEPoint.locationVector
      );
      // console.log("here", this.tmpVector.length(),this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal));
      // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
      // nearly antipodal or in the same direction)
      if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
        if (this._normalVector.length() === 0) {
          // console.log("set up");
          // The normal vector is still at its initial value so can't be used to compute the next normal, so set the
          // the normal vector to an arbitrarily chosen vector perpendicular to the start vector
          this.tmpVector.set(1, 0, 0);
          this.tmpVector.crossVectors(
            this._startSEPoint.locationVector,
            this.tmpVector
          );
          if (this.tmpVector.isZero()) {
            this.tmpVector.set(0, 1, 0);
            // The cross of startVector and (1,0,0) and (0,1,0) can't *both* be zero
            this.tmpVector.crossVectors(
              this._startSEPoint.locationVector,
              this.tmpVector
            );
          }
        } else {
          // console.log("normal exists");
          // The start and end vectors align, compute  the next normal vector from the old normal and the start vector
          this.tmpVector.crossVectors(
            this._startSEPoint.locationVector,
            this._normalVector
          );
          this.tmpVector.crossVectors(
            this.tmpVector,
            this._startSEPoint.locationVector
          );
        }
      }
      // The normal vector is now set
      this._normalVector.copy(this.tmpVector.normalize());

      // Record if the previous segment was longThanPi
      let longerThanPi = this._arcLength > Math.PI;

      // Set the arc length of the segment temporarily to the angle between start and end vectors (always less than Pi)
      this._arcLength = this._startSEPoint.locationVector.angleTo(
        this._endSEPoint.locationVector
      );

      // Check to see if the longThanPi variable needs updating.
      // First see if start and end vectors are even close to antipodal (which is when longerThanPi and nearly antipodal might need updating)
      if (
        this._startSEPoint.locationVector.angleTo(
          this._endSEPoint.locationVector
        ) > 2
      ) {
        // // The startVector and endVector might be antipodal proceed with caution,

        // // Set tmpVector to the antipode of the start Vector
        // this.tmpVector
        //   .copy(this._startSEPoint.locationVector)
        //   .multiplyScalar(-1);
        // // Check to see if the pixel distance (in the default screen plane)
        // if (
        //   this.tmpVector.angleTo(this._endSEPoint.locationVector) *
        //     SETTINGS.boundaryCircle.radius <
        //   SETTINGS.nearlyAntipodalPixel

        if (
          this.tmpVector
            .crossVectors(
              this._endSEPoint.locationVector,
              this._startSEPoint.locationVector
            )
            .isZero(SETTINGS.nearlyAntipodalIdeal)
        ) {
          // The points are antipodal on the screen
          this.nearlyAntipodal = true;
        } else {
          // Right here is why we need this from one update to the next!
          if (this.nearlyAntipodal) {
            longerThanPi = !longerThanPi;
          }
          this.nearlyAntipodal = false;
        }
      }
      // Now longerThanPi is correctly set, update the arcLength based on it
      if (longerThanPi) {
        this._arcLength = 2 * Math.PI - this._arcLength;
      }

      ////////////////////////////////////////////////////////////////////////////////////////
      this.ref.startVector = this._startSEPoint.locationVector;
      this.ref.arcLength = this._arcLength;
      this.ref.normalVector = this._normalVector;
      // update the display of the segment now that the start, normal vectors and arcLength are set, but only if showing
      this.ref.updateDisplay();
    }
    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    // Segments are determined by more than their point parents so we store additional information
    // If the parent points of the segment are antipodal, the normal vector determines the
    // plane of the segment.  The points also don't determine the arcLength of the segments.
    // Both of these quantities could change during a move therefore store normal vector and arcLength
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Segment with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      const normal = new Vector3();
      normal.copy(this._normalVector);
      objectState.set(this.id, {
        kind: "segment",
        object: this,
        normalVector: normal,
        arcLength: this.arcLength
      });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  /**
   * Return the vector near the SESegment (within SETTINGS.segment.maxLabelDistance) that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestLabelLocationVector(idealUnitSphereVector: Vector3): Vector3 {
    // First find the closest point on the segment to the idealUnitSphereVector
    this.tmpVector.copy(this.closestVector(idealUnitSphereVector));

    // The current magnification level

    const mag = SEStore.zoomMagnificationFactor;

    // If the idealUnitSphereVector is within the tolerance of the closest point, do nothing, otherwise return the vector in the plane of the ideanUnitSphereVector and the closest point that is at the tolerance distance away.
    if (
      this.tmpVector.angleTo(idealUnitSphereVector) <
      SETTINGS.segment.maxLabelDistance / mag
    ) {
      return idealUnitSphereVector;
    } else {
      // tmpVector1 is the normal to the plane of the closest point vector and the idealUnitVector
      // This can't be zero because tmpVector can be the closest on the segment to idealUnitSphereVector and parallel with ideanUnitSphereVector
      this.tmpVector1
        .crossVectors(idealUnitSphereVector, this.tmpVector)
        .normalize();
      // compute the toVector (so that tmpVector2= toVector, tmpVector= fromVector, tmpVector1 form an orthonormal frame)
      this.tmpVector2.crossVectors(this.tmpVector, this.tmpVector1).normalize;
      // return cos(SETTINGS.segment.maxLabelDistance)*fromVector/tmpVec + sin(SETTINGS.segment.maxLabelDistance)*toVector/tmpVec2
      this.tmpVector2.multiplyScalar(
        Math.sin(SETTINGS.segment.maxLabelDistance / mag)
      );

      return this.tmpVector2
        .addScaledVector(
          this.tmpVector,
          Math.cos(SETTINGS.segment.maxLabelDistance / mag)
        )
        .normalize();
    }
  }

  public getMidPointVector(): Vector3 {
    const midVector = new Vector3();
    this.toVector.crossVectors(
      this._normalVector,
      this._startSEPoint.locationVector
    );

    // There are two cases depending on the arcLength
    // Case 1 ArcLength < PI
    //  In this case we want dot(toVector, end) > 0
    // Case 2 ArcLength > PI
    //  In this case we want dot(toVector, end) < 0
    // Case 3 Arclength = Pi

    if (this._arcLength > Math.PI) {
      if (this.toVector.dot(this._endSEPoint.locationVector) > 0) {
        this.toVector.multiplyScalar(-1);
      }
    } else if (this._arcLength < Math.PI) {
      if (this.toVector.dot(this._endSEPoint.locationVector) < 0) {
        this.toVector.multiplyScalar(-1);
      }
    }
    // midVector =  cos(arcLength/2)*start + sin(arcLength/2)*this.toVector
    midVector
      .copy(this._startSEPoint.locationVector)
      .multiplyScalar(Math.cos(this._arcLength / 2));
    midVector.addScaledVector(this.toVector, Math.sin(this._arcLength / 2));
    return midVector.normalize();
  }

  /**
   * Move the segment
   * @param currentSphereVector The current location of the mouse
   * @param previousSphereVector The previous location of the mouse
   * @param altKeyPressed Controls which point defining the line or segment the line or segment rotates about
   * @param ctrlKeyPressed If pressed overrides the altKey method and just rotates the entire line/segment based on the change in mouse position.
   */
  public move(
    previousSphereVector: Vector3,
    currentSphereVector: Vector3,
    altKeyPressed: boolean,
    ctrlKeyPressed: boolean
  ): void {
    let rotationAngle;
    // If the ctrlKey Is press translate the segment in the direction of previousSphereVector
    //  to currentSphereVector (i.e. just rotate the segment)
    if (ctrlKeyPressed) {
      rotationAngle = previousSphereVector.angleTo(currentSphereVector);
      // If the rotation is big enough preform the rotation
      if (rotationAngle > SETTINGS.rotate.minAngle) {
        // The axis of rotation
        this.desiredZAxis
          .crossVectors(previousSphereVector, currentSphereVector)
          .normalize();
        // Form the matrix that performs the rotation
        // this.changeInPositionRotationMatrix.makeRotationAxis(
        //   desiredZAxis,
        //   rotationAngle
        // );
        this.tmpVector1
          .copy(this.startSEPoint.locationVector)
          .applyAxisAngle(this.desiredZAxis, rotationAngle);
        this.startSEPoint.locationVector = this.tmpVector1;
        this.tmpVector2
          .copy(this.endSEPoint.locationVector)
          .applyAxisAngle(this.desiredZAxis, rotationAngle);
        this.endSEPoint.locationVector = this.tmpVector2;
        // Update both points, because we might need to update their kids!
        // First mark the kids out of date so that the update method does a topological sort
        this.endSEPoint.markKidsOutOfDate();
        this.startSEPoint.markKidsOutOfDate();
        this.endSEPoint.update();
        this.startSEPoint.update();
      }
    } else {
      let pivot = this.startSEPoint;
      let freeEnd = this.endSEPoint;
      if (altKeyPressed) {
        pivot = this.endSEPoint;
        freeEnd = this.startSEPoint;
      }

      // We want to measure the rotation angle with respect to the rotationAxis
      // Essentially we rotate a plane "hinged" at the rotationAxis so
      // the angle of rotation must be measure as the amount of changes of the
      // plane normal vector

      // Determine the normal vector to the plane containing the pivot and the previous position
      this.tmpVector1
        .crossVectors(pivot.locationVector, previousSphereVector)
        .normalize();
      // Determine the normal vector to the plane containing the pivot and the current position
      this.tmpVector2
        .crossVectors(pivot.locationVector, currentSphereVector)
        .normalize();
      // The angle between tmpVector1 and tmpVector2 is the distance to move on the Ideal Unit Sphere
      rotationAngle = this.tmpVector1.angleTo(this.tmpVector2);

      // Determine which direction to rotate.
      this.tmpVector1.cross(this.tmpVector2);
      rotationAngle *= Math.sign(this.tmpVector1.z);

      // Reverse the direction of the rotation if the current points is on the back of the sphere
      if (currentSphereVector.z < 0) {
        rotationAngle *= -1;
      }

      // If the pivot and currentSphereVector are on opposite side of the sphere, reverse the direction
      if (currentSphereVector.z * pivot.locationVector.z < 0) {
        rotationAngle *= -1;
      }

      //console.log("rotate angle", rotationAngle);
      // Rotate the freeEnd by the rotation angle around the axisOfRotation
      const axisOfRotation = pivot.locationVector;
      // Test for antipodal endpoints
      if (
        this.tmpVector1
          .crossVectors(freeEnd.locationVector, pivot.locationVector)
          .isZero(SETTINGS.nearlyAntipodalIdeal)
      ) {
        //console.log("parallel free and pivot");
        // Set the direction of the rotation correctly for moving the normalvector
        rotationAngle *= currentSphereVector.z < 0 ? -1 : 1;
        // If the end points are antipodal move the normal vector
        this.tmpVector1.copy(this.normalVector);
        this.tmpVector1.applyAxisAngle(axisOfRotation, rotationAngle);
        // console.log(
        //   "normal rotated",
        //   this.tmpVector1.angleTo(this.normalVector)
        // );
        this.normalVector = this.tmpVector1;
        //Mark kids out of date so that the update method does a topological sort
        this.markKidsOutOfDate();
        this.update();
      } else {
        //console.log("not parallel free and pivot");
        // For non-antipodal points move the freeEnd
        this.tmpVector1.copy(freeEnd.locationVector);
        this.tmpVector1.applyAxisAngle(axisOfRotation, rotationAngle);
        freeEnd.locationVector = this.tmpVector1;
        // First mark the kids out of date so that the update method does a topological sort
        freeEnd.markKidsOutOfDate();
        pivot.markKidsOutOfDate();
        freeEnd.update();
        pivot.update();
      }
    }
  }

  public isOneDimensional(): boolean {
    return true;
  }

  public isSegmentOfLengthPi(): boolean {
    return (
      Math.abs(this._arcLength - Math.PI) < SETTINGS.segment.closeEnoughToPi
    );
  }
  public isLabelable(): boolean {
    return true;
  }
}
