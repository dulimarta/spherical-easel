import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";
import { SEOneDimensional } from "@/types";

export class AddPointOnOneDimensionalCommand extends Command {
  private sePoint: SEPoint;
  private parent: SEOneDimensional;
  constructor(sePoint: SEPoint, parent: SEOneDimensional) {
    super();
    this.sePoint = sePoint;
    this.parent = parent;
  }

  do(): void {
    Command.store.commit("addPoint", this.sePoint);
    this.parent.registerChild(this.sePoint);
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    Command.store.commit("removePoint", this.lastState);
    this.parent.unregisterChild(this.sePoint);
  }
}
