import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SEOneDimensional } from "@/types";
import { SELabel } from "@/models/SELabel";

export class AddPointOnOneDimensionalCommand extends Command {
  private sePoint: SEPoint;
  private parent: SEOneDimensional;
  private seLabel: SELabel;
  constructor(sePoint: SEPoint, parent: SEOneDimensional, seLabel: SELabel) {
    super();
    this.sePoint = sePoint;
    this.parent = parent;
    this.seLabel = seLabel;
  }

  do(): void {
    this.parent.registerChild(this.sePoint);
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
    this.parent.unregisterChild(this.sePoint);
  }
}
