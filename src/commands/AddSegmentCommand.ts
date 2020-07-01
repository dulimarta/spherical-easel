import { Command } from "./Command";
import { SESegment } from "@/models/SESegment";

export class AddSegmentCommand extends Command {
  private line: SESegment;
  constructor(line: SESegment) {
    super();
    this.line = line;
  }

  do(): void {
    Command.store.commit("addSegment", this.line);
  }

  saveState(): void {
    this.lastState = this.line.id;
  }

  restoreState(): void {
    Command.store.commit("removeSegment", this.lastState);
  }
}
