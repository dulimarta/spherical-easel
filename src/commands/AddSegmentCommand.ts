import { Command } from "./Command";
import { SESegment } from "@/models/SESegment";
import { SEPoint } from "@/models/SEPoint";

export class AddSegmentCommand extends Command {
  private line: SESegment;
  private startPoint: SEPoint;
  private endPoint: SEPoint;
  constructor({
    line,
    startPoint,
    endPoint
  }: {
    line: SESegment;
    startPoint: SEPoint;
    endPoint: SEPoint;
  }) {
    super();
    this.line = line;
    this.startPoint = startPoint;
    this.endPoint = endPoint;
  }

  do() {
    Command.store.commit("addSegment", {
      segment: this.line,
      startPoint: this.startPoint,
      endPoint: this.endPoint
    });
  }

  saveState() {
    this.lastState = this.line.id;
  }

  restoreState() {
    Command.store.commit("removeSegment", this.lastState);
  }
}
