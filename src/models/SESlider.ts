import { SEMeasurement } from "./SEMeasurement";
import { UpdateStateType, UpdateMode } from "@/types";

export class SESlider extends SEMeasurement /*implements Visitable*/ {
  /* Access to the store to retrieve the canvas size so that the bounding rectangle for the text can be computed properly*/
  // protected store = AppStore;

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

  get value(): number {
    return this.current;
  }
  set value(v: number) {
    this.current = v;
    this.updateKids({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }
}
