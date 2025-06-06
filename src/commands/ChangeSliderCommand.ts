import { Command } from "./Command";
import { SESlider } from "@/models/SESlider";
import { CommandReturnType, toSVGType } from "@/types";

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

  do(): CommandReturnType {
    this.seSlider.value = this.newSliderValue;
    return { success: true };
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
