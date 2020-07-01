import { Command } from "./Command";
import { SELine } from "@/models/SELine";

export class AddLineCommand extends Command {
  private line: SELine;
  constructor(line: SELine) {
    super();
    this.line = line;
  }

  do() {
    Command.store.commit("addLine", this.line);
  }

  saveState() {
    this.lastState = this.line.id;
  }

  restoreState() {
    Command.store.commit("removeLine", this.lastState);
  }
}
