import { Command } from "./Command";
import { SEExpression } from "@/models/SEExpression";
import { SENodule } from "@/models/SENodule";
import { SECalculation } from "@/models/SECalculation";
import { AddMeasurementCommand } from "./AddMeasurementCommand";
import { UpdateMode } from "@/types";

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

  toOpcode(): null | string | Array<string> {
    return (
      [
        "AddCalculation",
        /* arg-0 */ this.seExpression.name,
        /* arg-1 */ this.arithmeticExpression,
        /* arg-2 */ this.seExpression.showing,
        /* arg-3 */ this.seExpression.exists,
        /* arg-4 to ??? */ this.parents.map((n: SENodule) => n.name).join("@")
      ]
        .join(";") // Can't use "/" may get mixed up with division
        // Replace the first ";" with "/" so CommandInterpreter is able to identify and dispatch this command correctly
        .replace(";", "/")
    );
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const slashAt = command.indexOf("/");
    const args = command.substring(slashAt + 1);
    console.debug("Whole command", command);
    console.debug("Arguments", args);
    const tokens = args.split(";");
    console.debug("Tokens", tokens);
    const calc = new SECalculation(tokens[1]);
    calc.name = tokens[0];
    calc.showing = tokens[2] === "true";
    calc.exists = tokens[3] === "true";
    const parents: (SENodule | undefined)[] = [];
    const parentNames = tokens[4].split("@");
    parentNames.forEach(name =>
      parents.push(objMap.get(name) as SENodule | undefined)
    );
    if (parents.every(seNodule => seNodule !== undefined)) {
      objMap.set(tokens[1], calc);
      // Invoke "update" to trigger reevaluation of the expression
      // Otherwise, the value of the expressions is shown as ZERO
      calc.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      return new AddCalculationCommand(
        calc,
        tokens[1],
        parents.map(seNodule => seNodule as SENodule)
      );
    } else
      throw new Error(
        `AddCalculation: at least one parent in ${parentNames} is undefined`
      );
  }
}
