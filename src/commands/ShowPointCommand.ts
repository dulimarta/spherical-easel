import { Command } from "./Command";
import { SEPoint } from "@/models/SEPoint";

export class ShowPointCommand extends Command {
  private arg: SEPoint;
  constructor(arg: SEPoint) {
    super();
    this.arg = arg;
  }

  do(): void {
    this.arg.showing = true;
  }

  saveState(): void {
    // No additional code required
  }

  restoreState(): void {
    this.arg.showing = false;
  }
}
