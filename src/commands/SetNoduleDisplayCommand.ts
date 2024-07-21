import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { Labelable, SavedNames } from "@/types";
import SETTINGS from "@/global-settings";
import { toSVGType } from "@/types";

export class SetNoduleDisplayCommand extends Command {
  private seNodule: SENodule;
  private showing: boolean;
  // if labelShowingValue is undefined the SENodule is not labelable
  private initialLabelShowingValue: boolean | undefined = undefined;

  constructor(seNodule: SENodule, showing: boolean) {
    super();
    this.seNodule = seNodule;
    this.showing = showing;
    const theLabel = this.seNodule.getLabel()
    if (theLabel) {
      this.initialLabelShowingValue = theLabel.showing
    }
  }

  do(): void {
    //console.debug(`nodule ${this.seNodule.name}, show value ${this.showing}`);
    this.seNodule.showing = this.showing;
    // Check the global variable that indicates if when hiding an object we should hide the label (and similar for showing)
    // Notice that checking if the this.initialLabelShowingValue is true, means that the object is labelable
    if (SETTINGS.hideObjectHidesLabel) {
      if (this.showing === false && this.initialLabelShowingValue === true) {
        (this.seNodule as unknown as Labelable).label!.showing = false;
      }
    }
    if (SETTINGS.showObjectShowsLabel) {
      if (
        this.showing === true &&
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
    this.seNodule.showing = !this.showing;
    // Restore the original state
    if (this.initialLabelShowingValue !== undefined) {
      (this.seNodule as unknown as Labelable).label!.showing =
        this.initialLabelShowingValue;
    }
  }

  toSVG(deletedNoduleIds: Array<number>): null | toSVGType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
  }

  toOpcode(): null | string | Array<string> {
    return [
      "SetNoduleDisplay",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seNodule.name),
      // Object specific attributes necessary for recreating the object
      "objectShowing=" + this.showing
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
    const nodule = objMap.get(propMap.get("objectName") ?? "") as
      | SENodule
      | undefined;

    if (nodule) {
      return new SetNoduleDisplayCommand(
        nodule,
        propMap.get("objectShowing") === "true"
      );
    } else {
      throw new Error(
        `SetNoduleDisplayCommand: nodule with name ${propMap.get(
          "objectName"
        )} is undefined`
      );
    }
  }
}
