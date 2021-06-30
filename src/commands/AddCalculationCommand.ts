import { Command } from "./Command";
import { SEExpression } from "@/models/SEExpression";
import { SENodule } from "@/models/SENodule";
import { SECalculation } from "@/models/SECalculation";
import { AddMeasurementCommand } from "./AddMeasurementCommand";

export class AddCalculationCommand extends AddMeasurementCommand {
  // private seExpression: SEExpression;
  private arithmeticExpression: string;

  /**
   * @param seExpression
   * @param arithmeticExpression
   * @param parents If this is included then the seExpression is made a child of all the SENodules in this array
   */
  constructor(
    seExpression: SEExpression,
    arithmeticExpression: string,
    parents: SENodule[]
  ) {
    super(seExpression, parents);
    // this.seExpression = seExpression;
    this.arithmeticExpression = arithmeticExpression;
  }

  // do(): void {
  //   Command.store.addExpression(this.seExpression);
  // }

  // saveState(): void {
  //   this.lastState = this.seExpression.id;
  // }

  // restoreState(): void {
  //   Command.store.removeExpression(this.lastState);
  // }

  toOpcode(): null | string | Array<string> {
    return [
      "AddExpression",
      /* arg-1 */ this.seExpression.name,
      /* arg-2 */ this.arithmeticExpression,
      /* arg-3 */ this.seExpression.showing,
      /* arg-4 */ this.seExpression.exists,
      /* arg-5 to ??? */ this.parents.map((n: SENodule) => n.name).join("@")
    ].join(";"); // Can't use "/" may get mixed up with division
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split(";");
    const calc = new SECalculation(tokens[2]);
    calc.name = tokens[1];
    calc.showing = tokens[3] === "true";
    calc.exists = tokens[4] === "true";
    const parents: (SENodule | undefined)[] = [];
    const parentNames = tokens[5].split("@");
    parentNames.forEach(name =>
      parents.push(objMap.get(name) as SENodule | undefined)
    );
    if (parents.every(seNodule => seNodule !== undefined)) {
      objMap.set(tokens[1], calc);
      return new AddCalculationCommand(
        calc,
        tokens[2],
        parents.map(seNodule => seNodule as SENodule)
      );
    } else
      throw new Error(
        `AddCalculation: at least one parent in ${parentNames} is undefined`
      );
  }
}
