import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SECircle } from "@/models/SECircle";

export class AddCircleCommand extends Command {
  private circle: SECircle;
  // private center: SEPoint;
  // private circlePoint: SEPoint;
  constructor(
    //{
    circle: SECircle /*,
    centerPoint,
    circlePoint
  }: {
    circle: SECircle;
    centerPoint: SEPoint;
    circlePoint: SEPoint;
  }*/
  ) {
    super();
    this.circle = circle;
    // this.center = centerPoint;
    // this.circlePoint = circlePoint;
  }

  do() {
    Command.store.commit("addCircle", this.circle);
  }

  saveState() {
    this.lastState = this.circle.id;
  }

  restoreState() {
    Command.store.commit("removeCircle", this.lastState);
  }
}
