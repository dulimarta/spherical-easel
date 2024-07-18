import { Command } from "./Command";
import { SESlider } from "@/models/SESlider";
import { toSVGReturnType } from "@/types";

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

  toSVG(deletedNoduleIds: Array<number>): null | toSVGReturnType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
