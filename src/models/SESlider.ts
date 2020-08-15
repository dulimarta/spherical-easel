import Label from "../plottables/Label";
import { Vector3, NumberKeyframeTrack } from "three";
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
  // protected store = AppStore;

  /**
   * The vector location of the SEPoint on the ideal unit sphere
   */
  // protected _locationVector = new Vector3();

  readonly min: number;
  readonly max: number;
  private current: number;
  readonly step: number;
  constructor({
    min,
    max,
    step,
    value
  }: {
    min: number;
    max: number;
    step: number;
    value: number;
  }) {
    super();
    // console.log("store", SELabel.store);
    this.min = min;
    this.max = max;
    this.step = step;
    this.current = value;
    this.name = this.name + "-Slider";

    this.showing = true;
  }

  public prettyValue(): string {
    return this.current.toFixed(3);
  }
  get value(): number {
    return this.current;
  }
  set value(v: number) {
    this.current = v;
  }
}
