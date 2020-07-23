import { SENodule } from "./SENodule";
import Segment from "@/plottables/Segment";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";
import SETTINGS from "@/global-settings";
import { OneDimensional, SegmentState } from "@/types";
import { UpdateMode, UpdateStateType } from "@/types";

import { Styles } from "@/types/Styles";

let SEGMENT_COUNT = 0;
const styleSet = new Set([
  Styles.strokeWidth,
  Styles.strokeColor,
  Styles.dashPattern
]);
const tmpVector = new Vector3();
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();
const desiredZAxis = new Vector3();
const toVector = new Vector3();

export class SESegment extends SENodule implements Visitable, OneDimensional {
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public ref: Segment;
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

    SEGMENT_COUNT++;
    this.name = `Ls-${SEGMENT_COUNT}`;
  }

  customStyles(): Set<Styles> {
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

  public isHitAt(unitIdealVector: Vector3): boolean {
    // Is the unitIdealVector is perpendicular to the normal to the plane containing the segment?
    if (Math.abs(unitIdealVector.dot(this._normalVector)) > 1e-2) return false;

    // Is the unitIdealVector inside the radius arcLength/2 circle about the midVector?
    // NOTE: normalVector x startVector *(this.arcLength > Math.PI ? -1 : 1)
    // gives the direction in which the segment is drawn
    toVector
      .crossVectors(this._normalVector, this._startSEPoint.locationVector)
      .multiplyScalar(this._arcLength > Math.PI ? -1 : 1);
    // midVector = tmpVector = cos(arcLength/2)*start + sin(arcLength/2)*toVector
    tmpVector
      .copy(this._startSEPoint.locationVector)
      .multiplyScalar(Math.cos(this._arcLength / 2));
    tmpVector.addScaledVector(toVector, Math.sin(this._arcLength / 2));

    return (
      tmpVector.angleTo(unitIdealVector) <
      this._arcLength / 2 + SETTINGS.segment.hitIdealDistance
    );
  }

  /**
   * Given a unit vector in the plane containing the segment, is it on the segment?
   * @param unitIdealVector A vector *on* the line containing the segment
   */
  public onSegment(unitIdealVector: Vector3): boolean {
    // Is the unitIdealVector inside the radius arcLength/2 circle about the midVector?
    // NOTE: normalVector x startVector * (this.arcLength > Math.PI ? -1 : 1)
    // gives the direction in which the segment is drawn

    toVector
      .crossVectors(this._normalVector, this._startSEPoint.locationVector)
      .multiplyScalar(this._arcLength > Math.PI ? -1 : 1);
    // midVector = tmpVector = cos(arcLength/2)*start + sin(arcLength/2)*this.toVector
    tmpVector
      .copy(this._startSEPoint.locationVector)
      .multiplyScalar(Math.cos(this._arcLength / 2));
    tmpVector.addScaledVector(toVector, Math.sin(this._arcLength / 2));

    // console.debug("start vec", this._startSEPoint.locationVector.toFixed(2));
    // console.debug("toVector", this.toVector.toFixed(2));
    // console.debug("arclengh", this.arcLength);
    // console.debug("midPoint", this.tmpVector.toFixed(2));

    return tmpVector.angleTo(unitIdealVector) <= this._arcLength / 2;
  }

  /**
   * Return the vector on the SESegment that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    // The normal to the plane of the normal vector to the plane containing the segment and the idealUnitVector
    tmpVector1.crossVectors(this._normalVector, idealUnitSphereVector);
    // Check to see if the tmpVector is zero (i.e the normal and  idealUnit vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (tmpVector1.isZero()) {
      return this._endSEPoint.locationVector; // An arbitrary point will do as all points are equally far away
    } else {
      // Make the tmpVector (soon to be the to vector) unit
      tmpVector1.normalize();
      // The vector that is closest to the idealUnitSphereVector in the plane of the segment
      tmpVector1.cross(this._normalVector).normalize();
      // If this tmpVector is onSegment then return it, otherwise the closest endpoint is the correct return
      if (this.onSegment(tmpVector1)) {
        return tmpVector1;
      } else if (
        tmpVector1.angleTo(this._startSEPoint.locationVector) <
        tmpVector1.angleTo(this._endSEPoint.locationVector)
      ) {
        return this._startSEPoint.locationVector;
      } else {
        return this._endSEPoint.locationVector;
      }
    }
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this._exists = this._startSEPoint.exists && this._endSEPoint.exists;
    if (this._exists) {
      //////////////// This is  essentially setArcLengthAndNormalVector from segmentHandler/////////////////
      // Compute the normal vector from the this.startVector, the (old) normal vector and this.endVector
      // Compute a temporary normal from the two points' vectors
      tmpVector.crossVectors(
        this._startSEPoint.locationVector,
        this._endSEPoint.locationVector
      );
      // Check to see if the temporary normal is zero (i.e the start and end vectors are parallel -- ether
      // nearly antipodal or in the same direction)
      if (tmpVector.isZero()) {
        // Make the tmpVector (soon to be the to vector) unit
        tmpVector.normalize();
        if (this._normalVector.length() == 0) {
          // The normal vector is still at its initial value so can't be used to compute the next normal, so set the
          // the normal vector to an arbitrarily chosen vector perpendicular to the start vector
          tmpVector.set(1, 0, 0);
          tmpVector.crossVectors(this._startSEPoint.locationVector, tmpVector);
          if (tmpVector.isZero()) {
            tmpVector.set(0, 1, 0);
            // The cross or startVector and (1,0,0) and (0,1,0) can't *both* be zero
            tmpVector.crossVectors(
              this._startSEPoint.locationVector,
              tmpVector
            );
          }
        } else {
          // The start and end vectors align, compute  the next normal vector from the old normal and the start vector
          tmpVector.crossVectors(
            this._startSEPoint.locationVector,
            this._normalVector
          );
          tmpVector.crossVectors(tmpVector, this._startSEPoint.locationVector);
        }
      }
      // The normal vector is now set
      this._normalVector.copy(tmpVector).normalize();

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
        // The startVector and endVector might be antipodal proceed with caution,
        // Set tmpVector to the antipode of the start Vector
        tmpVector.copy(this._startSEPoint.locationVector).multiplyScalar(-1);
        // Check to see if the pixel distance (in the default screen plane)
        if (
          tmpVector.angleTo(this._endSEPoint.locationVector) *
            SETTINGS.boundaryCircle.radius <
          SETTINGS.nearlyAntipodalPixel
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
      if (this.showing) {
        this.ref.updateDisplay();
        this.ref.setVisible(true);
      } else {
        this.ref.setVisible(false);
      }
    } else {
      this.ref.setVisible(false);
    }
    // Record the segment state for a Move or delete if necessary
    if (state.mode == UpdateMode.RecordState) {
      // If the parent points of the segment are antipodal, the normal vector determines the
      // plane of the segment.  The points also don't determine the arcLength of the segments.
      // Both of these quantities could change during a move therefore store normal vector and arcLength
      // in stateArray for undo move. (No need to store the parent points, they will be updated on their own
      // before this line is updated.) Store the coordinate values of the vector and not the pointer to the vector.
      const segState: SegmentState = {
        kind: "segment",
        object: this,
        normalVectorX: this._normalVector.x,
        normalVectorY: this._normalVector.y,
        normalVectorZ: this._normalVector.z,
        arcLength: this._arcLength
      };
      state.stateArray.push(segState);
    }

    this.updateKids(state);
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
        desiredZAxis
          .crossVectors(previousSphereVector, currentSphereVector)
          .normalize();
        // Form the matrix that performs the rotation
        // this.changeInPositionRotationMatrix.makeRotationAxis(
        //   desiredZAxis,
        //   rotationAngle
        // );
        tmpVector1
          .copy(this.startSEPoint.locationVector)
          .applyAxisAngle(desiredZAxis, rotationAngle);
        this.startSEPoint.locationVector = tmpVector1;
        tmpVector2
          .copy(this.endSEPoint.locationVector)
          .applyAxisAngle(desiredZAxis, rotationAngle);
        this.endSEPoint.locationVector = tmpVector2;
        // Update both points, because we might need to update their kids!
        this.endSEPoint.update({
          mode: UpdateMode.DisplayOnly,
          stateArray: []
        });
        this.startSEPoint.update({
          mode: UpdateMode.DisplayOnly,
          stateArray: []
        });
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
      tmpVector1
        .crossVectors(pivot.locationVector, previousSphereVector)
        .normalize();
      // Determine the normal vector to the plane containing the pivot and the current position
      tmpVector2
        .crossVectors(pivot.locationVector, currentSphereVector)
        .normalize();
      // The angle between tmpVector1 and tmpVector2 is the distance to move on the Ideal Unit Sphere
      rotationAngle = tmpVector1.angleTo(tmpVector2);

      // Determine which direction to rotate.
      tmpVector1.cross(tmpVector2);
      rotationAngle *= Math.sign(tmpVector1.z);

      // Reverse the direction of the rotation if the current points is on the back of the sphere
      if (currentSphereVector.z < 0) {
        rotationAngle *= -1;
      }

      // Rotate the freeEnd by the rotation angle around the axisOfRotation
      const axisOfRotation = pivot.locationVector;
      // Test for antipodal endpoints
      if (
        tmpVector1
          .addVectors(freeEnd.locationVector, pivot.locationVector)
          .isZero()
      ) {
        // Set the direction of the rotation correctly for moving the normalvector
        rotationAngle *= currentSphereVector.z < 0 ? -1 : 1;
        // If the end points are antipodal move the normal vector
        tmpVector1.copy(this.normalVector);
        tmpVector1.applyAxisAngle(axisOfRotation, rotationAngle);
        this.normalVector = tmpVector1;
        this.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      } else {
        // For non-antipodal points move the freeEnd
        tmpVector1.copy(freeEnd.locationVector);
        tmpVector1.applyAxisAngle(axisOfRotation, rotationAngle);
        freeEnd.locationVector = tmpVector1;
        freeEnd.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
        pivot.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      }
    }
  }
}
