import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";

export class ShowPointCommand extends Command {
  private sePoint: SEPoint;
  constructor(sePoint: SEPoint) {
    super();
    this.sePoint = sePoint;
  }

  do(): void {
    this.sePoint.showing = true;
  }

  saveState(): void {
    // No additional code required
  }

  restoreState(): void {
    this.sePoint.showing = false;
  }
}
