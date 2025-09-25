import { Command } from "./Command";
import { SENodule } from "@/models-spherical/SENodule";
import { AddExpressionCommand } from "./AddExpressionCommand";
import { SEPoint } from "@/models-spherical/SEPoint";
import { SEPointDistance } from "@/models-spherical/SEPointDistance";
import { SavedNames, ValueDisplayMode } from "@/types";
import { toSVGType } from "@/types";

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
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seExpression.name),
      "objectExists=" + this.seExpression.exists,
      "objectShowing=" + this.seExpression.showing,

      // Object specific attributes
      "distanceMeasurementParentPoint1Name=" +
        Command.symbolToASCIIDec(this.parents[0].name),
      "distanceMeasurementParentPoint2Name=" +
        Command.symbolToASCIIDec(this.parents[1].name),
      "valueDisplayMode=" + this.seExpression.valueDisplayMode
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
    const parentPoint1 = objMap.get(
      propMap.get("distanceMeasurementParentPoint1Name") ?? ""
    ) as SEPoint | undefined;

    const parentPoint2 = objMap.get(
      propMap.get("distanceMeasurementParentPoint2Name") ?? ""
    ) as SEPoint | undefined;

    const valueDisplayMode = Number(propMap.get("valueDisplayMode")) as
      | ValueDisplayMode
      | undefined;

    if (parentPoint1 && parentPoint2 && typeof valueDisplayMode === "number") {
      const distanceMeasure = new SEPointDistance(parentPoint1, parentPoint2);
      distanceMeasure.valueDisplayMode = valueDisplayMode;
      //put the distance measure in the object map
      if (propMap.get("objectName") !== undefined) {
        distanceMeasure.name = propMap.get("objectName") ?? "";
        distanceMeasure.showing = propMap.get("objectShowing") === "true";
        distanceMeasure.exists = propMap.get("objectExists") === "true";
        objMap.set(distanceMeasure.name, distanceMeasure);
      } else {
        throw new Error(
          `AddPointDistanceMeasurementCommand: Point distance name doesn't exist`
        );
      }
      return new AddPointDistanceMeasurementCommand(distanceMeasure, [
        parentPoint1,
        parentPoint2
      ]);
    }
    throw new Error(
      `AddPointDistanceMeasurementCommand: Parent point 1 ${parentPoint1} or parent point 2 ${parentPoint2} doesn't exist`
    );
  }
  // toOpcode(): null | string | Array<string> {
  //   return [
  //     "AddPointDistanceMeasurement",
  //     /* arg-1 */ this.seExpression.name,
  //     /* arg-2 */ this.parents.map((n: SENodule) => n.name).join("/"),
  //     /* arg-N-2 */ this.seExpression.showing,
  //     /* arg-N-1 */ this.seExpression.exists
  //   ].join("/");
  // }

  // static parse(command: string, objMap: Map<string, SENodule>): Command {
  //   const tokens = command.split("/");
  //   const numTokens = tokens.length;
  //   const point1 = objMap.get(tokens[2]) as SEPoint | undefined;
  //   const point2 = objMap.get(tokens[3]) as SEPoint | undefined;
  //   if (point1 && point2) {
  //     const distanceMeasure = new SEPointDistance(point1, point2);
  //     distanceMeasure.name = tokens[1];
  //     distanceMeasure.showing = tokens[numTokens - 2] === "true";
  //     distanceMeasure.exists = tokens[numTokens - 1] === "true";
  //     objMap.set(tokens[1], distanceMeasure);
  //     return new AddPointDistanceMeasurementCommand(distanceMeasure, [
  //       point1,
  //       point2
  //     ]);
  //   } else
  //     throw new Error(
  //       `AddPointDistanceMeasurement: end point ${tokens[2]} or ${tokens[3]} is undefined`
  //     );
  // }
}
