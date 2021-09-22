import { Command } from "./Command";
import { SEExpression } from "@/models/SEExpression";
import { SENodule } from "@/models/SENodule";
import { SECalculation } from "@/models/SECalculation";
import { AddExpressionCommand } from "./AddExpressionCommand";
import { SavedNames } from "@/types";

export class AddCalculationCommand extends AddExpressionCommand {
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
    this.arithmeticExpression = arithmeticExpression;
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddCalculation",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seExpression.name),
      "objectExists=" + this.seExpression.exists,
      "objectShowing=" + this.seExpression.showing,

      // Object specific attributes
      "calculationExpressionString=" +
        Command.symbolToASCIIDec(this.arithmeticExpression),
      "calculationParentsNames=" +
        this.parents.map(n => Command.symbolToASCIIDec(n.name)).join("@")
    ].join("&");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("&");
    const propMap = new Map<SavedNames, string>();
    // load the tokens into the map
    tokens.forEach((token, ind) => {
      if (ind === 0) return; // don't put the command type in the propMap
      const parts = token.split("=");
      propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
    });

    // get the object specific attributes
    const tempCalculationParentsNames = propMap.get("calculationParentsNames");
    const calculationParents: (SEExpression | undefined)[] = [];
    if (tempCalculationParentsNames) {
      tempCalculationParentsNames
        .split("@")
        .forEach(name =>
          calculationParents.push(objMap.get(name) as SEExpression | undefined)
        );
    }

    const calculationExpression = propMap.get("calculationExpressionString");

    if (
      calculationParents.every(exp => exp !== undefined) &&
      calculationExpression
    ) {
      const calculation = new SECalculation(calculationExpression);

      //put the length measure in the object map
      if (propMap.get("objectName") !== undefined) {
        calculation.name = propMap.get("objectName") ?? "";
        calculation.showing = propMap.get("objectShowing") === "true";
        calculation.exists = propMap.get("objectExists") === "true";
        objMap.set(calculation.name, calculation);
      } else {
        throw new Error(
          "AddCalculationCommand:  calculation name doesn't exist"
        );
      }
      return new AddCalculationCommand(
        calculation,
        calculationExpression,
        calculationParents.map(exp => exp as SEExpression)
      );
    }
    throw new Error(
      `AddCalculationCommand: ${calculationExpression} is undefined`
    );
  }
}
