import { Command } from "./Command";
import Point from "@/plotables/Point";
import Circle from "@/plotables/Circle";
import { SEPoint } from "@/models/SEPoint";
import { SECircle } from "@/models/SECircle";

export class AddCircleCommand extends Command {
  private circle: SECircle;
  private center: SEPoint;
  private circlePoint: SEPoint;
  constructor({
    circle,
    centerPoint,
    circlePoint
  }: {
    circle: SECircle;
    centerPoint: SEPoint;
    circlePoint: SEPoint;
  }) {
    super();
    this.circle = circle;
    this.center = centerPoint;
    this.circlePoint = circlePoint;
  }

  do() {
    Command.store.commit("addCircle", {
      circle: this.circle,
      centerPoint: this.center,
      circlePoint: this.circlePoint
    });
  }

  saveState() {
    this.lastState = this.circle.id;
  }

  restoreState() {
    Command.store.commit("removeCircle", this.lastState);
  }
}
