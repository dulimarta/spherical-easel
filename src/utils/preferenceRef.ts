/* A definition for a singleton instance that will store an object of the userPreferences in order
   to use them throughout the app. Temporary fix for implementations like decimalPrecision which
   are used at too low of a level for calling from the store without spamming Firebase or
   refactoring large amounts of code. */

import SETTINGS from "@/global-settings";
import { UserPreferences } from "./userPreferences";

export class PreferenceRef {
  private static _instance: PreferenceRef;
  public easelDecimalPrecision: number;
  public objectTreeDecimalPrecision: number;
  public measurementMode: "degrees" | "radians" | "pi";

  private constructor(prefsStore: UserPreferences) {
    if (prefsStore != null) {
      if (prefsStore.easelDecimalPrecision !== undefined) {
        this.easelDecimalPrecision = prefsStore.easelDecimalPrecision;
      } else {
        this.easelDecimalPrecision = SETTINGS.decimalPrecision;
      }

      if (prefsStore.objectTreeDecimalPrecision !== undefined) {
        this.objectTreeDecimalPrecision = prefsStore.objectTreeDecimalPrecision;
      } else {
        this.objectTreeDecimalPrecision = SETTINGS.decimalPrecision;
      }

      if (prefsStore.measurementMode !== undefined) {
        this.measurementMode = prefsStore.measurementMode as
          | "degrees"
          | "radians"
          | "pi";
      } else {
        this.measurementMode = "degrees";
      }
    } else {
      this.easelDecimalPrecision = SETTINGS.decimalPrecision;
      this.objectTreeDecimalPrecision = SETTINGS.decimalPrecision;
      this.measurementMode = "degrees";
    }
  }

  public static get instance() {
    return (
      this._instance ||
      (this._instance = new this({
        easelDecimalPrecision: SETTINGS.decimalPrecision,
        objectTreeDecimalPrecision: SETTINGS.decimalPrecision,
        measurementMode: "degrees"
      }))
    );
  }

  public static update(prefsStore: any) {
    this._instance = new this(prefsStore);
  }
}
