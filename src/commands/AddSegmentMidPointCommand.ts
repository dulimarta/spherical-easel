import { Command } from "./Command";
import { SESegmentMidPoint } from "@/models/SESegmentMidPoint";

export class AddSegmentMidPointCommand extends Command {
  private arg: SESegmentMidPoint;
  constructor(arg: SESegmentMidPoint) {
    super();
    this.arg = arg;
  }

  do(): void {
    AddSegmentMidPointCommand.store.commit("addSegmentMidPoint", this.arg);
  }

  saveState(): void {
    this.lastState = this.arg.id;
  }

  restoreState(): void {
    Command.store.commit("removeSegmentMidPoint", this.lastState);
  }
}
