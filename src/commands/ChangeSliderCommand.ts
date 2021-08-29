import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { Labelable } from "@/types";
import SETTINGS from "@/global-settings";
import { SESlider } from "@/models/SESlider";

export class ChangeSliderCommand extends Command {
  private seSlider: SESlider;
  private oldSliderValue: number;
  private newSliderValue: number;

  constructor(
    seSlider: SESlider,
    newSliderValue: number,
    oldSliderValue: number
  ) {
    super();
    this.seSlider = seSlider;
    this.oldSliderValue = oldSliderValue;
    this.newSliderValue = newSliderValue;
  }

  do(): void {
    this.seSlider.value = this.newSliderValue;
  }

  saveState(): void {
    this.lastState = this.seSlider.id;
  }

  restoreState(): void {
    this.seSlider.value = this.oldSliderValue;
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
