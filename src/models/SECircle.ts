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
  private centerSEPoint: SEPoint;
  /**
   * The model SE object that is on the circle
   */
  private circleSEPoint: SEPoint;
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
    this.centerSEPoint = centerPoint;
    this.circleSEPoint = circlePoint;

    CIRCLE_COUNT++;
    this.name = `C-${CIRCLE_COUNT}`;
    // Always register the children after the name is initialized
    centerPoint.registerChild(this);
    circlePoint.registerChild(this);
  }
  // #endregion circleConstructor

  get centerPoint(): SEPoint {
    return this.centerSEPoint;
  }

  get circlePoint(): SEPoint {
    return this.circleSEPoint;
  }

  get radius(): number {
    return this.circleSEPoint.vectorPosition.angleTo(
      this.centerSEPoint.vectorPosition
    );
  }

  public isHitAt(spherePos: Vector3): boolean {
    const angleToCenter = spherePos.angleTo(this.centerSEPoint.vectorPosition);
    return (
      Math.abs(angleToCenter - this.radius) < SETTINGS.circle.hitIdealDistance
    );
  }

  public update(): void {
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);
    this.exists =
      this.centerSEPoint.getExists() && this.circleSEPoint.getExists();
    if (this.exists) {
      //update the centerVector and the radius
      const newRadius = this.centerSEPoint.vectorPosition.angleTo(
        this.circleSEPoint.vectorPosition
      );
      this.ref.circleRadius = newRadius;
      this.ref.centerPosition = this.centerSEPoint.vectorPosition;
      // display the new circle with the updated values
      this.ref.updateDisplay();
    }
    this.setOutOfDate(false);
  }

  accept(v: Visitor): void {
    v.actionOnCircle(this);
  }
}
