import { Command } from "./Command";
import { SESegment } from "@/models/SESegment";

export class AddSegmentCommand extends Command {
  private segment: SESegment;
  constructor(segment: SESegment) {
    super();
    this.segment = segment;
  }

  do(): void {
    Command.store.commit("addSegment", this.segment);
  }

  saveState(): void {
    this.lastState = this.segment.id;
  }

  restoreState(): void {
    Command.store.commit("removeSegment", this.lastState);
  }
}
