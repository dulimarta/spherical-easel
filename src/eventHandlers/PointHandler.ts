import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import Point from "@/plottables/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";

export default class PointHandler extends Highlighter {
  // The temporary point displayed as the user drags
  private isTemporaryPointAdded = false;

  constructor(layers: Two.Group[]) {
    super(layers);
  }

  mousePressed(event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will create a new point at the same location. This is not what we want so we call super.mouseMove
    super.mouseMoved(event);

    if (this.isOnSphere) {
      // If this is near any other points do not create a new point, unless the hitSEPoint is an uncreated intersection point
      if (this.hitSEPoints.length > 0) {
        if (
          this.hitSEPoints[0] instanceof SEIntersectionPoint &&
          !(this.hitSEPoints[0] as SEIntersectionPoint).isUserCreated
        ) {
          //Make it user created and turn on the display
          new ConvertInterPtToUserCreatedCommand(
            this.hitSEPoints[0] as SEIntersectionPoint
          ).execute();
          return;
        }
        return;
      }
      //#region linkNoduleSENodule
      const newPoint = new Point();
      // Set the display to the default values
      newPoint.stylize(DisplayStyle.DEFAULT);
      // Set up the glowing display
      newPoint.stylize(DisplayStyle.GLOWING);
      // Create the model object for the new point and link them
      const vtx = new SEPoint(newPoint);
      vtx.locationVector = this.currentSphereVector;
      //#endregion linkNoduleSENodule
      // Create and execute the command to create a new point for undo/redo
      new AddPointCommand(vtx).execute();
    } else if (this.isTemporaryPointAdded) {
      // Remove the temporary objects
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight all nearby objects and update location points
    super.mouseMoved(event);
    if (this.isOnSphere) {
      if (!this.isTemporaryPointAdded) {
        this.isTemporaryPointAdded = true;
        // Add the temporary point to the appropriate layers
        this.startMarker.addToLayers(this.layers);
      }
      // Move the temporary point to the location of the mouse event, and update the display
      this.startMarker.positionVector = this.currentSphereVector;
    } else if (this.isTemporaryPointAdded) {
      //if not on the sphere and the temporary segment has been added remove the temporary objects
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {
    /* None */
  }

  // eslint-disable-next-line
  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);

    if (this.isTemporaryPointAdded) {
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
    }
  }
  activate(): void {
    // Unselect the selected objects and clear the selectedObject array
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
