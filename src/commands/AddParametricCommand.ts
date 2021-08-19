import { Command } from "./Command";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { DisplayStyle } from "@/plottables/Nodule";
import Label from "@/plottables/Label";
import SETTINGS from "@/global-settings";
import { SEParametric } from "@/models/SEParametric";
import Parametric from "@/plottables/Parametric";
import { SEExpression } from "@/models/SEExpression";
import {
  UpdateMode,
  CoordExpression,
  MinMaxExpression,
  MinMaxNumber
} from "@/types";

export class AddParametricCommand extends Command {
  private seParametric: SEParametric;
  private seExpressionParents: SEExpression[] = [];
  private seLabel: SELabel;

  constructor(
    seParametric: SEParametric,
    seExpressionParents: SEExpression[],
    seLabel: SELabel
  ) {
    super();
    this.seParametric = seParametric;
    this.seExpressionParents.push(...seExpressionParents);
    this.seLabel = seLabel;
  }

  do(): void {
    this.seExpressionParents.forEach(par =>
      par.registerChild(this.seParametric)
    );
    this.seParametric.registerChild(this.seLabel);
    Command.store.addParametric(this.seParametric);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seParametric.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removeParametric(this.lastState);
    this.seParametric.unregisterChild(this.seLabel);
    this.seExpressionParents.forEach(par =>
      par.unregisterChild(this.seParametric)
    );
  }

  toOpcode(): null | string | Array<string> {
    return (
      [
        "AddParametric",
        /* arg-0 */ this.seParametric.name,
        /* arg-1 */ this.seParametric.coordinateExpressions.x,
        /* arg-2 */ this.seParametric.coordinateExpressions.y,
        /* arg-3 */ this.seParametric.coordinateExpressions.z,
        /* arg-4 */ this.seParametric.tExpressions.min,
        /* arg-5 */ this.seParametric.tExpressions.max,
        /* arg-6 */ this.seParametric.tNumbers.min,
        /* arg-7 */ this.seParametric.tNumbers.max,
        /* arg-8 */ this.seParametric.ref.closed,
        /* arg-9 */ this.seParametric.showing,
        /* arg-10 */ this.seParametric.exists,
        /* arg-11 */ this.seLabel.name,
        /* arg-12 */ this.seLabel.exists,
        /* arg-13 */ this.seLabel.showing,
        /* arg-14 */ this.seParametric.seParentExpressions
          .map((n: SEExpression) => n.name)
          .join("@"),
        /* arg-15 */ this.seParametric.c1DiscontinuityParameterValues.join("@")
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
    const coordinateExpressions: CoordExpression = {
      x: tokens[1],
      y: tokens[2],
      z: tokens[3]
    };
    const tExpressions: MinMaxExpression = {
      min: tokens[4],
      max: tokens[5]
    };
    const tNumbers: MinMaxNumber = {
      min: Number(tokens[6]),
      max: Number(tokens[7])
    };
    const closed = tokens[8] === "true";

    const calculationParents: (SENodule | undefined)[] = [];

    const parentNames = tokens[14] !== "" ? tokens[14].split("@") : [];
    parentNames.forEach(name =>
      calculationParents.push(objMap.get(name) as SENodule | undefined)
    );

    const tValues = tokens[15] !== "" ? tokens[14].split("@") : [];
    const c1DiscontinuityParameterValues: number[] = [];
    tValues.forEach(str => c1DiscontinuityParameterValues.push(Number(str)));

    if (calculationParents.every(seNodule => seNodule !== undefined)) {
      const parametric = new Parametric(
        tNumbers.min,
        tNumbers.max,
        tNumbers.min,
        tNumbers.max,
        closed
      );
      // Set the display to the default values
      parametric.stylize(DisplayStyle.ApplyCurrentVariables);
      // Adjust the stroke width to the current zoom magnification factor
      parametric.adjustSize();
      parametric.updateDisplay();

      // Add the last command to the group and then execute it (i.e. add the potentially two points and the circle to the store.)
      const newSEParametric = new SEParametric(
        parametric,
        coordinateExpressions,
        tExpressions,
        tNumbers,
        c1DiscontinuityParameterValues,
        calculationParents.map(par => par as SEExpression)
      );
      newSEParametric.name = tokens[0];
      objMap.set(tokens[0], newSEParametric);
      newSEParametric.glowing = false;
      newSEParametric.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      newSEParametric.showing = tokens[9] === "true";
      newSEParametric.exists = tokens[10] === "true";

      // Create the plottable and model label
      const seLabel = new SELabel(new Label(), newSEParametric);
      // Set the initial label location at the start of the curve
      const labelPosition = new Vector3();
      labelPosition
        .copy(parametric.P(tNumbers.min))
        .add(new Vector3(0, SETTINGS.parametric.initialLabelOffset, 0))
        .normalize();
      seLabel.locationVector = labelPosition;
      seLabel.showing = tokens[13] === "true";
      seLabel.exists = tokens[12] === "true";
      seLabel.name = tokens[11];
      objMap.set(tokens[11], seLabel);

      // Create a command group to add the points defining the ellipse and the ellipse to the store
      // This way a single undo click will undo all (potentially three) operations.

      return new AddParametricCommand(
        newSEParametric,
        calculationParents.map(par => par as SEExpression),
        seLabel
      );
    } else
      throw new Error(
        `AddParametric: at least one parent in ${parentNames} is undefined`
      );
  }
}
