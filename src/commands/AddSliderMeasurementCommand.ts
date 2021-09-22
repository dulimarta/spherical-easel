import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { SESlider } from "@/models/SESlider";
import { AddExpressionCommand } from "./AddExpressionCommand";
import SliderHandler from "@/eventHandlers/SliderHandler";
import { SavedNames } from "@/types";

export class AddSliderMeasurementCommand extends AddExpressionCommand {
  /**
   * @param seMeasurements
   * @param parents If this is included then the seExpression is made a child of all the SENodules in this array
   */
  constructor(seSlider: SESlider) {
    super(seSlider, []);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddSliderMeasurement",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seExpression.name),
      "objectExists=" + this.seExpression.exists,
      "objectShowing=" + this.seExpression.showing,

      // Object specific attributes
      "sliderMeasurementMin=" + (this.seExpression as SESlider).min,
      "sliderMeasurementMax=" + (this.seExpression as SESlider).max,
      "sliderMeasurementStep=" + (this.seExpression as SESlider).step,
      "sliderMeasurementValue=" + (this.seExpression as SESlider).value
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
    const sliderMeasurementMin = Number(propMap.get("sliderMeasurementMin"));
    const sliderMeasurementMax = Number(propMap.get("sliderMeasurementMax"));
    const sliderMeasurementStep = Number(propMap.get("sliderMeasurementStep"));
    const sliderMeasurementValue = Number(
      propMap.get("sliderMeasurementValue")
    );

    if (
      !isNaN(sliderMeasurementMin) &&
      !isNaN(sliderMeasurementMax) &&
      !isNaN(sliderMeasurementStep) &&
      !isNaN(sliderMeasurementValue)
    ) {
      const slider = new SESlider({
        min: sliderMeasurementMin,
        max: sliderMeasurementMax,
        step: sliderMeasurementStep,
        value: sliderMeasurementValue
      });

      //put the length measure in the object map
      if (propMap.get("objectName") !== undefined) {
        slider.name = propMap.get("objectName") ?? "";
        slider.showing = propMap.get("objectShowing") === "true";
        slider.exists = propMap.get("objectExists") === "true";
        objMap.set(slider.name, slider);
      } else {
        throw new Error("AddSliderCommand: slider name doesn't exist");
      }
      return new AddSliderMeasurementCommand(slider);
    }
    throw new Error(
      `AddLengthMeasurementCommand: ${sliderMeasurementMin}, ${sliderMeasurementMax}, ${sliderMeasurementStep}, or ${sliderMeasurementValue} is undefined`
    );
  }
}
