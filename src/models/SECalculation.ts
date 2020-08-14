import { SEExpression } from "./SEExpression";
import { UpdateStateType, isSegmentState, UpdateMode } from "@/types";
import { ExpressionParser } from "@/expression/ExpressionParser";
import AppStore from "@/store";
import store from "@/store";

const parser = new ExpressionParser();
export class SECalculation extends SEExpression {
  // static parser = new ExpressionParser();

  static store = AppStore;
  protected exprText = "";
  private computedValue = 0;
  constructor(text: string) {
    super();
    this.exprText = text;
    const vars = [];
    for (const v of text.matchAll(/[Mm][0-9]+/g)) {
      vars.push(v[0]);
    }

    store.state.expressions
      .filter(m => {
        const pos = m.name.indexOf("-");
        if (pos < 0) return false;
        const shortName = m.name.substring(0, pos);
        return m.name.startsWith(shortName);
      })
      .forEach(par => {
        par.registerChild(this);
      });
    this.recalculate();
    this.name += `-Calc(${text}):${this.value.toFixed(3)}`;
  }

  get value(): number {
    return this.computedValue;
  }

  private recalculate() {
    const varMap = new Map<string, number>();
    this.parents
      .filter(n => n instanceof SEExpression)
      .map(n => n as SEExpression)
      .forEach((m: SEExpression) => {
        const pos = m.name.indexOf("-");
        if (pos >= 0) {
          const shorttName = m.name.substring(0, pos);
          varMap.set(shorttName, m.value);
        }
      });

    this.computedValue = parser.evaluateWithVars(this.exprText, varMap);
  }

  // TODO: Move this method up to the parent class?
  public update(state: UpdateStateType): void {
    if (state.mode !== UpdateMode.DisplayOnly) return;
    if (!this.canUpdateNow()) return;
    this.recalculate();
    const pos = this.name.lastIndexOf("):");
    this.name = this.name.substring(0, pos + 2) + +this.value.toFixed(3);
    this.setOutOfDate(false);
    this.updateKids(state);
  }
}
