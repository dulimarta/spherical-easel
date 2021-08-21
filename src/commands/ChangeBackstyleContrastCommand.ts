import { Command } from "./Command";
import Nodule, { DisplayStyle } from "@/plottables/Nodule";
import { SEStore } from "@/store";

export class ChangeBackStyleContrastCommand extends Command {
  private currentBackStyleContrast: number;
  private pastBackStyleContrast: number;

  constructor(currentBackStyleContrast: number, pastBackStyleContrast: number) {
    super();

    this.currentBackStyleContrast = currentBackStyleContrast;
    this.pastBackStyleContrast = pastBackStyleContrast;
  }

  do(): void {
    // Nodule.setBackStyleContrast(this.currentBackStyleContrast);
    SEStore.changeBackContrast(this.currentBackStyleContrast);
  }

  saveState(): void {
    this.lastState = 0;
  }

  restoreState(): void {
    // Nodule.setBackStyleContrast(this.pastBackStyleContrast);
    SEStore.changeBackContrast(this.pastBackStyleContrast);
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
