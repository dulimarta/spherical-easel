import { SENodule } from "./SENodule";
import { ValueDisplayMode } from "@/types";
import { SEOneOrTwoDimensional } from "@/types";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";

//const emptySet = new Set<string>();
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

  /**Controls if the expression measurement should be displayed in multiples of pi, degrees or a number*/
  get valueDisplayMode(): ValueDisplayMode {
    return this._valueDisplayMode;
  }
  set valueDisplayMode(vdm: ValueDisplayMode) {
    this._valueDisplayMode = vdm;
  }

  /* TODO: Evaluate or get the value of the expressions */
  abstract get value(): number;

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

  //public customStyles = (): Set<string> => emptySet;

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
}
