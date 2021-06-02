import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SEMeasurement } from "@/models/SEMeasurement";
import { CommandGroup } from "./CommandGroup";
import { AddMeasurementCommand } from "./AddMeasurementCommand";
import { SEPoint } from "@/models/SEPoint";
import {
  CoordinateSelection,
  SEPointCoordinate
} from "@/models/SEPointCoordinate";

export class AddLocationMeasurementCommand extends AddMeasurementCommand {
  selector: CoordinateSelection;

  /**
   *
   * @param seMeasurement The measurement object being added
   * @param parent the point whose coordinate is being measured
   * @param selector the coordinate selection (x, y, or z)
   */
  constructor(
    seMeasurement: SEMeasurement,
    parent: SEPoint,
    selector: CoordinateSelection
  ) {
    super(seMeasurement, [parent]);
    this.selector = selector;
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddLocationMeasurement",
      /* arg-1 */ this.seMeasurement.name,
      /* arg-2 */ this.parents[0].name,
      /* arg-3 */ this.selector
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const point = objMap.get(tokens[2]) as SEPoint | undefined;
    if (point) {
      const selector = Number(tokens[3]);
      const coordMeasure = new SEPointCoordinate(point, selector);
      objMap.set(tokens[1], coordMeasure);
      return new AddLocationMeasurementCommand(coordMeasure, point, selector);
    } else
      throw new Error(
        `AddLocationMeasurement: point ${tokens[2]} is undefined`
      );
  }
}
