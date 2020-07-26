import { SENodule } from "./SENodule";
import Line from "@/plottables/Line";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { SEPoint } from "./SEPoint";
import SETTINGS from "@/global-settings";
import { OneDimensional } from "@/types";
import { Styles } from "@/types/Styles";
import { UpdateMode, UpdateStateType, LineState } from "@/types";

/** Temporary vectors to help with calculations */
const tmpVector = new Vector3(); //
const tmpVector1 = new Vector3();
const tmpVector2 = new Vector3();
const desiredZAxis = new Vector3();

let LINE_COUNT = 0;
const styleSet = new Set([
  Styles.strokeWidthPercentage,
  Styles.strokeColor,
  Styles.dashPattern
]);
export class SELine extends SENodule implements Visitable, OneDimensional {
  /**
   * The corresponding plottable TwoJS object
   */
  public ref: Line;
  /**
   * The model SE object that is one point on the line
   */
  private _startSEPoint: SEPoint;
  /**
   * The model SE object that is a second point on the line
   */
  private _endSEPoint: SEPoint;
  /**
   * The Vector3 that the normal vector to the plane of the line
   */
  private _normalVector = new Vector3();

  /**
   * Create an SELine
   * @param line plottable (TwoJS) line associated with this line
   * @param lineStartSEPoint One Point on the line
   * @param normalVector The normal vector to the plane containing the line
   * @param lineEndSEPoint A second Point on the line
   */
  constructor(
    line: Line,
    lineStartSEPoint: SEPoint,
    normalVector: Vector3,
    lineEndSEPoint: SEPoint
  ) {
    super();
    this.ref = line;
    this._startSEPoint = lineStartSEPoint;
    this._normalVector.copy(normalVector);
    this._endSEPoint = lineEndSEPoint;

    LINE_COUNT++;
    this.name = `Li-${LINE_COUNT}`;
  }

  customStyles(): Set<Styles> {
    return styleSet;
  }

  accept(v: Visitor): void {
    v.actionOnLine(this);
  }

  get normalVector(): Vector3 {
    return this._normalVector;
  }

  set normalVector(normalVec: Vector3) {
    this._normalVector.copy(normalVec);
  }

  get startSEPoint(): SEPoint {
    return this._startSEPoint;
  }

  get endSEPoint(): SEPoint {
    return this._endSEPoint;
  }

  public isHitAt(unitIdealVector: Vector3): boolean {
    // Is the sphereVector is perpendicular to the line normal?
    return Math.abs(unitIdealVector.dot(this._normalVector)) < 1e-2;
  }

  /**
   * Return the vector on the SELine that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    // The normal to the plane of the normal vector and the idealUnitVector
    tmpVector.crossVectors(this._normalVector, idealUnitSphereVector);

    // Check to see if the tmpVector is zero (i.e the normal and  idealUnit vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (tmpVector.isZero()) {
      return this._endSEPoint.locationVector; // An arbitrary point will do as all points are equally far away
    } else {
      // Make the tmpVector unit
      tmpVector.normalize();
      return tmpVector.cross(this._normalVector).normalize();
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
      // Given an set of this.startPoint, this.endPoint and (old) this.normalVector, and compute the next normal vector
      // Compute a temporary normal from the two points
      tmpVector.crossVectors(
        this._startSEPoint.locationVector,
        this._endSEPoint.locationVector
      );
      // Check to see if the tempNormal is zero (i.e the start and end vectors are parallel -- ether
      // nearly antipodal or in the same direction)
      if (tmpVector.isZero()) {
        // The start and end vectors align, compute  the next normal vector from the old normal and the start vector
        tmpVector.crossVectors(
          this._startSEPoint.locationVector,
          this._normalVector
        );
        tmpVector.crossVectors(tmpVector, this._startSEPoint.locationVector);
      }

      this._normalVector.copy(tmpVector).normalize();

      // Set the normal vector in the plottable object (the setter also calls the updateDisplay() method)
      this.ref.normalVector = this._normalVector;
      if (this.showing) {
        this.ref.updateDisplay();
        this.ref.setVisible(true);
      } else {
        this.ref.setVisible(false);
      }
    } else {
      this.ref.setVisible(false);
    }
    // Create a line state for a Move or delete if necessary
    if (
      state.mode == UpdateMode.RecordStateForDelete ||
      state.mode == UpdateMode.RecordStateForMove
    ) {
      // If the parent points of the segment are antipodal, the normal vector determines the
      // plane of the segment.  The points also don't determine the arcLength of the segments.
      // Both of these quantities could change during a move therefore store normal vector and arcLength
      // in stateArray for undo move. (No need to store the parent points, they will be updated on their own
      // before this line is updated.) Store the coordinate values of the vector and not the point to the vector.
      const segState: LineState = {
        kind: "line",
        object: this,
        normalVectorX: this._normalVector.x,
        normalVectorY: this._normalVector.y,
        normalVectorZ: this._normalVector.z
      };
      state.stateArray.push(segState);
    }
    this.updateKids(state);
  }

  /**
   * Move the line
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
        // First mark the kids out of date so that the update method does a topological sort
        this.startSEPoint.markKidsOutOfDate();
        this.endSEPoint.markKidsOutOfDate();
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
        // Set the direction of the rotation correctly for moving the normalVector
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
        // First mark the kids out of date so that the update method does a topological sort
        // First mark the kids out of date so that the update method does a topological sort
        freeEnd.markKidsOutOfDate();
        pivot.markKidsOutOfDate();
        freeEnd.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
        pivot.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      }
    }
  }
}
