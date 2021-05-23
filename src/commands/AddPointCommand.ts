import { Command, PersistableCommand } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";

//#region addPointCommand
export class AddPointCommand extends PersistableCommand {
  private sePoint: SEPoint;
  private seLabel: SELabel;
  constructor(sePoint: SEPoint, seLabel: SELabel) {
    super();
    this.sePoint = sePoint;
    this.seLabel = seLabel;
  }

  do(): void {
    Command.store.commit.addLabel(this.seLabel);
    this.sePoint.registerChild(this.seLabel);
    Command.store.commit.addPoint(this.sePoint);
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    this.sePoint.unregisterChild(this.seLabel);
    Command.store.commit.removePoint(this.lastState);
  }

  toJSON(_arg: any) {
    return `AddPoint ${this.sePoint.name} ${this.seLabel.name}`;
  }
}
//#endregion addPointCommand
