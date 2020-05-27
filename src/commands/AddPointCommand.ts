import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import Point from "@/plotables/Point";

export class AddPointCommand extends Command {
  private arg: SEPoint;
  constructor(arg: SEPoint) {
    super();
    this.arg = arg;
  }

  do(): void {
    AddPointCommand.store.commit("addPoint", this.arg);
  }

  saveState(): void {
    this.lastState = this.arg.id;
  }

  restoreState(): void {
    Command.store.commit("removePoint", this.lastState);
  }
}
