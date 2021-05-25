import { Command, PersistableCommand } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import { SEOneDimensional } from "@/types";

export class AddPerpendicularLineThruPointCommand extends PersistableCommand {
  private sePerpendicularLineThruPoint: SEPerpendicularLineThruPoint;
  private parentSEPoint: SEPoint;
  private parentOneDimensional: SEOneDimensional;
  private seLabel: SELabel;

  constructor(
    sePerpendicularLineThruPoint: SEPerpendicularLineThruPoint,
    parentSEPoint: SEPoint,
    parentOneDimensional: SEOneDimensional,
    seLabel: SELabel
  ) {
    super();
    this.sePerpendicularLineThruPoint = sePerpendicularLineThruPoint;
    this.parentSEPoint = parentSEPoint;
    this.parentOneDimensional = parentOneDimensional;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parentSEPoint.registerChild(this.sePerpendicularLineThruPoint);
    this.parentOneDimensional.registerChild(this.sePerpendicularLineThruPoint);
    this.sePerpendicularLineThruPoint.registerChild(this.seLabel);
    Command.store.commit.addLine(this.sePerpendicularLineThruPoint);
    Command.store.commit.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.sePerpendicularLineThruPoint.id;
  }

  restoreState(): void {
    Command.store.commit.removeLabel(this.seLabel.id);
    Command.store.commit.removeLine(this.lastState);
    this.sePerpendicularLineThruPoint.unregisterChild(this.seLabel);
    this.parentOneDimensional.unregisterChild(
      this.sePerpendicularLineThruPoint
    );
    this.parentSEPoint.unregisterChild(this.sePerpendicularLineThruPoint);
  }

  toJSON(_arg: any): string {
    return AddPerpendicularLineThruPointCommand.name;
  }
}
