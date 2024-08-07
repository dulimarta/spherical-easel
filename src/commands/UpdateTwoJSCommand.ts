import { Command } from "./Command";

export class UpdateTwoJSCommand extends Command {
  do(): void {
    Command.store.updateTwoJS()
  }

  saveState(): void {}

  restoreState(): void {}

  toOpcode(): null | string | Array<string> {
    return null;
  }
}
