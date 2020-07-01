import { Command } from "./Command";
import { SELine } from "@/models/SELine";

export class AddLineCommand extends Command {
  private line: SELine;
  constructor(line: SELine) {
    super();
    this.line = line;
  }

  do(): void {
    Command.store.commit("addLine", this.line);
  }

  saveState(): void {
    this.lastState = this.line.id;
  }

  restoreState(): void {
    Command.store.commit("removeLine", this.lastState);
  }
}
