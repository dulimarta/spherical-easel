import { CommandReturnType } from "@/types";
import { Command } from "./Command";

export class UpdateTwoJSCommand extends Command {
  do(): CommandReturnType {
    Command.store.updateTwoJS();
    return { success: true };
  }

  saveState(): void {}

  restoreState(): void {}

  toOpcode(): null | string | Array<string> {
    return null;
  }
}
