import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { Labelable } from "@/types";
import SETTINGS from "@/global-settings";
import { toSVGReturnType } from "@/types";

export class SetNoduleExistCommand extends Command {
  private seNodule: SENodule;
  private existing: boolean;
  private showing: boolean;
  // if labelShowingValue is undefined thee SENodule is not labelable
  private initialLabelShowingValue: boolean | undefined = undefined;

  constructor(seNodule: SENodule, existing: boolean, showing: boolean) {
    super();
    this.seNodule = seNodule;
    this.existing = existing;
    this.showing = showing;
    const theLabel = this.seNodule.getLabel()
    if (theLabel) {
      this.initialLabelShowingValue = theLabel.showing;
    }
  }

  do(): void {
    this.seNodule.exists = this.existing;
    this.seNodule.showing = this.showing;
    // Check the global variable that indicates if when hiding an object we should hide the label (and similar for showing)
    // Notice that checking if the this.initialLabelShowingValue is true, means that the object is labelable
    if (SETTINGS.hideObjectHidesLabel) {
      if (this.existing === false && this.initialLabelShowingValue === true) {
        (this.seNodule as unknown as Labelable).label!.showing = false;
      }
    }
    if (SETTINGS.showObjectShowsLabel) {
      if (
        this.existing === true &&
        this.initialLabelShowingValue !== undefined
      ) {
        (this.seNodule as unknown as Labelable).label!.showing = true;
      }
    }
  }

  saveState(): void {
    this.lastState = this.seNodule.id;
  }

  restoreState(): void {
    this.seNodule.exists = !this.existing;
    this.seNodule.showing = !this.showing;
    // Restore the original state
    if (this.initialLabelShowingValue !== undefined) {
      (this.seNodule as unknown as Labelable).label!.showing =
        this.initialLabelShowingValue;
    }
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
