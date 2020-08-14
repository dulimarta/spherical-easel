import Label from "../plottables/Label";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { Styles } from "@/types/Styles";
import { SEOneDimensional } from "@/types";
import { SEMeasurement } from "./SEMeasurement";
import AppStore from "@/store";

// const styleSet = new Set([
//   Styles.fillColor,
//   Styles.opacity,
//   Styles.labelTextScalePercent,
//   Styles.dynamicBackStyle,
//   Styles.labelTextStyle,
//   Styles.labelTextFamily,
//   Styles.labelTextDecoration,
//   Styles.labelTextRotation,
//   Styles.labelDisplayCaption,
//   Styles.labelDisplayText,
//   Styles.labelDisplayMode,
//   Styles.labelVisibility,
//   Styles.objectVisibility
// ]);

export class SESlider extends SEMeasurement /*implements Visitable*/ {
  /* Access to the store to retrieve the canvas size so that the bounding rectangle for the text can be computed properly*/
  protected store = AppStore;

  /**
   * The vector location of the SEPoint on the ideal unit sphere
   */
  // protected _locationVector = new Vector3();

  /**
   * Create a label of the parent object
   * @param label the TwoJS label associated with this SESlider
   * @param location The unit sphere location of this SESlider
   */
  constructor({ min, max, step }: { min: number; max: number; step: number }) {
    super();
    // console.log("store", SELabel.store);

    this.name = this.name + "-Slider";
    // this._locationVector.copy(location);
    this.showing = true;
  }

  public prettyValue(): string {
    throw new Error("Method not implemented.");
  }
  get value(): number {
    throw new Error("Method not implemented.");
  }
}
