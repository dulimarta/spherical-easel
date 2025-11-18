/* A definition for a singleton instance that will store an object of the userPreferences in order
   to use them throughout the app. Temporary fix for implementations like decimalPrecision which
   are used at too low of a level for calling from the store without spamming Firebase or
   refactoring large amounts of code. */

import SETTINGS from "@/global-settings";

export class PreferenceRef {
  private static _instance: PreferenceRef;
  public easelDecimalPrecision: number;
  public hierarchyDecimalPrecision: number;

  /* Sets to default values until updated. */
  private constructor(prefsStore: any) {
    if (prefsStore != null) {
      this.easelDecimalPrecision = prefsStore.easelDecimalPrecision;
      this.hierarchyDecimalPrecision = prefsStore.hierarchyDecimalPrecision;
    } else {
      this.easelDecimalPrecision = SETTINGS.decimalPrecision;
      this.hierarchyDecimalPrecision = SETTINGS.decimalPrecision;
    }
  }

  public static get instance() {
    return this._instance || (this._instance = new this({
      easelDecimalPrecision: SETTINGS.decimalPrecision,
      hierarchyDecimalPrecision: SETTINGS.decimalPrecision
    }));
  }

  /* Update attributes, used in load and save in utils/userPreferences.ts */
  public static update(prefsStore: any) {
    this._instance = new this(prefsStore);
  }
}