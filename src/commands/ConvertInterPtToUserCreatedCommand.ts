import { Command } from "./Command";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";

/**
 * This is used when an intersection point was automatically created and the user
 * wants to actually use it in a construction. Meaning they want to change the value of
 * isUserCreated, display the point and set up the glowing style
 */
export class ConvertInterPtToUserCreatedCommand extends Command {
  private seIntersectionPoint: SEIntersectionPoint;
  constructor(seIntersectionPoint: SEIntersectionPoint) {
    super();
    this.seIntersectionPoint = seIntersectionPoint;
  }

  do(): void {
    this.seIntersectionPoint.isUserCreated = true;
    this.seIntersectionPoint.ref.stylize(DisplayStyle.DEFAULT);
    this.seIntersectionPoint.ref.stylize(DisplayStyle.GLOWING);
    this.seIntersectionPoint.showing = true;
  }

  saveState(): void {
    // No additional code required
  }

  restoreState(): void {
    this.seIntersectionPoint.isUserCreated = false;
    this.seIntersectionPoint.showing = false;
    this.seIntersectionPoint.ref.stylize(DisplayStyle.TEMPORARY);
  }
}
