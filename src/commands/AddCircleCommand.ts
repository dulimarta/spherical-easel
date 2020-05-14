import { Command } from "./Command";
import Point from "@/3d-objs/Point";
import Circle from "@/3d-objs/Circle";

export class AddCircleCommand extends Command {
  private circle: Circle;
  private center: Point;
  private circlePoint: Point;
  constructor({
    circle,
    centerPoint,
    circlePoint
  }: {
    circle: Circle;
    centerPoint: Point;
    circlePoint: Point;
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
