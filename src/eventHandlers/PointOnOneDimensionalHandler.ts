import Two from "two.js";
import Point from "@/plottables/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";
import { SEOneDimensional } from "@/types";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";

export default class PointOnOneDimensionalHandler extends Highlighter {
  /**
   * The parent of the point
   */
  private oneDimensional: SEOneDimensional | null = null;

  /* temporary vector to help with computation */
  private tmpVector = new Vector3();

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
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
        newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
        newPoint.adjustSize();
        // Create plottable for the Label
        const newLabel = new Label();

        // Create the model object for the new point and link them
        const vtx = new SEPointOnOneDimensional(newPoint, this.oneDimensional);
        vtx.locationVector = this.oneDimensional.closestVector(
          this.currentSphereVector
        );
        const newSELabel = new SELabel(newLabel, vtx);
        // Set the initial label location
        this.tmpVector
          .copy(vtx.locationVector)
          .add(
            new Vector3(
              2 * SETTINGS.point.initialLabelOffset,
              SETTINGS.point.initialLabelOffset,
              0
            )
          )
          .normalize();
        newSELabel.locationVector = this.tmpVector;
        // Create and execute the command to create a new point for undo/redo
        new AddPointCommand(vtx, newSELabel).execute();

        this.oneDimensional = null;
      }
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight all nearby objects and update location vectors
    super.mouseMoved(event);
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    // Reset the oneDimensional in preparation for another intersection.
    this.oneDimensional = null;
  }
}
