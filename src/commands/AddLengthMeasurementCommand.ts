import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SEExpression } from "@/models/SEExpression";
import { AddExpressionCommand } from "./AddExpressionCommand";
import { SESegment } from "@/models/SESegment";
import { SESegmentLength } from "@/models/SESegmentLength";
import { SavedNames } from "@/types";

export class AddLengthMeasurementCommand extends AddExpressionCommand {
  /**
   *
   * @param seExpression The measurement object being added
   * @param parent
   *
   */

  constructor(seExpression: SEExpression, parent: SESegment) {
    super(seExpression, [parent]);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddLengthMeasurement",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seExpression.name),
      "objectExists=" + this.seExpression.exists,
      "objectShowing=" + this.seExpression.showing,

      // Object specific attributes
      "lengthMeasurementSegmentParentName=" +
        Command.symbolToASCIIDec(this.parents[0].name)
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
    const segmentParent = objMap.get(
      propMap.get("lengthMeasurementSegmentParentName") ?? ""
    ) as SESegment | undefined;

    if (segmentParent) {
      const lengthMeasure = new SESegmentLength(segmentParent);

      //put the length measure in the object map
      if (propMap.get("objectName") !== undefined) {
        lengthMeasure.name = propMap.get("objectName") ?? "";
        lengthMeasure.showing = propMap.get("objectShowing") === "true";
        lengthMeasure.exists = propMap.get("objectExists") === "true";
        objMap.set(lengthMeasure.name, lengthMeasure);
      } else {
        throw new Error(
          "AddLengthMeasureCommand:  length measure name doesn't exist"
        );
      }
      return new AddLengthMeasurementCommand(lengthMeasure, segmentParent);
    }
    throw new Error(
      `AddLengthMeasurementCommand: ${segmentParent} is undefined`
    );
  }
}
