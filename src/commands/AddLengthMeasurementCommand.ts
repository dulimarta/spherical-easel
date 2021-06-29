import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SEExpression } from "@/models/SEExpression";
import { AddMeasurementCommand } from "./AddMeasurementCommand";
import { SESegment } from "@/models/SESegment";
import { SESegmentLength } from "@/models/SESegmentLength";

export class AddLengthMeasurementCommand extends AddMeasurementCommand {
  /**
   *
   * @param seExpression The measurement object being added
   * @param parent the point whose coordinate is being measured
   */
  constructor(seExpression: SEExpression, parent: SESegment) {
    super(seExpression, [parent]);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddLengthMeasurement",
      /* arg-1 */ this.seExpression.name,
      /* arg-2 */ this.parents[0].name,
      /* arg-3 */ this.seExpression.showing,
      /* arg-4 */ this.seExpression.exists
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const segment = objMap.get(tokens[2]) as SESegment | undefined;
    if (segment) {
      const lengthMeasure = new SESegmentLength(segment);
      lengthMeasure.name = tokens[1];
      lengthMeasure.showing = tokens[3] === "true";
      lengthMeasure.exists = tokens[4] === "true";
      objMap.set(tokens[1], lengthMeasure);
      return new AddLengthMeasurementCommand(lengthMeasure, segment);
    } else
      throw new Error(
        `AddLengthMeasurement: segment ${tokens[2]} is undefined`
      );
  }
}
