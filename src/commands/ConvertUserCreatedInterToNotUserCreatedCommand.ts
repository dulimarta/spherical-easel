import { Command } from "./Command";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { DisplayStyle } from "@/plottables/Nodule";
// import { Labelable } from "@/types";
// import { SEPoint } from "@/models/SEPoint";
import SETTINGS from "@/global-settings";

/**
 * This is used when an intersection point the user converted to user created and now wants to
 * undo that change. Meaning they want to change the value of
 * isUserCreated to false from true and hide the point
 *
 * This does the opposite of ConvertInterPtToUserCreatedCommand
 *
 */
export class ConvertUserCreatedInterToNotUserCreatedCommand extends Command {
  private seIntersectionPoint: SEIntersectionPoint;
  constructor(seIntersectionPoint: SEIntersectionPoint) {
    super();
    this.seIntersectionPoint = seIntersectionPoint;
  }

  do(): void {
    // hide the label
    if (this.seIntersectionPoint.label != undefined) {
      this.seIntersectionPoint.label.showing = false;
    }
    // hide the point
    this.seIntersectionPoint.showing = false;
    // revert to temporary status
    this.seIntersectionPoint.ref.stylize(DisplayStyle.ApplyTemporaryVariables);
    // set back to automatically created
    this.seIntersectionPoint.isUserCreated = false;
  }

  saveState(): void {
    // No additional code required
  }

  restoreState(): void {
    this.seIntersectionPoint.isUserCreated = true;
    // Set the display to the default values
    this.seIntersectionPoint.ref.stylize(DisplayStyle.ApplyCurrentVariables);
    // Set the size for the current zoom magnification factor
    this.seIntersectionPoint.ref.adjustSize();
    this.seIntersectionPoint.showing = true;
    // show the label
    if (
      this.seIntersectionPoint.label != undefined &&
      SETTINGS.point.showLabelsOfNonFreePointsInitially
    ) {
      this.seIntersectionPoint.label.showing = true;
    }
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
