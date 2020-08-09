import { Command } from "./Command";
import { SESegment } from "@/models/SESegment";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";

export class AddSegmentCommand extends Command {
  private seSegment: SESegment;
  private startSEPoint: SEPoint;
  private endSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(
    seSegment: SESegment,
    startSEPoint: SEPoint,
    endSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seSegment = seSegment;
    this.startSEPoint = startSEPoint;
    this.endSEPoint = endSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.startSEPoint.registerChild(this.seSegment);
    this.endSEPoint.registerChild(this.seSegment);
    this.seSegment.registerChild(this.seLabel);
    Command.store.commit.addSegment(this.seSegment);
    Command.store.commit.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seSegment.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    Command.store.commit.removeSegment(this.lastState);
    this.seSegment.unregisterChild(this.seLabel);
    this.startSEPoint.unregisterChild(this.seSegment);
    this.endSEPoint.unregisterChild(this.seSegment);
  }
}
