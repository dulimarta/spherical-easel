import { Command } from "./Comnand";
import Vertex from "@/3d-objs/Vertex";
import Circle from "@/3d-objs/Circle";

export class AddRingCommand extends Command {
  private ring: Circle;
  private center: Vertex;
  private circlePoint: Vertex;
  constructor({
    ring,
    centerPoint,
    circlePoint
  }: {
    ring: Circle;
    centerPoint: Vertex;
    circlePoint: Vertex;
  }) {
    super();
    this.ring = ring;
    this.center = centerPoint;
    this.circlePoint = circlePoint;
  }

  do() {
    Command.store.commit("addRing", {
      ring: this.ring,
      centerPoint: this.center,
      circlePoint: this.circlePoint
    });
  }

  saveState() {
    this.lastState = this.ring.id;
  }

  restoreState() {
    Command.store.commit("removeRing", this.lastState);
  }
}
