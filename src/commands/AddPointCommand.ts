import { Command } from "./Command";
import Point from "@/plotables/Point";

export class AddPointCommand extends Command {
  private arg: Point;
  constructor(arg: Point) {
    super();
    this.arg = arg;
  }

  do() {
    AddPointCommand.store.commit("addPoint", this.arg);
  }

  saveState() {
    this.lastState = this.arg.id;
  }

  restoreState() {
    Command.store.commit("removePoint", this.lastState);
  }
}
