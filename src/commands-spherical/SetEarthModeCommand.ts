import { Command } from "./Command";
import { SENodule } from "@/models-spherical/SENodule";
import { SavedNames } from "@/types";
import { toSVGType } from "@/types";

export class SetEarthModeCommand extends Command {
  private showing: boolean;

  constructor(showing: boolean) {
    super();
    this.showing = showing;
  }

  do(): void {
    Command.store.isEarthMode = this.showing;
  }

  saveState(): void {}

  restoreState(): void {
    Command.store.isEarthMode = !this.showing;
  }

  toOpcode(): null | string | Array<string> {
    return [
      "SetEarthMode",
      // Specific attributes necessary for recreating earth mode
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

    if (propMap.get("objectShowing") !== undefined) {
      return new SetEarthModeCommand(propMap.get("objectShowing") === "true");
    } else {
      throw new Error(
        `SetEarthModeDisplayCommand: "objectShowing" is undefined`
      );
    }
  }
}
