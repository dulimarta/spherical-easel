import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SESlider } from "@/models/SESlider";
import { AddMeasurementCommand } from "./AddMeasurementCommand";

export class AddSliderMeasurementCommand extends AddMeasurementCommand {
  /**
   * @param seMeasurements
   * @param parents If this is included then the seMeasurement is made a child of all the SENodules in this array
   */
  constructor(seSlider: SESlider) {
    super(seSlider, []);
  }

  toOpcode(): null | string | Array<string> {
    const slider = this.seMeasurement as SESlider;
    return [
      "AddSliderMeasurement",
      /* arg-1 */ this.seMeasurement.name,
      /* arg-2 */ slider.min,
      /* arg-3 */ slider.max,
      /* arg-4 */ slider.step,
      /* arg-5 */ slider.value,
      /* arg-6 */ this.seMeasurement.showing,
      /* arg-7 */ this.seMeasurement.exists
    ].join("/");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("/");
    const min = Number(tokens[2]);
    const max = Number(tokens[3]);
    const step = Number(tokens[4]);
    const value = Number(tokens[5]);
    const seSlider = new SESlider({ min, max, step, value });
    seSlider.name = tokens[1];
    seSlider.showing = tokens[6] === "true";
    seSlider.exists = tokens[7] === "true";
    objMap.set(tokens[1], seSlider);
    return new AddSliderMeasurementCommand(seSlider);
  }
}
