import { Command } from "./Command";
import { SEExpression } from "@/models/SEExpression";
import { SENodule } from "@/models/SENodule";
import { SECalculation } from "@/models/SECalculation";

export class AddCalculationCommand extends Command {
  private seExpression: SEExpression;
  private arithmeticExpression: string;
  /**
   * @param seExpression
   * @param parents If this is included then the seMeasurement is made a child of all the SENodules in this array
   */
  constructor(seExpression: SEExpression, text: string) {
    super();
    this.seExpression = seExpression;
    this.arithmeticExpression = text;
  }

  do(): void {
    Command.store.commit.addExpression(this.seExpression);
  }

  saveState(): void {
    this.lastState = this.seExpression.id;
  }

  restoreState(): void {
    Command.store.commit.removeExpression(this.lastState);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddExpression",
      /* arg-1 */ this.seExpression.name,
      /* arg-2 */ this.arithmeticExpression
    ].join(";"); // Can't use "/" may get mixed up with division
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split(";");
    const calc = new SECalculation(tokens[2]);
    objMap.set(tokens[1], calc);
    return new AddCalculationCommand(calc, tokens[2]);
  }
}
