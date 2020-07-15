import Two from "two.js";
import { Vector3 } from "three";
import { SEPoint } from "@/models/SEPoint";
import Point from "@/plottables/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";
import { SENodule } from "@/models/SENodule";
import { IntersectionReturnType } from "@/types";
import store from "@/store";
import { SEOneDimensional } from "@/types";

export default class PointOnOneDimensionalHandler extends Highlighter {
  /**
   * The part
   */
  private oneDimensional: SEOneDimensional | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (event.button != 0) return;

    //Select the oneDimensional object to put point on
    if (this.isOnSphere) {
      if (this.hitSELines.length > 0) {
        this.oneDimensional = this.hitSELines[0];
      } else if (this.hitSESegments.length > 0) {
        this.oneDimensional = this.hitSESegments[0];
      } else if (this.hitSECircles.length > 0) {
        this.oneDimensional = this.hitSECircles[0];
      }

      if (this.oneDimensional != null) {
        const newPoint = new Point();
        // Set the display to the default values
        newPoint.stylize(DisplayStyle.DEFAULT);
        // Set up the glowing display
        newPoint.stylize(DisplayStyle.GLOWING);
        // Create the model object for the new point and link them
        const vtx = new SEPointOnOneDimensional(newPoint, this.oneDimensional);
        vtx.locationVector = this.oneDimensional.closestVector(
          this.currentSphereVector
        );
        // Create and execute the command to create a new point for undo/redo
        new AddPointCommand(vtx).execute();

        this.oneDimensional = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight all nearby objects and update location points
    super.mouseMoved(event);
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (event.button != 0) return;
  }

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the oneDimensional in preparation for another intersection.
    this.oneDimensional = null;
  }
  activate(): void {
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
