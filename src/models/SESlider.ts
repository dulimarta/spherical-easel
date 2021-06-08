import { SEMeasurement } from "./SEMeasurement";
import { UpdateMode } from "@/types";
import { Styles } from "@/types/Styles";
const emptySet = new Set<Styles>();
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
    //this.name = this.name + "-Slider";

    this.showing = true;
  }

  get value(): number {
    return this.current;
  }
  set value(v: number) {
    this.current = v;
    this.updateKids({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }
  public get longName(): string {
    return "Slider Value" + this.value;
  }

  public get shortName(): string {
    return "Slider " + this.value;
  }

  public customStyles = (): Set<Styles> => emptySet;

  public update(state: UpdateStateType): void {
    if (state.mode !== UpdateMode.DisplayOnly) return;
    if (!this.canUpdateNow()) return;
    // When this updates send its value to the label but there is no label for sliders

    //const pos = this.name.lastIndexOf(":");
    //this.name = this.name.substring(0, pos + 2) + this.prettyValue;
    this.setOutOfDate(false);
    this.updateKids(state);
  }
}
