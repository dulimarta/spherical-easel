import Nodule from "@/plottables/Nodule";
import { Command } from "./Command";
import { FillStyle, SavedNames } from "@/types";
import { SENodule } from "@/models/SENodule";


export class ChangeFillStyleCommand extends Command {
  private currentFillStyle: FillStyle;
  private pastFillStyle: FillStyle;

  constructor(currentFillStyle: FillStyle, pastFillStyle: FillStyle) {
    super();

    this.currentFillStyle = currentFillStyle;
    this.pastFillStyle = pastFillStyle;
  }

  do(): void {
    console.log("change fill style")
    Nodule.setFillStyle(this.currentFillStyle);
    Command.store.changeFillStyle(this.currentFillStyle);
  }

  saveState(): void {
    this.lastState = 0;
  }

  restoreState(): void {
    Command.store.changeFillStyle(this.pastFillStyle);
    Nodule.setFillStyle(this.pastFillStyle);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "ChangeGlobalFillStyle",
      "currentGlobalFillStyle=" + this.currentFillStyle,
      "pastGlobalFillStyle=" + this.pastFillStyle
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
    const currentFillStyle = Number(propMap.get("currentGlobalFillStyle")) as
      | FillStyle
      | undefined;
    const pastFillStyle = Number(propMap.get("pastGlobalFillStyle")) as
      | FillStyle
      | undefined;
    if (currentFillStyle != undefined && pastFillStyle != undefined) {
      return new ChangeFillStyleCommand(currentFillStyle, pastFillStyle);
    }else {
      throw new Error(
        `ChangeFillStyleCommand: past or current fill is undefined`
      );
    }
  }
}
