import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SEExpression } from "@/models/SEExpression";
import { AddExpressionCommand } from "./AddExpressionCommand";
import { SEPoint } from "@/models/SEPoint";
import {
  CoordinateSelection,
  SEPointCoordinate
} from "@/models/SEPointCoordinate";
import { SavedNames } from "@/types";

export class AddPointCoordinateMeasurementCommand extends AddExpressionCommand {
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
      "AddPointCoordinateMeasurement",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seExpression.name),
      "objectExists=" + this.seExpression.exists,
      "objectShowing=" + this.seExpression.showing,

      // Object specific attributes
      "locationMeasurementParentPointName=" +
        Command.symbolToASCIIDec(this.parents[0].name),
      "locationMeasurementSelector=" + this.selector
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
    const parentPoint = objMap.get(
      propMap.get("locationMeasurementParentPointName") ?? ""
    ) as SEPoint | undefined;

    const selector = Number(propMap.get("locationMeasurementSelector"));

    if (parentPoint && !isNaN(selector)) {
      const locationMeasurement = new SEPointCoordinate(
        parentPoint,
        selector as CoordinateSelection
      );

      //put the length measure in the object map
      if (propMap.get("objectName") !== undefined) {
        locationMeasurement.name = propMap.get("objectName") ?? "";
        locationMeasurement.showing = propMap.get("objectShowing") === "true";
        locationMeasurement.exists = propMap.get("objectExists") === "true";
        objMap.set(locationMeasurement.name, locationMeasurement);
      } else {
        throw new Error(
          "AddPointCoordinateMeasurementCommand:  location measure name doesn't exist"
        );
      }
      return new AddPointCoordinateMeasurementCommand(
        locationMeasurement,
        parentPoint,
        selector as CoordinateSelection
      );
    }
    throw new Error(
      `AddPointCoordinateMeasurementCommand: ${parentPoint} is undefined`
    );
  }
}
