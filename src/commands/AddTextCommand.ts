// Use the following template as a starter for a new Command
import { Command } from "./Command";

export class AddTextCommand extends Command {
  constructor(a: string, x: number, y: number) {
    console.debug("AddTextCommand:AddTextCommand()");
    super();
  }
  restoreState(): void {
    // throw new Error("Method not implemented.");
  }
  saveState(): void {
    // throw new Error("Method not implemented.");
  }
  do(): void {
    console.debug("AddTextCommand:do()");
    // throw new Error("Method not implemented.");
  }
  toOpcode(): null | string | Array<string> {
    return null;
  }

}
