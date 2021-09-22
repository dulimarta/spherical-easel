import { SEExpression } from "./SEExpression";
import { ObjectState } from "@/types";
import { ExpressionParser } from "@/expression/ExpressionParser";
import { SEStore } from "@/store";
import { SENodule } from "./SENodule";
import i18n from "@/i18n";

const emptySet = new Set<string>();
const parser = new ExpressionParser();
export class SECalculation extends SEExpression {
  // static parser = new ExpressionParser();

  protected exprText = "";
  private computedValue = 0;
  /**
   * The parents of this calculation
   */
  private _calculationParents: SENodule[] = [];
  constructor(text: string) {
    super(); // this.name is set to a measurement token M### in the super constructor
    this.exprText = text;
    //const vars = [];
    // Search the expression text for occurrences of M###
    for (const v of text.matchAll(/[Mm][0-9]+/g)) {
      // vars.push(v[0]);
      // Find the SENodule parents of this calculation
      // SEStore.expressions.forEach(n => console.log(n.name));
      const pos = SEStore.expressions.findIndex(z => z.name === `${v[0]}`);
      // add it to the calculationParents if it is not already added
      if (pos > -1) {
        const pos2 = this._calculationParents.findIndex(
          parent => parent.name === SEStore.expressions[pos].name
        );
        if (pos2 < 0) {
          this._calculationParents.push(SEStore.expressions[pos]);
        }
      }

      // if (pos > -1) this._calculationParents.push(SEStore.expressions[pos]);
    }

    // DO not register parents here. That is done the in the command

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

  // public get prettyValue(): string {
  //   if (this._valueDisplayMode) {
  //     return (
  //       (this.value / Math.PI).toFixed(SETTINGS.decimalPrecision) + "\u{1D7B9}"
  //     );
  //   } else {
  //     return this.value.toFixed(SETTINGS.decimalPrecision);
  //   }
  // }
  private recalculate() {
    const varMap = new Map<string, number>();
    this._calculationParents
      .filter(n => n instanceof SEExpression)
      .map(n => n as SEExpression)
      .forEach((m: SEExpression) => {
        // const pos = m.name.indexOf("-");
        // if (pos >= 0) {
        //   const shorttName = m.name.substring(0, pos);
        const measurementName = m.name;
        varMap.set(measurementName, m.value);
        // }
      });
    // console.log(this._calculationParents, varMap);
    // this.expressions.forEach((m: SEExpression) => {
    //   const measurementName = m.name;
    //   // console.debug("Measurement", m, measurementName);
    //   this.varMap.set(measurementName, m.value);
    // });

    // console.log("recalc", varMap);
    this.computedValue = parser.evaluateWithVars(this.exprText, varMap);
  }

  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.calculationDescription`, {
        str: this.exprText,
        val: this.value
      })
    );
  }

  public get noduleItemText(): string {
    return String(
      i18n.t(`objectTree.calculationValue`, {
        token: this.name,
        val: this.prettyValue
      })
    );
  }

  public update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    if (!this.canUpdateNow()) return;

    this.setOutOfDate(false);

    this.exists = this._calculationParents.every(parent => parent.exists);
    if (this.exists) {
      this.recalculate();
    }

    // This object and any of its children have no presence on the sphere canvas So we don't store any additional information
    if (objectState && orderedSENoduleList) {
      if (objectState.has(this.id)) {
        console.log(
          `Calculation with id ${this.id} has been visited twice proceed no further down this branch of the DAG.`
        );
        return;
      }
      orderedSENoduleList.push(this.id);
      objectState.set(this.id, { kind: "calculation", object: this });
    }

    this.updateKids(objectState, orderedSENoduleList);
  }

  public customStyles = (): Set<string> => emptySet;
}
