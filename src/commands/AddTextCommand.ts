// Use the following template as a starter for a new Command
import { SEText } from "@/models/SEText";
import { Command } from "./Command";

export class AddTextCommand extends Command {
  private seText: SEText;
  constructor(txt: SEText) { //constructor(txt: SEText, x: number, y: number)
    console.debug("AddTextCommand:AddTextCommand()");
    super();
    this.seText = txt;
  }
  restoreState(): void {
    // for undo.
    // throw new Error("Method not implemented.");
  }
  saveState(): void {
    // throw new Error("Method not implemented.");
  }
  do(): void {
    Command.store.addText(this.seText)
    console.debug("AddTextCommand:do()");
    // throw new Error("Method not implemented.");
    // Go into object tree; parents, children, etc.
  }
  toOpcode(): null | string | Array<string> {
    return null;
  }

}
