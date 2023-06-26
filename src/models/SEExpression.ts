import { SENodule } from "./SENodule";
import { ValueDisplayMode } from "@/types";
// import { SEOneOrTwoDimensional } from "@/types";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { Visitor } from "@/visitors/Visitor";

// const emptySet = new Set<string>();
export abstract class SEExpression extends SENodule {
  //Controls if the expression should be measured in multiples of pi, decimal degrees or just a number
  protected _valueDisplayMode = ValueDisplayMode.Number;
  constructor() {
    super();
    SEExpression.EXPR_COUNT++;
    //DO NOT MODIFY THIS NAME! THIS SHOULD BE THE ONLY VALUE THIS FIELD EVER GETS
    // This is the key value for for the SECalculation, see its construction for the Map<string,number>
    this.name = `M${SEExpression.EXPR_COUNT}`;
  }

  /**Controls if the expression measurement should be displayed in multiples of pi, degrees or a number
   * The setter must update the plottable label (if the expression is attached to a label)
   */
  abstract get valueDisplayMode(): ValueDisplayMode;
  abstract set valueDisplayMode(vdm: ValueDisplayMode);

  /* TODO: Evaluate or get the value of the expressions */
  abstract get value(): number;

  // this always returns false because visitors do geometric things and most SEExpressions (except SEAngleMarkers and ??) do not have geometric parts
  accept(v: Visitor): boolean {
    return false;
  }

  public get prettyValue(): string {
    switch (this._valueDisplayMode) {
      case ValueDisplayMode.Number:
        return String(this.value.toFixed(SETTINGS.decimalPrecision));
      case ValueDisplayMode.MultipleOfPi:
        return (
          (this.value / Math.PI).toFixed(SETTINGS.decimalPrecision) +
          "\u{1D7B9}"
        );
      case ValueDisplayMode.DegreeDecimals:
        return (
          this.value.toDegrees().toFixed(SETTINGS.decimalPrecision) + "\u{00B0}"
        );
    }
  }

  // public customStyles = (): Set<string> => emptySet;

  /**
   * Is the object hit a point at a particular sphere location?
   * Never! This object is not on the sphere (unless it is a angle marker, in which case isHitAt is overridden)
   * @param sphereVector a location on the ideal unit sphere
   */
  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    return false;
  }
  public isMeasurable(): boolean {
    return true;
  }
}
