import Nodule from "@/plottables/Nodule";
import { Command } from "./Command";
import { toSVGReturnType } from "@/types";

export class ChangeFillStyleCommand extends Command {
  private currentFillStyle: boolean;
  private pastFillStyle: boolean;

  constructor(currentFillStyle: boolean, pastFillStyle: boolean) {
    super();

    this.currentFillStyle = currentFillStyle;
    this.pastFillStyle = pastFillStyle;
  }

  do(): void {
    Nodule.setGradientFill(this.currentFillStyle);
    Command.store.changeGradientFill(this.currentFillStyle);
  }

  saveState(): void {
    this.lastState = 0;
  }

  restoreState(): void {
    Nodule.setGradientFill(this.pastFillStyle);
    Command.store.changeGradientFill(this.pastFillStyle);
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
