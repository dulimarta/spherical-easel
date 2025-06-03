import { Command } from "./Command";
import { SEExpression } from "../models/SEExpression";

import { CommandReturnType, SavedNames, ValueDisplayMode } from "../types";
import { SENodule } from "@/models/SENodule";
import { toSVGType } from "@/types";

export class SetValueDisplayModeCommand extends Command {
  private seExpression: SEExpression;
  private newValueDisplayMode: ValueDisplayMode;
  private oldValueDisplayMode: ValueDisplayMode;

  constructor(
    seExpression: SEExpression,
    oldVal: ValueDisplayMode,
    newVal: ValueDisplayMode
  ) {
    super();
    this.seExpression = seExpression;
    this.oldValueDisplayMode = oldVal;
    this.newValueDisplayMode = newVal;
  }

  do(): CommandReturnType {
    this.seExpression.valueDisplayMode = this.newValueDisplayMode;
    return { success: true };
  }

  saveState(): void {
    this.lastState = this.seExpression.id;
  }

  restoreState(): void {
    this.seExpression.valueDisplayMode = this.oldValueDisplayMode;
  }

  toOpcode(): null | string | Array<string> {
    return [
      "SetValueDisplayMode",
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seExpression.name),

      // Object specific attributes
      "setValueDisplayModeOldValue=" + this.oldValueDisplayMode,
      "setValueDisplayModeNewValue=" + this.newValueDisplayMode
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

    // get the object specific attributes
    const seExpression = objMap.get(propMap.get("objectName") ?? "") as
      | SEExpression
      | undefined;
    const oldVal = propMap.get("setValueDisplayModeOldValue") as
      | ValueDisplayMode
      | undefined;

    const newVal = propMap.get("setValueDisplayModeNewValue") as
      | ValueDisplayMode
      | undefined;
    if (seExpression && oldVal && newVal) {
      return new SetValueDisplayModeCommand(seExpression, oldVal, newVal);
    }
    throw new Error(
      `SetValueDisplayModeCommand: Expression ${seExpression} or Value Display Mode: Old ${oldVal} or New ${newVal} are undefined`
    );
  }
}
