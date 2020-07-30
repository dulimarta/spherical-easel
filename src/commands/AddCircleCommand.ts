import { Command } from "./Command";
import { SECircle } from "@/models/SECircle";
import { SEPoint } from "@/models/SEPoint";

export class AddCircleCommand extends Command {
  private seCircle: SECircle;
  private centerSEPoint: SEPoint;
  private circleSEPoint: SEPoint;
  constructor(
    seCircle: SECircle,
    centerSEPoint: SEPoint,
    circleSEPoint: SEPoint
  ) {
    super();
    this.seCircle = seCircle;
    this.centerSEPoint = centerSEPoint;
    this.circleSEPoint = circleSEPoint;
  }

  do(): void {
    this.centerSEPoint.registerChild(this.seCircle);
    this.circleSEPoint.registerChild(this.seCircle);
    Command.store.commit.addCircle(this.seCircle);
  }

  saveState(): void {
    this.lastState = this.seCircle.id;
  }

  restoreState(): void {
    Command.store.commit.removeCircle(this.lastState);
    this.centerSEPoint.unregisterChild(this.seCircle);
    this.circleSEPoint.unregisterChild(this.seCircle);
  }
}
