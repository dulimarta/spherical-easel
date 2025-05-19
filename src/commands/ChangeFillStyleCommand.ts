import Nodule from "@/plottables/Nodule";
import { Command } from "./Command";
import { SavedNames, toSVGType } from "@/types";
import { SENodule } from "@/models/internal";

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
    Command.store.changeGradientFill(this.pastFillStyle);
    Nodule.setGradientFill(this.pastFillStyle);
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
    const currentFillStyle = propMap.get("currentGlobalFillStyle") === "true";
    const pastFillStyle = propMap.get("pastGlobalFillStyle") === "true";
    return new ChangeFillStyleCommand(currentFillStyle, pastFillStyle);
  }
}
