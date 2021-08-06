import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SEExpression } from "@/models/SEExpression";
import { AddExpressionCommand } from "./AddExpressionCommand";
import { SEPoint } from "@/models/SEPoint";
import {
  CoordinateSelection,
  SEPointCoordinate
} from "@/models/SEPointCoordinate";

export class AddLocationMeasurementCommand extends AddExpressionCommand {
  selector: CoordinateSelection;

  /**
   *
   * @param seExpression The measurement object being added
   * @param parent the point whose coordinate is being measured
   * @param selector the coordinate selection (x, y, or z)
   */
  constructor(
    seExpression: SEExpression,
    parent: SEPoint,
    selector: CoordinateSelection
  ) {
    super(seExpression, [parent]);
    this.selector = selector;
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddLocationMeasurement",
      /* arg-1 */ this.seExpression.name,
      /* arg-2 */ this.parents[0].name,
      /* arg-3 */ this.selector,
      /* arg-4 */ this.seExpression.showing,
      /* arg-5 */ this.seExpression.exists
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const point = objMap.get(tokens[2]) as SEPoint | undefined;
    if (point) {
      const selector = Number(tokens[3]);
      const coordMeasure = new SEPointCoordinate(point, selector);
      coordMeasure.name = tokens[1];
      coordMeasure.showing = tokens[4] === "true";
      coordMeasure.exists = tokens[5] === "true";
      objMap.set(tokens[1], coordMeasure);
      return new AddLocationMeasurementCommand(coordMeasure, point, selector);
    } else
      throw new Error(
        `AddLocationMeasurement: point ${tokens[2]} is undefined`
      );
  }
}
