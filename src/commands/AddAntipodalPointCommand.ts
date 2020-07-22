import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SEOneDimensional } from "@/types";

export class AddAntipodalPointCommand extends Command {
  private sePoint: SEPoint;
  private parentSEPoint: SEPoint;
  constructor(sePoint: SEPoint, parentSEPoint: SEPoint) {
    super();
    this.sePoint = sePoint;
    this.parentSEPoint = parentSEPoint;
  }

  do(): void {
    this.parentSEPoint.registerChild(this.sePoint);
    Command.store.commit("addPoint", this.sePoint);
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    Command.store.commit("removePoint", this.lastState);
    this.parentSEPoint.unregisterChild(this.sePoint);
  }
}
