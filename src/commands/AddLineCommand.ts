import { Command } from "./Command";
import Point from "@/plotables/Point";
import Line from "@/3d-objs/Line";

export class AddLineCommand extends Command {
  private line: Line;
  private startPoint: Point;
  private endPoint: Point;
  constructor({
    line,
    startPoint,
    endPoint
  }: {
    line: Line;
    startPoint: Point;
    endPoint: Point;
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
