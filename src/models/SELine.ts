import { SENodule } from "./SENodule";
import Line from "@/plottables/Line";
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
// import  SENoduleItem  from "*.vue";
// import magnificationLevel from "*.vue";
import { SEStore } from "@/store";
import i18n from "@/i18n";
import {
  DEFAULT_LINE_BACK_STYLE,
  DEFAULT_LINE_FRONT_STYLE
} from "@/types/Styles";

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_LINE_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_LINE_BACK_STYLE)
]);

export class SELine extends SENodule
  implements Visitable, OneDimensional, Labelable {
  /**
   * The corresponding plottable TwoJS object
   */
  public ref: Line;
  /**
   * Pointer to the label of this SESegment
   */
  public label?: SELabel;
  /**
   * The model SE object that is one point on the line
   */
  protected _startSEPoint: SEPoint;
  /**
   * The model SE object that is a second point on the line
   */
  protected _endSEPoint: SEPoint;
  /**
   * The Vector3 that the normal vector to the plane of the line
   */
  protected _normalVector = new Vector3();
  /** Temporary vectors to help with calculations */
  protected tmpVector = new Vector3(); //
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();
  private tmpVector3 = new Vector3();
  private desiredZAxis = new Vector3();
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

    SELine.LINE_COUNT++;
    this.name = `Li${SELine.LINE_COUNT}`;
  }

  customStyles(): Set<string> {
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

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.lineThrough`, {
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
    // Is the sphereVector is perpendicular to the line normal?
    return (
      Math.abs(unitIdealVector.dot(this._normalVector)) <
      SETTINGS.line.hitIdealDistance / currentMagnificationFactor
    );
  }

  /**
   * Return the vector on the SELine that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    // The normal to the plane of the normal vector and the idealUnitVector
    this.tmpVector.crossVectors(this._normalVector, idealUnitSphereVector);

    // Check to see if the tmpVector is zero (i.e the normal and  idealUnit vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
      return this._endSEPoint.locationVector; // An arbitrary point will do as all points are equally far away
    } else {
      // Make the tmpVector unit
      this.tmpVector.normalize();
      return this.tmpVector.cross(this._normalVector).normalize();
    }
  }

  /**
   * Return the vector near the SELine (within SETTINGS.line.maxLabelDistance) that is closest to the idealUnitSphereVector
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
      SETTINGS.line.maxLabelDistance / mag
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
        Math.sin(SETTINGS.line.maxLabelDistance / mag)
      );
      return this.tmpVector2
        .addScaledVector(
          this.tmpVector,
          Math.cos(SETTINGS.line.maxLabelDistance / mag)
        )
        .normalize();
    }
  }

  /**
   * Return the normal vector to the plane containing the line that is perpendicular to this line through the
   * sePoint, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned)
   * @param sePoint A point on the line normal to this circle
   */
  public getNormalsToPerpendicularLinesThru(
    sePointVector: Vector3,
    oldNormal: Vector3
  ): NormalVectorAndTValue[] {
    this.tmpVector3.set(0, 0, 0);
    this.tmpVector3.crossVectors(sePointVector, this._normalVector);
    // Check to see if the tmpVector is zero (i.e the normal vector and given point are parallel -- ether
    // nearly antipodal or in the same direction)

    if (this.tmpVector3.isZero(SETTINGS.nearlyAntipodalIdeal)) {
      // console.log("get normals to line thru temp is zero");
      // In this case any line containing the sePoint will be perpendicular to the line, but
      //  we want to choose one line whose normal is near the oldNormal and perpendicular to sePointVector
      // So project the oldNormal vector onto the plane perpendicular to sePointVector
      this.tmpVector3
        .copy(oldNormal)
        .addScaledVector(sePointVector, -1 * oldNormal.dot(sePointVector))
        .normalize();

      // if (oldNormal.angleTo(this.tmpVector3) > 0.01) {
      // console.log(
      //   "change in normal vector in getNormalsToPerpendicularLinesThru",
      //   oldNormal.angleTo(this.tmpVector3)
      // );
      // }
    }
    this.tmpVector3.normalize();
    // console.log("here x", this.tmpVector3.x);

    return [{ normal: this.tmpVector3, tVal: NaN }];
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
      // Given an set of this.startPoint, this.endPoint and (old) this.normalVector, and compute the next normal vector
      // Compute a temporary normal from the two points
      this.tmpVector.crossVectors(
        this._startSEPoint.locationVector,
        this._endSEPoint.locationVector
      );
      // Check to see if the tempNormal is zero (i.e the start and end vectors are parallel -- ether
      // nearly antipodal or in the same direction)
      if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
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

      this._normalVector.copy(this.tmpVector).normalize();

      // Set the normal vector in the plottable object (the setter also calls the updateDisplay() method)
      this.ref.normalVector = this._normalVector;
      // this.ref.updateDisplay();
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }

    // Lines are NOT completely determined by their parents so we store additional information
    // If the parent points of the line are antipodal, the normal vector determines the
    // plane of the line.
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Line with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      const normal = new Vector3();
      normal.copy(this._normalVector);
      objectState.set(this.id, {
        kind: "line",
        object: this,
        normalVector: normal
      });
    }

    this.updateKids(objectState, orderedSENoduleList);
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
    //  to currentSphereVector (i.e. just rotate the line)
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
        this.startSEPoint.markKidsOutOfDate();
        this.endSEPoint.markKidsOutOfDate();
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
      // Rotate the freeEnd by the rotation angle around the axisOfRotation
      const axisOfRotation = pivot.locationVector;
      // Test for antipodal endpoints
      if (
        this.tmpVector1
          .addVectors(freeEnd.locationVector, pivot.locationVector)
          .isZero(SETTINGS.nearlyAntipodalIdeal)
      ) {
        // Set the direction of the rotation correctly for moving the normalVector
        rotationAngle *= currentSphereVector.z < 0 ? -1 : 1;
        // If the end points are antipodal move the normal vector
        this.tmpVector1.copy(this.normalVector);
        this.tmpVector1.applyAxisAngle(axisOfRotation, rotationAngle);
        this.normalVector = this.tmpVector1;
        this.markKidsOutOfDate();
        this.update();
      } else {
        // For non-antipodal points move the freeEnd
        this.tmpVector1.copy(freeEnd.locationVector);
        this.tmpVector1.applyAxisAngle(axisOfRotation, rotationAngle);
        freeEnd.locationVector = this.tmpVector1;
        // First mark the kids out of date so that the update method does a topological sort
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

  public isLabelable(): boolean {
    return true;
  }

  public isLineWithAntipodalPoints(): boolean {
    if (
      Math.abs(
        this._endSEPoint.locationVector.angleTo(
          this._startSEPoint.locationVector
        ) - Math.PI
      ) < SETTINGS.line.closeEnoughToPi
    ) {
      return true;
    } else {
      return false;
    }
  }
}
