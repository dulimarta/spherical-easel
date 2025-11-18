import { SENodule } from "./SENodule";
import { ValueDisplayMode } from "@/types";
// import { SEOneOrTwoDimensional } from "@/types";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { Visitor } from "@/visitors/Visitor";
import i18n from "@/i18n";
import EventBus from "@/eventHandlers/EventBus";
import { PreferenceRef } from "../utils/preferenceRef";
const { t } = i18n.global;

// const emptySet = new Set<string>();

export abstract class SEExpression extends SENodule {
  //Controls if the expression should be measured in multiples of pi, decimal degrees or just a number
  protected _valueDisplayMode = ValueDisplayMode.Number;
  protected _preEarthModeValueDisplayMode = ValueDisplayMode.Number;
  protected _postEarthModeValueDisplayMode =
    SETTINGS.earthMode.defaultEarthModeUnits === "km"
      ? ValueDisplayMode.EarthModeKilos
      : ValueDisplayMode.EarthModeMiles;

  constructor() {
    super();
    SENodule.EXPR_COUNT++;
    //DO NOT MODIFY THIS NAME! THIS SHOULD BE THE ONLY VALUE THIS FIELD EVER GETS
    // This is the key value for for the SECalculation, see its construction for the Map<string,number>
    this.name = `M${SENodule.EXPR_COUNT}`;
  }

  /**Controls if the expression measurement should be displayed in multiples of pi, degrees or a number
   * The setter must update the plottable label (if the expression is attached to a label)
   */
  abstract get valueDisplayMode(): ValueDisplayMode;
  abstract set valueDisplayMode(vdm: ValueDisplayMode);

  get preEarthModeValueDisplayMode(): ValueDisplayMode {
    return this._preEarthModeValueDisplayMode;
  }

  get postEarthModeValueDisplayMode(): ValueDisplayMode {
    return this._postEarthModeValueDisplayMode;
  }

  recordCurrentValueDisplayModeAndUpdate(
    isEarthMode: boolean
  ): Array<ValueDisplayMode> {
    if (isEarthMode) {
      //new SetNoduleDisplayCommand(this, true);
      /** Called when Earth mode is turned on so that the value display mode can updated immediately (in Easel.vue) and then
       * be restored when earth mode is turned off. */
      this._preEarthModeValueDisplayMode = this._valueDisplayMode;
      this._valueDisplayMode = this._postEarthModeValueDisplayMode;
      return [this._preEarthModeValueDisplayMode, this._valueDisplayMode];
    } else {
      /** Called when Earth mode is turned off so that the previous value display modes can be
       * restored and the display value mode can be updated immediately (In Easel.vue). */
      // issue the command to change back to the preEarthMode VDM (Value display mode)
      this._postEarthModeValueDisplayMode = this._valueDisplayMode;
      this._valueDisplayMode = this._preEarthModeValueDisplayMode;
      return [this._postEarthModeValueDisplayMode, this._valueDisplayMode];
    }
  }
  // Add a method to send the SENoduleItem vue component a message to update
  // This is included here rather than in SELabel or Label, because some (most?)
  // SEExpressions do not have labels, but need to be updated in object tree (i.e.
  // the SENoduleItem in the object tree)

  public shallowUpdate(): void {
    EventBus.fire("update-label-and-showing-and-measurement-display", {});
  }
  /* TODO: Evaluate or get the value of the expressions */
  abstract get value(): number;

  // this always returns false because visitors do geometric things and most SEExpressions (except SEAngleMarkers and ??) do not have geometric parts
  accept(v: Visitor): boolean {
    return false;
  }

  prettyValue(fullPrecision = false): string {
    switch (this._valueDisplayMode) {
      case ValueDisplayMode.Number:
        return String(
          this.value.toFixed(PreferenceRef.instance.hierarchyDecimalPrecision ?? SETTINGS.decimalPrecision)
        );
      case ValueDisplayMode.MultipleOfPi:
        return (
          (this.value / Math.PI).toFixed(
            PreferenceRef.instance.hierarchyDecimalPrecision ?? SETTINGS.decimalPrecision
          ) + "\u{1D7B9}"
        );
      case ValueDisplayMode.DegreeDecimals:
        return (
          this.value
            .toDegrees()
            .toFixed(PreferenceRef.instance.hierarchyDecimalPrecision ?? SETTINGS.decimalPrecision) +
          "\u{00B0}"
        );
      case ValueDisplayMode.EarthModeMiles:
        if (this.isPolygon()) {
          return (
            (
              this.value *
              SETTINGS.earthMode.radiusMiles *
              SETTINGS.earthMode.radiusMiles
            ).toFixed(PreferenceRef.instance.hierarchyDecimalPrecision ?? SETTINGS.decimalPrecision) +
            t(`units.mi`) +
            "\u{00B2}"
          );
        } else {
          return (
            (this.value * SETTINGS.earthMode.radiusMiles).toFixed(
              PreferenceRef.instance.hierarchyDecimalPrecision ?? SETTINGS.decimalPrecision
            ) + t(`units.mi`)
          );
        }
      case ValueDisplayMode.EarthModeKilos:
        if (this.isPolygon()) {
          return (
            (
              this.value *
              SETTINGS.earthMode.radiusKilometers *
              SETTINGS.earthMode.radiusKilometers
            ).toFixed(PreferenceRef.instance.hierarchyDecimalPrecision ?? SETTINGS.decimalPrecision) +
            t(`units.km`) +
            "\u{00B2}"
          );
        } else {
          return (
            (this.value * SETTINGS.earthMode.radiusKilometers).toFixed(
              PreferenceRef.instance.hierarchyDecimalPrecision ?? SETTINGS.decimalPrecision
            ) + t(`units.km`)
          );
        }
      default: // return the number mode string as a default, but warn the user
        console.warn(`ValueDisplayMode for ${this.name} was undefined`);
        return String(
          this.value.toFixed(PreferenceRef.instance.hierarchyDecimalPrecision ?? SETTINGS.decimalPrecision)
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
