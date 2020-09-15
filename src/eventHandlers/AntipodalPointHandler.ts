import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import NonFreePoint from "@/plottables/NonFreePoint";
import { AddAntipodalPointCommand } from "@/commands/AddAntipodalPointCommand";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { UpdateMode } from "@/types";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";

export default class AntipodalPointHandler extends Highlighter {
  /**
   * The parent of this point
   */
  private parentPoint: SEPoint | null = null;

  /* temporary vector to help with computation */
  private tmpVector = new Vector3();

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
        const antipodalCommandGroup = new CommandGroup();
        if (
          this.parentPoint instanceof SEIntersectionPoint &&
          !(this.parentPoint as SEIntersectionPoint).isUserCreated
        ) {
          //Make it user created and turn on the display
          antipodalCommandGroup.addCommand(
            new ConvertInterPtToUserCreatedCommand(
              this.parentPoint as SEIntersectionPoint
            )
          );
        }

        const newPoint = new NonFreePoint();
        // Set the display to the default values
        newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
        newPoint.adjustSize();

        // Create the model object for the new point and link them
        const vtx = new SEAntipodalPoint(newPoint, this.parentPoint);

        // Create the plottable label
        const newLabel = new Label();
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
        antipodalCommandGroup
          .addCommand(
            new AddAntipodalPointCommand(vtx, this.parentPoint, newSELabel)
          )
          .execute();
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
        newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
        newPoint.adjustSize();

        // Create the model object for the new point and link them
        const vtx = new SEAntipodalPoint(newPoint, object);

        // Create the plottable label
        const newLabel = new Label();
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
        new AddAntipodalPointCommand(vtx, object, newSELabel).execute();
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
