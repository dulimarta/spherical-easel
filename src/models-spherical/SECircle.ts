import { SENodule } from "./SENodule";
import Circle from "@/plottables-spherical/Circle";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import {
  NormalAndPerpendicularPoint,
  NormalAndTangentPoint,
  ObjectState,
  OneDimensional
} from "@/types";
import SETTINGS from "@/global-settings-spherical";
import {
  DEFAULT_CIRCLE_BACK_STYLE,
  DEFAULT_CIRCLE_FRONT_STYLE
} from "@/types/Styles";
import { Labelable } from "@/types";
import { intersectCircles } from "@/utils/intersections";
import i18n from "@/i18n";
import NonFreeCircle from "@/plottables-spherical/NonFreeCircle";
import { DisplayStyle } from "@/plottables-spherical/Nodule";
import { SELabel } from "./SELabel";
import { SEPoint } from "./SEPoint";
import { SEThreePointCircleCenter } from "./SEThreePointCircleCenter";
import { SEInversionCircleCenter } from "./SEInversionCircleCenter";
import { SELine } from "./SELine";
// import { SEThreePointCircleCenter } from "./SEThreePointCircleCenter";
// import { SEInversionCircleCenter } from "./SEInversionCircleCenter";
// import { SELine } from "./SELine";
const { t } = i18n.global;
const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_CIRCLE_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_CIRCLE_BACK_STYLE)
]);
export class SECircle
  extends SENodule
  implements Visitable, OneDimensional, Labelable
{
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  // declare public ref: Circle;
  /**
   * Pointer to the label of this SESegment
   */
  public label?: SELabel;
  /**
   * The model SE object that is the center of the circle
   */
  protected _centerSEPoint: SEPoint;
  /**
   * The model SE object that is on the circle
   */
  protected _circleSEPoint: SEPoint;

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
  constructor(
    centerPoint: SEPoint,
    circlePoint: SEPoint,
    createNonFreeCircle: boolean
  ) {
    super();
    this._centerSEPoint = centerPoint;
    this._circleSEPoint = circlePoint;
    SENodule.CIRCLE_COUNT++;
    this.name = `C${SENodule.CIRCLE_COUNT}`;
    this.ref = createNonFreeCircle
      ? new NonFreeCircle(this.name)
      : new Circle(this.name);
    (this.ref as Circle).centerVector = centerPoint.locationVector;
    (this.ref as Circle).circleRadius = this.circleRadius;
    this.ref.updateDisplay();
    this.ref.stylize(DisplayStyle.ApplyCurrentVariables);
    this.ref.adjustSize();
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
    //change the description for three point circle
    if (this._centerSEPoint instanceof SEThreePointCircleCenter) {
      if (
        Math.abs(
          this._centerSEPoint.locationVector.angleTo(
            this._centerSEPoint.seParentPoint1.locationVector
          ) - this.circleRadius
        ) < SETTINGS.tolerance
      ) {
        // this circle is a three point circle
        return String(
          i18n.global.t(`objectTree.threePointCircleThrough`, {
            pt1: this._centerSEPoint.seParentPoint1.label?.ref.shortUserName,
            pt2: this._centerSEPoint.seParentPoint2.label?.ref.shortUserName,
            pt3: this._centerSEPoint.seParentPoint3.label?.ref.shortUserName
          })
        );
      }
    } else if (this._centerSEPoint instanceof SEInversionCircleCenter) {
      // this circle is a circle of inversion
      //   "Image of {circleOrLine} {circleOrLineParentName} under inversion {inversionParentName}.",
      const geometricParentType =
        this._centerSEPoint.seParentCircleOrLine instanceof SELine
          ? i18n.global.t(`objects.lines`, 3)
          : i18n.global.t(`objects.circles`, 3);
      return String(
        i18n.global.t(`objectTree.inversionImageOfACircle`, {
          circleOrLine: geometricParentType,
          circleOrLineParentName:
            this._centerSEPoint.seParentCircleOrLine.label?.ref.shortUserName,
          inversionParentName: this._centerSEPoint.parentTransformation.name
        })
      );
    }
    return String(
      i18n.global.t(`objectTree.circleThrough`, {
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

  public shallowUpdate(): void {
    this._exists = this._centerSEPoint.exists && this._circleSEPoint.exists;

    if (this._exists) {
      //update the centerVector and the radius
      const newRadius = this._centerSEPoint.locationVector.angleTo(
        this._circleSEPoint.locationVector
      );
      (this.ref as Circle).circleRadius = newRadius;
      (this.ref as Circle).centerVector = this._centerSEPoint.locationVector;
      // display the new circle with the updated values
      (this.ref as Circle).updateDisplay();
    }

    if (this.showing && this._exists) {
      this.ref!.setVisible(true);
    } else {
      this.ref!.setVisible(false);
    }
  }
  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);
    this.shallowUpdate();
    // These circles are completely determined by their point parents and an update on the parents
    // will cause this circle to be put into the correct location.So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        // `Circle with id ${this.id} has been visited twice proceed no further down this branch of the DAG. Hopefully this is because we are moving two or more SENodules at the same time in the MoveHandler.`
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
  public closestLabelLocationVector(
    idealUnitSphereVector: Vector3,
    zoomMagnificationFactor: number
  ): Vector3 {
    // First find the closest point on the circle to the idealUnitSphereVector
    this.tmpVector.copy(this.closestVector(idealUnitSphereVector));

    // The current magnification level
    const mag = zoomMagnificationFactor;

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
      this.tmpVector2.crossVectors(this.tmpVector, this.tmpVector1).normalize();
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
  accept(v: Visitor): boolean {
    return v.actionOnCircle(this);
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
  ): NormalAndPerpendicularPoint[] {
    this.tmpVector
      .crossVectors(sePointVector, this._centerSEPoint.locationVector)
      .normalize();
    // To obtain the two intersection points, rotate (CW and CCW) the circle center
    // on the plane whose normal just computed
    this.tmpVector1.copy(this._centerSEPoint.locationVector);
    this.tmpVector1.applyAxisAngle(this.tmpVector, this.circleRadius);
    this.tmpVector2.copy(this._centerSEPoint.locationVector);
    this.tmpVector2.applyAxisAngle(this.tmpVector, -this.circleRadius);
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
    return [
      {
        normal: this.tmpVector,
        normalAt: this.tmpVector1.normalize()
      },
      {
        normal: this.tmpVector,
        normalAt: this.tmpVector2.normalize()
      }
    ];
  }

  /**
   * Return the normal vectors to the planes containing the lines that is tangent to this circle through the
   * sePointVector, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned)
   * @param sePointVector A point on the line tangent to this circle
   */
  public getNormalsToTangentLinesThru(
    sePointVector: Vector3,
    zoomMagnificationFactor: number,
    useFullTInterval?: boolean // only used in the constructor when figuring out the maximum number of Tangents to a SEParametric
  ): NormalAndTangentPoint[] {
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
        0.005 / zoomMagnificationFactor ||
      Math.abs(distanceFromCenterToVector + this.circleRadius - Math.PI) <
        0.005 / zoomMagnificationFactor
    ) {
      // tmpVector is not zero because we know that the center and sePointVector are not the same or antipodal
      const tmpVector = new Vector3();
      tmpVector.crossVectors(sePointVector, this._centerSEPoint.locationVector);
      tmpVector.cross(sePointVector);
      // console.log("SECircle here 1", tmpVector.x, tmpVector.y, tmpVector.z);
      return [{ normal: tmpVector.normalize(), tangentAt: sePointVector }];
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
      {
        normal: this.tmpVector.cross(intersections[0].vector).normalize(),
        tangentAt: intersections[0].vector
      },
      {
        normal: this.tmpVector1.cross(intersections[1].vector).normalize(),
        tangentAt: intersections[1].vector
      }
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

  public getLabel(): SELabel | null {
    return (this as Labelable).label!;
  }
  public isMeasurable(): boolean {
    return true;
  }
  public isFillable(): boolean {
    return true;
  }
}
