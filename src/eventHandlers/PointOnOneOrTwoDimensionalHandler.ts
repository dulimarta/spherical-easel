import Two from "two.js";
import Point from "@/plottables/Point";
import { AddPointCommand } from "@/commands/AddPointCommand";
import { DisplayStyle } from "@/plottables/Nodule";
import Highlighter from "./Highlighter";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";
import { SEOneOrTwoDimensional } from "@/types";
import Label from "@/plottables/Label";
import { SELabel } from "@/models/SELabel";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";
import { AddPointOnOneDimensionalCommand } from "@/commands/AddPointOnOneOrTwoDimensionalCommand";
import { SEStore } from "@/store";

export default class PointOnOneDimensionalHandler extends Highlighter {
  // The temporary point displayed as the user moves the pointer
  private isTemporaryPointAdded = false;
  /**
   * A temporary plottable (TwoJS) point created while the user is making a point
   */
  protected startMarker: Point;

  /**
   * As the user moves the pointer around snap the temporary marker to this object temporarily
   */
  protected snapToTemporaryOneDimensional: SEOneOrTwoDimensional | null = null;
  /**
   * The parent of the point
   */
  private oneDimensional: SEOneOrTwoDimensional | null = null;

  /* temporary vector to help with computation */
  private tmpVector = new Vector3();

  constructor(layers: Two.Group[]) {
    super(layers);
    // Create and style the temporary points marking the object being created
    this.startMarker = new Point();
    this.startMarker.stylize(DisplayStyle.ApplyTemporaryVariables);
    SEStore.addTemporaryNodule(this.startMarker);
  }

  mousePressed(event: MouseEvent): void {
    //run the mouse moved event so that clicking twice in the same spot *without* moving the mouse will not result in a second point being created.
    this.mouseMoved(event);

    //Select the oneDimensional object to put point on
    if (this.isOnSphere) {
      // to put a new point on an object you must have no points nearby
      if (this.hitSEPoints.length === 0) {
        if (this.hitSESegments.length > 0) {
          this.oneDimensional = this.hitSESegments[0];
        } else if (this.hitSELines.length > 0) {
          this.oneDimensional = this.hitSELines[0];
        } else if (this.hitSECircles.length > 0) {
          this.oneDimensional = this.hitSECircles[0];
        } else if (this.hitSEEllipses.length > 0) {
          this.oneDimensional = this.hitSEEllipses[0];
        } else if (this.hitSEParametrics.length > 0) {
          this.oneDimensional = this.hitSEParametrics[0];
        } else if (this.hitSEPolygons.length > 0) {
          this.oneDimensional = this.hitSEPolygons[0];
        }
      }
      if (this.oneDimensional !== null) {
        const newPoint = new Point();
        // Set the display to the default values
        newPoint.stylize(DisplayStyle.ApplyCurrentVariables);
        newPoint.adjustSize();
        // Create plottable for the Label
        const newLabel = new Label();

        // Create the model object for the new point and link them
        const vtx = new SEPointOnOneOrTwoDimensional(
          newPoint,
          this.oneDimensional
        );
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
        //new AddPointCommand(vtx, newSELabel).execute();
        new AddPointOnOneDimensionalCommand(
          vtx as SEPointOnOneOrTwoDimensional,
          this.oneDimensional,
          newSELabel
        ).execute();
        //run the mouse moved event so that the temporary marker is immediately removed
        this.mouseMoved(event);
        this.oneDimensional = null;
      }
    } else if (this.isTemporaryPointAdded) {
      // Remove the temporary object
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
      this.snapToTemporaryOneDimensional = null;
    }
  }

  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    //highlight nearby one dimensional, but only when not near any points
    if (this.hitSEPoints.length === 0) {
      if (this.hitSESegments.length > 0) {
        this.hitSESegments[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSESegments[0];
      } else if (this.hitSELines.length > 0) {
        this.hitSELines[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSELines[0];
      } else if (this.hitSECircles.length > 0) {
        this.hitSECircles[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSECircles[0];
      } else if (this.hitSEEllipses.length > 0) {
        this.hitSEEllipses[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSEEllipses[0];
      } else if (this.hitSEParametrics.length > 0) {
        this.hitSEParametrics[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSEParametrics[0];
      } else if (this.hitSEPolygons.length > 0) {
        this.hitSEPolygons[0].glowing = true;
        this.snapToTemporaryOneDimensional = this.hitSEPolygons[0];
      }
    }
    if (this.isOnSphere) {
      if (!this.isTemporaryPointAdded) {
        this.isTemporaryPointAdded = true;
        // Add the temporary point to the appropriate layers
        this.startMarker.addToLayers(this.layers);
      }
      // Move the temporary point to the location of the mouse event, and update the display, snap to a nearby one dimensional object (if there is one)
      if (this.snapToTemporaryOneDimensional === null) {
        this.startMarker.positionVector = this.currentSphereVector;
      } else {
        this.startMarker.positionVector = this.snapToTemporaryOneDimensional.closestVector(
          this.currentSphereVector
        );
      }
      // if there is a nearby point or no objects nearby remove the temporary point
      if (this.hitSEPoints.length > 0 || this.hitSENodules.length === 0) {
        this.startMarker.removeFromLayers();
        this.isTemporaryPointAdded = false;
        this.snapToTemporaryOneDimensional = null;
      }
    } else if (this.isTemporaryPointAdded) {
      //if not on the sphere and the temporary segment has been added remove the temporary objects
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
      this.snapToTemporaryOneDimensional = null;
    }
  }

  // eslint-disable-next-line
  mouseReleased(event: MouseEvent): void {}

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
    if (this.isTemporaryPointAdded) {
      this.startMarker.removeFromLayers();
      this.isTemporaryPointAdded = false;
    }
    this.snapToTemporaryOneDimensional = null;
    // Reset the oneDimensional in preparation for another intersection.
    this.oneDimensional = null;
  }
}
