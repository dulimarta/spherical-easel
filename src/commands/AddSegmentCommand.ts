import { Command } from "./Command";
import { SESegment } from "@/models/SESegment";
import { SEPoint } from "@/models/SEPoint";

export class AddSegmentCommand extends Command {
  private line: SESegment;
  constructor(line: SESegment) {
    super();
    this.line = line;
  }

  do() {
    Command.store.commit("addSegment", this.line);
  }

  saveState() {
    this.lastState = this.line.id;
  }

  restoreState() {
    Command.store.commit("removeSegment", this.lastState);
  }
}
