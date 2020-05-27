import { Command } from "./Command";
import Point from "@/plotables/Point";
import Line from "@/plotables/Line";
import { SELine } from "@/models/SELine";
import { SEPoint } from "@/models/SEPoint";

export class AddLineCommand extends Command {
  private line: SELine;
  private startPoint: SEPoint;
  private endPoint: SEPoint;
  constructor({
    line,
    startPoint,
    endPoint
  }: {
    line: SELine;
    startPoint: SEPoint;
    endPoint: SEPoint;
  }) {
    super();
    this.line = line;
    this.startPoint = startPoint;
    this.endPoint = endPoint;
  }

  do() {
    Command.store.commit("addLine", {
      line: this.line,
      startPoint: this.startPoint,
      endPoint: this.endPoint
    });
  }

  saveState() {
    this.lastState = this.line.id;
  }

  restoreState() {
    Command.store.commit("removeLine", this.lastState);
  }
}
