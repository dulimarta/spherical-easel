import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SEOneDimensional } from "@/types";
import { SELabel } from "@/models/SELabel";

export class AddIntersectionPointCommand extends Command {
  private sePoint: SEPoint;
  private parent1: SEOneDimensional;
  private parent2: SEOneDimensional;
  private seLabel: SELabel;

  constructor(
    sePoint: SEPoint,
    parent1: SEOneDimensional,
    parent2: SEOneDimensional,
    seLabel: SELabel
  ) {
    super();
    this.sePoint = sePoint;
    this.parent1 = parent1;
    this.parent2 = parent2;
    this.seLabel = seLabel;
  }

  do(): void {
    //console.log("Add intersection point command do");
    this.parent1.registerChild(this.sePoint);
    this.parent2.registerChild(this.sePoint);
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
    this.parent1.unregisterChild(this.sePoint);
    this.parent2.unregisterChild(this.sePoint);
  }
}
