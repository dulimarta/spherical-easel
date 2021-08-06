import { SEExpression } from "./SEExpression";
import { ExpressionState, UpdateMode, UpdateStateType } from "@/types";
import i18n from "@/i18n";

const emptySet = new Set<string>();
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

  public customStyles = (): Set<string> => emptySet;

  public update(state: UpdateStateType): void {
    // This object and any of its children has no presence on the sphere canvas, so update for move should
    if (state.mode === UpdateMode.RecordStateForMove) return;
    // This object is completely determined by its parents, so only record the object in state array
    if (state.mode == UpdateMode.RecordStateForDelete) {
      const expressionState: ExpressionState = {
        kind: "expression",
        object: this
      };
      state.stateArray.push(expressionState);
    }
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);
    this.updateKids(state);
  }
}
