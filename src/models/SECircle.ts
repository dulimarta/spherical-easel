import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Circle from "@/plottables/Circle";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { OneDimensional } from "@/types";
import SETTINGS from "@/global-settings";
import { Styles } from "@/types/Styles";

/** Use in the rotation matrix during a move event */
const desiredZAxis = new Vector3();
const tmpVector = new Vector3();
const tmpVector1 = new Vector3();

let CIRCLE_COUNT = 0;

const styleSet = new Set([
  Styles.strokeColor,
  Styles.strokeWidth,
  Styles.fillColorGray,
  Styles.fillColorWhite
]);
export class SECircle extends SENodule implements Visitable, OneDimensional {
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public ref!: Circle;
  /**
   * The model SE object that is the center of the circle
   */
  private _centerSEPoint: SEPoint;
  /**
   * The model SE object that is on the circle
   */
  private _circleSEPoint: SEPoint;

  /**
   * A matrix that is used to indicate the *change* in position of the objects on the sphere. The
   * total change in position is not stored. This matrix is applied (via a position visitor) to
   * all objects on the sphere. Used when no object is selected and the user mouse presses and drags
   */
  private changeInPositionRotationMatrix: Matrix4 = new Matrix4();

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

  public isHitAt(unitIdealVector: Vector3): boolean {
    const angleToCenter = unitIdealVector.angleTo(
      this._centerSEPoint.locationVector
    );
    return (
      Math.abs(angleToCenter - this.circleRadius) <
      SETTINGS.circle.hitIdealDistance
    );
  }

  public update(): void {
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
      if (this.showing) {
        this.ref.updateDisplay();
        this.ref.setVisible(true);
      } else {
        this.ref.setVisible(false);
      }
    } else {
      this.ref.setVisible(false);
    }
    this.updateKids();
  }

  /**
   * Return the vector on the SECircle that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    // The normal to the plane of the center and the idealUnitVector
    tmpVector.crossVectors(
      this._centerSEPoint.locationVector,
      idealUnitSphereVector
    );
    // Check to see if the tmpVector is zero (i.e the center and  idealUnit vectors are parallel -- ether
    // nearly antipodal or in the same direction)
    if (tmpVector.isZero()) {
      return this._circleSEPoint.locationVector; // An arbitrary point will do as all points are equally far away
    } else {
      // Make the tmpVector (soon to be the to vector) unit
      tmpVector.normalize();
      // A vector perpendicular to the center vector in the direction of the idealUnitSphereVector
      tmpVector.cross(this._centerSEPoint.locationVector).normalize();
      // The closest point is cos(arcLength)*this._centerSEPoint.locationVector+ sin(arcLength)*this.tmpVector
      tmpVector.multiplyScalar(Math.sin(this.circleRadius));
      tmpVector
        .addScaledVector(
          this._centerSEPoint.locationVector,
          Math.cos(this.circleRadius)
        )
        .normalize();
      return tmpVector;
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
  public move(previousSphereVector: Vector3, currentSphereVector: Vector3) {
    const rotationAngle = previousSphereVector.angleTo(currentSphereVector);

    // If the rotation is big enough preform the rotation
    if (Math.abs(rotationAngle) > SETTINGS.rotate.minAngle) {
      // The axis of rotation
      desiredZAxis
        .crossVectors(previousSphereVector, currentSphereVector)
        .normalize();
      // Form the matrix that performs the rotation
      this.changeInPositionRotationMatrix.makeRotationAxis(
        desiredZAxis,
        rotationAngle
      );
      tmpVector1
        .copy(this.centerSEPoint.locationVector)
        .applyMatrix4(this.changeInPositionRotationMatrix);
      this.centerSEPoint.locationVector = tmpVector1;
      tmpVector
        .copy(this.circleSEPoint.locationVector)
        .applyMatrix4(this.changeInPositionRotationMatrix);
      this.circleSEPoint.locationVector = tmpVector;
      // Update both points, because we might need to update their kids!
      this.circleSEPoint.update();
      this.centerSEPoint.update();
    }
  }
}
