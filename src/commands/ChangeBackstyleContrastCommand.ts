import Nodule from "@/plottables/Nodule";
import { Command } from "./Command";
import { toSVGReturnType } from "@/types";


export class ChangeBackStyleContrastCommand extends Command {
  private currentBackStyleContrast: number;
  private pastBackStyleContrast: number;

  constructor(currentBackStyleContrast: number, pastBackStyleContrast: number) {
    super();

    this.currentBackStyleContrast = currentBackStyleContrast;
    this.pastBackStyleContrast = pastBackStyleContrast;
  }

  do(): void {
    Nodule.setBackStyleContrast(this.currentBackStyleContrast);
    Command.store.changeBackContrast(this.currentBackStyleContrast);
  }

  saveState(): void {
    this.lastState = 0;
  }

  restoreState(): void {
    Nodule.setBackStyleContrast(this.pastBackStyleContrast);
    Command.store.changeBackContrast(this.pastBackStyleContrast);
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
