import { SEExpression } from "./SEExpression";
import { UpdateStateType, UpdateMode } from "@/types";
import { ExpressionParser } from "@/expression/ExpressionParser";
import AppStore from "@/store";
import store from "@/store";
import { Styles } from "@/types/Styles";
import SETTINGS from "@/global-settings";
import { SENodule } from "./SENodule";

const emptySet = new Set<Styles>();
const parser = new ExpressionParser();
export class SECalculation extends SEExpression {
  // static parser = new ExpressionParser();

  static store = AppStore;
  protected exprText = "";
  private computedValue = 0;
  /**
   * The parents of this calculation
   */
  private _calculationParents: SENodule[] = [];
  constructor(text: string) {
    super();
    this.exprText = text;
    //const vars = [];
    // Search the expression text for occurrences of M###
    for (const v of text.matchAll(/[Mm][0-9]+/g)) {
      // vars.push(v[0]);
      // Find the SENodule parents of this calculation
      store.state.expressions.forEach(n => console.log(n.name));
      const pos = store.state.expressions.findIndex(z =>
        z.name.startsWith(`${v[0]}`)
      );
      if (pos > -1) this._calculationParents.push(store.state.expressions[pos]);
    }

    // This might not be necessary because all expressions have the name "M####" and should be caught by the above
    //  This appears to make ALL expressions have this as a child
    // store.state.expressions
    //   .filter(m => {
    //     const pos = m.name.indexOf("-");
    //     if (pos < 0) return false;
    //     const shortName = m.name.substring(0, pos);
    //     return m.name.startsWith(shortName);
    //   })
    //   .forEach(par => {
    //     par.registerChild(this);
    //   });
    // this.name += `-Calc(${text}):${this.value.toFixed(
    //   SETTINGS.decimalPrecision
    // )}`;
  }

  get value(): number {
    return this.computedValue;
  }

  get calculationParents(): SENodule[] {
    return this._calculationParents;
  }

  public get prettyValue(): string {
    if (this._displayInMultiplesOfPi) {
      return (
        (this.value / Math.PI).toFixed(SETTINGS.decimalPrecision) + "\u{1D7B9}"
      );
    } else {
      return this.value.toFixed(SETTINGS.decimalPrecision);
    }
  }
  private recalculate() {
    const varMap = new Map<string, number>();
    this.parents
      .filter(n => n instanceof SEExpression)
      .map(n => n as SEExpression)
      .forEach((m: SEExpression) => {
        // const pos = m.name.indexOf("-");
        // if (pos >= 0) {
        //   const shorttName = m.name.substring(0, pos);
        varMap.set(m.name, m.value);
        // }
      });
    console.log("recalc", varMap);
    this.computedValue = parser.evaluateWithVars(this.exprText, varMap);
  }

  public get longName(): string {
    this.recalculate();
    return `Calculation(${this.exprText})`;
  }

  public get shortName(): string {
    this.recalculate();
    return (
      this.name + ` - Calc(${this.exprText.slice(0, 4)}...):${this.prettyValue}`
    );
  }

  // TODO: Move this method up to the parent class?
  public update(state: UpdateStateType): void {
    if (state.mode !== UpdateMode.DisplayOnly) return;
    if (!this.canUpdateNow()) return;
    this.recalculate();
    // const pos = this.name.lastIndexOf("):");
    // this.name =
    //   this.name.substring(0, pos + 2) +
    //   +this.value.toFixed(SETTINGS.decimalPrecision);
    this.setOutOfDate(false);
    this.updateKids(state);
  }

  public customStyles = (): Set<Styles> => emptySet;
}
