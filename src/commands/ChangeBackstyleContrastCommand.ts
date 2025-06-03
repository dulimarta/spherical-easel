import Nodule from "@/plottables/Nodule";
import { Command } from "./Command";
import { CommandReturnType, SavedNames, toSVGType } from "@/types";
import { SENodule } from "@/models/SENodule";

export class ChangeBackStyleContrastCommand extends Command {
  private currentBackStyleContrast: number;
  private pastBackStyleContrast: number;

  constructor(currentBackStyleContrast: number, pastBackStyleContrast: number) {
    super();

    this.currentBackStyleContrast = currentBackStyleContrast;
    this.pastBackStyleContrast = pastBackStyleContrast;
  }

  do(): CommandReturnType {
    Command.store.changeBackContrast(this.currentBackStyleContrast);
    return { success: true };
  }

  saveState(): void {
    this.lastState = 0;
  }

  restoreState(): void {
    Command.store.changeBackContrast(this.pastBackStyleContrast);
  }

  toOpcode(): null | string | Array<string> {
    return [
      "ChangeBackStyleContrast",
      "currentGlobalBackStyleContrast=" + this.currentBackStyleContrast,
      "pastGlobalBackStyleContrast=" + this.pastBackStyleContrast
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
    const currentContrast = Number(
      propMap.get("currentGlobalBackStyleContrast")
    ) as number | undefined;
    const pastStyleContrast = Number(
      propMap.get("pastGlobalBackStyleContrast")
    ) as number | undefined;
    if (currentContrast != undefined && pastStyleContrast != undefined) {
      return new ChangeBackStyleContrastCommand(
        currentContrast,
        pastStyleContrast
      );
    } else {
      throw new Error(
        `ChangeBackStyleContrastCommand: past or current contrast is undefined`
      );
    }
  }
}
