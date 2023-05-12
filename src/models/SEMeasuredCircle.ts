import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Circle from "@/plottables/Circle";
import { Vector3 } from "three";
import { ObjectState } from "@/types";
import i18n from "@/i18n";
import { SECircle } from "./SECircle";
import { SEExpression } from "./SEExpression";
import NonFreeCircle from "@/plottables/NonFreeCircle";

export class SEMeasuredCircle extends SECircle {
  /**
   * The model measurement expression that determines the radius of the circle
   */
  private _radiusMeasurementSEExpression: SEExpression;

  private tmpPerpVector = new Vector3();
  private tempVector = new Vector3();

  /**
   * Create a model SECircle using:
   * @param circ The plottable TwoJS Object associated to this object (non free circle)
   * @param centerPoint The model SEPoint object that is the center of the circle
   * @param hiddenCirclePoint A point on the circle (not *ever* visible and updated only by this circle)
   * @param radiusMeasurementSEExpression The model SEExpression that determines the radius
   */
  constructor(
    circ: NonFreeCircle,
    centerPoint: SEPoint,
    hiddenCirclePoint: SEPoint,
    radiusMeasurementSEExpression: SEExpression
  ) {
    super(circ, centerPoint, hiddenCirclePoint);
    this._radiusMeasurementSEExpression = radiusMeasurementSEExpression;
  }

  public get noduleDescription(): string {
    return String(
      i18n.global.t(`objectTree.measuredCircle`, {
        center: this._centerSEPoint.label?.ref.shortUserName,
        measurementToken: this._radiusMeasurementSEExpression.name
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ?? "No Label Short Name In SEMeasuredCircle"
    );
  }

  public get radiusMeasurementSEExpression(): SEExpression {
    return this._radiusMeasurementSEExpression;
  }

  public shallowUpdate(): void {
    this._exists =
      this._centerSEPoint.exists && this._radiusMeasurementSEExpression.exists;

    if (this._exists) {
      const newRadius = this._radiusMeasurementSEExpression.value.modPi();
      // update the location of the circleSEPoint (This is the *only* place that this is updated)
      // compute a normal to the centerVector, named tmpVector
      this.tmpPerpVector.set(
        -this._centerSEPoint.locationVector.y,
        this._centerSEPoint.locationVector.x,
        0
      );
      // check to see if this vector is zero, if so choose a different way of being perpendicular to the polar point parent
      if (this.tmpPerpVector.isZero()) {
        this.tmpPerpVector.set(
          0,
          -this._centerSEPoint.locationVector.z,
          this._centerSEPoint.locationVector.y
        );
      }
      this.tmpPerpVector.normalize();
      this.tempVector
        .copy(this._centerSEPoint.locationVector)
        .multiplyScalar(Math.cos(newRadius));
      this.tempVector.addScaledVector(this.tmpPerpVector, Math.sin(newRadius));
      this.circleSEPoint.locationVector = this.tempVector.normalize();

      //update the centerVector and the radius
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

  public isNonFreeCirle(): boolean {
    return true;
  }
}
