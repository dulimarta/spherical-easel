import { SEExpression } from "./SEExpression";
import { ObjectState } from "@/types";
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
    this.markKidsOutOfDate();
    this.updateKids();
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

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);

    // SESliders always exist they are like free points, they have kids but no parents.
    //  So we store the value of the slider (because the min, max and step can't change)
    if (objectState && orderedSENoduleList) {
      orderedSENoduleList.push(this.id);
      if (objectState.has(this.id)) {
        console.log(
          `Slider with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      objectState.set(this.id, {
        kind: "slider",
        object: this,
        sliderValue: this.value
      });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }
}
