import { SENodule } from "./SENodule";
import { Styles } from "@/types/Styles";
import { SEOneDimensional, UpdateStateType, UpdateMode } from "@/types";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
let EXPR_COUNT = 0;

//const emptySet = new Set<Styles>();
export abstract class SEExpression extends SENodule {
  //Controls if the expression should be measured in multiples of pi
  protected _displayInMultiplesOfPi = false;
  constructor() {
    super();
    EXPR_COUNT++;
    //DO NOT MODIFY THIS NAME! THIS SHOULD BE THE ONLY VALUE THIS FIELD EVER GETS
    // This is the key value for for the SECalculation, see its construction for the Map<string,number>
    this.name = `M${EXPR_COUNT}`;
  }

  public toggleDisplayInMultiplesOfPi(): void {
    this._displayInMultiplesOfPi = !this._displayInMultiplesOfPi;
  }

  /**Controls if the expression should be measured in multiples of pi*/
  get displayInMultiplesOfPi(): boolean {
    return this._displayInMultiplesOfPi;
  }
  set displayInMultiplesOfPi(b: boolean) {
    this._displayInMultiplesOfPi = b;
  }

  public isPointOnOneDimensional(): boolean {
    return false;
  }
  public isFreePoint(): boolean {
    return false;
  }
  public isPoint(): boolean {
    return false;
  }
  public isOneDimensional(): this is SEOneDimensional {
    return false;
  }
  public isSegmentOfLengthPi(): boolean {
    return false;
  }
  public isLabelable(): boolean {
    return false;
  }
  public isLabel(): boolean {
    return false;
  }
  /* TODO: Evaluate or get the value of the expressions */
  abstract get value(): number;

  protected get prettyValue(): string {
    return this.value.toFixed(SETTINGS.decimalPrecision);
  }

  /**
   * The short name used in the SENoduleItem component (in object tree) to display name and value of this
   * expression. This get updated with the object.
   */
  abstract get shortName(): string;

  /**
   * The long name used in the SENoduleItem component (in object tree) when the user mouses over the
   * item it displays more information about the item.
   */
  abstract get longName(): string;

  //public customStyles = (): Set<Styles> => emptySet;

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
