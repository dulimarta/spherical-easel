// Use the following template as a starter for a new Command
import { Command } from "./Command";

export class DummyCommand extends Command {
  constructor(a: string, x: number, y: number) {
    super()
  }
  restoreState(): void {
    // throw new Error("Method not implemented.");
  }
  saveState(): void {
    // throw new Error("Method not implemented.");
  }
  do(): void {
    console.debug("DummyCommand:do()")
    // throw new Error("Method not implemented.");
  }
  toOpcode(): null | string | Array<string> {
    return null
  }

}