import { Command, PersistableCommand } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";

export class AddAntipodalPointCommand extends PersistableCommand {
  private sePoint: SEPoint;
  private parentSEPoint: SEPoint;
  private seLabel: SELabel;
  constructor(sePoint: SEPoint, parentSEPoint: SEPoint, seLabel: SELabel) {
    super();
    this.sePoint = sePoint;
    this.parentSEPoint = parentSEPoint;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentSEPoint.registerChild(this.sePoint);
    this.sePoint.registerChild(this.seLabel);
    Command.store.commit.addPoint(this.sePoint);
    Command.store.commit.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    Command.store.commit.removePoint(this.lastState);
    this.sePoint.unregisterChild(this.seLabel);
    this.parentSEPoint.unregisterChild(this.sePoint);
  }

  toJSON(_arg: any): string {
    return `AddAntipodalPoint ${this.sePoint.name} ${this.parentSEPoint.name}`;
  }
}
