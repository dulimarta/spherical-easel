import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { Labelable } from "@/types";
import SETTINGS from "@/global-settings";

export class SetNoduleDisplayCommand extends Command {
  private seNodule: SENodule;
  private showing: boolean;
  // if labelShowingValue is undefined thee SENodule is not labelable
  private initialLabelShowingValue: boolean | undefined = undefined;

  constructor(seNodule: SENodule, showing: boolean) {
    super();
    this.seNodule = seNodule;
    this.showing = showing;
    if (this.seNodule.isLabelable()) {
      this.initialLabelShowingValue = ((this
        .seNodule as unknown) as Labelable).label?.showing;
    }
  }

  do(): void {
    this.seNodule.showing = this.showing;
    // Check the global variable that indicates if when hiding an object we should hide the label (and similar for showing)
    // Notice that checking if the this.initialLabelShowingValue is true, means that the object is labelable
    if (SETTINGS.hideObjectHidesLabel) {
      if (this.showing === false && this.initialLabelShowingValue === true) {
        ((this.seNodule as unknown) as Labelable).label!.showing = false;
      }
    }
    if (SETTINGS.showObjectShowsLabel) {
      if (
        this.showing === true &&
        this.initialLabelShowingValue !== undefined
      ) {
        ((this.seNodule as unknown) as Labelable).label!.showing = true;
      }
    }
  }

  saveState(): void {
    this.lastState = this.seNodule.id;
  }

  restoreState(): void {
    this.seNodule.showing = !this.showing;
    // Restore the original state
    if (this.initialLabelShowingValue !== undefined) {
      ((this
        .seNodule as unknown) as Labelable).label!.showing = this.initialLabelShowingValue;
    }
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
