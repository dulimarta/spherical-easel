import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Circle from "@/plottables/Circle";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { OneDimensional } from "@/types";
import SETTINGS from "@/global-settings";
import { Styles } from "@/types/Styles";
import { UpdateMode, UpdateStateType, CircleState } from "@/types";
import { Labelable } from "@/types";
import { SELabel } from "@/models/SELabel";

let CIRCLE_COUNT = 0;

const styleSet = new Set([
  Styles.strokeColor,
  Styles.strokeWidthPercent,
  Styles.dashArray,
  Styles.fillColor,
  Styles.opacity,
  Styles.dynamicBackStyle
]);
export class SECircle extends SENodule
  implements Visitable, OneDimensional, Labelable {
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public ref!: Circle;
  /**
   * Pointer to the label of this SESegment
   */
  public label?: SELabel;
  /**
   * The model SE object that is the center of the circle
   */
  private _centerSEPoint: SEPoint;
  /**
   * The model SE object that is on the circle
   */
  private _circleSEPoint: SEPoint;

  /**
   * Used during this.move(): A matrix that is used to indicate the *change* in position of the
   * circle on the sphere.
   */
  private changeInPositionRotationMatrix: Matrix4 = new Matrix4();
  /** Use in the rotation matrix during a move event */
  private desiredZAxis = new Vector3();
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();

  // #region circleConstructor
  /**
   * Create a model SECircle using:
   * @param circ The plottable TwoJS Object associated to this object
   * @param centerPoint The model SEPoint object that is the center of the circle
   * @param circlePoint The model SEPoint object that is on the circle
   */
  constructor(circ: Circle, centerPoint: SEPoint, circlePoint: SEPoint) {
    super();
    this.ref = circ;
    this._centerSEPoint = centerPoint;
    this._circleSEPoint = circlePoint;

    CIRCLE_COUNT++;
    this.name = `C-${CIRCLE_COUNT}`;
  }
  // #endregion circleConstructor

  customStyles(): Set<Styles> {
    return styleSet;
  }

  get centerSEPoint(): SEPoint {
    return this._centerSEPoint;
  }

  get circleSEPoint(): SEPoint {
    return this._circleSEPoint;
  }

  get circleRadius(): number {
    return this._circleSEPoint.locationVector.angleTo(
      this._centerSEPoint.locationVector
    );
  }

  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    const angleToCenter = unitIdealVector.angleTo(
      this._centerSEPoint.locationVector
    );
    return (
      Math.abs(angleToCenter - this.circleRadius) <
      SETTINGS.circle.hitIdealDistance / currentMagnificationFactor
    );
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this._exists = this._centerSEPoint.exists && this._circleSEPoint.exists;
    if (this._exists) {
      //update the centerVector and the radius
      const newRadius = this._centerSEPoint.locationVector.angleTo(
        this._circleSEPoint.locationVector
      );
      this.ref.circleRadius = newRadius;
      this.ref.centerVector = this._centerSEPoint.locationVector;
      // display the new circle with the updated values
      this.ref.updateDisplay();
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // These circles are completely determined by their point parents and an update on the parents
    // will cause this circle to be put into the correct location. Therefore there is no need to
    // store it in the stateArray for undo move. Only store for delete

    if (state.mode == UpdateMode.RecordStateForDelete) {
      const pointState: CircleState = {
        kind: "circle",
        object: this
      };
      state.stateArray.push(pointState);
    }

    this.updateKids(state);
  }

  /**
   * Return the vector on the SECircle that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    // The normal to the plane of the center and the idealUnitVector
    this.tmpVector.crossVectors(
      this._centerSEPoint.locationVector,
      idealUnitSphereVector
    );
    // Check to see if the tmpVector is zero (i.e the center and  idealUnit vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (this.tmpVector.isZero()) {
      return this._circleSEPoint.locationVector; // An arbitrary point will do as all points are equally far away
    } else {
      // Make the tmpVector (soon to be the to vector) unit
      this.tmpVector.normalize();
      // A vector perpendicular to the center vector in the direction of the idealUnitSphereVector
      this.tmpVector.cross(this._centerSEPoint.locationVector).normalize();
      // The closest point is cos(arcLength)*this._centerSEPoint.locationVector+ sin(arcLength)*this.tmpVector
      this.tmpVector.multiplyScalar(Math.sin(this.circleRadius));
      this.tmpVector
        .addScaledVector(
          this._centerSEPoint.locationVector,
          Math.cos(this.circleRadius)
        )
        .normalize();
      return this.tmpVector;
    }
  }
  /**
   * Return the vector near the SECircle (within SETTINGS.circle.maxLabelDistance) that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestLabelLocationVector(idealUnitSphereVector: Vector3): Vector3 {
    // First find the closest point on the segment to the idealUnitSphereVector
    this.tmpVector.copy(this.closestVector(idealUnitSphereVector));

    // If the idealUnitSphereVector is within the tolerance of the closest point, do nothing, otherwise return the vector in the plane of the ideanUnitSphereVector and the closest point that is at the tolerance distance away.
    if (
      this.tmpVector.angleTo(idealUnitSphereVector) <
      SETTINGS.circle.maxLabelDistance
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
        Math.sin(SETTINGS.circle.maxLabelDistance)
      );
      return this.tmpVector2
        .addScaledVector(
          this.tmpVector,
          Math.cos(SETTINGS.circle.maxLabelDistance)
        )
        .normalize();
    }
  }
  accept(v: Visitor): void {
    v.actionOnCircle(this);
  }

  /**
   * Move the the circle by moving the free points it depends on
   * Simply forming a rotation matrix mapping the previous to current sphere and applying
   * that rotation to the center and circle points of defining the circle.
   * @param previousSphereVector Vector3 previous location on the unit ideal sphere of the mouse
   * @param currentSphereVector Vector3 current location on the unit ideal sphere of the mouse
   */
  public move(
    previousSphereVector: Vector3,
    currentSphereVector: Vector3
  ): void {
    const rotationAngle = previousSphereVector.angleTo(currentSphereVector);

    // If the rotation is big enough preform the rotation
    if (Math.abs(rotationAngle) > SETTINGS.rotate.minAngle) {
      // The axis of rotation
      this.desiredZAxis
        .crossVectors(previousSphereVector, currentSphereVector)
        .normalize();
      // Form the matrix that performs the rotation
      this.changeInPositionRotationMatrix.makeRotationAxis(
        this.desiredZAxis,
        rotationAngle
      );
      this.tmpVector1
        .copy(this.centerSEPoint.locationVector)
        .applyMatrix4(this.changeInPositionRotationMatrix);
      this.centerSEPoint.locationVector = this.tmpVector1;
      this.tmpVector
        .copy(this.circleSEPoint.locationVector)
        .applyMatrix4(this.changeInPositionRotationMatrix);
      this.circleSEPoint.locationVector = this.tmpVector;
      // Update both points, because we might need to update their kids!
      // First mark the kids out of date so that the update method does a topological sort
      this.circleSEPoint.markKidsOutOfDate();
      this.centerSEPoint.markKidsOutOfDate();
      this.circleSEPoint.update({
        mode: UpdateMode.DisplayOnly,
        stateArray: []
      });
      this.centerSEPoint.update({
        mode: UpdateMode.DisplayOnly,
        stateArray: []
      });
    }
  }

  // I wish the SENodule methods would work but I couldn't figure out how
  // See the attempts in SENodule
  public isFreePoint() {
    return false;
  }
  public isOneDimensional() {
    return true;
  }
  public isPoint() {
    return false;
  }
  public isPointOnOneDimensional() {
    return false;
  }
  public isLabel(): boolean {
    return false;
  }
}
