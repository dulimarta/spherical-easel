import Nodule from "@/plottables/Nodule";
import { Command } from "./Command";

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
    // Command.store.changeBackContrast(this.currentBackStyleContrast);
  }

  saveState(): void {
    this.lastState = 0;
  }

  restoreState(): void {
    Nodule.setBackStyleContrast(this.pastBackStyleContrast);
    // Command.store.changeBackContrast(this.pastBackStyleContrast);
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
