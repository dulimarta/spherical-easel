//import Two from "two.js";
import { Group } from "two.js/src/group";
import Point from "@/plottables-spherical/Point";
import Highlighter from "./Highlighter";
import { SEPointOnOneOrTwoDimensional } from "@/models-spherical/SEPointOnOneOrTwoDimensional";
import { SEOneOrTwoDimensional } from "@/types";
import { SELabel } from "@/models-spherical/SELabel";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";
import { AddPointOnOneDimensionalCommand } from "@/commands-spherical/AddPointOnOneOrTwoDimensionalCommand";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { SEPoint } from "@/models-spherical/SEPoint";
import { SEIntersectionPoint } from "@/models-spherical/SEIntersectionPoint";
import { SEAntipodalPoint } from "@/models-spherical/SEAntipodalPoint";
import { SetPointUserCreatedValueCommand } from "@/commands-spherical/SetPointUserCreatedValueCommand";

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
  // Filter the hitSEPoints appropriately for this handler
  protected filteredIntersectionPointsList: SEPoint[] = [];

  constructor(layers: Group[]) {
    super(layers);
    // Create and style the temporary points marking the object being created
    this.startMarker = new Point();
    PointOnOneDimensionalHandler.store.addTemporaryNodule(this.startMarker);
  }

  mousePressed(event: MouseEvent): void {
    //run the mouse moved event so that clicking twice in the same spot *without* moving the mouse will not result in a second point being created.
    this.mouseMoved(event);

    //Select the oneDimensional object to put point on
    if (this.isOnSphere) {
      this.updateFilteredPointsList();
      // to put a new point on an object you must have no points nearby
      if (this.filteredIntersectionPointsList.length === 0) {
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
      } else {
        // create an intersection point at a place where there is a non-user created intersection between two showing parents
        if (
          (this.filteredIntersectionPointsList[0] instanceof
            SEIntersectionPoint ||
            this.filteredIntersectionPointsList[0] instanceof
              SEAntipodalPoint) &&
          !this.filteredIntersectionPointsList[0].isUserCreated
        ) {
          new SetPointUserCreatedValueCommand(
            this.filteredIntersectionPointsList[0],
            !this.filteredIntersectionPointsList[0].isUserCreated,
            true
          ).execute();
          return;
        }
      }
      if (this.oneDimensional !== null) {
        const pointOnOneDimensionalCommandGroup = new CommandGroup();

        // Create the model object for the new point and link them
        const vtx = new SEPointOnOneOrTwoDimensional(this.oneDimensional);
        vtx.locationVector = this.oneDimensional.closestVector(
          this.currentSphereVector
        );
        const newSELabel = vtx.attachLabelWithOffset(
          new Vector3(
            2 * SETTINGS.point.initialLabelOffset,
            SETTINGS.point.initialLabelOffset,
            0
          )
        );
        // Create the command to create a new point for undo/redo

        pointOnOneDimensionalCommandGroup.addCommand(
          new AddPointOnOneDimensionalCommand(
            vtx as SEPointOnOneOrTwoDimensional,
            this.oneDimensional,
            newSELabel
          )
        );

        /////////////
        // Create the antipode of the new point, vtx
        PointOnOneDimensionalHandler.addCreateAntipodeCommand(
          vtx,
          pointOnOneDimensionalCommandGroup
        );
        pointOnOneDimensionalCommandGroup.execute();
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
    this.updateFilteredPointsList();
    if (this.filteredIntersectionPointsList.length === 0) {
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
        this.startMarker.positionVectorAndDisplay = this.currentSphereVector;
      } else {
        this.startMarker.positionVectorAndDisplay =
          this.snapToTemporaryOneDimensional.closestVector(
            this.currentSphereVector
          );
      }

      if (
        this.filteredIntersectionPointsList.length > 0 ||
        this.hitSENodules.length === 0
      ) {
        // if we are at a non-user created intersection with both parents showing then move the start marker to the intersection
        if (
          this.filteredIntersectionPointsList[0] instanceof
            SEIntersectionPoint &&
          !this.filteredIntersectionPointsList[0].isUserCreated &&
          this.filteredIntersectionPointsList[0].principleParent1.showing &&
          this.filteredIntersectionPointsList[0].principleParent2.showing
        ) {
          this.startMarker.positionVectorAndDisplay =
            this.filteredIntersectionPointsList[0].locationVector;
        } else {
          // if there is a nearby point or no objects nearby remove the temporary point
          this.startMarker.removeFromLayers();
          this.isTemporaryPointAdded = false;
          this.snapToTemporaryOneDimensional = null;
        }
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

  updateFilteredPointsList(): void {
    this.filteredIntersectionPointsList = this.hitSEPoints.filter(pt => {
      if (pt instanceof SEIntersectionPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          if (pt.principleParent1.showing && pt.principleParent2.showing) {
            return true;
          } else {
            return false;
          }
        }
      } else if (pt instanceof SEAntipodalPoint) {
        if (pt.isUserCreated) {
          return pt.showing;
        } else {
          return false;
        }
      }
      return pt.showing;
    });
  }
}
