import { Command } from "./Command";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";

/**
 * This is used when an intersection point was automatically created and the user
 * wants to actually use it in a construction. Meaning they want to change the value of
 * isUserCreated, display the point and set up the glowing style
 */
export class ConvertInterPtToUserCreatedCommand extends Command {
  private arg: SEIntersectionPoint;
  constructor(arg: SEIntersectionPoint) {
    super();
    this.arg = arg;
  }

  do(): void {
    this.arg.isUserCreated = true;
    this.arg.ref.stylize(DisplayStyle.DEFAULT);
    this.arg.ref.stylize(DisplayStyle.GLOWING);
    this.arg.showing = true;
  }

  saveState(): void {
    // No additional code required
  }

  restoreState(): void {
    this.arg.isUserCreated = false;
    this.arg.showing = false;
    this.arg.ref.stylize(DisplayStyle.TEMPORARY);
  }
}
