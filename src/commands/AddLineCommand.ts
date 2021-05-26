import { Command } from "./Command";
import { SELine } from "@/models/SELine";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";

export class AddLineCommand extends Command {
  private seLine: SELine;
  private startSEPoint: SEPoint;
  private endSEPoint: SEPoint;
  private seLabel: SELabel;

  constructor(
    seLine: SELine,
    startSEPoint: SEPoint,
    endSEPoint: SEPoint,
    seLabel: SELabel
  ) {
    super();
    this.seLine = seLine;
    this.startSEPoint = startSEPoint;
    this.endSEPoint = endSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.startSEPoint.registerChild(this.seLine);
    this.endSEPoint.registerChild(this.seLine);
    this.seLine.registerChild(this.seLabel);
    Command.store.commit.addLine(this.seLine);
    Command.store.commit.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seLine.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    Command.store.commit.removeLine(this.lastState);
    this.seLabel.unregisterChild(this.seLabel);
    this.startSEPoint.unregisterChild(this.seLine);
    this.endSEPoint.unregisterChild(this.seLine);
  }

  toOpcode(): null | string | Array<string> {
    return `AddLine ${this.seLine.name} ${this.startSEPoint.name} ${this.endSEPoint.name} ${this.seLabel.name}`;
  }
}
