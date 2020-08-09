import { Command } from "./Command";
import { SECircle } from "@/models/SECircle";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";

export class AddCircleCommand extends Command {
  private seCircle: SECircle;
  private centerSEPoint: SEPoint;
  private circleSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(
    seCircle: SECircle,
    centerSEPoint: SEPoint,
    circleSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seCircle = seCircle;
    this.centerSEPoint = centerSEPoint;
    this.circleSEPoint = circleSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.centerSEPoint.registerChild(this.seCircle);
    this.circleSEPoint.registerChild(this.seCircle);
    this.seCircle.registerChild(this.seLabel);
    Command.store.commit.addCircle(this.seCircle);
    Command.store.commit.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seCircle.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    Command.store.commit.removeCircle(this.lastState);
    this.seCircle.unregisterChild(this.seLabel);
    this.centerSEPoint.unregisterChild(this.seCircle);
    this.circleSEPoint.unregisterChild(this.seCircle);
  }
}
