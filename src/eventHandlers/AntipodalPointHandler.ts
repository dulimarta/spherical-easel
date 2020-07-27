import Two from "two.js";
import { Vector3 } from "three";
import { SEPoint } from "@/models/SEPoint";
import Point from "@/plottables/Point";
import { AddAntipodalPointCommand } from "@/commands/AddAntipodalPointCommand";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { SENodule } from "@/models/SENodule";
import { IntersectionReturnType } from "@/types";
import store from "@/store";
import { SEOneDimensional } from "@/types";
import { UpdateMode, UpdateStateType } from "@/types";

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
        const newPoint = new Point();
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
    if (this.store.getters.selectedObjects().length == 1) {
      const object = this.store.getters.selectedObjects()[0];
      if (object instanceof SEPoint) {
        const newPoint = new Point();
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
