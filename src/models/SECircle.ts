import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Circle from "@/plottables/Circle";
import { Vector3 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
let CIRCLE_COUNT = 0;
import SETTINGS from "@/global-settings";

export class SECircle extends SENodule implements Visitable {
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
    // Always register the children after the name is initialized
    centerPoint.registerChild(this);
    circlePoint.registerChild(this);
  }
  // #endregion circleConstructor

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
      this.ref.updateDisplay();
    }
    this.setOutOfDate(false);
    this.updateKids();
  }

  accept(v: Visitor): void {
    v.actionOnCircle(this);
  }
}
