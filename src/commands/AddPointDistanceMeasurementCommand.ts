import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { AddExpressionCommand } from "./AddExpressionCommand";
import { SEPoint } from "@/models/SEPoint";
import { SEPointDistance } from "@/models/SEPointDistance";

export class AddPointDistanceMeasurementCommand extends AddExpressionCommand {
  // /**
  //  *
  //  * @param seExpression The measurement object being added
  //  * @param parent the point whose coordinate is being measured
  //  */
  // constructor(
  //   seExpression: SEExpression,
  //   parent: SEPoint[],
  //   selector: CoordinateSelection
  // ) {
  //   super(seExpression, parent);
  // }

  toOpcode(): null | string | Array<string> {
    return [
      "AddPointDistanceMeasurement",
      /* arg-1 */ this.seExpression.name,
      /* arg-2 */ this.parents.map((n: SENodule) => n.name).join("/"),
      /* arg-N-2 */ this.seExpression.showing,
      /* arg-N-1 */ this.seExpression.exists
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const numTokens = tokens.length;
    const point1 = objMap.get(tokens[2]) as SEPoint | undefined;
    const point2 = objMap.get(tokens[3]) as SEPoint | undefined;
    if (point1 && point2) {
      const distanceMeasure = new SEPointDistance(point1, point2);
      distanceMeasure.name = tokens[1];
      distanceMeasure.showing = tokens[numTokens - 2] === "true";
      distanceMeasure.exists = tokens[numTokens - 1] === "true";
      objMap.set(tokens[1], distanceMeasure);
      return new AddPointDistanceMeasurementCommand(distanceMeasure, [
        point1,
        point2
      ]);
    } else
      throw new Error(
        `AddPointDistanceMeasurement: end point ${tokens[2]} or ${tokens[3]} is undefined`
      );
  }
}
