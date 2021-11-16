import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Circle from "@/plottables/Circle";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { NormalVectorAndTValue, ObjectState, OneDimensional } from "@/types";
import SETTINGS from "@/global-settings";
import {
  DEFAULT_CIRCLE_BACK_STYLE,
  DEFAULT_CIRCLE_FRONT_STYLE
} from "@/types/Styles";
import { Labelable } from "@/types";
import { SELabel } from "@/models/SELabel";
import { SEStore } from "@/store";
import { intersectCircles } from "@/utils/intersections";
import i18n from "@/i18n";

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_CIRCLE_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_CIRCLE_BACK_STYLE)
]);
export class SECircle extends SENodule
  implements Visitable, OneDimensional, Labelable {
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public ref: Circle;
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

    SECircle.CIRCLE_COUNT++;
    this.name = `C${SECircle.CIRCLE_COUNT}`;
  }
  // #endregion circleConstructor

  customStyles(): Set<string> {
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

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.circleThrough`, {
        center: this._centerSEPoint.label?.ref.shortUserName,
        through: this._circleSEPoint.label?.ref.shortUserName
      })
    );
  }

  public get noduleItemText(): string {
    return this.label?.ref.shortUserName ?? "No Label Short Name In SECircle";
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

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

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
    // will cause this circle to be put into the correct location.So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Circle with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "circle", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
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
    if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
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
    // First find the closest point on the circle to the idealUnitSphereVector
    this.tmpVector.copy(this.closestVector(idealUnitSphereVector));

    // The current magnification level
    const mag = SEStore.zoomMagnificationFactor;

    // If the idealUnitSphereVector is within the tolerance of the closest point, do nothing, otherwise return the vector in the plane of the ideanUnitSphereVector and the closest point that is at the tolerance distance away.
    if (
      this.tmpVector.angleTo(idealUnitSphereVector) <
      SETTINGS.circle.maxLabelDistance / mag
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
        Math.sin(SETTINGS.circle.maxLabelDistance / mag)
      );
      return this.tmpVector2
        .addScaledVector(
          this.tmpVector,
          Math.cos(SETTINGS.circle.maxLabelDistance / mag)
        )
        .normalize();
    }
  }
  accept(v: Visitor): void {
    v.actionOnCircle(this);
  }

  /**
   * Return the normal vector to the plane containing the line that is perpendicular to this circle through the
   * sePoint, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned)
   * @param sePoint A point on the line normal to this circle
   */
  public getNormalsToPerpendicularLinesThru(
    sePointVector: Vector3,
    oldNormal: Vector3
  ): NormalVectorAndTValue[] {
    this.tmpVector.crossVectors(
      sePointVector,
      this._centerSEPoint.locationVector
    );
    // Check to see if the tmpVector is zero (i.e the center point and given point are parallel -- ether
    // nearly antipodal or in the same direction)
    if (this.tmpVector.isZero(SETTINGS.nearlyAntipodalIdeal)) {
      // In this case any line containing the sePoint will be perpendicular to the circle, but
      //  we want to choose one line whose normal is near the oldNormal and perpendicular to sePointVector
      // So project the oldNormal vector onto the plane perpendicular to sePointVector
      this.tmpVector
        .copy(oldNormal)
        .addScaledVector(sePointVector, -1 * oldNormal.dot(sePointVector));
    }
    return [{ normal: this.tmpVector.normalize(), tVal: NaN }];
  }

  /**
   * Return the normal vectors to the planes containing the lines that is tangent to this circle through the
   * sePointVector, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned)
   * @param sePointVector A point on the line tangent to this circle
   */
  public getNormalsToTangentLinesThru(
    sePointVector: Vector3,
    useFullTInterval?: boolean // only used in the constructor when figuring out the maximum number of Tangents to a SEParametric
  ): Vector3[] {
    const distanceFromCenterToVector = sePointVector.angleTo(
      this._centerSEPoint.locationVector
    );

    // console.log(
    //   "SECircle here 0",
    //   Math.abs(distanceFromCenterToVector - this.circleRadius)
    // );
    // If the vector is on the circle or its antipode then there is one tangent
    if (
      Math.abs(distanceFromCenterToVector - this.circleRadius) <
        0.005 / SEStore.zoomMagnificationFactor ||
      Math.abs(distanceFromCenterToVector + this.circleRadius - Math.PI) <
        0.005 / SEStore.zoomMagnificationFactor
    ) {
      // tmpVector is not zero because we know that the center and sePointVector are not the same or antipodal
      const tmpVector = new Vector3();
      tmpVector.crossVectors(sePointVector, this._centerSEPoint.locationVector);
      tmpVector.cross(sePointVector);
      // console.log("SECircle here 1", tmpVector.x, tmpVector.y, tmpVector.z);
      return [tmpVector.normalize()];
    }

    // If the vector is inside the circle or the antipode of the circle there is no tangent or if the circle has radius PI/2
    if (
      Math.abs(this.circleRadius - Math.PI / 2) < SETTINGS.tolerance ||
      (this.circleRadius < Math.PI / 2 &&
        (distanceFromCenterToVector < this.circleRadius ||
          distanceFromCenterToVector > Math.PI - this.circleRadius)) ||
      (this.circleRadius > Math.PI / 2 &&
        (distanceFromCenterToVector < Math.PI - this.circleRadius ||
          distanceFromCenterToVector > this.circleRadius))
    ) {
      return [];
    }

    // The vector is not on or in the circle or its antipode, there are two tangents. Use the intersectCircles routine
    let secondRadius; // this is the radius of the circle about sePointVector that intersects this circle at the points of tangency
    if (this.circleRadius < Math.PI) {
      // use the spherical pythagorean theorem
      secondRadius = Math.acos(
        Math.cos(distanceFromCenterToVector) / Math.cos(this.circleRadius)
      );
    } else {
      secondRadius = Math.acos(
        Math.cos(distanceFromCenterToVector) /
          Math.cos(Math.PI - this.circleRadius)
      );
    }
    const intersections = intersectCircles(
      this._centerSEPoint.locationVector,
      this.circleRadius,
      sePointVector,
      secondRadius
    );
    this.tmpVector.crossVectors(
      intersections[0].vector,
      this._centerSEPoint.locationVector
    );
    this.tmpVector1.crossVectors(
      intersections[1].vector,
      this._centerSEPoint.locationVector
    );
    return [
      this.tmpVector.cross(intersections[0].vector).normalize(),
      this.tmpVector1.cross(intersections[1].vector).normalize()
    ];
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
      this.circleSEPoint.update();
      this.centerSEPoint.update();
    }
  }

  public isOneDimensional(): boolean {
    return true;
  }

  public isLabelable(): boolean {
    return true;
  }
}
