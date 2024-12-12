// Use the following template as a starter for a new Command
import { SEText } from "@/models/SEText";
import { Command } from "./Command";

export class AddTextCommand extends Command {
  private seText: SEText;
  constructor(txt: SEText) { //constructor(txt: SEText, x: number, y: number)
    super();
    this.seText = txt;
  }
  restoreState(): void {
    Command.store.removeText(this.seText.id);
    // for undo.
    // throw new Error("Method not implemented.");
  }
  saveState(): void {
    this.lastState = this.seText.id;
    // throw new Error("Method not implemented.");
  }
  do(): void {
    Command.store.addText(this.seText)
    // throw new Error("Method not implemented.");
    // Go into object tree; parents, children, etc.
  }
  toOpcode(): null | string | Array<string> {
    return null;
  }

}
