import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SECircle } from "@/models/SECircle";

export class AddCircleCommand extends Command {
  private circle: SECircle;
  constructor(circle: SECircle) {
    super();
    this.circle = circle;
  }

  do(): void {
    Command.store.commit("addCircle", this.circle);
  }

  saveState(): void {
    this.lastState = this.circle.id;
  }

  restoreState(): void {
    Command.store.commit("removeCircle", this.lastState);
  }
}
