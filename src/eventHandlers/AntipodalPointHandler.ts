import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import NonFreePoint from "@/plottables/NonFreePoint";
import { AddAntipodalPointCommand } from "@/commands/AddAntipodalPointCommand";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { UpdateMode } from "@/types";

export default class AntipodalPointHandler extends Highlighter {
  /**
   * The part
   */
  private parentPoint: SEPoint | null = null;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    //Select the point object to create the antipode of
    if (this.isOnSphere) {
      if (this.hitSEPoints.length > 0) {
        this.parentPoint = this.hitSEPoints[0];
      }

      if (this.parentPoint != null) {
        const newPoint = new NonFreePoint();
        // Set the display to the default values
        newPoint.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
        newPoint.adjustSize();

        // Create the model object for the new point and link them
        const vtx = new SEAntipodalPoint(newPoint, this.parentPoint);

        // Create and execute the command to create a new point for undo/redo
        new AddAntipodalPointCommand(vtx, this.parentPoint).execute();
        // Update the display of the antipodal point
        vtx.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });

        this.parentPoint = null;
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
    // Reset the parent point in preparation for another intersection.
    this.parentPoint = null;
  }
  activate(): void {
    // If there is exactly one point selected, create its anitpode
    if (this.store.getters.selectedSENodules().length == 1) {
      const object = this.store.getters.selectedSENodules()[0];
      if (object instanceof SEPoint) {
        const newPoint = new NonFreePoint();
        // Set the display to the default values
        newPoint.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
        newPoint.adjustSize();

        // Create the model object for the new point and link them
        const vtx = new SEAntipodalPoint(newPoint, object);

        // Create and execute the command to create a new point for undo/redo
        new AddAntipodalPointCommand(vtx, object).execute();
        // Update the display of the antipodal point
        vtx.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      }
    }
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
