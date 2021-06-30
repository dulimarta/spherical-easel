import { SEExpression } from "./SEExpression";
import { UpdateMode, UpdateStateType } from "@/types";
import { Styles } from "@/types/Styles";
import i18n from "@/i18n";

const emptySet = new Set<Styles>();
export class SESlider extends SEExpression /*implements Visitable*/ {
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
    super(); // this.name is set to a measurement token M### in the super constructor
    this.min = min;
    this.max = max;
    this.step = step;
    this.current = value;

    this.showing = true;
  }

  get value(): number {
    return this.current;
  }
  set value(v: number) {
    this.current = v;
    this.updateKids({ mode: UpdateMode.DisplayOnly, stateArray: [] });
  }

  public get noduleDescription(): string {
    return String(i18n.t(`objectTree.slider`));
  }

  public get noduleItemText(): string {
    return String(
      i18n.t(`objectTree.sliderValue`, {
        token: this.name,
        val: this.prettyValue
      })
    );
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
