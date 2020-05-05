import { Command } from "./Comnand";
import Vertex from "@/3d-objs/Vertex";
import Line from "@/3d-objs/Line";

export class AddLineCommand extends Command {
  private line: Line;
  private startPoint: Vertex;
  private endPoint: Vertex;
  constructor({
    line,
    startPoint,
    endPoint
  }: {
    line: Line;
    startPoint: Vertex;
    endPoint: Vertex;
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