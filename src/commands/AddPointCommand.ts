import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";

//#region addPointCommand
export class AddPointCommand extends Command {
  private sePoint: SEPoint;
  constructor(sePoint: SEPoint) {
    super();
    this.sePoint = sePoint;
  }

  do(): void {
    Command.store.commit.addPoint(this.sePoint);
  }

  saveState(): void {
    this.lastState = this.sePoint.id;
  }

  restoreState(): void {
    Command.store.commit.removePoint(this.lastState);
  }
}
//#endregion addPointCommand
