import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SEOneDimensional } from "@/types";

export class AddIntersectionPointCommand extends Command {
  private sePoint: SEPoint;
  private parent1: SEOneDimensional;
  private parent2: SEOneDimensional;

  constructor(
    sePoint: SEPoint,
    parent1: SEOneDimensional,
    parent2: SEOneDimensional
  ) {
    super();
    this.sePoint = sePoint;
    this.parent1 = parent1;
    this.parent2 = parent2;
  }

  do(): void {
    Command.store.commit("addPoint", this.sePoint);
    this.parent1.registerChild(this.sePoint);
    this.parent2.registerChild(this.sePoint);
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    Command.store.commit("removePoint", this.lastState);
    this.parent1.unregisterChild(this.sePoint);
    this.parent2.unregisterChild(this.sePoint);
  }
}
