import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import Point from "@/plottables/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { ConvertInterPtToUserCreatedCommand } from "@/commands/ConvertInterPtToUserCreatedCommand";
import { SEPointOnOneDimensional } from "@/models/SEPointOnOneDimensional";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneDimensionalCommand";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";

export default class PointHandler extends Highlighter {
  // The temporary point displayed as the user drags
  private isTemporaryPointAdded = false;
  /**
   * A temporary plottable (TwoJS) point created while the user is making a point
   */
  protected startMarker: Point;
  /* temporary vector to help with computation */
  private tmpVector = new Vector3();

  constructor(layers: Two.Group[]) {
    super(layers);
    // Create and style the temporary points marking the object being created
    this.startMarker = new Point();
    this.startMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    this.store.commit.addTemporaryNodule(this.startMarker);
  }

  mousePressed(event: MouseEvent): void {
    // Do the mouse moved event of the Highlighter so that a new hitSEPoints array will be generated
    // otherwise if the user has finished making an new point, then *without* triggering a mouse move
    // event, mouse press will create a new point at the same location. This is not what we want so
    // we call super.mouseMove
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
      } else {
        //#region linkNoduleSENodule
        // create a new Point
        const newPoint = new Point();
        // Set the display to the default values
        newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
        newPoint.adjustSize();
        let vtx: SEPointOnOneDimensional | SEPoint | null = null;

        // Create plottable for the Label
        const newLabel = new Label();
        let newSELabel: SELabel | null = null;

        if (this.hitSESegments.length > 0) {
          // The new point will be a point on a segment
          // Create the model object for the new point and link them
          vtx = new SEPointOnOneDimensional(newPoint, this.hitSESegments[0]);
          vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
          newSELabel = new SELabel(newLabel, vtx);

          // Create and execute the command to create a new point for undo/redo
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.hitSESegments[0],
            newSELabel
          ).execute();
          //#endregion linkNoduleSENodule
        } else if (this.hitSELines.length > 0) {
          // The new point will be a point on a line
          // Create the model object for the new point and link them
          vtx = new SEPointOnOneDimensional(newPoint, this.hitSELines[0]);
          vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
          newSELabel = new SELabel(newLabel, vtx);

          // Create and execute the command to create a new point for undo/redo
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.hitSELines[0],
            newSELabel
          ).execute();
        } else if (this.hitSECircles.length > 0) {
          // The new point will be a point on a circle
          // Create the model object for the new point and link them
          vtx = new SEPointOnOneDimensional(newPoint, this.hitSECircles[0]);
          vtx.locationVector = this.currentSphereVector; // snaps location to the closest on the one Dimensional
          newSELabel = new SELabel(newLabel, vtx);

          // Create and execute the command to create a new point for undo/redo
          new AddPointOnOneDimensionalCommand(
            vtx,
            this.hitSECircles[0],
            newSELabel
          ).execute();
        } else {
          // mouse press on empty location so create a free point
          // Create the model object for the new point and link them
          vtx = new SEPoint(newPoint);
          vtx.locationVector = this.currentSphereVector;
          newSELabel = new SELabel(newLabel, vtx);

          // Create and execute the command to create a new point for undo/redo
          new AddPointCommand(vtx, newSELabel).execute();
        }
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
      }
    } else if (this.isTemporaryPointAdded) {
      // Remove the temporary object
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Highlight all nearby objects and update location vectors
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

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);

    if (this.isTemporaryPointAdded) {
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
    }
  }
  activate(): void {
    super.activate();
  }

  deactivate(): void {
    super.deactivate();
  }
}
